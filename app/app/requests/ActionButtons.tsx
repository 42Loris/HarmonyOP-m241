// app/app/requests/ActionButtons.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveHireRequestAction, rejectHireRequestAction } from "@/actions/hire-requests";
import { toast } from "sonner";

export default function ActionButtons({ requestId }: { requestId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Executing God-Mode Provisioning...");
    
    const formData = new FormData();
    formData.append("requestId", requestId);
    
    const res = await approveHireRequestAction(formData);

    if (res?.error) {
      toast.error("Provisioning Failed", {
        id: toastId,
        description: res.error,
        duration: 5000
      });
    } else {
      toast.success("Success!", {
        id: toastId,
        description: "User created in Entra ID and internal workflows started."
      });
    }
    
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Rejecting request...");
    
    const formData = new FormData();
    formData.append("requestId", requestId);
    
    const res = await rejectHireRequestAction(formData);

    if (res?.error) {
      toast.error("Error", {
        id: toastId,
        description: res.error
      });
    } else {
      toast.success("Request Rejected", {
        id: toastId
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex md:flex-col gap-3 min-w-[140px]">
      <button 
        onClick={handleApprove} 
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} 
        {isLoading ? "Provisioning..." : "Approve"}
      </button>
      
      <button 
        onClick={handleReject} 
        disabled={isLoading}
        className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} 
        Reject
      </button>
    </div>
  );
}