# Harmony OP System Architecture

> A visual guide to the data flow, multi-tenant isolation, and provisioning lifecycle.

## High-Level Data Flow

```mermaid
graph TD
    %% Actors
    HR[HR Manager]
    IT[IT Admin]
    NH[New Hire]

    %% Front-End
    subgraph "Next.js App Router (Client & Server Components)"
        UI_Req[Hire Request Form]
        UI_Dash[IT/HR Task Dashboard]
        UI_Onb[Onboarding Wizard]
    end

    %% Backend/Server Actions
    subgraph "Next.js Server Actions (The Backend)"
        SA_Hire[actions/hire-requests.ts]
        SA_Task[actions/tasks.ts]
    end

    %% Integrations
    subgraph "External Integrations"
        MSGraph[Microsoft Graph API / Entra ID]
        Resend[Resend Email API]
    end

    %% Database
    subgraph "Supabase / PostgreSQL"
        DB_Req[(Hire Requests)]
        DB_WF[(Onboarding Workflows)]
        DB_Task[(Workflow Tasks)]
        DB_User[(Users & Orgs)]
    end

    %% Interactions
    HR -->|1. Submits| UI_Req
    UI_Req -->|2. POST formData| SA_Hire
    SA_Hire -->|3. Validates & Writes| DB_Req
    
    IT -->|4. Approves Request| SA_Hire
    SA_Hire -->|5. Authenticates & Creates User| MSGraph
    SA_Hire -->|6. Generates Password & Emails| Resend
    SA_Hire -->|7. Seeds Tasks from Profile| DB_Task
    SA_Hire -->|8. Creates Active Workflow| DB_WF
    
    NH -->|9. Logs In via Supabase Auth| UI_Onb
    UI_Onb -->|10. Reads Status| DB_WF
    UI_Dash -->|11. Reads/Updates| DB_Task
```

## Security & Multi-Tenancy

Every database query and server action in Harmony OP is scoped by the `orgId` of the currently authenticated user. 

```typescript
// Example of strict tenant isolation in Drizzle ORM
const requests = await db.query.hireRequests.findMany({
  where: eq(hireRequests.orgId, currentUser.orgId)
});
```

## The "God-Mode" Provisioning Lifecycle

When an IT/HR Admin approves a hire request in `actions/hire-requests.ts`, the following 5-phase transaction occurs:

1. **Authentication:** Fetches OAuth 2.0 token from `login.microsoftonline.com` using the organization's `clientSecret`.
2. **User Creation:** Posts to `graph.microsoft.com/v1.0/users` to create the Entra ID object with a securely generated temporary password.
3. **Database Sync:** Upserts the newly created Microsoft employee into our internal `users` table to ensure ID tracking.
4. **Workflow Generation:** Creates a new `onboardingWorkflows` record and seeds individual IT/HR/Hardware tasks from the role's assigned `profileTasks`.
5. **Notification:** Triggers Resend to email the employee's temporary Microsoft 365 credentials to their personal email or their manager.