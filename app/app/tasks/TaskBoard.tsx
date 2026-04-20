// app/app/tasks/TaskBoard.tsx
"use client";

import { useState } from "react";
import { updateTaskStatus } from "@/actions/tasks";
import { Loader2, Monitor, AlertCircle, CheckCircle2, Play, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

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

  const handleStatusChange = async (taskId: string, newStatus: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE", taskTitle: string, newHireName: string) => {
    setLoadingId(taskId);
    
    // Fire a loading toast while we wait for the database
    const toastId = toast.loading(`Updating task status...`);
    
    const res = await updateTaskStatus(taskId, newStatus);
    setLoadingId(null);

    if (res?.error) {
      toast.error("Update Failed", { id: toastId, description: res.error });
    } else {
      // Fire different success toasts based on the action taken
      if (newStatus === "DONE") {
        toast.success("Task Completed!", { 
          id: toastId, 
          description: `"${taskTitle}" for ${newHireName} is marked as done.` 
        });
      } else if (newStatus === "BLOCKED") {
        toast.error("Task Blocked", { 
          id: toastId, 
          description: `"${taskTitle}" has been flagged as blocked.` 
        });
      } else {
        toast.success("Task Updated", { 
          id: toastId, 
          description: `"${taskTitle}" moved to In Progress.` 
        });
      }
    }
  };

  const pending = initialTasks.filter(t => t.status === "PENDING");
  const inProgress = initialTasks.filter(t => t.status === "IN_PROGRESS" || t.status === "BLOCKED");
  const completed = initialTasks.filter(t => t.status === "DONE");

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="p-5 flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Monitor className="h-3 w-3" /> {task.taskType.replace("_", " ")}
          </span>
          {task.status === "BLOCKED" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase">
              <AlertCircle className="h-3 w-3" /> Blocked
            </span>
          )}
        </div>
        
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{task.title}</h4>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{task.workflow.newHireName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{task.workflow.roleTitle} • {task.workflow.department}</p>
        </div>
      </div>

      {/* Action Buttons based on Status */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        {task.status === "PENDING" && (
          <button 
            onClick={() => handleStatusChange(task.id, "IN_PROGRESS", task.title, task.workflow.newHireName)}
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
              onClick={() => handleStatusChange(task.id, task.status === "BLOCKED" ? "IN_PROGRESS" : "BLOCKED", task.title, task.workflow.newHireName)}
              disabled={loadingId === task.id}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${task.status === "BLOCKED" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"}`}
            >
              {loadingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
              {task.status === "BLOCKED" ? "Unblock" : "Block"}
            </button>
            <button 
              onClick={() => handleStatusChange(task.id, "DONE", task.title, task.workflow.newHireName)}
              disabled={loadingId === task.id}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loadingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Done
            </button>
          </>
        )}

        {task.status === "DONE" && (
          <div className="w-full flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-1 text-sm font-bold">
            <CheckCircle2 className="h-5 w-5" /> Completed
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {initialTasks.length === 0 ? (
        <EmptyState 
          icon={ClipboardList}
          title="No provisioning tasks"
          description="Everything is quiet. When a new hire is approved, their hardware and access tasks will appear here."
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-8">
          {/* PENDING COLUMN */}
          <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 border-t-4 border-t-slate-400 dark:border-t-slate-600">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Pending</h3>
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-bold">{pending.length}</span>
            </div>
            <div className="space-y-4">
              {pending.length === 0 ? <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">No pending tasks</p> : pending.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900 border-t-4 border-t-blue-500 dark:border-t-blue-700">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-blue-900 dark:text-blue-300">In Progress</h3>
              <span className="bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{inProgress.length}</span>
            </div>
            <div className="space-y-4">
              {inProgress.length === 0 ? <p className="text-center text-sm text-blue-400 dark:text-blue-600 py-8">No active tasks</p> : inProgress.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          </div>

          {/* COMPLETED COLUMN */}
          <div className="bg-green-50/50 dark:bg-green-950/20 rounded-2xl p-4 border border-green-100 dark:border-green-900 border-t-4 border-t-green-500 dark:border-t-green-700">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-green-900 dark:text-green-300">Completed</h3>
              <span className="bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{completed.length}</span>
            </div>
            <div className="space-y-4">
              {completed.length === 0 ? <p className="text-center text-sm text-green-400 dark:text-green-600 py-8">No completed tasks</p> : completed.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}