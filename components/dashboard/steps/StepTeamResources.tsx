"use client";

import { motion } from "framer-motion";
import { Users, BookOpen, Coffee, MessageSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import { users } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof users>;

export default function StepTeamResources({ 
  user, 
  onBack 
}: { 
  user: User, 
  onBack: () => void 
}) {
  const teamMembers = [
    { name: "Sarah Chen", role: "Department Head", avatar: "SC", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
    { name: "Mike Ross", role: "IT Lead", avatar: "MR", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" },
    { name: "Jessica Day", role: "HR Manager", avatar: "JD", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          Meet Your Team & Resources
        </h2>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              Your Support Network
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm transition-all"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${member.color}`}>
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{member.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-400">
              <p className="text-sm leading-relaxed">
                <strong>Pro-tip:</strong> Join the <code>#general</code> and <code>#{user.department?.toLowerCase() || 'team'}</code> channels on Slack once your access is ready!
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-teal-700 dark:from-green-700 dark:to-slate-900 text-white rounded-3xl p-8 shadow-lg flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">You&apos;re All Set!</h3>
              <p className="text-green-50/80 text-sm">
                You&apos;ve completed the initial onboarding walkthrough. Welcome to the family!
              </p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </section>

        {/* Resources Sidebar */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Quick Links
            </h3>
            <ul className="space-y-4">
              {[
                { label: "IT Helpdesk", desc: "Ticket system" },
                { label: "HR Portal", desc: "Benefits & Payroll" },
                { label: "Company Wiki", desc: "Documentation" },
                { label: "Holiday Policy", desc: "PTO management" }
              ].map((link, idx) => (
                <li key={idx}>
                  <a href="#" className="group block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <span className="block font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{link.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{link.desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6">
            <h4 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 mb-2">
              <Coffee className="h-5 w-5" />
              Coffee Chats
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              Don&apos;t forget to schedule some 15-min intros with your new teammates. It&apos;s the best way to learn the culture!
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
