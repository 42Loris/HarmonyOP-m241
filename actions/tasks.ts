// actions/tasks.ts
"use server";

import { db } from "@/db";
import { workflowTasks, onboardingWorkflows, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateProgressRatio } from "@/lib/utils";

export async function updateTaskStatus(taskId: string, newStatus: "PENDING" | "DONE") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser || dbUser.role === "EMPLOYEE") {
    return { error: "Unauthorized access." };
  }

  try {
    const task = await db.query.workflowTasks.findFirst({
      where: eq(workflowTasks.id, taskId),
      with: { workflow: true }
    });

    if (!task || task.workflow.orgId !== dbUser.orgId) {
      return { error: "Task not found or access denied" };
    }

    const [updatedTask] = await db.update(workflowTasks)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(workflowTasks.id, taskId))
      .returning();

    if (!updatedTask) return { error: "Failed to update task" };

    const allTasks = await db.query.workflowTasks.findMany({
      where: eq(workflowTasks.workflowId, updatedTask.workflowId),
    });

    if (allTasks.length > 0) {
      const progressRatio = calculateProgressRatio(allTasks);

      await db.update(onboardingWorkflows)
        .set({ progressRatio })
        .where(eq(onboardingWorkflows.id, updatedTask.workflowId));
    }

    revalidatePath("/app", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "Failed to update task status" };
  }
}