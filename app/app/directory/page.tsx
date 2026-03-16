// app/app/directory/page.tsx
import { db } from "@/db";
import { eq, not } from "drizzle-orm";
import { users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Users, Mail, Briefcase } from "lucide-react";
import OffboardButton from "./OffboardButton";
import ResetPasswordButton from "@/components/ui/ResetPasswordButton"; // <--- NEW IMPORT

export default async function EmployeeDirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch all employees in the organization
  const allEmployees = await db.query.users.findMany({
    where: eq(users.orgId, dbUser.orgId),
    orderBy: (users, { asc }) => [asc(users.name)],
  });

  // Filter out the Admins and already terminated people from the main list
  const activeEmployees = allEmployees.filter(e => 
    e.role === "EMPLOYEE" && !e.department?.includes("Terminated")
  );
  
  const terminatedEmployees = allEmployees.filter(e => 
    e.department?.includes("Terminated")
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Employee Directory
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Manage active staff and handle security offboarding.
        </p>
      </header>

      {/* Active Employees List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Active Staff ({activeEmployees.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {activeEmployees.length === 0 ? (
            <p className="p-8 text-center text-slate-500 italic">No active employees found.</p>
          ) : (
            activeEmployees.map((employee) => (
              <div key={employee.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{employee.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <span className="text-sm text-slate-500 flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {employee.department || "No Department"}</span>
                      <span className="text-sm text-slate-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {employee.email}</span>
                    </div>
                  </div>
                </div>
                
                {/* === NEW: Action Buttons Container === */}
                <div className="shrink-0 flex flex-col items-end gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <ResetPasswordButton employeeId={employee.id} employeeName={employee.name} />
                  <OffboardButton employeeId={employee.id} employeeName={employee.name} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Terminated Graveyard (Optional, good for records) */}
      {terminatedEmployees.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Offboarded Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {terminatedEmployees.map(emp => (
              <div key={emp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-75">
                <p className="font-bold text-slate-700 line-through">{emp.name}</p>
                <p className="text-xs text-slate-500 mt-1">{emp.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-sm uppercase">Access Revoked</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}