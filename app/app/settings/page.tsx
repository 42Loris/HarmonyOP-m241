// app/app/settings/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, organizationIntegrations, organizations } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import IntegrationForm from "./IntegrationForm";
import OrganizationForm from "./OrganizationForm";
import DangerZone from "./DangerZone";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch the organization data
  const orgData = await db.query.organizations.findFirst({
    where: eq(organizations.id, dbUser.orgId)
  });

  // Fetch the current integration data to pre-fill the form
  const integrationData = await db.query.organizationIntegrations.findFirst({
    where: eq(organizationIntegrations.orgId, dbUser.orgId)
  });

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Settings className="h-8 w-8 text-slate-700 dark:text-slate-500" />
          Organization Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Manage your external integrations and data lifecycle.
        </p>
      </header>

      {/* 1. Company Description Form */}
      <OrganizationForm initialData={orgData || null} />

      {/* 2. The Microsoft Credentials Form */}
      <IntegrationForm initialData={integrationData || null} />

      {/* 3. Your Factory Reset Button */}
      <DangerZone />

    </div>
  );
}