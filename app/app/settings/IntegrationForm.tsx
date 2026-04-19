// app/app/settings/IntegrationForm.tsx
"use client";

import { useState } from "react";
import { updateMicrosoftIntegrationAction } from "@/actions/settings";
import { Loader2, Building, Key, Lock, ShieldCheck, AlertCircle } from "lucide-react";

export default function IntegrationForm({ initialData }: { initialData: { tenantId: string | null, clientId: string | null, clientSecret: string | null } | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateMicrosoftIntegrationAction(formData);

    setIsLoading(false);
    if (res?.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: "Microsoft Graph API credentials securely saved and activated!" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Microsoft Entra ID Connection
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Securely link your Azure tenant to enable God-Mode auto-provisioning.
          </p>
        </div>
        {initialData && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Connected
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.type === 'success' ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Directory (Tenant) ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                name="tenantId" 
                required 
                defaultValue={initialData?.tenantId || ""}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="e.g. 8z9b...-..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application (Client) ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                name="clientId" 
                required 
                defaultValue={initialData?.clientId || ""}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="e.g. a1b2...-..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client Secret Value</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="password" 
                name="clientSecret" 
                required 
                defaultValue={initialData?.clientSecret || ""}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="••••••••••••••••••••••••••••••" 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              For security reasons, this value is securely encrypted in our database. If you regenerate the secret in Azure, you must update it here immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Saving Credentials..." : "Save Connection"}
        </button>
      </div>
    </form>
  );
}