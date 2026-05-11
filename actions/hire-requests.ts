// actions/hire-requests.ts
"use server";

import { db } from "@/db";
import { 
  hireRequests, 
  users, 
  roleProfiles, 
  organizationIntegrations, 
  onboardingWorkflows, 
  workflowTasks,
  profileTasks
} from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { MicrosoftGraphService } from "@/lib/infrastructure/microsoft-graph";

/**
 * Creates a new pending hire request from a submitted form.
 *
 * This action parses the manager's form input, checks for required fields,
 * and saves the request to the database. It then automatically dispatches
 * an email via Resend to the IT/HR department for approval.
 *
 * @param formData - The submitted form data containing profileId, firstName, lastName, etc.
 * @returns An object indicating success or a specific error message.
 *
 * @example
 * ```ts
 * const result = await createHireRequestAction(formData);
 * if (result.error) console.error(result.error);
 * ```
 */
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

/**
 * Executes the "God-Mode" provisioning transaction for an approved hire request.
 *
 * This is the core engine of Harmony OP. It authenticates with Microsoft Graph,
 * creates the user in Entra ID, assigns licenses and groups, seeds internal
 * onboarding workflows, and emails the generated credentials.
 *
 * @param formData - The submitted form data containing the requestId.
 * @returns An object indicating success or a specific error message.
 * @throws {Error} If the Microsoft Graph API provisioning transaction fails.
 *
 * @example
 * ```ts
 * const result = await approveHireRequestAction(formData);
 * if (result.success) revalidatePath('/app/requests');
 * ```
 */
export async function approveHireRequestAction(formData: FormData) {
  const resend = new Resend(process.env.RESEND_API_KEY);
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
    // First, we must create/ensure the internal user exists in our DB
    // Since Auth sync might not have run yet, we create it manually
    const [newInternalUser] = await db.insert(users).values({
      orgId: dbUser.orgId,
      email: userPrincipalName,
      name: `${request.firstName} ${request.lastName}`,
      role: "EMPLOYEE",
      department: request.department,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { 
        name: `${request.firstName} ${request.lastName}`,
        department: request.department 
      }
    })
    .returning();

    const workflowId = crypto.randomUUID();
    await db.insert(onboardingWorkflows).values({
      id: workflowId,
      orgId: dbUser.orgId,
      newHireId: newInternalUser.id,
      roleTitle: request.jobTitle,
      department: request.department,
      startDate: new Date(),
    });

    // Seed tasks from profile
    if (request.profileId) {
      const defaultTasks = await db.query.profileTasks.findMany({
        where: eq(profileTasks.profileId, request.profileId)
      });

      for (const dt of defaultTasks) {
        await db.insert(workflowTasks).values({
          id: crypto.randomUUID(),
          workflowId,
          title: dt.title,
          taskType: dt.taskType as "IT_ACCESS" | "HARDWARE" | "TRAINING" | "HR_ADMIN",
          status: "PENDING",
          requiresApproval: dt.requiresApproval,
          approverEmail: dt.approverEmail,
          provisionEntraGroupOnComplete: dt.provisionEntraGroupOnComplete
        });
      }
    }

    // ==========================================
    // PHASE 5: SEND WELCOME EMAIL & FINALIZE
    // ==========================================
    await resend.emails.send({
      from: 'Harmony OP IT <onboarding@resend.dev>',
      to: 'dpangione@online.gibz.ch',
      subject: `Welcome to Harmony OP - Your IT Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Welcome to the team, ${request.firstName}!</h2>
          <p>Your Manager has approved your onboarding. IT has automatically generated your corporate Microsoft 365 credentials.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">CORPORATE EMAIL</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: #0f172a;">${userPrincipalName}</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">TEMPORARY PASSWORD</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${tempPassword}</p>
          </div>

          <p>Please log in to <a href="https://office.com" style="color: #2563eb;">office.com</a>. You will be prompted to change this password immediately upon your first login.</p>
          <p>Best regards,<br/><strong>Harmony OP Automated IT Systems</strong></p>
        </div>
      `
    });

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

/**
 * Rejects a pending hire request.
 *
 * Sets the request status to 'REJECTED' in the database, preventing any
 * automated provisioning from occurring.
 *
 * @param formData - The submitted form data containing the requestId to reject.
 * @returns An object indicating success or an error message.
 */
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