"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Laptop, UserCheck, BookOpen, Rocket } from "lucide-react";
import StepWelcome from "./steps/StepWelcome";
import StepITTimeline from "./steps/StepITTimeline";
import StepActionItems from "./steps/StepActionItems";
import StepTeamResources from "./steps/StepTeamResources";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { users, onboardingWorkflows, workflowTasks } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof users>;
type Workflow = InferSelectModel<typeof onboardingWorkflows>;
type Task = InferSelectModel<typeof workflowTasks>;

export default function EmployeeDashboard({ 
  user, 
  workflow, 
  tasks 
}: { 
  user: User, 
  workflow: Workflow | null, 
  tasks: Task[] 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const driverObj = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      steps: [
        { element: '#onboarding-stepper', popover: { title: 'Onboarding Journey', description: 'Follow these 4 simple steps to get fully set up in your new role.', side: "bottom", align: 'start' }},
        { element: '#onboarding-content', popover: { title: 'Step Content', description: 'This is where you will find your IT status, hardware tracking, and action items.', side: "top", align: 'start' }},
      ]
    });
  }, []);

  const startTour = () => {
    driverObj.current?.drive();
  };

  const steps = [
    { id: "welcome", label: "Welcome", icon: Rocket },
    { id: "setup", label: "Setup", icon: Laptop },
    { id: "actions", label: "Actions", icon: CheckCircle2 },
    { id: "team", label: "Team", icon: UserCheck },
  ];

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Rocket className="h-12 w-12 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-900">No active onboarding</h2>
        <p className="text-slate-500 max-w-md">We couldn&apos;t find an active onboarding workflow for your account. Please contact your manager or HR.</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepWelcome user={user} workflow={workflow} onNext={() => setCurrentStep(1)} />;
      case 1:
        return <StepITTimeline tasks={tasks} workflow={workflow} onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />;
      case 2:
        return <StepActionItems workflow={workflow} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
      case 3:
        return <StepTeamResources user={user} onBack={() => setCurrentStep(2)} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen space-y-8">
      
      {/* Help Button */}
      <div className="flex justify-end">
        <button 
          onClick={startTour}
          className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Need a tour?
        </button>
      </div>

      {/* Stepper Navigation Indicator */}
      <div id="onboarding-stepper" className="flex items-center justify-between max-w-2xl mx-auto mb-12 relative">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
        
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === idx;
          const isCompleted = currentStep > idx;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => isCompleted && setCurrentStep(idx)}
                disabled={!isCompleted && !isActive}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isActive 
                    ? "bg-indigo-600 text-white scale-110 ring-4 ring-indigo-100" 
                    : isCompleted 
                      ? "bg-green-500 text-white hover:bg-green-600" 
                      : "bg-white text-slate-400 border border-slate-200 grayscale"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
              </button>
              <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-indigo-600" : isCompleted ? "text-green-600" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dynamic Step Content */}
      <div id="onboarding-content" className="relative overflow-hidden min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
