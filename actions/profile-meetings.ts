// actions/profile-meetings.ts
"use server";

import { db } from "@/db";
import { profileMeetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addProfileMeetingAction(formData: FormData) {
  const profileId = formData.get("profileId") as string;
  const title = formData.get("title") as string;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string) || 60;
  const hostEmail = formData.get("hostEmail") as string;
  
  // Grab both the internal and external guests
  const internalGuests = formData.get("internalGuests") as string;
  const externalGuests = formData.get("externalGuests") as string;

  // Combine them into a single string for the database (ignores empty fields)
  const combinedGuests = [internalGuests, externalGuests]
    .filter(email => email && email.trim() !== "")
    .join(", ");

  if (!profileId || !title || !hostEmail) return { error: "Missing fields" };

  try {
    await db.insert(profileMeetings).values({
      profileId,
      title,
      durationMinutes,
      hostEmail,
      additionalAttendees: combinedGuests || null,
    });

    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add meeting:", error);
    return { error: "Failed to save meeting" };
  }
}

export async function deleteProfileMeetingAction(formData: FormData) {
  const id = formData.get("id") as string;
  const profileId = formData.get("profileId") as string;

  if (!id || !profileId) return { error: "Missing ID" };

  try {
    await db.delete(profileMeetings).where(eq(profileMeetings.id, id));
    
    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    return { error: "Failed to delete meeting" };
  }
}