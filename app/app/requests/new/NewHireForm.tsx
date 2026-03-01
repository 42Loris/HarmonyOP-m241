"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function NewHireForm({ 
  profiles, 
  msLicenses, 
  msGroups, 
  tenantDomain, 
  action 
}: { 
  profiles: any[], 
  msLicenses: any[], 
  msGroups: any[], 
  tenantDomain: string,
  action: any 
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSpecialHire, setIsSpecialHire] = useState(false);

  // Auto-generate the corporate email
  const generatedEmail = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@${tenantDomain}`;

  return (
    <form action={action} className="bg-white border border-slate-200 rounded-xl p-8 space-y-8 shadow-sm">
      
      {/* 1. Personal Details */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">1. Personal Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input type="text" name="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="e.g. John" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input type="text" name="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="e.g. Doe" />
          </div>
          
          {/* Auto-Generated Corporate Email Preview */}
          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Generated Corporate Email:</span>
            <span className="text-sm font-bold text-blue-600">{firstName || lastName ? generatedEmail : `firstname.lastname@${tenantDomain}`}</span>
          </div>

          <div className="col-span-2 mt-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Email (Where we send the temporary password)</label>
            <input type="email" name="personalEmail" required className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="johndoe@gmail.com" />
          </div>
        </div>
      </section>

      {/* 2. Role & Blueprint */}
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
        </div>
      </section>

      {/* 3. Special Overrides */}
      <section className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" name="isSpecialHire" id="isSpecialHire" checked={isSpecialHire} onChange={(e) => setIsSpecialHire(e.target.checked)} className="h-4 w-4 text-blue-600 rounded" />
          <label htmlFor="isSpecialHire" className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            Special Hire Overrides (Custom Licenses/Groups)
          </label>
        </div>
        
        {isSpecialHire && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 mt-4 animate-in fade-in slide-in-from-top-2">
            
            {/* Live Microsoft Licenses (Multi-Select Checklist) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Microsoft 365 Licenses (Select multiple)</label>
              <div className="w-full border border-slate-300 rounded-md bg-white max-h-48 overflow-y-auto p-2 space-y-1">
                {msLicenses.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">No licenses found.</p>
                ) : (
                  msLicenses.map((lic: any) => (
                    <label key={lic.skuId} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                      <input type="checkbox" name="msLicenses" value={lic.skuPartNumber} className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-slate-700 leading-tight">
                        {lic.skuPartNumber} <br/>
                        <span className="text-xs text-slate-400">Available: {lic.prepaidUnits?.enabled - lic.consumedUnits}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Live Microsoft Groups (Multi-Select Checklist) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Microsoft Entra Groups (Select multiple)</label>
              <div className="w-full border border-slate-300 rounded-md bg-white max-h-48 overflow-y-auto p-2 space-y-1">
                {msGroups.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">No groups found.</p>
                ) : (
                  msGroups.map((group: any) => (
                    <label key={group.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                      <input type="checkbox" name="msGroups" value={group.displayName} className="h-4 w-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-slate-700">{group.displayName}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Non-Microsoft Software */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-1">Other Software Licenses (Manager Approval Required)</label>
              <input type="text" name="otherLicenses" className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="e.g. Adobe Creative Cloud, Figma, SAP" />
            </div>
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="pt-4 border-t border-slate-100">
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
          Submit Request for Manager Approval
        </button>
      </div>

    </form>
  );
}