// app/app/tasks/pending/PendingTasksList.tsx
"use client";

import { useState } from "react";
import { Calendar, AlertCircle, Monitor, FileText, ArrowDownAz, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type PendingTask = {
  id: string;
  title: string;
  taskType: string;
  status: string;
  startDate: Date | string | null;
  employeeName: string;
  roleTitle: string;
  department: string;
};

// IT tags vs HR tags to show the right icon
const IT_TYPES = ["HARDWARE", "SOFTWARE", "ACCESS", "IT_PROVISIONING"];

// Helper function to calculate urgency and badge colors
function getUrgencyData(startDate: Date | string | null) {
  if (!startDate) return { days: 999, label: "No Date", color: "bg-slate-100 text-slate-600 border-slate-200" };
  
  const start = new Date(startDate);
  const today = new Date();
  
  // Normalize to midnight to avoid time-of-day math weirdness
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { days: diffDays, label: `Overdue by ${Math.abs(diffDays)}d`, color: "bg-red-50 text-red-700 border-red-200" };
  if (diffDays === 0) return { days: diffDays, label: "Starts Today!", color: "bg-red-50 text-red-700 border-red-200 animate-pulse" };
  if (diffDays <= 3) return { days: diffDays, label: `Starts in ${diffDays}d`, color: "bg-orange-50 text-orange-700 border-orange-200" };
  if (diffDays <= 7) return { days: diffDays, label: `Starts in ${diffDays}d`, color: "bg-amber-50 text-amber-700 border-amber-200" };
  
  return { days: diffDays, label: `Starts in ${diffDays}d`, color: "bg-green-50 text-green-700 border-green-200" };
}

export default function PendingTasksList({ initialTasks }: { initialTasks: PendingTask[] }) {
  const [sortBy, setSortBy] = useState<"URGENCY" | "DEPARTMENT" | "STATUS">("URGENCY");

  // Add the calculated days to the tasks before sorting
  const tasksWithUrgency = initialTasks.map(task => ({
    ...task,
    urgency: getUrgencyData(task.startDate)
  }));

  // Sort logic
  const sortedTasks = [...tasksWithUrgency].sort((a, b) => {
    if (sortBy === "URGENCY") return a.urgency.days - b.urgency.days;
    if (sortBy === "DEPARTMENT") return a.department.localeCompare(b.department);
    if (sortBy === "STATUS") return a.status.localeCompare(b.status);
    return 0;
  });

  if (initialTasks.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Inbox Zero!</h2>
        <p className="text-slate-500 mt-2">There are no pending tasks across the organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <AlertCircle className="h-4 w-4" />
          Showing {sortedTasks.length} pending items
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1"><ArrowDownAz className="h-4 w-4" /> Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as "URGENCY" | "DEPARTMENT" | "STATUS")}
            className="border border-slate-300 text-sm rounded-lg px-3 py-1.5 bg-slate-50 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="URGENCY">Urgency (Start Date)</option>
            <option value="DEPARTMENT">Department</option>
            <option value="STATUS">Task Status</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sortedTasks.map((task) => {
            const isIT = IT_TYPES.includes(task.taskType);
            const routeUrl = isIT ? "/app/tasks" : "/app/hr-tasks";
            
            return (
              <div key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                
                {/* Left Side: Icon & Titles */}
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${isIT ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {isIT ? <Monitor className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-slate-800">{task.employeeName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm text-slate-500">{task.department}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Badges & Action Link */}
                <div className="flex items-center flex-wrap gap-3">
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                    task.status === "BLOCKED" ? "bg-red-50 text-red-700 border-red-200" : 
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {task.status.replace("_", " ")}
                  </span>

                  {/* Urgency Badge */}
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${task.urgency.color}`}>
                    <Calendar className="h-3 w-3" />
                    {task.urgency.label}
                  </span>

                  {/* Go to Board Button */}
                  <Link 
                    href={routeUrl} 
                    className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Go to {isIT ? "IT" : "HR"} Board <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}