"use server";

import { db } from "@/db";
import { onboardingWorkflows, workflowTasks, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { calculateProgressRatio } from "@/lib/utils";

export async function toggleActionItemAction(workflowId: string, taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser) return { error: "User not found" };

  try {
    // 1. Verify authorization
    const workflow = await db.query.onboardingWorkflows.findFirst({
      where: and(
        eq(onboardingWorkflows.id, workflowId),
        or(
          eq(onboardingWorkflows.newHireId, dbUser.id),
          and(
            eq(onboardingWorkflows.orgId, dbUser.orgId),
            or(eq(users.role, "MANAGER"), eq(users.role, "HR"))
          )
        )
      ),
    });

    if (!workflow) {
      return { error: "Workflow not found or access denied" };
    }

    // 2. Fetch the specific task
    const task = await db.query.workflowTasks.findFirst({
      where: and(
        eq(workflowTasks.id, taskId),
        eq(workflowTasks.workflowId, workflowId)
      )
    });

    if (!task) {
      return { error: "Task not found" };
    }

    // 3. Toggle the task status
    const newStatus = task.status === "PENDING" ? "DONE" : "PENDING";
    
    await db.update(workflowTasks)
      .set({ status: newStatus })
      .where(eq(workflowTasks.id, taskId));

    // 4. Recalculate progress ratio
    const allTasks = await db.query.workflowTasks.findMany({
      where: eq(workflowTasks.workflowId, workflowId)
    });

    // Manually update the current task in the list for ratio calculation
    // because findMany might return stale data in the same transaction
    const updatedTasks = allTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );

    const progressRatio = calculateProgressRatio(updatedTasks);

    // 5. Update the workflow with the new ratio
    await db.update(onboardingWorkflows)
      .set({ progressRatio })
      .where(eq(onboardingWorkflows.id, workflowId));

    // 6. Revalidate the dashboard
    revalidatePath("/app/dashboard");
    
    return { success: true, progressRatio };
  } catch (error) {
    console.error("Failed to toggle action item:", error);
    return { success: false, error: "Failed to update checklist" };
  }
}
