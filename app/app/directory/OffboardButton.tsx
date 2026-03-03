// components/directory/OffboardButton.tsx
"use client";

import { useState } from "react";
import { offboardEmployeeAction } from "@/actions/offboard";
import { UserMinus, Loader2, ShieldAlert } from "lucide-react";

export default function OffboardButton({ employeeId, employeeName }: { employeeId: string, employeeName: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOffboard = async () => {
    const confirmText = `DANGER: You are about to terminate ${employeeName}.\n\nThis will instantly disable their Microsoft 365 account, revoke their active login sessions, and generate exit tasks for IT and HR.\n\nAre you absolutely sure?`;
    
    if (!window.confirm(confirmText)) return;

    setIsProcessing(true);
    const res = await offboardEmployeeAction(employeeId);
    setIsProcessing(false);

    if (res?.error) {
      alert("Error: " + res.error);
    } else {
      alert(`${employeeName} has been successfully offboarded and locked out of the tenant.`);
    }
  };

  return (
    <button
      onClick={handleOffboard}
      disabled={isProcessing}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
      {isProcessing ? "Terminating..." : "Terminate Access"}
    </button>
  );
}