// actions/profile-provisioning.ts
"use server";

import { db } from "@/db";
import { roleProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfileProvisioningAction(formData: FormData) {
  const profileId = formData.get("profileId") as string;
  
  // Grab the arrays of checked boxes
  const msLicensesArray = formData.getAll("msLicenses") as string[];
  const msGroupsArray = formData.getAll("msGroups") as string[];

  if (!profileId) return { error: "Missing Profile ID" };

  // Convert arrays to comma-separated strings
  const defaultLicenses = msLicensesArray.length > 0 ? msLicensesArray.join(", ") : null;
  const defaultGroups = msGroupsArray.length > 0 ? msGroupsArray.join(", ") : null;

  try {
    await db.update(roleProfiles)
      .set({
        defaultLicenses,
        defaultGroups,
        updatedAt: new Date(),
      })
      .where(eq(roleProfiles.id, profileId));

    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update provisioning defaults:", error);
    return { error: "Failed to update profile" };
  }
}