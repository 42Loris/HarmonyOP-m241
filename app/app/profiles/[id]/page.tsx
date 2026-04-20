// app/app/profiles/[id]/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { roleProfiles, organizationIntegrations, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Laptop, Users, GraduationCap, ClipboardList, Calendar, ShieldCheck } from "lucide-react";
import { addProfileTaskAction, deleteProfileTaskAction } from "@/actions/profile-tasks";
import { addProfileMeetingAction, deleteProfileMeetingAction } from "@/actions/profile-meetings";
import { updateProfileProvisioningAction } from "@/actions/profile-provisioning";
import { deleteProfileHardwareAction } from "@/actions/profile-hardware";
import HardwareProcurementForm from "@/components/profiles/HardwareProcurementForm";
import SubmitButton from "@/components/ui/SubmitButton"; 
import DeleteIconButton from "@/components/ui/DeleteIconButton";
import { ShoppingCart, ExternalLink } from "lucide-react";

interface MSGroup {
  id: string;
  displayName: string;
}

interface MSLicense {
  skuId: string;
  skuPartNumber: string;
}

export default async function ProfileDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });

  const profile = await db.query.roleProfiles.findFirst({
    where: eq(roleProfiles.id, id),
    with: {
      defaultTasks: true,
      defaultMeetings: true, 
      defaultHardware: true,
    },
  });

  if (!profile) redirect("/app/profiles");

  // Fetch Microsoft Graph Data for the Checklists
  const integration = await db.query.organizationIntegrations.findFirst({
    where: eq(organizationIntegrations.orgId, dbUser!.orgId),
  });

  let msGroups: MSGroup[] = [];
  let msLicenses: MSLicense[] = [];

  if (integration?.clientId && integration?.clientSecret) {
    try {
      const tokenRes = await fetch(`https://login.microsoftonline.com/${integration.tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: integration.clientId,
          scope: "https://graph.microsoft.com/.default",
          client_secret: integration.clientSecret,
          grant_type: "client_credentials",
        }),
      });
      const tokenData = await tokenRes.json();
      const access_token = tokenData.access_token as string;

      if (access_token) {
        const groupsRes = await fetch(`https://graph.microsoft.com/v1.0/groups?$top=100&$select=id,displayName`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const groupsData = await groupsRes.json();
        msGroups = groupsData.value || [];

        const skusRes = await fetch(`https://graph.microsoft.com/v1.0/subscribedSkus?$select=skuId,skuPartNumber,consumedUnits,prepaidUnits`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const skusData = await skusRes.json();
        msLicenses = skusData.value || [];
      }
    } catch {
      console.error("Failed to fetch MS Graph data");
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "IT_ACCESS": return <Laptop className="h-4 w-4 text-blue-500" />;
      case "HARDWARE": return <Laptop className="h-4 w-4 text-purple-500" />;
      case "HR_ADMIN": return <Users className="h-4 w-4 text-pink-500" />;
      case "TRAINING": return <GraduationCap className="h-4 w-4 text-orange-500" />;
      default: return <ClipboardList className="h-4 w-4 text-slate-500" />;
    }
  };

  const currentLicenses = profile.defaultLicenses ? profile.defaultLicenses.split(", ") : [];
  const currentGroups = profile.defaultGroups ? profile.defaultGroups.split(", ") : [];

  const totalHardwareCost = profile.defaultHardware.reduce((sum, item) => sum + parseFloat(item.price), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen animate-in fade-in duration-500">
      <div className="mb-6">
        <Link href="/app/profiles" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Profiles
        </Link>
      </div>

      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{profile.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Department: {profile.department}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Lists */}
        <div className="md:col-span-2 space-y-8">
          
          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" /> Standard System Access
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
              {!profile.defaultLicenses && !profile.defaultGroups ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No default access configured. Set it on the right.</p>
              ) : (
                <div className="space-y-4">
                  {profile.defaultLicenses && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Microsoft Licenses</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentLicenses.map(lic => (
                          <span key={lic} className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-medium px-2.5 py-1 rounded-md">{lic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.defaultGroups && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Entra Security Groups</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentGroups.map(grp => (
                          <span key={grp} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-medium px-2.5 py-1 rounded-md">{grp}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" /> Hardware Procurement & Financials
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              {profile.defaultHardware.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">No hardware requirements defined yet.</div>
              ) : (
                <>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {profile.defaultHardware.map(item => (
                      <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md"><Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400" /></div>
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-200 text-sm line-clamp-1">{item.itemName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              {item.category} • <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-0.5"><ExternalLink className="h-2 w-2" /> View Link</a>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">CHF {parseFloat(item.price).toFixed(2)}</span>
                          <form action={deleteProfileHardwareAction as unknown as (payload: FormData) => void}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="profileId" value={profile.id} />
                            <DeleteIconButton />
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estimated Onboarding Cost</span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">CHF {totalHardwareCost.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Default Onboarding Tasks</h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              {profile.defaultTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No tasks added yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.defaultTasks.map(task => (
                    <li key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md">{getTaskIcon(task.taskType)}</div>
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-200 block">{task.title}</span>
                          {task.requiresApproval && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-green-600" /> Approval by: {task.approverEmail}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                          {task.taskType.replace("_", " ")}
                        </span>
                        <form action={deleteProfileTaskAction as unknown as (payload: FormData) => void}>
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="profileId" value={profile.id} />
                          <DeleteIconButton />
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Auto-Scheduled Meetings</h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              {profile.defaultMeetings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No meetings scheduled.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.defaultMeetings.map(meeting => (
                    <li key={meeting.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md"><Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200">{meeting.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Host: {meeting.hostEmail} • {meeting.durationMinutes} mins</p>
                        </div>
                      </div>
                      <form action={deleteProfileMeetingAction as unknown as (payload: FormData) => void}>
                        <input type="hidden" name="id" value={meeting.id} />
                        <input type="hidden" name="profileId" value={profile.id} />
                        <DeleteIconButton />
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Forms */}
        <div className="space-y-6">

          <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-5">
            <h3 className="font-bold text-green-900 dark:text-green-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Standard Access
            </h3>
            <form action={updateProfileProvisioningAction as unknown as (payload: FormData) => void} className="space-y-4">
              <input type="hidden" name="profileId" value={profile.id} />
              
              <div>
                <label className="block text-xs font-medium text-green-900 dark:text-green-400 mb-1">Default MS Licenses</label>
                <div className="w-full border border-green-200 dark:border-green-900/30 rounded-md bg-white dark:bg-slate-950 max-h-32 overflow-y-auto p-2 space-y-1">
                  {msLicenses.map((lic) => (
                    <label key={lic.skuId} className="flex items-start gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded cursor-pointer">
                      <input type="checkbox" name="msLicenses" value={lic.skuPartNumber} defaultChecked={currentLicenses.includes(lic.skuPartNumber)} className="mt-0.5 h-3.5 w-3.5 text-green-600 rounded border-slate-300 dark:border-slate-800 dark:bg-slate-900" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{lic.skuPartNumber}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-green-900 dark:text-green-400 mb-1">Default MS Groups</label>
                <div className="w-full border border-green-200 dark:border-green-900/30 rounded-md bg-white dark:bg-slate-950 max-h-32 overflow-y-auto p-2 space-y-1">
                  {msGroups.map((group) => (
                    <label key={group.id} className="flex items-start gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded cursor-pointer">
                      <input type="checkbox" name="msGroups" value={group.displayName} defaultChecked={currentGroups.includes(group.displayName)} className="mt-0.5 h-3.5 w-3.5 text-green-600 rounded border-slate-300 dark:border-slate-800 dark:bg-slate-900" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{group.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <SubmitButton 
                defaultText="Save Standard Access" 
                loadingText="Saving..." 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm font-medium" 
              />
            </form>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Task
            </h3>
            <form action={addProfileTaskAction as unknown as (payload: FormData) => void} className="space-y-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                <input type="text" name="title" required className="w-full border border-slate-300 dark:border-slate-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select name="taskType" required className="w-full border border-slate-300 dark:border-slate-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm">
                  <option value="IT_ACCESS">IT Access (Software)</option>
                  <option value="HARDWARE">Hardware (Equipment)</option>
                  <option value="HR_ADMIN">HR & Admin</option>
                  <option value="TRAINING">Training</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" name="requiresApproval" id="requiresApproval" className="h-4 w-4 text-slate-800 rounded border-slate-300" />
                <label htmlFor="requiresApproval" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Requires Admin/Manager Approval</label>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Approver Email (if required)</label>
                <input type="email" name="approverEmail" placeholder="approver@company.com" className="w-full border border-slate-300 dark:border-slate-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Entra Group to Unlock (Optional)</label>
                <select name="provisionEntraGroupOnComplete" className="w-full border border-slate-300 dark:border-slate-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm">
                  <option value="">None (Just mark complete)</option>
                  {msGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.displayName}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Automatically adds employee to this group upon task approval.</p>
              </div>
              
              <SubmitButton 
                defaultText="Save Task" 
                loadingText="Saving..." 
                className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white py-2 rounded-md text-sm font-medium transition-colors" 
              />
            </form>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Schedule Meeting
            </h3>
            <form action={addProfileMeetingAction as unknown as (payload: FormData) => void} className="space-y-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <div>
                <label className="block text-xs font-medium text-blue-900 dark:text-blue-400 mb-1">Meeting Title</label>
                <input type="text" name="title" required placeholder="e.g. Codebase Intro" className="w-full border border-blue-200 dark:border-blue-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 dark:text-blue-400 mb-1">Host Email (Leader)</label>
                <input type="email" name="hostEmail" required placeholder="leader@company.com" className="w-full border border-blue-200 dark:border-blue-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 dark:text-blue-400 mb-1">Other Internal People</label>
                <input type="text" name="internalGuests" placeholder="dev@company.com" className="w-full border border-blue-200 dark:border-blue-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 dark:text-blue-400 mb-1">External Guests</label>
                <input type="text" name="externalGuests" placeholder="sap@external.com" className="w-full border border-blue-200 dark:border-blue-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 dark:text-blue-400 mb-1">Duration (Minutes)</label>
                <select name="durationMinutes" className="w-full border border-blue-200 dark:border-blue-800 dark:bg-slate-950 rounded-md px-3 py-2 text-sm">
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                </select>
              </div>
              
              <SubmitButton 
                defaultText="Add Meeting to Template" 
                loadingText="Adding..." 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium" 
              />
            </form>
          </div>

          <HardwareProcurementForm profileId={profile.id} />

        </div>
      </div>
    </div>
  );
}