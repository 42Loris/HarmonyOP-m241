"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrganizationAction } from "@/actions/settings";
import SubmitButton from "@/components/ui/SubmitButton";

// Assuming we have a similar SubmitButton or we can create a local one.
function LocalSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Details"}
    </button>
  );
}

export default function OrganizationForm({ initialData }: { initialData: { description: string | null } | null }) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const res = await updateOrganizationAction(formData);
    return res;
  }, null);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Company Profile</h2>
        <p className="text-sm text-slate-500 mt-1">Describe your organization.</p>
      </div>

      <form action={formAction} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Company Description
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={initialData?.description || ""}
            placeholder="A brief description of your company..."
            className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {state?.error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-200">
            Organization details updated successfully.
          </div>
        )}

        <div className="flex justify-end">
          <LocalSubmitButton />
        </div>
      </form>
    </section>
  );
}