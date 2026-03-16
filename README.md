# Harmony OP

Harmony OP is an enterprise-grade, automated Employee Onboarding and Provisioning platform. It bridges the gap between IT, HR, and Management by directly integrating with Microsoft Entra ID (Active Directory) to automate role-based access, hardware provisioning, and Microsoft 365 licensing the moment a hire is approved.

## Key Features

* **"God-Mode" Auto-Provisioning:** Creates users directly in Microsoft Entra, assigns secure temporary passwords, attaches 365 licenses, and joins security groups automatically.
* **Smart HR Request Forms:** Dynamic forms that pull live Microsoft tenant data and filter out duplicate license assignments based on predefined role templates.
* **Mission Control Kanban:** Unified task boards for IT and HR featuring "Urgency Math" that sorts pending setups based on the employee's start date.
* **The "Digital Red Carpet":** A dedicated, interactive Employee Dashboard providing new hires with an IT progress tracker and actionable Day 1 checklists.
* **Automated Email Delivery:** Seamlessly dispatches welcome packages and manager approval notifications using Resend.
* **Blazing Fast UI:** Achieves perfect Vercel Speed Insight scores using React 19 `<Suspense>` streaming boundaries.

## Tech Stack

* **Framework:** Next.js 15 (App Router, React 19)
* **Database:** PostgreSQL hosted on Supabase
* **ORM:** Drizzle ORM
* **Authentication:** Supabase Auth & Microsoft OAuth2
* **Email:** Resend API
* **Styling:** Tailwind CSS, Lucide Icons, shadcn/ui
* **Deployment:** Vercel
