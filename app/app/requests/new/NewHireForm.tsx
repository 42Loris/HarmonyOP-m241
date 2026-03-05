"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import SubmitButton from "@/components/ui/SubmitButton";
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
  
  // Track the currently selected profile
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const generatedEmail = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@${tenantDomain}`;

  // Find the full profile object so we can display its default data
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // === DYNAMIC FILTERING LOGIC ===
  // 1. Convert the comma-separated strings into clean arrays
  const defaultLicensesArray = selectedProfile?.defaultLicenses 
    ? selectedProfile.defaultLicenses.split(",").map((s: string) => s.trim()) 
    : [];
    
  const defaultGroupsArray = selectedProfile?.defaultGroups 
    ? selectedProfile.defaultGroups.split(",").map((s: string) => s.trim()) 
    : [];

  // 2. Filter the Microsoft arrays to exclude items already in the profile
  const availableMsLicenses = msLicenses.filter(
    (lic: any) => !defaultLicensesArray.includes(lic.skuPartNumber)
  );
  
  const availableMsGroups = msGroups.filter(
    (group: any) => !defaultGroupsArray.includes(group.displayName)
  );

  return (
    <form action={action} className="bg-white border border-slate-200 rounded-xl p-8 space-y-8 shadow-sm">
      
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

      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">2. Role & Blueprint</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Role Profile</label>
          <select 
            name="profileId" 
            required 
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-50"
          >
            <option value="">-- Choose a Role --</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
            ))}
          </select>

          {/* Dynamic Display of Standard Access */}
          {selectedProfile && (selectedProfile.defaultLicenses || selectedProfile.defaultGroups) && (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4" /> Standard Access Package Applied
              </h3>
              <div className="space-y-2">
                {selectedProfile.defaultLicenses && (
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold text-blue-900">Licenses: </span> 
                    {selectedProfile.defaultLicenses}
                  </p>
                )}
                {selectedProfile.defaultGroups && (
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold text-blue-900">Groups: </span> 
                    {selectedProfile.defaultGroups}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" name="isSpecialHire" id="isSpecialHire" checked={isSpecialHire} onChange={(e) => setIsSpecialHire(e.target.checked)} className="h-4 w-4 text-blue-600 rounded" />
          <label htmlFor="isSpecialHire" className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            Special Hire Overrides (Add Additional Licenses/Groups)
          </label>
        </div>
        
        {isSpecialHire && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 mt-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional MS Licenses</label>
              <div className="w-full border border-slate-300 rounded-md bg-white max-h-48 overflow-y-auto p-2 space-y-1">
                {availableMsLicenses.length > 0 ? (
                  availableMsLicenses.map((lic: any) => (
                    <label key={lic.skuId} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" name="msLicenses" value={lic.skuPartNumber} className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-slate-700 leading-tight">
                        {lic.skuPartNumber} <br/><span className="text-xs text-slate-400">Available: {lic.prepaidUnits?.enabled - lic.consumedUnits}</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 p-2 italic">All available licenses are already included in the standard package.</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional MS Groups</label>
              <div className="w-full border border-slate-300 rounded-md bg-white max-h-48 overflow-y-auto p-2 space-y-1">
                {availableMsGroups.length > 0 ? (
                  availableMsGroups.map((group: any) => (
                    <label key={group.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" name="msGroups" value={group.displayName} className="h-4 w-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-slate-700">{group.displayName}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 p-2 italic">All available groups are already included in the standard package.</p>
                )}
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-1">Other Software Licenses (Requires Approval)</label>
              <input type="text" name="otherLicenses" className="w-full border border-slate-300 rounded-md px-3 py-2" placeholder="e.g. Adobe Creative Cloud, Figma, SAP" />
            </div>
          </div>
        )}
      </section>

      <div className="pt-4 border-t border-slate-100">
      <SubmitButton defaultText="Submit Request for Manager Approval" loadingText="Submitting..." className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold" />
      </div>
    </form>
  );
}