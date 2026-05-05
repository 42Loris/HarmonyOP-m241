# Post-Mortem 001: Vercel Deployment and Build Failures

**Date:** 2026-04-20
**Authors:** Harmony OP Engineering

## Symptoms
- Production deployments on Vercel repeatedly failed during the `npm run build` step.
- Cron jobs (e.g. automatic DB syncing or checks) failed to execute or threw 429 Too Many Requests / 403 Forbidden errors on Vercel's Hobby tier.

## Root Cause
1. **TypeScript strictness in Server Actions:** Drizzle schema typing in `actions/employee-actions.ts` and profile forms was too loose, causing `tsc` to fail on Vercel even if the local development environment (`npm run dev`) did not crash.
2. **Cron Schedule:** The cron configuration in `vercel.json` was set to an hourly frequency, which exceeds the limit for the Vercel Hobby tier (limited to 1 cron job per day).

## Resolution
1. **Type Refactoring:** Enforced strict TypeScript types for profile form states. We updated `employee-actions.ts` to strictly check for `"MANAGER"` and `"HR"` roles when fetching users.
2. **Cron Adjustment:** Updated the cron schedule to daily (`0 0 * * *`) to stay within the Vercel hobby tier limits.

## Lessons Learned
- **Never rely solely on `npm run dev`:** Always run `npm run lint` and `npm run build` locally before pushing to `main` to catch TypeScript errors early.
- **Infrastructure Limits:** Always cross-reference the infrastructure platform's tier limitations when designing background processing architectures.