import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
      <p className="font-medium">Loading Harmony OP...</p>
    </div>
  );
}