// components/dashboard/SyncButton.tsx
"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message); 
        router.refresh(); 
      } else {
        alert(data.error || "Failed to sync");
      }
    } catch {
      alert("Something went wrong during sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-400"}`} />
      {isSyncing ? "Syncing with Entra ID..." : "Sync Directory Now"}
    </button>
  );
}