// components/ui/ResetPasswordButton.tsx
"use client";

import { useState } from "react";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { resetMicrosoftPasswordAction } from "@/actions/password-reset";

export default function ResetPasswordButton({ 
  employeeId, 
  employeeName 
}: { 
  employeeId: string, 
  employeeName: string 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset the Microsoft 365 password for ${employeeName}? An email will be sent to them.`)) return;
    
    setIsLoading(true);
    setError(null);
    setNewPassword(null);
    
    const res = await resetMicrosoftPasswordAction(employeeId);
    
    if (res.error) {
      setError(res.error);
    } else if (res.success && res.newPassword) {
      setNewPassword(res.newPassword);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-3 items-start w-full">
      <button
        onClick={handleReset}
        disabled={isLoading || newPassword !== null}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {isLoading ? "Resetting & Emailing..." : "Reset M365 Password"}
      </button>
      
      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100">{error}</p>
      )}
      
      {newPassword && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg w-full shadow-sm animate-in fade-in zoom-in duration-300">
          <p className="text-sm text-green-800 font-bold mb-2 flex items-center gap-2">
            <MailCheck className="h-5 w-5" /> Password Reset & Emailed!
          </p>
          <p className="text-xs text-green-700 mb-3 font-medium">
            The temporary credentials have been securely emailed to the user.
          </p>
          <div className="bg-white p-3 rounded border border-green-100 flex items-center justify-between">
            <code className="text-lg font-mono font-bold tracking-widest text-slate-800">
              {newPassword}
            </code>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">
            (Backup copy for IT Admin)
          </p>
        </div>
      )}
    </div>
  );
}