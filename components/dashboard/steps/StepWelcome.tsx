"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { users, onboardingWorkflows } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof users>;
type Workflow = InferSelectModel<typeof onboardingWorkflows>;

export default function StepWelcome({ 
  user, 
  workflow, 
  onNext 
}: { 
  user: User, 
  workflow: Workflow, 
  onNext: () => void 
}) {
  useEffect(() => {
    if (workflow?.progressRatio === 100) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#4f46e5', '#ffffff']
      });
    }
  }, [workflow?.progressRatio]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-end mb-2">
        <button onClick={onNext} className="bg-slate-900 dark:bg-blue-600 text-white p-2 rounded-full hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-md">
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-900 dark:from-blue-700 dark:to-slate-900 text-white p-12 shadow-2xl border border-white/10 dark:border-white/5">
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium mb-8 border border-white/20"
          >
            <Sparkles className="h-4 w-4 text-blue-200" />
            Welcome to the team!
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Glad to have you here, <span className="text-blue-200">{user.name.split(' ')[0]}</span>.
          </h1>
          
          <p className="text-blue-100 text-xl leading-relaxed mb-10">
            You are officially a <strong>{user.department}</strong> team member. We are excited to help you get settled and start your journey with us.
          </p>

          <button 
            onClick={onNext}
            className="group flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            Start Onboarding
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* Decorative background shapes with animation */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        ></motion.div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 right-12 w-72 h-72 bg-blue-400/20 rounded-full blur-2xl"
        ></motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "IT Setup", desc: "Digital workspace preparation", icon: "💻" },
          { title: "Team", desc: "Meet your colleagues", icon: "👋" },
          { title: "Tasks", desc: "First day action items", icon: "✅" }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
