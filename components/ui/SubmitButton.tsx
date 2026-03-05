// components/ui/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function SubmitButton({ 
  defaultText, 
  loadingText, 
  className 
}: { 
  defaultText: string;
  loadingText: string;
  className?: string;
}) {
  // This hook automatically knows if the parent <form> is currently running a server action!
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center gap-2 transition-colors ${className} disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? loadingText : defaultText}
    </button>
  );
}