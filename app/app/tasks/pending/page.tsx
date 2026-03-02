// app/app/tasks/pending/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, onboardingWorkflows } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PendingTasksList from "./PendingTasksList";

export default async function GlobalPendingTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch all workflows and their nested tasks
  const activeWorkflows = await db.query.onboardingWorkflows.findMany({
    where: eq(onboardingWorkflows.orgId, dbUser.orgId),
    with: { newHire: true, tasks: true },
  });

  // Flatten the arrays and filter out anything that is already DONE
  const incompleteTasks = activeWorkflows.flatMap(workflow => 
    workflow.tasks
      .filter(task => task.status !== "DONE")
      .map(task => ({
        id: task.id,
        title: task.title,
        taskType: task.taskType,
        status: task.status,
        startDate: workflow.startDate, // Crucial for Urgency Math!
        employeeName: workflow.newHire?.name || "Unknown User",
        roleTitle: workflow.roleTitle,
        department: workflow.department,
      }))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Mission Control: Pending Tasks</h1>
        <p className="text-sm text-slate-500 mt-2">
          Global overview of all outstanding IT and HR tasks, sorted by start date urgency.
        </p>
      </header>

      <PendingTasksList initialTasks={incompleteTasks} />
    </div>
  );
}