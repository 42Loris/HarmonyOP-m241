// components/dashboard/TriggerOnboardingButton.tsx
"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { triggerOnboardingAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

type Profile = {
  id: string;
  roleTitle: string;
  department: string;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={pending || disabled}>
      {pending ? "Initiating..." : "Start Onboarding"}
    </Button>
  );
}

export default function TriggerOnboardingButton({ profiles }: { profiles: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(triggerOnboardingAction, null);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const hasProfiles = profiles.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <UserPlus className="mr-2 h-4 w-4" /> Trigger Onboarding
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initiate New Hire Workflow</DialogTitle>
          <DialogDescription>
            Select a predefined role profile to automatically configure tasks and access rights.
          </DialogDescription>
        </DialogHeader>

        {!hasProfiles ? (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-600 mb-4">You need to configure at least one Role Profile before you can trigger an onboarding.</p>
            <Button variant="outline" onClick={() => window.location.href = '/app/profiles'}>
              Go to Profiles
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="e.g. Jane Doe" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Personal Email</Label>
              <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profileId">Role Profile</Label>
              <select 
                id="profileId" 
                name="profileId" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-white dark:ring-offset-slate-950 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled selected>Select a role...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.roleTitle} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>

            {state?.error && (
              <p className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded">{state.error}</p>
            )}

            <div className="pt-2">
              <SubmitButton disabled={!hasProfiles} />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}