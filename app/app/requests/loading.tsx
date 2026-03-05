// app/app/requests/loading.tsx
import { Loader2, ShieldCheck } from "lucide-react";

export default function RequestsLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-500 bg-white p-12 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex items-center justify-center">
          <ShieldCheck className="h-16 w-16 text-blue-100" />
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Loading Approvals...</h2>
          <p className="text-sm font-medium animate-pulse text-slate-400">Syncing pending manager requests</p>
        </div>
      </div>
    </div>
  );
}