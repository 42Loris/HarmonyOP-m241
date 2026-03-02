// app/app/dashboard/page.tsx
import { Suspense } from "react";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, onboardingWorkflows, organizationIntegrations } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, Clock, Activity, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import SyncButton from "@/components/dashboard/SyncButton";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

// ==========================================
// 1. ASYNC EMPLOYEE DASHBOARD ENGINE
// ==========================================
async function AsyncEmployeeView({ dbUser }: { dbUser: any }) {
  const myWorkflow = await db.query.onboardingWorkflows.findFirst({
    where: eq(onboardingWorkflows.newHireId, dbUser.id),
    with: { tasks: true }
  });

  return (
    <EmployeeDashboard 
      user={dbUser} 
      workflow={myWorkflow || null} 
      tasks={myWorkflow?.tasks || []} 
    />
  );
}

// ==========================================
// 2. ASYNC ADMIN DASHBOARD ENGINE
// ==========================================
async function AsyncAdminView({ dbUser }: { dbUser: any }) {
  const integration = await db.query.organizationIntegrations.findFirst({
    where: eq(organizationIntegrations.orgId, dbUser.orgId)
  });
  const hasIntegration = !!integration;

  const activeWorkflows = await db.query.onboardingWorkflows.findMany({
    where: eq(onboardingWorkflows.orgId, dbUser.orgId),
    with: { newHire: true, tasks: true },
    orderBy: (workflows, { desc }) => [desc(workflows.createdAt)],
    limit: 5,
  });

  const totalActive = activeWorkflows.length;
  let totalTasks = 0;
  let completedTasks = 0;

  activeWorkflows.forEach(wf => {
    totalTasks += wf.tasks.length;
    completedTasks += wf.tasks.filter(t => t.status === "DONE").length;
  });

  // === UPDATED MATH: Average the actual weighted progress of all workflows ===
  const totalProgressSum = activeWorkflows.reduce((sum, wf) => sum + (wf.progressRatio || 0), 0);
  const overallProgress = totalActive === 0 ? 0 : Math.round(totalProgressSum / totalActive);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {dbUser.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500 mt-1">Here is what is happening with your onboardings today.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasIntegration && <SyncButton />}
          <Link 
            href="/app/requests/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 text-sm transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            New Hire Request
          </Link>
        </div>
      </header>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 h-full group">
          <Link href="/app/workflows" className="absolute inset-0 z-10 cursor-pointer" aria-label="View Active Onboardings" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
              Active Onboardings
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 transition-transform group-hover:scale-110 duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalActive}</div>
            <p className="text-xs text-slate-500 mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="relative border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-orange-300 transition-all duration-300 h-full group">
          <Link href="/app/workflows" className="absolute inset-0 z-10 cursor-pointer" aria-label="View Tasks Pending" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-orange-600 transition-colors">
              Tasks Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500 transition-transform group-hover:scale-110 duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalTasks - completedTasks}</div>
            <p className="text-xs text-slate-500 mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="relative border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-green-300 transition-all duration-300 h-full group">
          <Link href="/app/workflows" className="absolute inset-0 z-10 cursor-pointer" aria-label="View Overall Progress" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">
              Overall Progress
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500 transition-transform group-hover:scale-110 duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{overallProgress}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Onboardings List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Recent Workflows</h2>
          <Link href="/app/workflows" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all &rarr;
          </Link>
        </div>
        
        {activeWorkflows.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-slate-200 mb-3" />
            <h3 className="text-slate-700 font-medium">No active onboardings</h3>
            <p className="text-slate-500 text-sm mt-1">When Microsoft Sync detects a new user, they will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeWorkflows.map((workflow) => {
              const wfProgress = workflow.progressRatio || 0;
              return (
                <div key={workflow.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{workflow.newHire?.name || "Unknown User"}</h3>
                    <p className="text-sm text-slate-500">{workflow.roleTitle} • {workflow.department}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 w-1/3 justify-end">
                    <div className="flex-grow max-w-[150px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Progress</span>
                        <span className="text-slate-700 font-bold">{wfProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${wfProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN PAGE SHELL (Loads Instantly)
// ==========================================
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only run the absolute minimum DB query to determine who is logging in
  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser) redirect("/login");

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Vercel instantly paints the screen, securing the 100 Score */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      }>
        {/* Stream the heavy data components in the background */}
        {dbUser.role === "EMPLOYEE" ? (
          <AsyncEmployeeView dbUser={dbUser} />
        ) : (
          <AsyncAdminView dbUser={dbUser} />
        )}
      </Suspense>
    </div>
  );
}