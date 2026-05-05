"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, BookOpen, ExternalLink, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toggleActionItemAction } from "@/actions/employee-actions";
import { toast } from "sonner";
import { onboardingWorkflows, workflowTasks } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Workflow = InferSelectModel<typeof onboardingWorkflows>;
type Task = InferSelectModel<typeof workflowTasks>;

export default function StepActionItems({ 
  workflow,
  tasks,
  onNext, 
  onBack 
}: { 
  workflow: Workflow,
  tasks: Task[],
  onNext: () => void, 
  onBack: () => void 
}) {
  const [loading, setLoading] = useState<string | null>(null);
  
  // Filter for employee-facing tasks
  const actionItems = tasks.filter(t => t.taskType === "TRAINING" || t.taskType === "HR_ADMIN");

  const toggleChecklist = async (taskId: string) => {
    setLoading(taskId);
    const result = await toggleActionItemAction(workflow.id, taskId);
    if (result.success) {
      toast.success("Progress saved!");
    } else {
      toast.error("Failed to save progress.");
    }
    setLoading(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
          Day 1 Action Items
        </h2>
        <div className="flex gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button onClick={onNext} className="bg-slate-900 dark:bg-blue-600 text-white p-2 rounded-full hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-md">
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center sm:text-left">
            Complete these essential steps to get started with your digital identity and company resources.
          </p>

          <div className="space-y-6">
            {actionItems.length > 0 ? actionItems.map((item) => {
              const isCompleted = item.status === "DONE";
              return (
                <div
                  key={item.id}
                  className="relative flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-md transition-all group cursor-pointer"
                >
                  <button
                    disabled={loading === item.id}
                    onClick={(e) => { e.stopPropagation(); toggleChecklist(item.id); }}
                    className="relative z-10 mt-1 focus:outline-none transition-transform active:scale-90 disabled:opacity-50"
                  >
                    {loading === item.id ? (
                      <Loader2 className="h-6 w-6 text-indigo-500 dark:text-indigo-400 animate-spin" />
                    ) : isCompleted ? (
                      <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-lg text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        <Circle className="h-5 w-5" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-lg ${isCompleted ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.title}
                      </h4>
                    </div>
                    {/* The task description feature will be added here in the future once we add it to the schema */}
                    <p className={`text-sm mt-1 ${isCompleted ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.taskType === "TRAINING" ? "Training / Documentation" : "HR / Admin Task"}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-slate-500 dark:text-slate-400 italic text-center">No action items assigned.</p>
            )}
          </div>
        </div>

        <div className="bg-indigo-900 dark:bg-slate-950 text-white rounded-3xl p-8 flex items-center gap-6 overflow-hidden relative shadow-lg border border-transparent dark:border-slate-800">
          <div className="z-10 relative">
            <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-300 dark:text-blue-500" />
              Resource Hub
            </h4>
            <p className="text-blue-100 dark:text-slate-400 text-sm">
              Explore your first-week roadmap, training sessions, and internal docs.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <BookOpen className="h-32 w-32" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
