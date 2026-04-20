"use server";

import { db } from "@/db";
import { onboardingWorkflows, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function toggleActionItemAction(workflowId: string, itemKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser) return { error: "User not found" };

  try {
    // 1. Fetch current workflow and verify authorization
    // Authorization: User must be either the owner (newHireId) OR an Admin/HR in the same org
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
