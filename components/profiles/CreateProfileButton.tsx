// components/profiles/CreateProfileButton.tsx
"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProfileAction, type ProfileFormState } from "@/actions/profiles";
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
import { Plus } from "lucide-react";

// 1. Define the exact initial state matching the server action
const initialState: ProfileFormState = { 
  error: null, 
  success: false, 
  timestamp: 0 
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={pending}>
      {pending ? "Saving..." : "Create Profile"}
    </Button>
  );
}

export default function CreateProfileButton() {
  const [open, setOpen] = useState(false);
  
  // 2. Pass initialState instead of null
  const [state, formAction] = useActionState(createProfileAction, initialState);

  // 3. Update the useEffect to cleanly read the state
  useEffect(() => {
    if (state.success && state.timestamp) {
      const timer = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.timestamp]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Role Profile
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Role Profile</DialogTitle>
          <DialogDescription>
            Define a standard role to automate future onboardings.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Role Title</Label>
            {/* 4. Changed id and name from "roleTitle" to "name" to match the backend! */}
            <Input id="name" name="name" placeholder="e.g. Senior Frontend Engineer" required />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" placeholder="e.g. Engineering" required />
          </div>

          {state.error && (
            <p className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded">{state.error}</p>
          )}

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}