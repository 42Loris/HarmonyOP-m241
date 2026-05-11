// components/settings/MicrosoftIntegrationForm.tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveMicrosoftIntegrationAction, type IntegrationFormState } from "@/actions/integrations";
import { Key, ShieldCheck, CheckCircle2 } from "lucide-react";

const initialState: IntegrationFormState = {
  error: null,
  success: false,
  timestamp: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save & Connect"}
    </button>
  );
}

// We pass `isConnected` as a prop so the form knows if keys already exist in the DB!
export default function MicrosoftIntegrationForm({ isConnected }: { isConnected: boolean }) {
  const [state, formAction] = useActionState(saveMicrosoftIntegrationAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success && state.timestamp) {
      const t1 = setTimeout(() => setShowSuccess(true), 0);
      const t2 = setTimeout(() => setShowSuccess(false), 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [state.success, state.timestamp]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-4 mb-6 flex gap-3 items-start">
        <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-700">
          <strong>Secure Connection:</strong> Your API keys are securely stored. We only request permission to read user directories and manage groups.
        </div>
      </div>

      {/* Show a badge if they already have keys saved in the database */}
      {isConnected && !showSuccess && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-4">
          <CheckCircle2 className="h-4 w-4" /> Active Connection Established
        </div>
      )}

      {showSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Keys saved successfully!
        </div>
      )}

      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">
          {state.error}
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Key className="h-4 w-4 text-slate-400" /> Tenant ID
        </label>
        <input 
          type="text" 
          name="tenantId"
          placeholder="e.g., 8a7b3c2d-1e2f-..." 
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Key className="h-4 w-4 text-slate-400" /> Client ID (Application ID)
        </label>
        <input 
          type="text" 
          name="clientId"
          placeholder="e.g., f1g2h3i4-..." 
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Key className="h-4 w-4 text-slate-400" /> Client Secret
        </label>
        <input 
          type="password" 
          name="clientSecret"
          placeholder="••••••••••••••••" 
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="pt-4 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}