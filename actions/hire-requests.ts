// actions/hire-requests.ts
"use server";

import { db } from "@/db";
import { hireRequests, users, roleProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

// Initialize Resend with your API Key from .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function createHireRequestAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Get the current HR user making the request
  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser) return { error: "User not found" };

  // 2. Grab the standard form data
  const profileId = formData.get("profileId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const personalEmail = formData.get("personalEmail") as string;
  const isSpecialHire = formData.get("isSpecialHire") === "on";
  
  // Grab Arrays using getAll() for checkboxes
  const msLicensesArray = formData.getAll("msLicenses") as string[]; 
  const msGroupsArray = formData.getAll("msGroups") as string[];
  const otherLicenses = formData.get("otherLicenses") as string;

  // Combine checked MS Licenses and Other Licenses into one readable string
  const requestedLicenses = [
    msLicensesArray.length > 0 ? msLicensesArray.join(", ") : null, 
    otherLicenses ? `Other: ${otherLicenses}` : null
  ].filter(Boolean).join(" | ");

  // Combine checked MS Groups into a readable string
  const requestedGroups = msGroupsArray.length > 0 ? msGroupsArray.join(", ") : null;

  if (!profileId || !firstName || !lastName || !personalEmail) {
    return { error: "Missing required fields" };
  }

  // 3. Look up the profile
  const profile = await db.query.roleProfiles.findFirst({
    where: eq(roleProfiles.id, profileId)
  });

  if (!profile) return { error: "Profile not found" };

  try {
    // 4. Save the Pending Request to Database
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

    // 5. Send Email Notification via Resend
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

          <a href="http://localhost:3000/app/requests" 
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
  
  // 6. Redirect the HR admin to the pending approvals dashboard
  redirect("/app/requests");
}

export async function approveHireRequestAction(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  if (!requestId) return { error: "Missing ID" };

  try {
    await db.update(hireRequests)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(hireRequests.id, requestId));

    // Microsoft Graph Provisioning logic will go here in the next step!

    revalidatePath("/app/requests");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve request:", error);
    return { error: "Failed to approve" };
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