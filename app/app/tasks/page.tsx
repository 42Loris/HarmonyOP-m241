// app/app/tasks/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, onboardingWorkflows } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TaskBoard from "./TaskBoard";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch all active workflows and their tasks
  const activeWorkflows = await db.query.onboardingWorkflows.findMany({
    where: eq(onboardingWorkflows.orgId, dbUser.orgId),
    with: {
      newHire: true,
      tasks: true,
    },
  });

  // Filter ONLY IT-related tasks
  const itTaskTypes = ["HARDWARE", "SOFTWARE", "ACCESS", "IT_PROVISIONING"];

  // Flatten the nested data into a simple array for the Kanban board
  const allTasks = activeWorkflows.flatMap(workflow => 
    workflow.tasks
      .filter(task => itTaskTypes.includes(task.taskType)) // <--- THE MAGIC FILTER
      .map(task => ({
        id: task.id,
        title: task.title,
        taskType: task.taskType,
        status: task.status,
        workflow: {
          roleTitle: workflow.roleTitle,
          department: workflow.department,
          newHireName: workflow.newHire?.name || "Unknown User",
        }
      }))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">IT Provisioning Tasks</h1>
        <p className="text-sm text-slate-500 mt-2">
          Manage AD accounts, permissions, and hardware preparation.
        </p>
      </header>

      {/* Render our interactive Client Component */}
      <TaskBoard initialTasks={allTasks} />
    </div>
  );
}