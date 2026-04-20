// app/app/audit-logs/page.tsx
import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import { users, auditLogs } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Shield, UserMinus, Settings, FileText, Clock, History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

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
        return { icon: UserMinus, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50" };
      case "SETTINGS_UPDATE":
        return { icon: Settings, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50" };
      default:
        return { icon: FileText, color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800" };
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <History className="h-8 w-8 text-slate-700 dark:text-slate-500" />
          Security Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          An immutable, read-only record of critical platform actions.
        </p>
      </header>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
        {logs.length === 0 ? (
          <EmptyState 
            icon={Shield}
            title="No audit logs found"
            description="When sensitive actions like user creation, termination, or setting updates are performed, they will appear here."
            className="border-none shadow-none"
          />
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8">
            {logs.map((log) => {
              const { icon: Icon, color } = getLogStyle(log.actionType);
              
              return (
                <div key={log.id} className="relative pl-8">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border flex items-center justify-center ${color} bg-white dark:bg-slate-950 z-10`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Log Content */}
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-slate-100 dark:border-slate-800 transition-colors hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{log.actorName}</span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{log.description}</p>
                    <span className="inline-block mt-3 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-sm uppercase tracking-wider">
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