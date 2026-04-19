// app/app/settings/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, organizationIntegrations } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import IntegrationForm from "./IntegrationForm";
import DangerZone from "./DangerZone";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Fetch the current integration data to pre-fill the form
  const integrationData = await db.query.organizationIntegrations.findFirst({
    where: eq(organizationIntegrations.orgId, dbUser.orgId)
  });

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-slate-700" />
          Organization Settings
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Manage your external integrations and data lifecycle.
        </p>
      </header>

      {/* 1. The Microsoft Credentials Form */}
      <IntegrationForm initialData={integrationData || null} />

      {/* 2. Your Factory Reset Button */}
      <DangerZone />

    </div>
  );
}