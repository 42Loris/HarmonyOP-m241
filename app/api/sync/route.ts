// app/api/sync/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { 
  organizationIntegrations, 
  roleProfiles, 
  users, 
  onboardingWorkflows, 
  workflowTasks
} from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const isCronJob = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let integrationsToSync = [];

    if (isCronJob) {
      integrationsToSync = await db.query.organizationIntegrations.findMany({
        where: eq(organizationIntegrations.provider, "MICROSOFT_ENTRA"),
      });
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
      if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const integration = await db.query.organizationIntegrations.findFirst({
        where: and(
          eq(organizationIntegrations.orgId, dbUser.orgId),
          eq(organizationIntegrations.provider, "MICROSOFT_ENTRA")
        ),
      });

      if (!integration) {
        return NextResponse.json({ error: "Microsoft Integration not configured" }, { status: 400 });
      }
      integrationsToSync = [integration];
    }

    let totalNewHiresProcessed = 0;
    let debugMessages = []; // 🕵️‍♂️ OUR DETECTIVE LOGS

    for (const integration of integrationsToSync) {
      if (!integration.tenantId || !integration.clientId || !integration.clientSecret) continue;

      const tokenResponse = await fetch(`https://login.microsoftonline.com/${integration.tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: integration.clientId,
          scope: "https://graph.microsoft.com/.default",
          client_secret: integration.clientSecret,
          grant_type: "client_credentials",
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
         debugMessages.push(`Auth Failed: No token returned`);
         continue;
      }
      const accessToken = tokenData.access_token;

      const profiles = await db.query.roleProfiles.findMany({
        where: eq(roleProfiles.orgId, integration.orgId),
        with: { defaultTasks: true },
      });

      // Fix: Account for Drizzle sometimes returning snake_case depending on schema
      const mappedProfiles = profiles.filter(p => p.entraGroupId !== null || (p as any).entra_group_id !== null);
      debugMessages.push(`Found ${mappedProfiles.length} mapped profiles`);

      for (const profile of mappedProfiles) {
        const groupId = profile.entraGroupId || (profile as any).entra_group_id;

        const groupRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId.trim()}/members`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (!groupRes.ok) {
          const errText = await groupRes.text();
          // Log exactly what Microsoft tells us
          debugMessages.push(`MS Error (${groupRes.status}): ${errText.substring(0, 60)}...`);
          continue;
        }

        const groupData = await groupRes.json();
        const members = groupData.value || [];
        debugMessages.push(`Group has ${members.length} members`);

        for (const member of members) {
          const email = member.mail || member.userPrincipalName;
          
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
          });

          if (existingUser) {
            debugMessages.push(`Skipped ${email.split('@')[0]} (already exists)`);
          } else {
            debugMessages.push(`Imported ${email.split('@')[0]}`);
            
            const [newUser] = await db.insert(users).values({
              orgId: integration.orgId,
              email: email,
              name: member.displayName || "Unknown User",
              role: "EMPLOYEE",
              department: profile.department,
            }).returning();

            const [newWorkflow] = await db.insert(onboardingWorkflows).values({
              orgId: integration.orgId,
              newHireId: newUser.id,
              profileId: profile.id,
              roleTitle: profile.name,
              department: profile.department,
              startDate: new Date(), 
            }).returning();

            if (profile.defaultTasks && profile.defaultTasks.length > 0) {
              const tasksToInsert = profile.defaultTasks.map(task => ({
                workflowId: newWorkflow.id,
                title: task.title,
                taskType: task.taskType as "IT_ACCESS" | "HARDWARE" | "TRAINING" | "HR_ADMIN",
                status: "PENDING" as const,
              }));
              await db.insert(workflowTasks).values(tasksToInsert);
            }
            totalNewHiresProcessed++;
          }
        }
      }
    }

    // Return the logs directly to the user's screen!
    return NextResponse.json({ 
      success: true, 
      message: `Sync complete. ${totalNewHiresProcessed} processed. \n\nLogs: ${debugMessages.join(" | ")}` 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}