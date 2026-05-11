// app/app/hr-tasks/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, onboardingWorkflows } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, Users } from "lucide-react";
import MarkDoneButton from "@/components/tasks/MarkDoneButton";

export default async function HRTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  const activeWorkflows = await db.query.onboardingWorkflows.findMany({
    where: eq(onboardingWorkflows.orgId, dbUser.orgId),
    with: { newHire: true, tasks: true },
    orderBy: (workflows, { desc }) => [desc(workflows.createdAt)],
  });

  const hrTaskTypes = ["HR_ADMIN", "TRAINING", "PAPERWORK"];

  const workflowsWithPendingTasks = activeWorkflows.map(workflow => {
    const pendingTasks = workflow.tasks.filter(task => 
      hrTaskTypes.includes(task.taskType) && task.status === "PENDING"
    );
    return { ...workflow, pendingTasks };
  }).filter(workflow => workflow.pendingTasks.length > 0);

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      <header className="mb-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Users className="h-8 w-8 text-slate-700 dark:text-slate-500" />
          HR Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Manage payroll setup, contracts, and welcome packages for new hires.
        </p>
      </header>

      {workflowsWithPendingTasks.length === 0 ? (
        <EmptyState 
          icon={ClipboardList}
          title="Inbox Zero"
          description="There are no pending HR tasks requiring your attention."
          className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        />
      ) : (
        <div className="space-y-8">
          {workflowsWithPendingTasks.map(workflow => (
            <section key={workflow.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {workflow.newHire?.name || "Unknown User"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {workflow.roleTitle} • {workflow.department}
                </p>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Task</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {workflow.pendingTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{task.title}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {task.taskType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MarkDoneButton taskId={task.id} taskTitle={task.title} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}