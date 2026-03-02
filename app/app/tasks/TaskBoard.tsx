// app/app/tasks/TaskBoard.tsx
"use client";

import { useState } from "react";
import { updateTaskStatus } from "@/actions/tasks";
import { Loader2, Monitor, AlertCircle, CheckCircle2, Play } from "lucide-react";

type Task = {
  id: string;
  title: string;
  taskType: string;
  status: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  workflow: {
    roleTitle: string;
    department: string;
    newHireName: string;
  };
};

export default function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE") => {
    setLoadingId(taskId);
    const res = await updateTaskStatus(taskId, newStatus);
    setLoadingId(null);

    if (res?.error) {
      alert("Failed to update task: " + res.error);
    }
  };

  const pending = initialTasks.filter(t => t.status === "PENDING");
  const inProgress = initialTasks.filter(t => t.status === "IN_PROGRESS" || t.status === "BLOCKED");
  const completed = initialTasks.filter(t => t.status === "DONE");

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="p-5 flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
            <Monitor className="h-3 w-3" /> {task.taskType.replace("_", " ")}
          </span>
          {task.status === "BLOCKED" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">
              <AlertCircle className="h-3 w-3" /> Blocked
            </span>
          )}
        </div>
        
        <h4 className="font-bold text-slate-900 text-base">{task.title}</h4>
        
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">{task.workflow.newHireName}</p>
          <p className="text-xs text-slate-500">{task.workflow.roleTitle} • {task.workflow.department}</p>
        </div>
      </div>

      {/* Action Buttons based on Status */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
        {task.status === "PENDING" && (
          <button 
            onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
            disabled={loadingId === task.id}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loadingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start Setup
          </button>
        )}

        {(task.status === "IN_PROGRESS" || task.status === "BLOCKED") && (
          <>
            <button 
              onClick={() => handleStatusChange(task.id, task.status === "BLOCKED" ? "IN_PROGRESS" : "BLOCKED")}
              disabled={loadingId === task.id}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${task.status === "BLOCKED" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
            >
              {loadingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
              {task.status === "BLOCKED" ? "Unblock" : "Block"}
            </button>
            <button 
              onClick={() => handleStatusChange(task.id, "DONE")}
              disabled={loadingId === task.id}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loadingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Done
            </button>
          </>
        )}

        {task.status === "DONE" && (
          <div className="w-full flex items-center justify-center gap-2 text-green-600 py-1 text-sm font-bold">
            <CheckCircle2 className="h-5 w-5" /> Completed
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-8">
      {/* PENDING COLUMN */}
      <div className="bg-slate-100/50 rounded-2xl p-4 border border-slate-200 border-t-4 border-t-slate-400">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-slate-700">Pending</h3>
          <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{pending.length}</span>
        </div>
        <div className="space-y-4">
          {pending.length === 0 ? <p className="text-center text-sm text-slate-400 py-8">No pending tasks</p> : pending.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>

      {/* IN PROGRESS COLUMN */}
      <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 border-t-4 border-t-blue-500">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-blue-900">In Progress</h3>
          <span className="bg-blue-200 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold">{inProgress.length}</span>
        </div>
        <div className="space-y-4">
          {inProgress.length === 0 ? <p className="text-center text-sm text-blue-400 py-8">No active tasks</p> : inProgress.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>

      {/* COMPLETED COLUMN */}
      <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100 border-t-4 border-t-green-500">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-green-900">Completed</h3>
          <span className="bg-green-200 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-bold">{completed.length}</span>
        </div>
        <div className="space-y-4">
          {completed.length === 0 ? <p className="text-center text-sm text-green-400 py-8">No completed tasks</p> : completed.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>
    </div>
  );
}