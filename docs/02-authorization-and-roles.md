# Authorization Concept & Role-Based Access Control (RBAC)

**BLUF:** Harmony OP employs a strict, centralized Role-Based Access Control (RBAC) model. All data access and Server Actions are scoped both by a user's role and their hard-bound Organization ID (`orgId`), ensuring absolute multi-tenant data isolation.

## 1. RBAC Boundaries
- **System Admin (`ADMIN`):** Highest privilege level. Unrestricted access to organization settings, active directory integrations (Microsoft Graph credentials), full audit logs, and global task management. Can trigger and approve all hire/offboarding workflows.
- **Human Resources (`HR`):** High privilege level focused on personnel. Can initiate hire requests, view the organizational directory, approve role provisioning, and manage HR-specific onboarding tasks. Cannot alter tenant integrations or global security settings.
- **Information Technology (`IT`):** High privilege level focused on infrastructure. Can execute password resets, manage hardware provisioning workflows, and clear IT-specific access tasks.
- **Manager (`MANAGER`):** Mid-tier privilege. Can submit new hire requests for their specific department and view the status of their direct reports' onboarding workflows.
- **Employee (`EMPLOYEE`):** Lowest privilege level. Restricted exclusively to their own Onboarding Wizard and assigned tasks. Cannot view the directory, tasks of other users, or any system configurations.

## 2. Reviewer Guide: Full Lifecycle Testing
To evaluate the complete automated provisioning engine, please follow this test sequence using the provided reviewer credentials.

**Reviewer Credentials:**
- **URL:** [Insert Deployment URL]
- **Email:** `pulfer@harmony-op.me`
- **Password:** `[Insert Password]`
- **Role Assigned:** `ADMIN`

**Testing Steps:**
1. **Initiate Request:** Navigate to `/app/requests/new`. Submit a new hire request using a test name (e.g., "Test User"). Ensure you provide a valid personal email you can access.
2. **Approve & Provision:** Navigate to the **Requests** dashboard. Locate your pending request and click **Approve**.
   - *Behind the scenes:* The "God-Mode" engine will authenticate with Microsoft, physically create the user in the Azure tenant, assign licenses, and dispatch the welcome email via Resend.
3. **Verify Generation:** Check the inbox of the personal email provided in Step 1. You should receive the automated credentials.
4. **Task Management:** Navigate to the **Tasks** or **Profiles** dashboard to observe the generated onboarding workflow items for the new employee.