// app/app/requests/ActionButtons.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveHireRequestAction, rejectHireRequestAction } from "@/actions/hire-requests";

export default function ActionButtons({ requestId }: { requestId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("requestId", requestId);
    
    // Call the God-Mode Engine
    const res = await approveHireRequestAction(formData);

    // If Microsoft throws an error, show it to the user!
    if (res?.error) {
      alert("MICROSOFT PROVISIONING FAILED:\n\n" + res.error);
    }
    
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("requestId", requestId);
    
    const res = await rejectHireRequestAction(formData);

    if (res?.error) {
      alert("Error: " + res.error);
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
        className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} 
        Reject
      </button>
    </div>
  );
}