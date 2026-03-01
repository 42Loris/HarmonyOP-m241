// app/app/requests/new/page.tsx
import { db } from "@/db";
import { roleProfiles } from "@/db/schema";
import { createHireRequestAction } from "@/actions/hire-requests";
import Link from "next/link";
import { ArrowLeft, UserPlus, ShieldAlert } from "lucide-react";

export default async function NewHireRequestPage() {
  // Fetch available profiles for the dropdown
  const profiles = await db.query.roleProfiles.findMany();

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link href="/app/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-blue-600" />
          Request New Hire
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Submit a new hire for Manager Approval and automatic Microsoft 365 provisioning.
        </p>
      </header>

      <form action={createHireRequestAction as any} className="bg-white border border-slate-200 rounded-xl p-8 space-y-8 shadow-sm">
        
        {/* Section 1: The Person */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">1. Personal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input type="text" name="firstName" required className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="e.g. John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input type="text" name="lastName" required className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="e.g. Doe" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Personal Email (For sending initial credentials)</label>
              <input type="email" name="personalEmail" required className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="johndoe@gmail.com" />
            </div>
          </div>
        </section>

        {/* Section 2: The Role */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">2. Role & Blueprint</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Role Profile</label>
            <select name="profileId" required className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50">
              <option value="">-- Choose a Role --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">This will automatically apply default Microsoft licenses, Entra groups, and onboarding tasks.</p>
          </div>
        </section>

        {/* Section 3: Special Overrides */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <input type="checkbox" name="isSpecialHire" id="isSpecialHire" className="h-4 w-4 text-blue-600 rounded" />
            <label htmlFor="isSpecialHire" className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              This is a Special Hire (Request Custom Licenses/Groups)
            </label>
          </div>
          
          <div className="grid grid-cols-1 gap-4 pl-7">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Microsoft Licenses (SKUs)</label>
              <input type="text" name="requestedLicenses" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Visio Plan 2, Power Automate Premium" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Microsoft Entra Groups</label>
              <input type="text" name="requestedGroups" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Executive File Share, Finance SharePoint" />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
            Submit Request for Manager Approval
          </button>
        </div>

      </form>
    </div>
  );
}