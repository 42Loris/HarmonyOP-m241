// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!authError && authData.user) {
      const authUser = authData.user;

      try {
        // 1. Prüfen, ob der Nutzer bereits in unserer Postgres-Datenbank existiert via authId
        let existingUser = await db.query.users.findFirst({
          where: eq(users.authId, authUser.id),
        });

        // 2. Falls nicht via authId gefunden, prüfen wir via Email (Pre-Provisioned User!)
        if (!existingUser && authUser.email) {
          existingUser = await db.query.users.findFirst({
            where: eq(users.email, authUser.email),
          });

          if (existingUser) {
            // User existiert bereits via Provisioning Engine, aber authId fehlt -> Update!
            await db.update(users)
              .set({ authId: authUser.id })
              .where(eq(users.id, existingUser.id));
          }
        }

        // 3. Wenn er gar nicht existiert (erster Login via Microsoft ohne Pre-Provisioning!), legen wir ihn an
        if (!existingUser) {
          // Wir suchen die erste Organisation im System als Fallback (für die Dev-Phase)
          const defaultOrg = await db.query.organizations.findFirst();

          if (defaultOrg) {
            await db.insert(users).values({
              authId: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'SSO User',
              role: 'EMPLOYEE',
              department: 'General', 
              orgId: defaultOrg.id, 
            });
          }
        }
      } catch (dbError) {
        console.error("Fehler beim Synchronisieren des SSO-Nutzers mit der DB:", dbError);
        // Wir lassen ihn trotzdem zum Dashboard, auch wenn der Sync fehlschlägt,
        // das Layout wird ihn dann entsprechend behandeln.
      }

      // Erfolgreich eingeloggt und synchronisiert -> ab zum Dashboard!
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Falls etwas schiefgeht, zurück zum Login
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}