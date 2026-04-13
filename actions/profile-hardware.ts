"use server";

import { db } from "@/db";
import { profileHardware } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * addProfileHardwareAction
 * 
 * Inserts a new hardware record into the profile_hardware table.
 */
export async function addProfileHardwareAction(formData: FormData) {
  const profileId = formData.get("profileId") as string;
  const category = formData.get("category") as string;
  const url = formData.get("url") as string;
  const itemName = formData.get("itemName") as string;
  const price = formData.get("price") as string;

  if (!profileId || !category || !url || !itemName || !price) {
    return { error: "Missing required fields" };
  }

  try {
    await db.insert(profileHardware).values({
      profileId,
      category,
      url,
      itemName,
      price,
    });

    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to add hardware:", error);
    return { error: "Failed to save hardware record." };
  }
}

/**
 * deleteProfileHardwareAction
 * 
 * Removes a hardware record from the profile_hardware table.
 */
export async function deleteProfileHardwareAction(formData: FormData) {
  const id = formData.get("id") as string;
  const profileId = formData.get("profileId") as string;

  if (!id || !profileId) return { error: "Missing ID" };

  try {
    await db.delete(profileHardware).where(eq(profileHardware.id, id));
    
    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete hardware:", error);
    return { error: "Failed to remove hardware record." };
  }
}