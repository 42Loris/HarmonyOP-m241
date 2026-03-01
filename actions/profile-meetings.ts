// actions/profile-meetings.ts
"use server";

import { db } from "@/db";
import { profileMeetings } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function addProfileMeetingAction(formData: FormData) {
  const profileId = formData.get("profileId") as string;
  const title = formData.get("title") as string;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string) || 60;
  const hostEmail = formData.get("hostEmail") as string;

  if (!profileId || !title || !hostEmail) return { error: "Missing fields" };

  try {
    await db.insert(profileMeetings).values({
      profileId,
      title,
      durationMinutes,
      hostEmail,
    });

    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add meeting:", error);
    return { error: "Failed to save meeting" };
  }
}