# Harmony OP: Engineering Context

Harmony OP is an enterprise-grade, automated Employee Onboarding and Provisioning platform. It bridges the gap between IT, HR, and Management by integrating with Microsoft Entra ID (Active Directory) to automate role-based access, hardware provisioning, and Microsoft 365 licensing.

## Project Overview

- **Purpose:** Automate the entire IT and HR pipeline for new hires, from request approval to Microsoft Entra user creation and task management.
- **Architecture:** Next.js 15 (App Router) with React 19 features (Server Components, Server Actions, `<Suspense>` streaming).
- **Database:** Multi-tenant PostgreSQL hosted on Supabase, managed via Drizzle ORM.
- **Integrations:** 
  - **Microsoft Graph API:** For direct Entra ID (Active Directory) provisioning.
  - **Supabase Auth:** For platform authentication.
  - **Resend:** For transactional email delivery.
- **Key Pillars:**
  - **Provisioning Engine:** Server Actions in `actions/hire-requests.ts` that handle the multi-phase Entra ID setup.
  - **Relational Schema:** Highly normalized schema in `db/schema.ts` supporting multi-tenancy and complex workflow tracking.
  - **Mission Control:** Kanban-style task boards with "Urgency Math" for deadline tracking.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Database & Auth:** Supabase (Postgres, Auth)
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Email:** Resend API
- **Monitoring:** Vercel Analytics & Speed Insights

## Building and Running

### Development
- `npm install`: Install dependencies.
- `npm run dev`: Start the local development server.
- `npx drizzle-kit push`: Sync database schema changes to the Supabase instance.
- `npx drizzle-kit studio`: Visual database explorer.

### Production
- `npm run build`: Build the application for production.
- `npm run start`: Run the production build.
- `npm run lint`: Run ESLint for code quality checks.

### Environment Variables
The project requires several environment variables, typically stored in `.env.local`:
- `DATABASE_URL`: PostgreSQL connection string.
- `RESEND_API_KEY`: API key for email delivery.
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase configuration.
- Microsoft Graph API credentials (Tenant ID, Client ID, Client Secret).

## Development Conventions

- **Server-First Logic:** Prefer React Server Components for data fetching and Server Actions for mutations.
- **Type Safety:** Strict TypeScript usage and Zod schemas for validation.
- **UI Performance:** Utilize React `<Suspense>` boundaries to maintain high performance and perfect Web Vitals scores.
- **Database Integrity:** Use Drizzle ORM for type-safe queries and leverage PostgreSQL constraints (Foreign Keys, Cascades, Upserts).
- **Naming Conventions:** Standard camelCase for variables/functions, PascalCase for components.
- **Styling:** Adhere to Tailwind CSS and shadcn/ui patterns for consistency.

## Custom Subagents

The following specialized agents are configured in `.gemini/agents/` and can be invoked using `@agent-name`:

- `@code-reviewer`: For code review, refactoring, and improving code quality in Next.js/React components and server actions.
- `@qa-tester`: To write, run, and debug automated tests, or perform linting (`npm run lint`) and type-checking.
- `@db-api-agent`: Strictly for modifying database schemas (`db/schema.ts`), Drizzle ORM queries, and API routes.
- `@git-agent`: To handle Git workflows, check status, create branches, commit changes, and review diffs.
- `@entra-provisioner`: For domain logic related to Microsoft Entra ID integrations, Graph API, and user provisioning.

## Automated Skills

The following skills are configured in `.gemini/skills/` and will be automatically utilized by Gemini CLI when relevant:

- **nextjs-conventions:** Enforces Next.js 15, React 19, Server Action, and Tailwind CSS architectural patterns.
- **provisioning-workflow:** Details the strict 5-phase transactional logic for the Microsoft Entra ID "God-Mode" provisioning engine.
- **harmony-onboarding:** Provides a high-level system architecture overview to onboard new agents or developers to the codebase.

## MCP Server Integrations

The project is configured to use the following MCP (Model Context Protocol) servers in `.gemini/settings.json`:

- **@supabase/mcp-server-supabase**
- **@modelcontextprotocol/server-postgres**

*(Note: These are configured to run via `npx`, so no global installation is strictly required. They will utilize the `DATABASE_URL` environment variable).*
