// app/app/audit-logs/page.tsx
import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import { users, auditLogs } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Shield, UserMinus, Settings, FileText, Clock } from "lucide-react";

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch all logs for this organization, newest first
  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.orgId, dbUser.orgId),
    orderBy: [desc(auditLogs.createdAt)],
    limit: 100, // Keep the page fast by only showing the last 100 events
  });

  // Helper function to pick the right icon and color based on the action
  const getLogStyle = (actionType: string) => {
    switch (actionType) {
      case "TERMINATION":
        return { icon: UserMinus, color: "bg-red-100 text-red-600 border-red-200" };
      case "SETTINGS_UPDATE":
        return { icon: Settings, color: "bg-blue-100 text-blue-600 border-blue-200" };
      default:
        return { icon: FileText, color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-slate-700" />
          Security Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          An immutable, read-only record of critical platform actions.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <h3 className="text-slate-700 font-medium">No audit logs found</h3>
            <p className="text-slate-500 text-sm mt-1">When sensitive actions are performed, they will appear here.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
            {logs.map((log) => {
              const { icon: Icon, color } = getLogStyle(log.actionType);
              
              return (
                <div key={log.id} className="relative pl-8">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border flex items-center justify-center ${color} bg-white z-10`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Log Content */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900 text-sm">{log.actorName}</span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{log.description}</p>
                    <span className="inline-block mt-3 px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-sm uppercase tracking-wider">
                      {log.actionType.replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}