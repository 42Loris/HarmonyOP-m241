// components/ui/DeleteIconButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteIconButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-1"
      title="Delete"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}