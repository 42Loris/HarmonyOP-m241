// components/profiles/CreateProfileModal.tsx
"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProfileAction, type ProfileFormState } from "@/actions/profiles";
import { Plus, X } from "lucide-react";

// Strictly type the initial state
const initialState: ProfileFormState = { 
  error: null, 
  success: false, 
  timestamp: 0 
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {pending ? "Saving..." : "Create Profile"}
    </button>
  );
}

export default function CreateProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(createProfileAction, initialState);

  // Close the modal automatically if the action returns success
  useEffect(() => {
    if (state.success && state.timestamp) {
      const timer = setTimeout(() => setIsOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.timestamp]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
      >
        <Plus className="h-4 w-4" /> New Profile
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Create Role Profile</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form action={formAction} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g., Senior Software Engineer" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Description</label>
                <textarea 
                  name="description" 
                  rows={3}
                  placeholder="Responsibilities, requirements, etc." 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select 
                  name="department" 
                  required 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a department...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              {state.error && (
                <p className="text-red-500 text-sm">{state.error}</p>
              )}
              
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md mt-4 border border-blue-100 flex gap-2 items-start">
                <span className="text-blue-500 font-bold mt-0.5">ℹ</span>
                <p>Microsoft Entra ID mapping can be configured later once the tenant keys are connected.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}