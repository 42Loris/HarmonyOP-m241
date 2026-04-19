// actions/tenant-reset.ts
"use server";

import { db } from "@/db";
import { 
  hireRequests, 
  onboardingWorkflows, 
  workflowTasks, 
  roleProfiles, 
  users 
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function resetTenantDataAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Ensure only HR users can do this
  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  
  // === FIX: Changed "HR_ADMIN" to "HR" to match your schema! ===
  if (!dbUser || dbUser.role !== "HR") return { error: "Unauthorized" };

  const orgId = dbUser.orgId;

  try {
    // 1. Find all workflows to delete their nested tasks first (prevents Foreign Key crash)
    const workflows = await db.query.onboardingWorkflows.findMany({
      where: eq(onboardingWorkflows.orgId, orgId)
    });

    const workflowIds = workflows.map(w => w.id);
    if (workflowIds.length > 0) {
      await db.delete(workflowTasks).where(inArray(workflowTasks.workflowId, workflowIds));
    }

    // 2. Delete Workflows & Pending Hire Requests
    await db.delete(onboardingWorkflows).where(eq(onboardingWorkflows.orgId, orgId));
    await db.delete(hireRequests).where(eq(hireRequests.orgId, orgId));

    // 3. Delete Role Profiles (because they hold the OLD tenant's licenses and groups)
    await db.delete(roleProfiles).where(eq(roleProfiles.orgId, orgId));

    // 4. Delete all created Employee accounts (but KEEP the HR Admins!)
    await db.delete(users).where(
      and(
        eq(users.orgId, orgId),
        eq(users.role, "EMPLOYEE")
      )
    );

    revalidatePath("/app/dashboard");
    revalidatePath("/app/settings");
    revalidatePath("/app/profiles");
    revalidatePath("/app/requests");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to reset tenant data:", error);
    return { error: error instanceof Error ? error.message : "Failed to reset data" };
  }
}