// actions/onboarding.ts
"use server";

import { db } from "@/db";
import { users, onboardingWorkflows, workflowTasks, onboardingProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const TriggerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  profileId: z.string().min(1, "Please select a role profile"),
  startDate: z.string().min(1, "Start date is required"),
});

export async function triggerOnboardingAction(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const hrUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!hrUser) return { error: "Tenant connection not found" };

  const payload = {
    name: formData.get("name")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    profileId: formData.get("profileId")?.toString() || "",
    startDate: formData.get("startDate")?.toString() || "",
  };

  const parsed = TriggerSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || "Please fill out all fields correctly." };
  }

  const { name, email, profileId, startDate } = parsed.data;

  try {
    const profile = await db.query.onboardingProfiles.findFirst({
      where: eq(onboardingProfiles.id, profileId)
    });

    if (!profile) return { error: "Selected profile not found." };

    await db.transaction(async (tx) => {
      const [newHire] = await tx.insert(users).values({
        orgId: hrUser.orgId,
        email,
        name,
        role: "EMPLOYEE",
        department: profile.department, 
      }).returning();

      const [workflow] = await tx.insert(onboardingWorkflows).values({
        orgId: hrUser.orgId,
        newHireId: newHire.id,
        profileId: profile.id, 
        roleTitle: profile.roleTitle, 
        department: profile.department, 
        startDate: new Date(startDate),
        progressRatio: 0,
      }).returning();

      // === NEW: ADDED COSTS TO THE TASKS ===
      await tx.insert(workflowTasks).values([
        { 
          workflowId: workflow.id, 
          title: "Create AD & Email Account", 
          taskType: "IT_ACCESS", 
          status: "PENDING",
          cost: 350 // Software seat cost
        },
        { 
          workflowId: workflow.id, 
          title: "Order Laptop & Peripherals", 
          taskType: "HARDWARE", 
          status: "PENDING",
          cost: 2500 // Hardware cost
        },
        { 
          workflowId: workflow.id, 
          title: "Setup Payroll", 
          taskType: "HR_ADMIN", 
          status: "PENDING",
          cost: 0 // Admin tasks are zero cost
        },
      ]);
    });

    revalidatePath("/app/dashboard");
    return { success: true, timestamp: Date.now() }; 

  } catch (error) {
    console.error(error);
    return { error: "Database transaction failed." };
  }
}