"use server";

import { db } from "@/db";
import { onboardingWorkflows } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleActionItemAction(workflowId: string, itemKey: string) {
  try {
    // 1. Fetch current workflow
    const workflow = await db.query.onboardingWorkflows.findFirst({
      where: eq(onboardingWorkflows.id, workflowId),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // 2. Parse current completed items
    let completedItems: string[] = [];
    try {
      completedItems = JSON.parse(workflow.completedActionItems || "[]");
    } catch {
      completedItems = [];
    }

    // 3. Toggle the item
    if (completedItems.includes(itemKey)) {
      completedItems = completedItems.filter(i => i !== itemKey);
    } else {
      completedItems.push(itemKey);
    }

    // 4. Update the DB
    await db.update(onboardingWorkflows)
      .set({ completedActionItems: JSON.stringify(completedItems) })
      .where(eq(onboardingWorkflows.id, workflowId));

    // 5. Revalidate the dashboard
    revalidatePath("/app/dashboard");
    
    return { success: true, completedItems };
  } catch (error) {
    console.error("Failed to toggle action item:", error);
    return { success: false, error: "Failed to update checklist" };
  }
}
