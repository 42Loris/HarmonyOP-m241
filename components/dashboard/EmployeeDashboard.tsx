// components/dashboard/EmployeeDashboard.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Sparkles, Laptop, ShieldCheck, BookOpen, Coffee, ExternalLink } from "lucide-react";

export default function EmployeeDashboard({ user, workflow, tasks }: { user: any, workflow: any, tasks: any[] }) {
  const isFullyProvisioned = workflow?.progressRatio === 100;

  // Local state to handle the interactive checklist!
  const [completedItems, setCompletedItems] = useState<{ [key: string]: boolean }>({
    login: false,
    mfa: false,
    handbook: false,
  });

  const toggleChecklist = (item: string) => {
    setCompletedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. The Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 text-white p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="h-4 w-4 text-blue-200" />
            Welcome to the team!
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Glad to have you here, {user.name.split(' ')[0]}.
          </h1>
          <p className="text-blue-100 text-lg">
            You are officially a <strong>{user.department}</strong> team member. We are currently preparing your digital workspace. Here is everything you need to know for your first week.
          </p>
        </div>
        
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 right-12 w-72 h-72 bg-blue-400/20 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. IT Provisioning Tracker (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Laptop className="h-6 w-6 text-blue-600" />
              Your Workspace Setup
            </h2>
            
            <div className="mb-8">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-700">IT Provisioning Progress</span>
                <span className="text-blue-600">{workflow?.progressRatio || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${workflow?.progressRatio || 0}%` }}
                ></div>
              </div>
              {isFullyProvisioned ? (
                <p className="text-sm text-green-600 mt-3 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> All accounts and hardware are ready!
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-3 flex items-center gap-1.5">
                  <Circle className="h-3 w-3 fill-blue-500 text-blue-500 animate-pulse" /> 
                  IT is currently configuring your access...
                </p>
              )}
            </div>

            {/* Live Task Tracker from the Database */}
            <div className="space-y-4">
              {tasks?.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 transition-all">
                  {task.status === "DONE" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-300 shrink-0" />
                  )}
                  <div>
                    <h4 className={`font-semibold ${task.status === "DONE" ? "text-slate-900 line-through opacity-70" : "text-slate-900"}`}>
                      {task.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {task.status === "DONE" ? "Completed by IT Team" : "Pending setup"}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-100">No IT tasks assigned yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* 3. First Week Schedule & Actionable Checklist (Right Column) */}
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Day 1 Action Items
            </h2>
            
            <ul className="space-y-4">
              {/* Item 1: Office.com Login */}
              <li className="flex items-start gap-3 group">
                <button onClick={() => toggleChecklist('login')} className="mt-0.5 focus:outline-none transition-transform active:scale-90">
                  {completedItems.login ? 
                    <div className="bg-indigo-100 p-1 rounded text-indigo-700"><CheckCircle2 className="h-4 w-4" /></div> : 
                    <div className="bg-slate-100 p-1 rounded text-slate-400 group-hover:text-indigo-500"><Circle className="h-4 w-4" /></div>
                  }
                </button>
                <div className={`transition-all ${completedItems.login ? 'opacity-50 line-through' : ''}`}>
                  <a href="https://www.office.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1">
                    Log into Microsoft 365 <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Use your new email and temp password.</p>
                </div>
              </li>

              {/* Item 2: MFA Setup */}
              <li className="flex items-start gap-3 group">
                <button onClick={() => toggleChecklist('mfa')} className="mt-0.5 focus:outline-none transition-transform active:scale-90">
                  {completedItems.mfa ? 
                    <div className="bg-indigo-100 p-1 rounded text-indigo-700"><CheckCircle2 className="h-4 w-4" /></div> : 
                    <div className="bg-slate-100 p-1 rounded text-slate-400 group-hover:text-indigo-500"><Circle className="h-4 w-4" /></div>
                  }
                </button>
                <div className={`transition-all ${completedItems.mfa ? 'opacity-50 line-through' : ''}`}>
                  <a href="https://aka.ms/mfasetup" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1">
                    Set up Multi-Factor Auth <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Required for all secure access.</p>
                </div>
              </li>

              {/* Item 3: Company Handbook */}
              <li className="flex items-start gap-3 group">
                <button onClick={() => toggleChecklist('handbook')} className="mt-0.5 focus:outline-none transition-transform active:scale-90">
                  {completedItems.handbook ? 
                    <div className="bg-indigo-100 p-1 rounded text-indigo-700"><CheckCircle2 className="h-4 w-4" /></div> : 
                    <div className="bg-slate-100 p-1 rounded text-slate-400 group-hover:text-indigo-500"><Circle className="h-4 w-4" /></div>
                  }
                </button>
                <div className={`transition-all ${completedItems.handbook ? 'opacity-50 line-through' : ''}`}>
                  {/* Note: Update this URL to your actual company SharePoint later! */}
                  <a href="https://sharepoint.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1">
                    Review Company Handbook <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Available on the HR portal.</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Coffee className="h-5 w-5 text-amber-600" />
              Need Help?
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Your manager and the IT department are here to support you.
            </p>
            <a href="mailto:it@company.com" className="block w-full text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
              Contact IT Support
            </a>
          </section>
        </div>

      </div>
    </div>
  );
}