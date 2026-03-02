// app/app/requests/new/page.tsx
import { Suspense } from "react";
import { db } from "@/db";
import { roleProfiles, organizationIntegrations, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { createHireRequestAction } from "@/actions/hire-requests";
import Link from "next/link";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import NewHireForm from "./NewHireForm";

// === 1. THE ASYNC ENGINE (Runs in the background) ===
async function AsyncMicrosoftForm({ profiles, orgId }: { profiles: any[], orgId: string }) {
  const integration = await db.query.organizationIntegrations.findFirst({
    where: eq(organizationIntegrations.orgId, orgId),
  });

  let msGroups = [];
  let msLicenses = [];
  let tenantDomain = "company.com";

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
      const { access_token } = await tokenRes.json();

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

        const domainsRes = await fetch(`https://graph.microsoft.com/v1.0/domains`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const domainsData = await domainsRes.json();
        
        const defaultDomain = domainsData.value?.find((d: any) => d.isDefault);
        if (defaultDomain) {
          tenantDomain = defaultDomain.id;
        }
      }
    } catch (e) {
      console.error("Failed to fetch Graph data for form");
    }
  }

  return (
    <NewHireForm 
      profiles={profiles} 
      msLicenses={msLicenses} 
      msGroups={msGroups} 
      tenantDomain={tenantDomain}
      action={createHireRequestAction as any} 
    />
  );
}

// === 2. THE MAIN PAGE (Renders Instantly for 100 Score) ===
export default async function NewHireRequestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user!.id) });

  // Fetch profiles instantly from our DB
  const profiles = await db.query.roleProfiles.findMany({ where: eq(roleProfiles.orgId, dbUser!.orgId) });

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link href="/app/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-blue-600" />
          Request New Hire
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Submit a new hire for Manager Approval and automatic Microsoft 365 provisioning.
        </p>
      </header>

      {/* 3. THE SUSPENSE BOUNDARY */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-base text-slate-900 font-semibold">Connecting to Microsoft Graph...</p>
          <p className="text-sm text-slate-500 mt-1">Fetching live licenses and groups from your tenant.</p>
        </div>
      }>
        <AsyncMicrosoftForm profiles={profiles} orgId={dbUser!.orgId} />
      </Suspense>

    </div>
  );
}