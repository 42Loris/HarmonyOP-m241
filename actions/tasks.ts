// actions/tasks.ts
"use server";

import { db } from "@/db";
import { workflowTasks, onboardingWorkflows } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Status = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export async function updateTaskStatus(taskId: string, newStatus: Status) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    // 1. Update the specific task and return it so we know which workflow it belongs to
    const [updatedTask] = await db.update(workflowTasks)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(workflowTasks.id, taskId))
      .returning();

    if (!updatedTask) return { error: "Task not found" };

    // 2. Fetch ALL tasks for this specific workflow to calculate true progress
    const allTasks = await db.query.workflowTasks.findMany({
      where: eq(workflowTasks.workflowId, updatedTask.workflowId),
    });

    if (allTasks.length > 0) {
      // 3. Calculate weighted completion percentage
      // DONE = 1 point, IN_PROGRESS = 0.5 points
      const doneCount = allTasks.filter(t => t.status === "DONE").length;
      const inProgressCount = allTasks.filter(t => t.status === "IN_PROGRESS").length;
      
      const totalScore = doneCount + (inProgressCount * 0.5);
      
      // Calculate ratio and add safety fallback to prevent NaN crashes
      const progressRatio = Math.round((totalScore / allTasks.length) * 100) || 0;
      const safeProgressRatio = Math.min(100, Math.max(0, progressRatio));

      // 4. Update the Workflow's progress bar in the database
      await db.update(onboardingWorkflows)
        .set({ progressRatio: safeProgressRatio })
        .where(eq(onboardingWorkflows.id, updatedTask.workflowId));
    }

    // 5. The Nuclear Cache Clear: Forces Next.js to redraw the entire Dashboard and Task Board
    revalidatePath("/app", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "Failed to update task status" };
  }
}