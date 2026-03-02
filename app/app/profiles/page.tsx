// app/app/profiles/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, roleProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Network, CheckCircle } from "lucide-react"; // <-- Added CheckCircle
import CreateProfileModal from "@/components/profiles/CreateProfileModal";
import Link from "next/link";
import AutoMapButton from "./AutoMapButton"; // <-- Imported our new Magic Button

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
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Role Profiles</h1>
          <p className="text-sm text-slate-500">Manage onboarding templates and Microsoft Entra group mappings.</p>
        </div>
        
        {/* Render the interactive Modal component instead of a static button */}
        <CreateProfileModal />
        
      </header>

      {profiles.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No profiles created yet. Click "New Profile" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="relative overflow-hidden group hover:shadow-md transition-all hover:border-blue-200 border-slate-200 h-full flex flex-col">
              
              {/* TOP HALF: Clickable Link to Profile Details */}
              <Link href={`/app/profiles/${profile.id}`} className="block flex-grow cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                      {profile.department}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> {profile.defaultTasks?.length || 0} Tasks
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-700 transition-colors">{profile.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Standard equipment and access provisioning template.
                  </CardDescription>
                </CardHeader>
              </Link>

              {/* BOTTOM HALF: Actionable Entra ID Section */}
              <CardContent className="bg-slate-50 border-t p-4 mt-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className={`h-4 w-4 ${profile.entraGroupId ? "text-blue-500" : "text-slate-400"}`} />
                    <span className="text-xs font-medium text-slate-700">Entra ID Mapping</span>
                  </div>
                  
                  {/* The Auto-Map Logic */}
                  {profile.entraGroupId ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 gap-1 flex items-center">
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