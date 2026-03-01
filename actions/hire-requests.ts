// actions/hire-requests.ts
"use server";

import { db } from "@/db";
import { hireRequests, users, roleProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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
  
  // Is this a special custom hire?
  const isSpecialHire = formData.get("isSpecialHire") === "on";
  
  // === NEW: Grab Arrays using getAll() for checkboxes ===
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
    // 4. Save the Pending Request
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
  } catch (error) {
    console.error("Failed to create hire request:", error);
    return { error: "Failed to create request" };
  }
  
  // 5. Redirect the HR admin to the pending approvals dashboard
  redirect("/app/requests");
}

// Add this to the bottom of actions/hire-requests.ts
import { revalidatePath } from "next/cache";

export async function approveHireRequestAction(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  if (!requestId) return { error: "Missing ID" };

  try {
    // 1. Update the status in the database
    await db.update(hireRequests)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(hireRequests.id, requestId));

    // NOTE: In the next step, this is exactly where we will trigger 
    // the Microsoft Graph API to physically create the user!

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