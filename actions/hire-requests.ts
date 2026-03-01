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

  // 2. Grab the form data
  const profileId = formData.get("profileId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const personalEmail = formData.get("personalEmail") as string;
  
  // Is this a special custom hire?
  const isSpecialHire = formData.get("isSpecialHire") === "on";
  
  // 2.5 Grab the split fields from our updated UI
  const msLicense = formData.get("msLicense") as string;
  const otherLicenses = formData.get("otherLicenses") as string;
  const requestedGroups = formData.get("msGroup") as string;

  // Combine MS License and Other Licenses into one string for the database
  const requestedLicenses = [msLicense, otherLicenses].filter(Boolean).join(" | Other: ");

  if (!profileId || !firstName || !lastName || !personalEmail) {
    return { error: "Missing required fields" };
  }

  // 3. Look up the profile to get the job title and department automatically
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