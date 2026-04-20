// app/app/profiles/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, roleProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Network, CheckCircle, Users } from "lucide-react"; 
import CreateProfileModal from "@/components/profiles/CreateProfileModal";
import Link from "next/link";
import AutoMapButton from "./AutoMapButton"; 
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch real profiles from the new Entra-ready table
  const profiles = await db.query.roleProfiles.findMany({
    where: eq(roleProfiles.orgId, dbUser.orgId),
    with: {
      defaultTasks: true, 
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Role Profiles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage onboarding templates and Microsoft Entra group mappings.</p>
        </div>
        
        <CreateProfileModal />
      </header>

      {profiles.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No profiles created yet"
          description="Create role profiles to define standard equipment and access templates for your organization."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 h-full flex flex-col bg-white dark:bg-slate-900">
              
              {/* TOP HALF: Clickable Link to Profile Details */}
              <Link href={`/app/profiles/${profile.id}`} className="block flex-grow cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {profile.department}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> {profile.defaultTasks?.length || 0} Tasks
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors dark:text-slate-100">{profile.name}</CardTitle>
                  <CardDescription className="text-xs mt-1 dark:text-slate-400">
                    Standard equipment and access provisioning template.
                  </CardDescription>
                </CardHeader>
              </Link>

              {/* BOTTOM HALF: Actionable Entra ID Section */}
              <CardContent className="bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 p-4 mt-auto transition-colors group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className={`h-4 w-4 ${profile.entraGroupId ? "text-blue-500" : "text-slate-400"}`} />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Entra ID Mapping</span>
                  </div>
                  
                  {/* The Auto-Map Logic */}
                  {profile.entraGroupId ? (
                    <Badge className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-900/50 gap-1 flex items-center">
                      <CheckCircle className="h-3 w-3" /> Mapped
                    </Badge>
                  ) : (
                    <AutoMapButton profileId={profile.id} />
                  )}
                </div>
              </CardContent>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}