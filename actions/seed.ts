// actions/seed.ts
"use server";

import { db } from "@/db";
import { users, onboardingWorkflows, workflowTasks } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function seedDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  try {
    const hrUser = await db.query.users.findFirst({
      where: eq(users.authId, user.id),
    });

    if (!hrUser) return;

    await db.transaction(async (tx) => {
      // 1. Create Mock Employee
      const [newHire] = await tx.insert(users).values({
        orgId: hrUser.orgId,
        email: `mock-${Date.now()}@example.com`,
        name: "Mock Employee",
        role: "EMPLOYEE",
        department: "Engineering",
      }).returning();

      // 2. Create Workflow
      const [workflow] = await tx.insert(onboardingWorkflows).values({
        orgId: hrUser.orgId,
        newHireId: newHire.id,
        roleTitle: "Software Engineer",
        department: "Engineering",
        startDate: new Date(),
        progressRatio: 0,
      }).returning();

      // 3. Create Tasks
      await tx.insert(workflowTasks).values([
        { workflowId: workflow.id, title: "Create AD & Email Account", taskType: "IT_ACCESS", status: "PENDING" },
        { workflowId: workflow.id, title: "Order Laptop & Peripherals", taskType: "HARDWARE", status: "PENDING" },
        { workflowId: workflow.id, title: "Setup Payroll", taskType: "HR_ADMIN", status: "PENDING" },
      ]);
    });

    // Refresh UI
    revalidatePath("/app/dashboard");
    
    // Returning void to satisfy Next.js 15 strict form action types
  } catch (error) {
    console.error("Seed error:", error);
  }
}