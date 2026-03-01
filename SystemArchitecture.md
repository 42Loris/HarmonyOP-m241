# Project Documentation: Harmony OP

**Automated Enterprise Onboarding Platform**

## 1. Executive Summary: Why Harmony OP is Awesome

In the modern corporate world, the onboarding process is fundamentally broken. When a new employee is hired, it typically triggers a chaotic chain of emails between HR, IT, and Department Leads. Software licenses are forgotten, hardware is ordered late, and new hires spend their first two weeks doing nothing because they don't have access to their tools or scheduled intro meetings.

**Harmony OP solves this.** Harmony OP is a fully automated, event-driven onboarding engine. By deeply integrating with an enterprise's Microsoft Entra ID (Active Directory), the app acts as a bridge between HR and IT. When a user is added to a specific security group in Microsoft, Harmony OP automatically:

1. Detects the new hire and prevents duplicate entries.
2. Reads the company's predefined "Role Profiles" (e.g., Software Developer).
3. Generates a targeted Kanban board of tasks for IT and HR (e.g., "Order MacBook", "Assign GitHub License").
4. **The Masterpiece Feature:** Automatically schedules Microsoft Teams onboarding meetings via the Graph API, inviting the new hire, the internal team leaders, and even external specialists, placing it directly on their Outlook calendars.

Harmony OP doesn't just manage onboarding; it executes it. It ensures an employee is 100% operative within their first 1-2 weeks.

---

## 2. Team Structure & Contributions

To execute a project of this complexity, we divided the workload to mimic a real-world DevOps environment:

* **Dante Pangione (Master Developer & Mastermind):** Lead Software Engineer and Application Architect. Responsible for 100% of the codebase. Designed the database schema, built the Next.js frontend/backend, engineered the Microsoft Graph API sync pipeline, built the Server Actions, and designed the UI/UX.
* **Loris (Tenant & Infrastructure Admin):** Responsible for configuring the external Microsoft Test Environment. Handled the creation of the Microsoft Entra ID test tenant, set up basic security groups, and applied the necessary Application API Permissions (e.g., `Calendars.ReadWrite`, `Group.ReadAll`) based strictly on the backend system requirements provided by the Master Developer.

---

## 3. The Tech Stack & Architecture

We intentionally chose a bleeding-edge, enterprise-grade technology stack. This is the exact stack used by top Silicon Valley startups today.

* **Framework:** Next.js 15 (App Router). Chosen for its React Server Components, which allow us to securely fetch database records on the server without exposing API endpoints, making the app incredibly fast and secure.
* **Database:** PostgreSQL hosted on Supabase. Chosen for its strict relational integrity, raw SQL power, and enterprise scalability.
* **ORM (Object-Relational Mapper):** Drizzle ORM. Chosen over Prisma because it provides complete type-safety from the database all the way to the frontend UI, preventing runtime crashes.
* **Hosting:** Vercel. Chosen for its seamless CI/CD (Continuous Integration/Continuous Deployment) pipeline and serverless edge functions.
* **Integrations:** Microsoft Graph API (Entra ID / Office 365). Chosen because Microsoft owns the enterprise market. Bypassing basic email/password auth to hook directly into a company's Active Directory is what makes this a true B2B SaaS product.

---

## 4. Complete Codebase Explanation

The codebase is structured around three main pillars: The Schema, The Engine, and The Interface.

### Pillar 1: The Relational Schema (`db/schema.ts`)

The database is highly normalized and relational. It uses Foreign Keys with `CASCADE` deletion to ensure data integrity.

* `users` & `organizations`: The core actors. Multi-tenant architecture allows the app to theoretically scale to multiple companies.
* `roleProfiles`: The HR templates. It maps a job title (e.g., "Software Developer") to a specific `entraGroupId` from Microsoft.
* `profileTasks` & `profileMeetings`: The blueprints. These tables store what *should* happen when someone gets hired (e.g., specific hardware tasks, predefined Teams meeting templates).
* `onboardingWorkflows` & `workflowTasks`: The living instances. When a user is synced, the blueprints are cloned into these tables as active, trackable Kanban items.

### Pillar 2: The Sync Engine (`app/api/sync/route.ts`)

This is the brain of Harmony OP. It is a secure backend route that can be triggered manually by an Admin or automatically via a Vercel Cron Job.

1. **OAuth Authentication:** It securely requests a Bearer token from Microsoft using the `client_credentials` grant flow.
2. **Intelligent Fetching:** It maps our Postgres `roleProfiles` to Microsoft Security Groups, querying the Graph API for new members.
3. **Duplicate Protection:** It cross-references incoming Microsoft emails against our Postgres `users` table to ensure existing employees aren't re-onboarded.
4. **Data Instantiation:** It writes the new user into the database and generates their specific IT/HR tasks.
5. **Meeting Dispatch:** It takes the `profileMeetings` templates, calculates future dates, constructs a complex JSON payload, and POSTs it to Microsoft to generate automated Outlook Invites and Teams links for all required internal and external attendees.

### Pillar 3: Server Actions (`actions/profile-tasks.ts`, `profile-meetings.ts`)

Instead of using outdated REST APIs, we utilized Next.js Server Actions. When an HR Admin submits a form to add a new Meeting Template, the form natively calls a strictly-typed server function. This function uses Drizzle to securely `INSERT` or `DELETE` records in Supabase and then calls `revalidatePath()` to instantly update the UI without needing a page refresh.

### Pillar 4: The Interface (`app/app/profiles/[id]/page.tsx`)

The frontend is built with React, Tailwind CSS, and Lucide Icons. It focuses on a clean, scannable HR dashboard. It features split-view architecture: the left side dynamically maps existing database blueprints, while the right side contains smart forms for data entry. The Meeting Scheduler form contains distinct, categorized inputs (Leader, Internal Guests, External Guests) which the backend intelligently concatenates into a single database string.

---

## 5. Overcoming Engineering Challenges

The most difficult technical hurdle was mastering the Microsoft Graph API security boundaries.
Initially, scheduling meetings failed because the API rejected requests attempting to force external emails to "host" a meeting. Through deep architectural debugging, we realized Microsoft requires the `Organizer` to be a licensed internal tenant member.

**The Solution:** We engineered a system that separates the "Host" (an internal, licensed system account) from "Guests". The system intelligently parses a comma-separated list of internal experts and external specialists (like SAP trainers) and injects them all into the `attendees` array of the API payload. This allows Harmony OP to schedule meetings involving external contractors seamlessly while adhering to Microsoft's strict enterprise security rules.

## 6. Conclusion

Harmony OP is not a basic CRUD (Create, Read, Update, Delete) application. It is a complex, event-driven automation engine that solves a tangible business problem. By combining modern web frameworks (Next.js) with enterprise infrastructure (Microsoft Entra ID), we successfully built a SaaS product that significantly reduces HR manual labor, ensures IT compliance, and gets new hires operative from Day One.
