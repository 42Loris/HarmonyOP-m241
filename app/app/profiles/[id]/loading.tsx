// app/app/profiles/[id]/loading.tsx
import { Hexagon, Loader2 } from "lucide-react";

export default function ProfileLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center mb-4">
          <Hexagon className="h-16 w-16 text-blue-600 fill-blue-600/20" />
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Harmony OP</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">
          Loading profile configuration...
        </p>
      </div>
    </div>
  );
}