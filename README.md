# Harmony OP

> Enterprise-grade, automated Employee Onboarding and Provisioning platform bridging the gap between IT, HR, and Management.

## Overview

In the modern corporate world, onboarding is often broken, triggering chaotic chains of emails, manual data entry, forgotten software licenses, and new hires spending their first week locked out of tools.

Harmony OP solves this by completely automating the IT and HR pipeline. It is not just an observer; it is an active provisioning engine. Deeply integrated with Microsoft Entra ID (Active Directory) and built on a bleeding-edge Next.js architecture, Harmony OP guarantees a flawless Day One experience for new employees while eliminating manual IT data entry and enforcing HR compliance.

## Key Features

- **"God-Mode" Provisioning Engine:** Upon manager approval, Harmony OP authenticates with Microsoft, physically creates the user in the Azure tenant, assigns a secure temporary password, attaches specific 365 licenses, and adds them to Entra Security Groups.
- **Dynamic Role Profiles:** Maps a job title to default Microsoft licenses, Entra Groups, and automated IT/HR tasks.
- **Multi-Tenant Architecture:** Securely supports multiple organizations with strict data isolation.
- **Mission Control Task Boards:** Kanban-style task boards with "Urgency Math" for deadline tracking across IT and HR departments.
- **Onboarding Wizard:** A visually rich, multi-step interactive employee dashboard to guide new hires through their first day.
- **Automated Notifications:** Dispatches welcome emails via Resend with new corporate credentials.
- **Security Audit Logs:** An immutable, read-only record of critical platform actions.

## Architecture & Tech Stack

Built for enterprise scale with a perfect 100 Vercel Speed Insight score.

- **Framework:** Next.js 15 (App Router) with React 19 features (Server Components, Server Actions, `<Suspense>` streaming).
- **Database:** Multi-tenant PostgreSQL hosted on Supabase.
- **ORM:** Drizzle ORM for complete end-to-end type safety.
- **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons, `next-themes` for system-aware Dark Mode.
- **Integrations:**
  - **Microsoft Graph API:** For direct Entra ID (Active Directory) provisioning via a dedicated infrastructure adapter (`MicrosoftGraphService`).
  - **Supabase Auth:** For platform authentication.
  - **Resend:** For transactional email delivery.

## Security & Privacy

Harmony OP is built with a security-first mindset:

- **Strict Multi-Tenancy:** All database queries and server actions strictly enforce `orgId` isolation, preventing cross-tenant data access.
- **Role-Based Access Control (RBAC):** Critical provisioning actions (Hire Requests, Task Updates, Offboarding) are restricted to authorized `ADMIN` and `HR` roles.
- **Protected Onboarding Checklists:** Task toggles are restricted exclusively to the assigned new hire or authorized organization administrators.
- **Repository Privacy:** Internal AI configurations, architectural blueprints, and sensitive schemas are explicitly untracked via `.gitignore` to maintain operational privacy in public repositories.

## Quick Start

Get the local development server running in under 5 minutes.

### Prerequisites

- Node.js (v20+)
- npm (v10+)
- A Supabase Project
- Microsoft Entra ID (Azure AD) Tenant credentials
- Resend API Key

### Installation

1. **Clone and install dependencies:**
```bash
git clone https://github.com/your-org/harmony-op.git
cd harmony-op
npm install
```

2. **Configure environment variables:**
Create a `.env.local` file in the root directory and add the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. **Push the database schema:**
```bash
npx drizzle-kit push
```

4. **Start the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration: Microsoft Entra ID Setup

For the provisioning engine to work, you must configure a Microsoft Entra ID Application:

1. Go to the **Microsoft Entra admin center**.
2. Navigate to **Applications** > **App registrations** > **New registration**.
3. Set **Supported account types** to "Accounts in this organizational directory only (Single tenant)".
4. Grant **Admin Consent** for the following API Permissions:
   - `User.ReadWrite.All`
   - `GroupMember.ReadWrite.All`
   - `Directory.ReadWrite.All`
5. Generate a **Client Secret**.
6. Enter the **Tenant ID**, **Client ID**, and **Client Secret** in the Harmony OP Settings dashboard (`/app/settings`).

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the local Next.js development server. |
| `npm run build` | Builds the application for production. |
| `npm run start` | Runs the built production server. |
| `npm run lint` | Runs ESLint to check for code quality and style issues. |
| `npm run test` | Runs the Vitest test suite. |
| `npx drizzle-kit studio` | Opens a local Drizzle database explorer. |

## Contributing

1. **Create a branch:** `git checkout -b feature/my-feature`
2. **Commit your changes:** Use Conventional Commits (e.g., `feat: add new dashboard widget`).
3. **Run tests:** Ensure `npm run test` and `npm run lint` pass successfully.
4. **Push and PR:** Push to your branch and open a Pull Request against `main`.

## License

[MIT License](LICENSE)