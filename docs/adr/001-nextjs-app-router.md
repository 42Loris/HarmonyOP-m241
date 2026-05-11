# ADR-001: Next.js App Router and React Server Components

**Status:** Accepted
**Date:** 2026-05-04
**Authors:** Harmony OP Engineering

## Context
Harmony OP requires a robust framework to handle complex UI states, real-time feedback during the onboarding wizard, and secure back-end execution for our "God-Mode" provisioning engine. We needed a solution that would deliver a blazing-fast user experience (perfect Vercel Speed Insight scores) while keeping sensitive logic (like API keys for Resend and Microsoft Graph) strictly on the server.

## Decision
We chose Next.js 15 using the App Router architecture and React 19 Server Components/Server Actions.

## Options Considered

### Option A: Next.js (App Router)
- **Pros:** Native support for Server Components and Server Actions keeps secret keys secure and bundles small. `<Suspense>` streaming provides excellent perceived performance and Vercel scores.
- **Cons:** Steeper learning curve for Server/Client component boundaries.

### Option B: React SPA (Vite) + Express.js Backend
- **Pros:** Clear separation of concerns; traditional API development.
- **Cons:** Requires maintaining two separate codebases. No native SSR/streaming out of the box, which impacts Day One load performance for new hires.

## Consequences
- **Easier:** Developing complex forms (like Hire Requests) by directly invoking Server Actions (`actions/hire-requests.ts`) without manually wiring up API endpoints.
- **Harder:** Managing the boundary between what is rendered on the server (data fetching) versus the client (interactivity).
- **Monitor:** Vercel deployment build times and TypeScript strictness in Server Actions, which have caused build failures in the past.

## References
- Next.js 15 Documentation
- Project `gemini.md` architecture overview