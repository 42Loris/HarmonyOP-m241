// actions/profile-tasks.ts
"use server";

import { db } from "@/db";
import { profileTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addProfileTaskAction(formData: FormData) {
  const profileId = formData.get("profileId") as string;
  const title = formData.get("title") as string;
  const taskType = formData.get("taskType") as string;
  const requiresApproval = formData.get("requiresApproval") === "on";
  const approverEmail = formData.get("approverEmail") as string;
  const provisionEntraGroupOnComplete = formData.get("provisionEntraGroupOnComplete") as string;

  if (!profileId || !title || !taskType) return { error: "Missing fields" };

  try {
    await db.insert(profileTasks).values({
      profileId,
      title,
      taskType,
      requiresApproval,
      approverEmail,
      provisionEntraGroupOnComplete: provisionEntraGroupOnComplete || null,
    });

    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add task:", error);
    return { error: "Failed to save task" };
  }
}

export async function deleteProfileTaskAction(formData: FormData) {
  const id = formData.get("id") as string;
  const profileId = formData.get("profileId") as string;

  if (!id || !profileId) return { error: "Missing ID" };

  try {
    await db.delete(profileTasks).where(eq(profileTasks.id, id));
    
    revalidatePath(`/app/profiles/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { error: "Failed to delete task" };
  }
}