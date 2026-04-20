// app/app/profiles/AutoMapButton.tsx
"use client";

import { useState } from "react";
import { autoMapEntraGroupAction } from "@/actions/auto-map";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AutoMapButton({ profileId }: { profileId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoMap = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Auto-mapping Entra ID group...");
    
    const res = await autoMapEntraGroupAction(profileId);
    setIsLoading(false);

    if (res?.error) {
      toast.error("Auto-mapping failed", {
        id: toastId,
        description: res.error
      });
    } else {
      toast.success("Profile mapped!", {
        id: toastId,
        description: "Microsoft Entra security group created and linked."
      });
    }
  };

  return (
    <button 
      onClick={handleAutoMap}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
      {isLoading ? "Generating..." : "Auto-Map Group"}
    </button>
  );
}