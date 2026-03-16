// actions/password-reset.ts
"use server";

import { db } from "@/db";
import { users, organizationIntegrations, auditLogs } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend"; // <--- NEW IMPORT

export async function resetMicrosoftPasswordAction(employeeId: string) {
  const resend = new Resend(process.env.RESEND_API_KEY); // <--- INITIALIZE RESEND
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dbAdmin = await db.query.users.findFirst({ where: eq(users.authId, user.id) });
  if (!dbAdmin || dbAdmin.role === "EMPLOYEE") {
    return { error: "Unauthorized access. Only Admins and HR can reset passwords." };
  }

  try {
    const targetEmployee = await db.query.users.findFirst({ where: eq(users.id, employeeId) });
    if (!targetEmployee) return { error: "Employee not found." };

    const integration = await db.query.organizationIntegrations.findFirst({
      where: eq(organizationIntegrations.orgId, dbAdmin.orgId)
    });

    if (!integration?.clientId || !integration?.clientSecret) {
      return { error: "Microsoft Integration missing. Please connect tenant." };
    }

    // 1. Authenticate with Microsoft Graph
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
    if (!access_token) throw new Error("Failed to authenticate with Microsoft Graph");

    // 2. Generate a secure temporary password
    const tempPassword = `Reset!${Math.random().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(-3)}`;

    const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
    
    // 3. Update the password in Azure AD
    const updateRes = await fetch(`https://graph.microsoft.com/v1.0/users/${targetEmployee.email}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        passwordProfile: {
          forceChangePasswordNextSignIn: true, 
          password: tempPassword
        }
      })
    });

    if (!updateRes.ok) {
      const errorData = await updateRes.json();
      throw new Error(errorData.error?.message || "Failed to reset password in Azure.");
    }

    // 4. Log the action in the Audit Logs
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      orgId: dbAdmin.orgId,
      actorName: dbAdmin.name,
      actionType: "UPDATE",
      description: `Triggered a Microsoft 365 password reset for ${targetEmployee.name}.`,
    });

    // ==========================================
    // 5. NEW: SEND THE TEMPORARY PASSWORD VIA EMAIL
    // ==========================================
    await resend.emails.send({
      from: 'Harmony OP IT Helpdesk <onboarding@resend.dev>',
      to: 'dpangione@online.gibz.ch', // Your test inbox
      subject: `Security Alert: Your M365 Password was Reset`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-w: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Microsoft 365 Password Reset</h2>
          <p>Hello ${targetEmployee.name},</p>
          <p>Your IT Administrator (<strong>${dbAdmin.name}</strong>) has just issued a secure password reset for your corporate Microsoft 365 account.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">CORPORATE EMAIL</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: #0f172a;">${targetEmployee.email}</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">NEW TEMPORARY PASSWORD</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${tempPassword}</p>
          </div>

          <p>Please log in to <a href="https://office.com" style="color: #2563eb; font-weight: bold;">office.com</a> immediately.</p>
          <p style="color: #ef4444; font-size: 14px;"><strong>Note:</strong> You will be forced to choose a new, permanent password upon your first successful login.</p>
          <br/>
          <p>Securely,<br/><strong>Harmony OP Automated IT Systems</strong></p>
        </div>
      `
    });

    revalidatePath("/app/directory");
    revalidatePath("/app/audit-logs");
    
    // We still return the password to the UI just in case the Admin wants to copy it directly
    return { success: true, newPassword: tempPassword };

  } catch (error: any) {
    console.error("Password reset failed:", error);
    return { error: error.message || "Failed to reset password." };
  }
}