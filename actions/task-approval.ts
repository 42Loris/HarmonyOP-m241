"use server";

import { db } from "@/db";
import { workflowTasks, users, organizationIntegrations, auditLogs } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * approveTaskAction
 * 
 * Logic for Just-In-Time (JIT) Provisioning and Training-Gated Access.
 * This action marks a workflow task as DONE and optionally triggers
 * an automated Microsoft Graph API call to add the user to a security group.
 */
export async function approveTaskAction(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Fetch current DB User (the approver)
  const dbApprover = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbApprover) return { error: "Approver profile not found" };

  // 2. Fetch the Task with related data (Workflow & New Hire)
  const task = await db.query.workflowTasks.findFirst({
    where: eq(workflowTasks.id, taskId),
    with: {
      workflow: {
        with: {
          newHire: true
        }
      }
    }
  });

  if (!task) return { error: "Task not found" };
  if (!task.requiresApproval) return { error: "This task does not require explicit approval." };

  // 3. Authorization Check
  // Verify the logged-in user matches the designated approver email for this task
  if (dbApprover.email !== task.approverEmail) {
    return { error: `Unauthorized. Only ${task.approverEmail} can approve this task.` };
  }

  try {
    // 4. Update Task Status in Database
    await db.update(workflowTasks)
      .set({ status: "DONE", updatedAt: new Date() })
      .where(eq(workflowTasks.id, taskId));

    // 5. JIT Provisioning (Entra Group Assignment)
    if (task.provisionEntraGroupOnComplete) {
      const targetEmployee = task.workflow.newHire;
      const integration = await db.query.organizationIntegrations.findFirst({
        where: eq(organizationIntegrations.orgId, dbApprover.orgId)
      });

      if (!integration?.clientId || !integration?.clientSecret) {
        throw new Error("Microsoft Integration missing. Could not provision group access.");
      }

      // Authenticate with Microsoft Graph API
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
      if (!access_token) throw new Error("Failed to authenticate with Microsoft Graph");

      const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
      
      // Resolve Microsoft User ID by Email (UPN)
      const userRes = await fetch(`https://graph.microsoft.com/v1.0/users/${targetEmployee.email}`, { headers });
      const msUser = await userRes.json();
      if (!msUser.id) throw new Error(`Could not find Microsoft User for ${targetEmployee.email}`);

      // Add User to Group via Graph API
      const addGroupRes = await fetch(`https://graph.microsoft.com/v1.0/groups/${task.provisionEntraGroupOnComplete}/members/$ref`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${msUser.id}`
        })
      });

      if (!addGroupRes.ok) {
        const errorData = await addGroupRes.json();
        throw new Error(errorData.error?.message || "Failed to add user to Entra Group");
      }

      // 6. Log Action to Audit Logs
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        orgId: dbApprover.orgId,
        actorName: dbApprover.name,
        actionType: "PROVISION",
        description: `Approved task "${task.title}" and provisioned Entra Group ${task.provisionEntraGroupOnComplete} for ${targetEmployee.name}.`,
      });
    }

    revalidatePath("/app/tasks");
    revalidatePath("/app/dashboard");
    revalidatePath(`/app/profiles/${task.workflow.profileId}`);
    
    return { success: true };

  } catch (error: any) {
    console.error("Task approval failed:", error);
    return { error: error.message || "Failed to approve task" };
  }
}