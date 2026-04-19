// app/app/workflows/page.tsx
import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import { users, onboardingWorkflows } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, Briefcase } from "lucide-react";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch all workflows with their associated tasks and new hire data
  const workflows = await db.query.onboardingWorkflows.findMany({
    where: eq(onboardingWorkflows.orgId, dbUser.orgId),
    with: {
      newHire: true,
      tasks: true,
    },
    orderBy: [desc(onboardingWorkflows.createdAt)],
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Active Workflows</h1>
        <p className="text-sm text-slate-500">Track the end-to-end onboarding progress for all new hires.</p>
      </header>

      <div className="grid gap-4">
        {workflows.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No active workflows found. Trigger an onboarding to see it here.</p>
          </div>
        ) : (
          workflows.map((wf) => {
            const totalTasks = wf.tasks?.length || 0;
            const completedTasks = wf.tasks?.filter((t) => t.status === "DONE").length || 0;
            // Use the database ratio, or fallback to manual calculation
            const progress = wf.progressRatio || (totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100));

            return (
              <Card key={wf.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Employee Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" /> 
                        {wf.newHire?.name || "Unknown"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" /> {wf.roleTitle}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" /> Start: {new Date(wf.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full md:w-1/3">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-700">Completion</span>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-right">
                        {completedTasks} of {totalTasks} tasks done
                      </p>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}