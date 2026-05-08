# Future Enhancements & V2 Roadmap

**BLUF:** Harmony OP has achieved its V1 MVP goals by delivering a robust, secure, and automated provisioning engine. To demonstrate the platform's scalability and our long-term vision, we have outlined the architecture for V2, focusing on "Automated Nudges & Webhooks" to further reduce administrative overhead.

## Problem Statement
Currently, while Harmony OP automates the *provisioning* of accounts and generation of tasks, ensuring those tasks are completed still requires manual oversight. If a manager forgets to approve a hardware request, or an employee ignores their mandatory compliance training, HR and IT must manually monitor the dashboard and chase individuals down. This manual follow-up introduces friction and HR fatigue, diluting the automation value of the platform.

## Proposed Architecture: Automated Nudges
To solve this, V2 will introduce an automated background engine to proactively monitor and nudge stalled workflows.

- **Vercel Cron Jobs & API Routes:** We will implement a secured Next.js API route (e.g., `/api/cron/nudge`) invoked daily by Vercel Cron.
- **Database Querying (Drizzle):** The cron job will utilize Drizzle ORM to query the `workflow_tasks` table, specifically targeting tasks where `status = 'PENDING'` and `createdAt` is older than a defined threshold (e.g., 48 hours).
- **Urgency Math Integration:** The system will leverage our existing "Urgency Math" logic to escalate the frequency or severity of the nudges as deadlines approach.

## Planned Integrations
The nudging engine will rely on two primary communication channels:
1. **Resend Daily Digests:** A consolidated daily email digest sent to HR/IT managers, summarizing all stalled onboarding or offboarding tasks across the organization.
2. **Slack Webhooks:** Direct, automated Slack messages sent to individual employees or managers, pinging them with actionable deep-links (e.g., "⚠️ *Action Required: Please approve the hardware request for John Doe.*").

## Rationale for Deferment
While highly valuable, this feature set was intentionally deferred from the V1 release. Developing the robust cron infrastructure, securing the API routes against unauthorized execution, and integrating reliable third-party webhooks introduced complexity that threatened our primary deadline. 

We made the strategic decision to strictly scope V1 to the core "God-Mode" provisioning lifecycle and secure multi-tenancy. This ensured the delivery of a highly polished, stable, and production-ready MVP for the final project evaluation, prioritizing quality and core functionality over feature bloat.