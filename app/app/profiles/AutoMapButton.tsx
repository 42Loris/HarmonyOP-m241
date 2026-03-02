// app/app/profiles/AutoMapButton.tsx
"use client";

import { useState } from "react";
import { autoMapEntraGroupAction } from "@/actions/auto-map";
import { Loader2, Zap } from "lucide-react";

export default function AutoMapButton({ profileId }: { profileId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoMap = async () => {
    setIsLoading(true);
    const res = await autoMapEntraGroupAction(profileId);
    setIsLoading(false);

    if (res?.error) {
      alert("Failed to auto-map: " + res.error);
    }
  };

  return (
    <button 
      onClick={handleAutoMap}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
      {isLoading ? "Generating..." : "Auto-Map Group"}
    </button>
  );
}