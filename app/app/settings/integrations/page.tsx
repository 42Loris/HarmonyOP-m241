// app/app/settings/integrations/page.tsx
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { users, organizationIntegrations } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Server } from "lucide-react";
import MicrosoftIntegrationForm from "@/components/settings/MicrosoftIntegrationForm";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  if (!dbUser || dbUser.role === "EMPLOYEE") redirect("/app/dashboard");

  // Check if we already have a Microsoft integration saved for this Org
  const existingIntegration = await db.query.organizationIntegrations.findFirst({
    where: and(
      eq(organizationIntegrations.orgId, dbUser.orgId),
      eq(organizationIntegrations.provider, "MICROSOFT_ENTRA")
    ),
  });

  const isConnected = !!existingIntegration;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">Connect Harmony OP with your company&apos;s existing tools.</p>
      </header>

      <div className="grid gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50/50 border-b border-slate-100 p-6 flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Microsoft Entra ID (Active Directory)</h2>
              <p className="text-sm text-slate-600 mt-1">
                Automatically sync new hires, assign them to Microsoft Groups, and trigger onboarding workflows the moment an IT Admin creates their account.
              </p>
            </div>
          </div>
          
          <CardContent className="p-6">
            {/* Drop in our new interactive client form! */}
            <MicrosoftIntegrationForm isConnected={isConnected} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}