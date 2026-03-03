// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 1. Check if the user has a Supabase authentication cookie
  // Supabase uses cookies that typically contain 'sb-' and '-auth-token'
  const hasSession = request.cookies.getAll().some(cookie => cookie.name.includes('-auth-token'));
  
  // 2. Protect the entire /app workspace
  // If they are trying to access ANY /app route but aren't logged in, instantly bounce them to login.
  if (path.startsWith('/app') && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Keep logged-in users away from the public login page
  // If they are already authenticated, send them straight to their dashboard.
  if ((path === '/login' || path === '/') && hasSession) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }

  // 4. If all checks pass, allow the request to proceed to the Server Components
  return NextResponse.next();
}

// 5. Configure exactly which routes this Middleware should protect
// This keeps your app lightning fast by ignoring static files (images, fonts, etc.)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};