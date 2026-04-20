// actions/hire-requests.ts
"use server";

import { db } from "@/db";
import { 
  hireRequests, 
  users, 
  roleProfiles, 
  organizationIntegrations, 
  onboardingWorkflows, 
  workflowTasks 
} from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { MicrosoftGraphService } from "@/lib/infrastructure/microsoft-graph";

export async function createHireRequestAction(formData: FormData) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser) return { error: "User not found" };

  const profileId = formData.get("profileId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const personalEmail = formData.get("personalEmail") as string;
  const isSpecialHire = formData.get("isSpecialHire") === "on";
  
  const msLicensesArray = formData.getAll("msLicenses") as string[]; 
  const msGroupsArray = formData.getAll("msGroups") as string[];
  const otherLicenses = formData.get("otherLicenses") as string;

  const requestedLicenses = [
    msLicensesArray.length > 0 ? msLicensesArray.join(", ") : null, 
    otherLicenses ? `Other: ${otherLicenses}` : null
  ].filter(Boolean).join(" | ");

  const requestedGroups = msGroupsArray.length > 0 ? msGroupsArray.join(", ") : null;

  if (!profileId || !firstName || !lastName || !personalEmail) {
    return { error: "Missing required fields" };
  }

  const profile = await db.query.roleProfiles.findFirst({
    where: and(
      eq(roleProfiles.id, profileId),
      eq(roleProfiles.orgId, dbUser.orgId)
    )
  });

  if (!profile) return { error: "Profile not found or access denied" };

  try {
    await db.insert(hireRequests).values({
      orgId: dbUser.orgId,
      profileId,
      requesterId: dbUser.id,
      firstName,
      lastName,
      personalEmail,
      jobTitle: profile.name,
      department: profile.department,
      isSpecialHire,
      requestedLicenses: requestedLicenses || null,
      requestedGroups: requestedGroups || null,
      status: "PENDING"
    });

    await resend.emails.send({
      from: 'Harmony OP <onboarding@resend.dev>', 
      to: 'dpangione@online.gibz.ch', 
      subject: `Action Required: New Hire Approval for ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">New Hire Approval Required</h2>
          <p>Hello Manager,</p>
          <p><strong>${dbUser.name}</strong> has submitted a new hire request that requires your approval for Microsoft 365 provisioning.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>New Hire:</strong> ${firstName} ${lastName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Role:</strong> ${profile.name} (${profile.department})</p>
            <p style="margin: 0;"><strong>Special Hire:</strong> ${isSpecialHire ? 'Yes' : 'No'}</p>
          </div>

          <a href="https://harmony-op-m241.vercel.app/app/requests" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Review and Approve
          </a>
        </div>
      `
    });

  } catch (error) {
    console.error("Failed to process hire request:", error);
    return { error: "Failed to process request" };
  }

  revalidatePath("/app/requests");
  return { success: true };
}

export async function approveHireRequestAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser || dbUser.role === "EMPLOYEE") {
    return { error: "Only Admins/HR can approve requests." };
  }

  const requestId = formData.get("requestId") as string;
  if (!requestId) return { error: "Missing Request ID" };

  try {
    const request = await db.query.hireRequests.findFirst({
      where: and(
        eq(hireRequests.id, requestId),
        eq(hireRequests.orgId, dbUser.orgId)
      ),
      with: { profile: true }
    });

    if (!request) return { error: "Request not found" };

    const integration = await db.query.organizationIntegrations.findFirst({
      where: eq(organizationIntegrations.orgId, dbUser.orgId)
    });

    if (!integration?.clientId || !integration?.clientSecret) {
      return { error: "Microsoft Integration missing. IT must connect tenant first." };
    }

    const msGraph = new MicrosoftGraphService(integration);
    const defaultDomain = await msGraph.getDefaultDomain();
    const skusData = await msGraph.getSubscribedSkus();
    const groupsData = await msGraph.getGroups();

    const mailNickname = `${request.firstName.toLowerCase().replace(/\s+/g, '')}.${request.lastName.toLowerCase().replace(/\s+/g, '')}`;
    const userPrincipalName = `${mailNickname}@${defaultDomain}`;
    const tempPassword = `Hrmny!${Math.random().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(-3)}`;

    // ==========================================
    // PHASE 1: CREATE THE USER IN MICROSOFT
    // ==========================================
    const msUser = await msGraph.createUser({
      displayName: `${request.firstName} ${request.lastName}`,
      mailNickname,
      userPrincipalName,
      tempPassword,
    });

    const msUserId = msUser.id;

    // ==========================================
    // THE DEFINITIVE FIX: EXPLICITLY PATCH THE MAIL
    // ==========================================
    // We immediately hit MS Graph again to forcefully inject the primary email.
    // This bypasses the Exchange server delay and guarantees Supabase gets the email.
    await msGraph.patchUser(msUserId, { mail: userPrincipalName });

    // ==========================================
    // PHASE 2: ASSIGN LICENSES
    // ==========================================
    if (request.requestedLicenses) {
      const requestedSkus = request.requestedLicenses.split(" | ")[0].split(", ");
      const addLicenses = [];
      
      for (const reqSku of requestedSkus) {
        const liveSku = skusData.find((s: { skuPartNumber: string, skuId: string }) => s.skuPartNumber === reqSku);
        if (liveSku) addLicenses.push(liveSku.skuId);
      }

      await msGraph.assignLicenses(msUserId, addLicenses);
    }

    // ==========================================
    // PHASE 3: ADD TO GROUPS
    // ==========================================
    if (request.requestedGroups) {
      const requestedGroupNames = request.requestedGroups.split(", ");
      for (const groupName of requestedGroupNames) {
        const liveGroup = groupsData.find((g: { displayName: string, id: string }) => g.displayName === groupName);
        if (liveGroup) {
          await msGraph.addUserToGroup(liveGroup.id, msUserId);
        }
      }
    }

    // ==========================================
    // PHASE 4: START INTERNAL WORKFLOW
    // ==========================================
    const workflowId = crypto.randomUUID();
    await db.insert(onboardingWorkflows).values({
      id: workflowId,
      orgId: dbUser.orgId,
      newHireId: null, // User doesn't exist in Supabase yet (handled by sync)
      hireRequestId: request.id,
      roleTitle: request.jobTitle,
      department: request.department,
      startDate: new Date(), // Should ideally come from the request
      status: "ACTIVE"
    });

    // Seed tasks from profile
    if (request.profileId) {
      const defaultTasks = await db.query.roleProfileTasks.findMany({
        where: eq(roleProfiles.id, request.profileId)
      });

      for (const dt of defaultTasks) {
        await db.insert(workflowTasks).values({
          id: crypto.randomUUID(),
          workflowId,
          title: dt.title,
          taskType: dt.taskType,
          status: "PENDING",
          requiresApproval: dt.requiresApproval,
          approverEmail: dt.approverEmail,
          provisionEntraGroupOnComplete: dt.provisionEntraGroupOnComplete
        });
      }
    }

    // ==========================================
    // PHASE 5: FINALIZE REQUEST
    // ==========================================
    await db.update(hireRequests)
      .set({ status: "PROVISIONED", updatedAt: new Date() })
      .where(eq(hireRequests.id, request.id));

    revalidatePath("/app/requests");
    return { success: true };

  } catch (error) {
    console.error("Provisioning failed:", error);
    return { error: error instanceof Error ? error.message : "Failed to provision user." };
  }
}

export async function rejectHireRequestAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser || dbUser.role === "EMPLOYEE") return { error: "Unauthorized" };

  const requestId = formData.get("requestId") as string;
  if (!requestId) return { error: "Missing Request ID" };

  try {
    await db.update(hireRequests)
      .set({ status: "REJECTED", updatedAt: new Date() })
      .where(and(
        eq(hireRequests.id, requestId),
        eq(hireRequests.orgId, dbUser.orgId)
      ));

    revalidatePath("/app/requests");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject request:", error);
    return { error: "Failed to reject" };
  }
}