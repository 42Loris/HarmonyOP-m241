"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Laptop, Package, Truck, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { onboardingWorkflows, workflowTasks } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Workflow = InferSelectModel<typeof onboardingWorkflows>;
type Task = InferSelectModel<typeof workflowTasks>;

export default function StepITTimeline({ 
  tasks, 
  workflow, 
  onNext, 
  onBack 
}: { 
  tasks: Task[], 
  workflow: Workflow, 
  onNext: () => void, 
  onBack: () => void 
}) {
  const itTasks = tasks.filter(t => t.taskType === "IT_ACCESS");
  const hardwareTasks = tasks.filter(t => t.taskType === "HARDWARE");

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Laptop className="h-8 w-8 text-blue-600" />
          Digital Workspace & Hardware
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IT Provisioning Timeline */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">Provisioning Status</h3>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
              {workflow?.progressRatio || 0}% Complete
            </span>
          </div>

          <div className="relative space-y-8">
            {/* The Vertical Line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>

            {itTasks.length > 0 ? itTasks.map((task, idx) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative flex items-start gap-6 pl-10"
              >
                <div className={`absolute left-0 p-1 rounded-full z-10 ${task.status === "DONE" ? "bg-green-100 text-green-600" : "bg-white border-2 border-slate-200 text-slate-300"}`}>
                  {task.status === "DONE" ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </div>
                <div>
                  <h4 className={`font-bold ${task.status === "DONE" ? "text-slate-900" : "text-slate-500"}`}>
                    {task.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {task.status === "DONE" ? "System access successfully granted." : "Configuration in progress..."}
                  </p>
                </div>
              </motion.div>
            )) : (
              <p className="text-slate-500 italic">No IT access tasks found.</p>
            )}
            
            {workflow?.progressRatio === 100 && (
              <div className="relative flex items-start gap-6 pl-10">
                <div className="absolute left-0 p-1 rounded-full z-10 bg-blue-100 text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-700">All Systems Ready</h4>
                  <p className="text-sm text-blue-500 mt-1">Your digital workspace is fully provisioned.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Hardware Tracking */}
        <section className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-400" />
              Equipment Delivery
            </h3>
            
            {hardwareTasks.length > 0 ? (
              <div className="space-y-6">
                {hardwareTasks.map((task) => (
                  <div key={task.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{task.title}</h4>
                        <p className="text-slate-400 text-sm mt-1">Standard Company Issue</p>
                      </div>
                      <div className={`p-2 rounded-xl ${task.status === "DONE" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {task.status === "DONE" ? <CheckCircle2 className="h-6 w-6" /> : <Truck className="h-6 w-6 animate-pulse" />}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Ordered</span>
                        <span>In Transit</span>
                        <span>Delivered</span>
                      </div>
                      <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${task.status === "DONE" ? "w-full bg-green-500" : "w-1/2 bg-blue-500"}`}
                        ></div>
                      </div>
                      <p className="text-sm text-slate-300 mt-4">
                        {task.status === "DONE" ? "Item delivered and confirmed." : "Estimated delivery: 1-2 business days."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-2xl">
                <Laptop className="h-10 w-10 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No hardware assigned to this workflow.</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
            <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5" />
              IT Security Tip
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Never share your temporary password. You&apos;ll be prompted to change it during your first login.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
