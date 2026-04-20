// actions/tasks.ts
"use server";

import { db } from "@/db";
import { workflowTasks, onboardingWorkflows, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Status = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export async function updateTaskStatus(taskId: string, newStatus: Status) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser || dbUser.role === "EMPLOYEE") {
    return { error: "Unauthorized access. Only Admins/HR can manage tasks." };
  }

  try {
    // 1. Fetch task and verify multi-tenancy before update
    const task = await db.query.workflowTasks.findFirst({
      where: eq(workflowTasks.id, taskId),
      with: { workflow: true }
    });

    if (!task || task.workflow.orgId !== dbUser.orgId) {
      return { error: "Task not found or access denied" };
    }

    // 2. Update the specific task
    const [updatedTask] = await db.update(workflowTasks)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(workflowTasks.id, taskId))
      .returning();

    if (!updatedTask) return { error: "Failed to update task" };

    // 3. Fetch ALL tasks for this specific workflow to calculate true progress
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