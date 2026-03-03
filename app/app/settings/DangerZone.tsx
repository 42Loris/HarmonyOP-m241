// app/app/settings/DangerZone.tsx
"use client";

import { useState } from "react";
import { resetTenantDataAction } from "@/actions/tenant-reset";
import { AlertTriangle, ServerCrash, Loader2 } from "lucide-react";

export default function DangerZone() {
  const [isResetting, setIsResetting] = useState(false);

  const handleFactoryReset = async () => {
    const confirmReset = window.confirm(
      "DANGER: This will permanently delete all Role Profiles, Hire Requests, Onboarding Workflows, and Employee accounts. Your Admin account and Microsoft keys will be saved. \n\nAre you sure you want to proceed?"
    );

    if (!confirmReset) return;

    setIsResetting(true);
    const res = await resetTenantDataAction();
    setIsResetting(false);

    if (res?.error) {
      alert("Failed to reset: " + res.error);
    } else {
      alert("Success! The environment has been wiped clean and is ready for the new tenant.");
      window.location.href = "/app/dashboard";
    }
  };

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" /> Danger Zone
      </h2>
      
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-red-900 text-lg">Factory Reset Tenant Data</h3>
          <p className="text-sm text-red-700 mt-1 max-w-xl">
            Did you recently switch Microsoft Tenants? Use this to wipe all old test data. This will permanently delete all Hire Requests, Workflows, generated Employees, and Role Profiles. <strong>Your Admin account and Integration settings will not be deleted.</strong>
          </p>
        </div>
        
        <button 
          onClick={handleFactoryReset}
          disabled={isResetting}
          className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isResetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ServerCrash className="h-5 w-5" />}
          {isResetting ? "Wiping Data..." : "Reset Environment"}
        </button>
      </div>
    </section>
  );
}