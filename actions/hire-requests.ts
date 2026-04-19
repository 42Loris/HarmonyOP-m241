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
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

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
    where: eq(roleProfiles.id, profileId)
  });

  if (!profile) return { error: "Profile not found" };

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
  
  redirect("/app/requests");
}

export async function approveHireRequestAction(formData: FormData) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const requestId = formData.get("requestId") as string;
  if (!requestId) return { error: "Missing ID" };

  try {
    const request = await db.query.hireRequests.findFirst({
      where: eq(hireRequests.id, requestId),
      with: { profile: { with: { defaultTasks: true } } }
    });
    
    if (!request) return { error: "Request not found" };

    const integration = await db.query.organizationIntegrations.findFirst({
      where: eq(organizationIntegrations.orgId, request.orgId)
    });

    if (!integration?.clientId || !integration?.clientSecret) {
      return { error: "Microsoft Integration missing. IT must connect tenant first." };
    }

    const tokenRes = await fetch(`https://login.microsoftonline.com/${integration.tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: integration.clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: integration.clientSecret,
        grant_type: "client_credentials",
      }),
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) throw new Error("Failed to authenticate with Microsoft Graph");

    const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
    
    const domainsRes = await fetch(`https://graph.microsoft.com/v1.0/domains`, { headers });
    const domainsData = await domainsRes.json();
    const defaultDomain = domainsData.value?.find((d: { isDefault: boolean, id: string }) => d.isDefault)?.id || "company.com";

    const skusRes = await fetch(`https://graph.microsoft.com/v1.0/subscribedSkus`, { headers });
    const skusData = await skusRes.json();
    
    const groupsRes = await fetch(`https://graph.microsoft.com/v1.0/groups?$select=id,displayName`, { headers });
    const groupsData = await groupsRes.json();

    const mailNickname = `${request.firstName.toLowerCase().replace(/\s+/g, '')}.${request.lastName.toLowerCase().replace(/\s+/g, '')}`;
    const userPrincipalName = `${mailNickname}@${defaultDomain}`;
    const tempPassword = `Hrmny!${Math.random().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(-3)}`;

    // ==========================================
    // PHASE 1: CREATE THE USER IN MICROSOFT
    // ==========================================
    const createUserRes = await fetch(`https://graph.microsoft.com/v1.0/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        accountEnabled: true,
        displayName: `${request.firstName} ${request.lastName}`,
        mailNickname: mailNickname,
        userPrincipalName: userPrincipalName,
        usageLocation: "CH", 
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: tempPassword
        }
      })
    });
    
    const msUser = await createUserRes.json();
    if (msUser.error) {
      console.error("MS Graph Error:", msUser.error);
      throw new Error(`Microsoft rejected user creation: ${msUser.error.message}`);
    }

    const msUserId = msUser.id;

    // ==========================================
    // THE DEFINITIVE FIX: EXPLICITLY PATCH THE MAIL
    // ==========================================
    // We immediately hit MS Graph again to forcefully inject the primary email.
    // This bypasses the Exchange server delay and guarantees Supabase gets the email.
    await fetch(`https://graph.microsoft.com/v1.0/users/${msUserId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ 
        mail: userPrincipalName 
      })
    });

    // ==========================================
    // PHASE 2: ASSIGN LICENSES
    // ==========================================
    if (request.requestedLicenses) {
      const requestedSkus = request.requestedLicenses.split(" | ")[0].split(", ");
      const addLicenses = [];
      
      for (const reqSku of requestedSkus) {
        const liveSku = skusData.value?.find((s: { skuPartNumber: string, skuId: string }) => s.skuPartNumber === reqSku);
        if (liveSku) addLicenses.push({ skuId: liveSku.skuId });
      }

      if (addLicenses.length > 0) {
        await fetch(`https://graph.microsoft.com/v1.0/users/${msUserId}/assignLicense`, {
          method: "POST",
          headers,
          body: JSON.stringify({ addLicenses, removeLicenses: [] })
        });
      }
    }

    // ==========================================
    // PHASE 3: ADD TO GROUPS
    // ==========================================
    if (request.requestedGroups) {
      const requestedGroupNames = request.requestedGroups.split(", ");
      for (const groupName of requestedGroupNames) {
        const liveGroup = groupsData.value?.find((g: { displayName: string, id: string }) => g.displayName === groupName);
        if (liveGroup) {
          await fetch(`https://graph.microsoft.com/v1.0/groups/${liveGroup.id}/members/$ref`, {
            method: "POST",
            headers,
            body: JSON.stringify({ "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${msUserId}` })
          });
        }
      }
    }

    // ==========================================
    // PHASE 4: START HARMONY INTERNAL WORKFLOW
    // ==========================================
    const [newInternalUser] = await db.insert(users).values({
      orgId: request.orgId,
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

    const [newWorkflow] = await db.insert(onboardingWorkflows).values({
      orgId: request.orgId,
      newHireId: newInternalUser.id,
      profileId: request.profileId,
      roleTitle: request.jobTitle,
      department: request.department,
      startDate: new Date(),
    }).returning();

    if (request.profile?.defaultTasks && request.profile.defaultTasks.length > 0) {
      const tasksToInsert = request.profile.defaultTasks.map(task => ({
        workflowId: newWorkflow.id,
        title: task.title,
        taskType: task.taskType as "IT_ACCESS" | "HARDWARE" | "TRAINING" | "HR_ADMIN",
        status: "PENDING" as const,
        requiresApproval: task.requiresApproval,
        approverEmail: task.approverEmail,
        provisionEntraGroupOnComplete: task.provisionEntraGroupOnComplete,
      }));
      await db.insert(workflowTasks).values(tasksToInsert);
    }

    // ==========================================
    // PHASE 5: SEND THE WELCOME EMAIL (With Password)
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
      .where(eq(hireRequests.id, requestId));

    revalidatePath("/app/requests");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve request:", error);
    return { error: error instanceof Error ? error.message : "Failed to provision user" };
  }
}

export async function rejectHireRequestAction(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  if (!requestId) return { error: "Missing ID" };

  try {
    await db.update(hireRequests)
      .set({ status: "REJECTED", updatedAt: new Date() })
      .where(eq(hireRequests.id, requestId));

    revalidatePath("/app/requests");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject request:", error);
    return { error: "Failed to reject" };
  }
}