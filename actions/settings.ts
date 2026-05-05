// actions/settings.ts
"use server";

import { db } from "@/db";
import { organizationIntegrations, users, organizations } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOrganizationAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser || dbUser.role === "EMPLOYEE") {
    return { error: "Unauthorized access." };
  }

  const description = formData.get("description") as string;

  try {
    await db.update(organizations)
      .set({ description })
      .where(eq(organizations.id, dbUser.orgId));
      
    revalidatePath("/app/settings");
    return { success: true };
  } catch (error) {
    console.error("Organization update failed:", error);
    return { error: "Failed to save organization details." };
  }
}

export async function updateMicrosoftIntegrationAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbUser || dbUser.role === "EMPLOYEE") {
    return { error: "Unauthorized access. Employees cannot modify system settings." };
  }

  const tenantId = formData.get("tenantId") as string;
  const clientId = formData.get("clientId") as string;
  const clientSecret = formData.get("clientSecret") as string;

  if (!tenantId || !clientId || !clientSecret) {
    return { error: "All fields are required to connect Microsoft Entra." };
  }

  try {
    // 1. Check if the organization already has an integration saved
    const existingIntegration = await db.query.organizationIntegrations.findFirst({
      where: eq(organizationIntegrations.orgId, dbUser.orgId)
    });

    if (existingIntegration) {
      // 2a. If it exists, UPDATE the existing row safely
      await db.update(organizationIntegrations)
        .set({ 
          tenantId, 
          clientId, 
          clientSecret, 
          updatedAt: new Date() 
        })
        .where(eq(organizationIntegrations.id, existingIntegration.id));
    } else {
      // 2b. If it does not exist, do a clean INSERT
      await db.insert(organizationIntegrations).values({
        id: crypto.randomUUID(), // Ensure a unique ID is provided
        orgId: dbUser.orgId,
        provider: "microsoft",   // <--- THE FIX: Satisfies your schema requirement!
        tenantId,
        clientId,
        clientSecret,
      });
    }

    // Force Next.js to redraw the UI
    revalidatePath("/app", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Integration update failed:", error);
    return { error: "Failed to save Microsoft credentials." };
  }
}