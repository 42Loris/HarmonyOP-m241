"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, BookOpen, ExternalLink, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toggleActionItemAction } from "@/actions/employee-actions";
import { toast } from "sonner";
import { onboardingWorkflows } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Workflow = InferSelectModel<typeof onboardingWorkflows>;

export default function StepActionItems({ 
  workflow, 
  onNext, 
  onBack 
}: { 
  workflow: Workflow, 
  onNext: () => void, 
  onBack: () => void 
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const completedItems = JSON.parse(workflow.completedActionItems || "[]");

  const toggleChecklist = async (itemKey: string) => {
    setLoading(itemKey);
    const result = await toggleActionItemAction(workflow.id, itemKey);
    if (result.success) {
      toast.success("Progress saved!");
    } else {
      toast.error("Failed to save progress.");
    }
    setLoading(null);
  };

  const actionItems = [
    { key: "login", title: "Log into Microsoft 365", desc: "Use your new email and temp password.", url: "https://www.office.com" },
    { key: "mfa", title: "Set up Multi-Factor Auth", desc: "Required for all secure access.", url: "https://aka.ms/mfasetup" },
    { key: "handbook", title: "Review Company Handbook", desc: "Available on the HR portal.", url: "https://sharepoint.com" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          Day 1 Action Items
        </h2>
        <div className="flex gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button onClick={onNext} className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition-colors shadow-md">
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <p className="text-slate-500 mb-8">
            Complete these essential steps to get started with your digital identity and company resources.
          </p>

          <div className="space-y-6">
            {actionItems.map((item) => {
              const isCompleted = completedItems.includes(item.key);
              return (
                <div key={item.key} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                  <button 
                    disabled={loading === item.key}
                    onClick={() => toggleChecklist(item.key)} 
                    className="mt-1 focus:outline-none transition-transform active:scale-90 disabled:opacity-50"
                  >
                    {loading === item.key ? (
                      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                    ) : isCompleted ? (
                      <div className="bg-green-100 p-1.5 rounded-lg text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="bg-slate-200 p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <Circle className="h-5 w-5" />
                      </div>
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-lg ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {item.title}
                      </h4>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className={`text-sm mt-1 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-indigo-900 text-white rounded-3xl p-8 flex items-center gap-6 overflow-hidden relative shadow-lg">
          <div className="z-10">
            <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-300" />
              Resource Hub
            </h4>
            <p className="text-blue-100 text-sm">
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
