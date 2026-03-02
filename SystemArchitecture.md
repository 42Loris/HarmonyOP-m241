# Project Documentation: Harmony OP

**Automated Enterprise Onboarding & Provisioning Platform**

## 1. Executive Summary: Why Harmony OP is a Game-Changer

In the modern corporate world, onboarding is broken. It typically triggers a chaotic chain of emails, manual data entry, forgotten software licenses, and new hires spending their first week locked out of their tools. 

**Harmony OP solves this by completely automating the IT and HR pipeline.** It is not just an observer; it is an active provisioning engine. Deeply integrated with Microsoft Entra ID (Active Directory) and built on a bleeding-edge Next.js architecture, Harmony OP automatically:

1. Allows HR to submit customizable New Hire Requests (dynamically filtering out standard vs. custom access).
2. **The "God-Mode" Engine:** Upon manager approval, it authenticates with Microsoft, physically *creates* the user in the Azure tenant, assigns a secure temporary password, attaches specific 365 licenses, and adds them to Entra Security Groups.
3. Automatically dispatches welcome emails via Resend with the new corporate credentials.
4. Generates targeted Kanban boards for IT and HR, tracking hardware and contract statuses.
5. Provides a "Mission Control" view that mathematically calculates urgency based on the employee's start date.
6. Rolls out a "Digital Red Carpet"—a dedicated, interactive Employee Dashboard for the new hire's first day.

Harmony OP ensures an employee is 100% operative from minute one.

---

## 2. Team Structure & Contributions

To execute a project of this complexity, the workload was divided to mimic a real-world DevOps environment:

* **Dante Pangione (Lead Architect & Full-Stack Engineer):** Responsible for the entire codebase. Designed the highly normalized PostgreSQL database, engineered the multi-phase Microsoft Graph API provisioning pipeline, built the self-healing DB server actions, implemented React `<Suspense>` streaming for perfect Web Vitals, and designed the premium UI/UX.
* **Loris (Infrastructure & Identity Admin):** Handled the external Microsoft Test Environment. Configured the Microsoft Entra ID test tenant, set up Application API Permissions, and managed the initial Azure App Registrations required for OAuth flows. *(Note: Tenant management and API key rotation were later absorbed into the core platform administration).*

---

## 3. The Tech Stack & Architecture

We intentionally chose a bleeding-edge, enterprise-grade technology stack utilized by top Silicon Valley startups to achieve a perfect 100 Vercel Speed Insight score.

* **Framework:** Next.js 15 (App Router). Utilizing React Server Components and `<Suspense>` boundaries to securely fetch heavy database/Microsoft records on the server while streaming the UI instantly to the client.
* **Database:** PostgreSQL hosted on Supabase. Chosen for strict relational integrity, raw SQL power, and enterprise scalability.
* **ORM:** Drizzle ORM. Provides complete end-to-end type safety, preventing runtime crashes.
* **Hosting:** Vercel. Chosen for its seamless CI/CD pipeline, edge functions, and real-time Web Vitals analytics.
* **Email Delivery:** Resend. Used for transactional email automation (Welcome emails, Manager approvals).
* **Identity Provider:** Microsoft Graph API (Entra ID). Bypassing basic auth to hook directly into a company's Active Directory, making this a true B2B SaaS product.

---

## 4. Core System Architecture

The codebase is structured around four main pillars:

### Pillar 1: The Relational Schema (`db/schema.ts`)
The database utilizes Foreign Keys with `CASCADE` deletion and `ON CONFLICT DO UPDATE` constraints for self-healing operations.
* `users` & `organizationIntegrations`: Handles multi-tenant Auth and securely stores encrypted Microsoft OAuth credentials.
* `roleProfiles`: The HR templates. Maps a job title to default Microsoft licenses and Entra Groups.
* `hireRequests`: The approval staging ground. Holds pending employees until a manager signs off.
* `onboardingWorkflows` & `workflowTasks`: The living instances tracking IT/HR progress, calculating weighted completion percentages in real-time.

### Pillar 2: The "God-Mode" Provisioning Engine (`actions/hire-requests.ts`)
A strictly-typed Next.js Server Action that executes a 5-phase transactional pipeline:
1. **Creation:** Authenticates via `client_credentials` and creates the `userPrincipalName` in Entra ID.
2. **Licensing:** Parses dynamic form data and assigns Office 365 Subscribed SKUs via Graph API.
3. **Grouping:** Injects the new user's Object ID into specific Entra Security Groups.
4. **Database Upsert:** Safely writes the user to the Postgres database, generating a customized IT/HR task blueprint.
5. **Notification:** Fires a styled Resend HTML email to the new hire/manager with temporary login credentials.

### Pillar 3: Traffic Cop Routing & Streaming UI
The application uses intelligent routing at the dashboard level (`/app/dashboard/page.tsx`). 
* If an **Admin/IT** logs in, the server fetches global organizational stats, utilizing React `<Suspense>` to paint the shell instantly while heavily nested math (like overall progress ratios) streams in the background.
* If a **New Hire** logs in, the traffic cop intercepts the route and serves the `EmployeeDashboard` component—a visually distinct, interactive checklist and progress tracker.

### Pillar 4: Mission Control & Task Management
Tasks are flattened and filtered dynamically on the server based on `taskType`. 
The Global Pending Tasks page utilizes client-side JavaScript to perform "Urgency Math"—comparing the current date against the employee's start date to dynamically color-code and sort tasks (e.g., "Starts Today!", "Overdue by 2d") ensuring IT never misses a deadline.

---

## 5. Overcoming Engineering Challenges

1. **Vercel LCP (Largest Contentful Paint) Bottlenecks:** Initially, the New Hire Request form forced the server to wait for Microsoft Graph to return live licenses before rendering, resulting in a poor 62 Speed Score. **Solution:** Implemented React `<Suspense>` boundaries. The form shell renders instantly (0.01s), and the Microsoft checkboxes populate asynchronously, achieving a perfect 100 Vercel score.
2. **Duplicate Checkbox Rendering:** HR profiles contain default licenses, but the UI allowed admins to accidentally double-assign them in the "Overrides" section, risking Graph API errors. **Solution:** Built a dynamic `.filter()` engine in the Client Component that strips default profile arrays out of the live Microsoft arrays before rendering.
3. **Database Race Conditions & Ghost Users:** If the API crashed midway, half-provisioned users caused foreign key violations on retry. **Solution:** Engineered "Self-Healing" database queries using `.onConflictDoUpdate()` (Upserts) and bypassed buggy ORM migrations using direct SQL constraint injections via Supabase.

## 6. Conclusion
Harmony OP is a complex, event-driven automation engine. By combining Next.js Server Actions with Microsoft Entra ID's read/write capabilities, we built a zero-latency SaaS product that eliminates manual IT data entry, enforces HR compliance, and guarantees a flawless Day One experience for new employees.