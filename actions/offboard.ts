// actions/offboard.ts
"use server";

import { db } from "@/db";
import { users, organizationIntegrations, onboardingWorkflows, workflowTasks, auditLogs } from "@/db/schema"; // <-- Imported auditLogs
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function offboardEmployeeAction(employeeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbAdmin = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbAdmin || dbAdmin.role === "EMPLOYEE") {
    return { error: "Unauthorized access. Only Admins can offboard employees." };
  }

  try {
    const targetEmployee = await db.query.users.findFirst({ where: eq(users.id, employeeId) });
    if (!targetEmployee) return { error: "Employee not found." };

    const integration = await db.query.organizationIntegrations.findFirst({
      where: eq(organizationIntegrations.orgId, dbAdmin.orgId)
    });

    if (integration?.clientId && integration?.clientSecret) {
      const tokenRes = await fetch(`https://login.microsoftonline.com/${integration.tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: integration.clientId,
          scope: "https://graph.microsoft.com/.default",
          client_secret: integration.clientSecret,
          grant_type: "client_credentials",
        }),
      });
      
      const { access_token } = await tokenRes.json();

      if (access_token) {
        const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
        
        await fetch(`https://graph.microsoft.com/v1.0/users/${targetEmployee.email}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ accountEnabled: false })
        });

        await fetch(`https://graph.microsoft.com/v1.0/users/${targetEmployee.email}/revokeSignInSessions`, {
          method: "POST",
          headers
        });
      }
    }

    await db.update(users)
      .set({ department: "Terminated (Offboarded)" })
      .where(eq(users.id, employeeId));

    const [offboardWorkflow] = await db.insert(onboardingWorkflows).values({
      id: crypto.randomUUID(),
      orgId: dbAdmin.orgId,
      newHireId: targetEmployee.id,
      // profileId: "OFFBOARDING" <--- DELETED THIS LINE TO FIX THE UUID ERROR!
      roleTitle: "Offboarding Process",
      department: "Terminated",
      startDate: new Date(),
    }).returning();

    await db.insert(workflowTasks).values([
      {
        id: crypto.randomUUID(),
        workflowId: offboardWorkflow.id,
        title: "Collect Company Hardware (Laptop, Phone)",
        taskType: "HARDWARE",
        status: "PENDING",
      },
      {
        id: crypto.randomUUID(),
        workflowId: offboardWorkflow.id,
        title: "Revoke 3rd Party SaaS Licenses (GitHub, Figma)",
        taskType: "IT_ACCESS",
        status: "PENDING",
      },
      {
        id: crypto.randomUUID(),
        workflowId: offboardWorkflow.id,
        title: "Conduct Exit Interview & Final Payroll",
        taskType: "HR_ADMIN",
        status: "PENDING",
      }
    ]);

    // === NEW: WRITE TO THE AUDIT LOG ===
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      orgId: dbAdmin.orgId,
      actorName: dbAdmin.name, // The Admin who clicked the button
      actionType: "TERMINATION",
      description: `Revoked Microsoft 365 access and initiated offboarding for ${targetEmployee.name}.`,
    });

    revalidatePath("/app", "layout");
    return { success: true };
  } catch (error) {
    console.error("Offboarding failed:", error);
    return { error: "Failed to offboard employee." };
  }
}