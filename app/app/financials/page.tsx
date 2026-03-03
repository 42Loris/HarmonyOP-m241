// app/app/financials/page.tsx
import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import { users, onboardingWorkflows, workflowTasks } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, Laptop, CreditCard, PieChart } from "lucide-react";

export default async function FinancialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch all workflows and their associated tasks
  const workflows = await db.query.onboardingWorkflows.findMany({
    where: eq(onboardingWorkflows.orgId, dbUser.orgId),
    with: {
      tasks: true,
      newHire: true,
    },
    orderBy: [desc(onboardingWorkflows.startDate)],
  });

  // Calculate Metrics
  let totalSpend = 0;
  let hardwareSpend = 0;
  let softwareSpend = 0;
  let activeWorkflowsCount = workflows.length;

  const expensesList: any[] = [];

  workflows.forEach(workflow => {
    workflow.tasks.forEach(task => {
      const taskCost = task.cost || 0; // Fallback to 0 if null
      totalSpend += taskCost;

      if (task.taskType === "HARDWARE") hardwareSpend += taskCost;
      if (task.taskType === "SOFTWARE" || task.taskType === "IT_ACCESS") softwareSpend += taskCost;

      if (taskCost > 0) {
        expensesList.push({
          id: task.id,
          title: task.title,
          cost: taskCost,
          employee: workflow.newHire?.name || "Unknown",
          type: task.taskType,
          date: workflow.startDate,
        });
      }
    });
  });

  const averageCostPerHire = activeWorkflowsCount > 0 ? Math.round(totalSpend / activeWorkflowsCount) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <PieChart className="h-8 w-8 text-emerald-600" />
          Financial Overview
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Track provisioning costs, hardware expenses, and software seat investments.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium">
            <DollarSign className="h-5 w-5 text-emerald-500" /> Total Provisioning Spend
          </div>
          <div className="text-4xl font-black text-slate-900">${totalSpend.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-2">Across {activeWorkflowsCount} employees</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium">
            <TrendingUp className="h-5 w-5 text-blue-500" /> Avg. Cost Per Hire (CPH)
          </div>
          <div className="text-4xl font-black text-slate-900">${averageCostPerHire.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-2">Industry average: $4,129</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600"><Laptop className="h-4 w-4 text-purple-500"/> Hardware</span>
            <span className="font-bold text-slate-900">${hardwareSpend.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${totalSpend > 0 ? (hardwareSpend/totalSpend)*100 : 0}%` }}></div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600"><CreditCard className="h-4 w-4 text-amber-500"/> SaaS Licenses</span>
            <span className="font-bold text-slate-900">${softwareSpend.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${totalSpend > 0 ? (softwareSpend/totalSpend)*100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Itemized Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Recent Provisioning Expenses</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {expensesList.length === 0 ? (
            <p className="p-8 text-center text-slate-500 italic">No expenses recorded yet. Start onboarding to see costs.</p>
          ) : (
            expensesList.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{expense.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned to: <span className="font-medium text-slate-700">{expense.employee}</span></p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">${expense.cost.toLocaleString()}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{expense.type.replace("_", " ")}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}