// app/app/requests/page.tsx
import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import { hireRequests, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, ShieldCheck, UserPlus, Inbox } from "lucide-react";
// Notice we no longer need to import the actions directly here, because the Client Component handles them!
import ActionButtons from "./ActionButtons";
import { EmptyState } from "@/components/ui/empty-state";

export default async function HireRequestsDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser) redirect("/login");

  // Fetch all requests for this organization
  const requests = await db.query.hireRequests.findMany({
    where: eq(hireRequests.orgId, dbUser.orgId),
    with: {
      profile: true,
      requester: true,
    },
    orderBy: [desc(hireRequests.createdAt)],
  });

  const pendingRequests = requests.filter(r => r.status === "PENDING");
  const pastRequests = requests.filter(r => r.status !== "PENDING");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case "REJECTED": return <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
      case "PROVISIONED": return <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Provisioned</span>;
      default: return <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <Link href="/app/dashboard" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Link href="/app/requests/new" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 text-sm transition-colors">
          <UserPlus className="h-4 w-4" /> New Hire Request
        </Link>
      </div>

      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Manager Approvals</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and approve incoming new hire requests to trigger automatic Microsoft provisioning.</p>
      </header>

      {/* Action Required: Pending Approvals */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" /> Action Required ({pendingRequests.length})
        </h2>
        
        {pendingRequests.length === 0 ? (
          <EmptyState 
            icon={Inbox}
            title="All caught up!"
            description="No pending requests at the moment. When a new hire is submitted, it will appear here for approval."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map(request => (
              <div key={request.id} className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Info Block */}
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{request.firstName} {request.lastName}</h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{request.jobTitle} • {request.department}</span>
                    {request.isSpecialHire && (
                      <span className="text-xs font-bold text-orange-700 bg-orange-100 dark:bg-orange-950 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-900">Special Hire</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1 text-xs uppercase tracking-wider">Requested Access (Includes Standard)</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {request.requestedLicenses && <li><span className="font-medium text-slate-700 dark:text-slate-300">Licenses:</span> {request.requestedLicenses}</li>}
                        {request.requestedGroups && <li><span className="font-medium text-slate-700 dark:text-slate-300">Groups:</span> {request.requestedGroups}</li>}
                        {(!request.requestedLicenses && !request.requestedGroups) && <li>Standard Profile Access Only</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1 text-xs uppercase tracking-wider">Details</p>
                      <p>Requested by: <span className="font-medium text-slate-700 dark:text-slate-300">{request.requester?.name}</span></p>
                      <p>Personal Email: {request.personalEmail}</p>
                    </div>
                  </div>
                </div>

                {/* === NEW: Action Buttons Component === */}
                <ActionButtons requestId={request.id} />

              </div>
            ))}
          </div>
        )}
      </section>

      {/* History Log */}
      <section className="pt-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Request History</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {pastRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No history available yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {pastRequests.map(request => (
                <li key={request.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{request.firstName} {request.lastName} <span className="font-normal text-slate-500 text-sm ml-2">- {request.jobTitle}</span></p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Requested by {request.requester?.name} on {new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

    </div>
  );
}