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
    const debugMessages = []; // 🕵️‍♂️ OUR DETECTIVE LOGS

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

      // === STEP 1: Fetch Profiles WITH Meetings included ===
      const profiles = await db.query.roleProfiles.findMany({
        where: eq(roleProfiles.orgId, integration.orgId),
        with: { 
          defaultTasks: true,
          defaultMeetings: true // <--- We added this!
        },
      });

      const mappedProfiles = profiles.filter(p => p.entraGroupId !== null || (p as { entra_group_id?: string }).entra_group_id !== null);
      debugMessages.push(`Found ${mappedProfiles.length} mapped profiles`);

      for (const profile of mappedProfiles) {
        const groupId = profile.entraGroupId || (profile as { entra_group_id?: string }).entra_group_id;
        if (!groupId) continue;

        const groupRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId.trim()}/members`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (!groupRes.ok) {
          const errText = await groupRes.text();
          debugMessages.push(`MS Error (${groupRes.status}): ${errText.substring(0, 60)}...`);
          continue;
        }

        const groupData = await groupRes.json();
        const members = groupData.value || [];

        for (const member of members) {
          const email = member.mail || member.userPrincipalName;
          
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
          });

          if (existingUser) {
            debugMessages.push(`Skipped ${email.split('@')[0]}`);
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
              roleTitle: profile.name,
              department: profile.department,
              startDate: new Date(), 
            }).returning();

            // Create Tasks in Database
            if (profile.defaultTasks && profile.defaultTasks.length > 0) {
              const tasksToInsert = profile.defaultTasks.map(task => ({
                workflowId: newWorkflow.id,
                title: task.title,
                taskType: task.taskType as "IT_ACCESS" | "HARDWARE" | "TRAINING" | "HR_ADMIN",
                status: "PENDING" as const,
              }));
              await db.insert(workflowTasks).values(tasksToInsert);
            }

            // === STEP 2: Automate Outlook Calendar Invites ===
            if (profile.defaultMeetings && profile.defaultMeetings.length > 0) {
              for (const meeting of profile.defaultMeetings) {
                
                // Let's schedule it for 2 days from now at 10:00 AM UTC
                const startTime = new Date();
                startTime.setDate(startTime.getDate() + 2);
                startTime.setUTCHours(10, 0, 0, 0); 
                
                const endTime = new Date(startTime.getTime() + meeting.durationMinutes * 60000);

                const eventPayload = {
                  subject: `Onboarding: ${meeting.title} (${newUser.name})`,
                  body: {
                    contentType: "HTML",
                    content: `Hello! This is an automated onboarding meeting generated by Harmony OP for our newest hire, <strong>${newUser.name}</strong>.<br><br>Please use this time to cover: ${meeting.title}.`
                  },
                  start: {
                    dateTime: startTime.toISOString(),
                    timeZone: "UTC"
                  },
                  end: {
                    dateTime: endTime.toISOString(),
                    timeZone: "UTC"
                  },
                  attendees: [
                    {
                      emailAddress: { address: email },
                      type: "required"
                    }
                  ],
                  // Magic toggle to generate a Teams Meeting link automatically!
                  isOnlineMeeting: true,
                  onlineMeetingProvider: "teamsForBusiness"
                };

                // Create the event on the Host's calendar and invite the new hire
                const meetingRes = await fetch(`https://graph.microsoft.com/v1.0/users/${meeting.hostEmail.trim()}/events`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(eventPayload)
                });

                if (!meetingRes.ok) {
                  const errText = await meetingRes.text();
                  debugMessages.push(`Meeting Error: ${errText.substring(0, 50)}`);
                } else {
                  debugMessages.push(`Scheduled '${meeting.title}' with ${meeting.hostEmail}`);
                }
              }
            }

            totalNewHiresProcessed++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync complete. ${totalNewHiresProcessed} processed. \n\nLogs: ${debugMessages.join(" | ")}` 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}