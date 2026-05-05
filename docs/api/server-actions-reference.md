# Server Actions API Reference

This document outlines the core Next.js Server Actions used in Harmony OP. Because we use React 19 Server Components and Actions, these functions are called directly from client components or form submissions, bypassing the need for traditional REST endpoints.

---

### `createHireRequestAction`

Processes a manager's request for a new hire, validates input, inserts it into the database as `PENDING`, and emails the HR/IT team.

**Location:** `actions/hire-requests.ts`
**Authentication:** Requires an authenticated Supabase user session.

**Input (`FormData`)**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | string | ✅ | UUID of the `roleProfiles` defining the job. |
| `firstName` | string | ✅ | Employee's given name. |
| `lastName` | string | ✅ | Employee's family name. |
| `personalEmail` | string | ✅ | Email used for initial communication before corporate email exists. |
| `isSpecialHire` | string | ❌ | `"on"` if true, otherwise undefined. |
| `msLicenses` | string[] | ❌ | Array of requested Microsoft 365 SKU parts. |
| `msGroups` | string[] | ❌ | Array of requested Microsoft Entra ID group names. |

**Response**
```typescript
// On Success
{ success: true }

// On Error
{ error: "Missing required fields" }
```

---

### `approveHireRequestAction`

The "God-Mode" provisioning engine trigger. Approves a request and initiates the 5-phase transaction to create the Microsoft Entra user, assign licenses, setup tasks, and email credentials.

**Location:** `actions/hire-requests.ts`
**Authentication:** Requires an authenticated Supabase user session with role `ADMIN` or `HR`.

**Input (`FormData`)**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | string | ✅ | UUID of the `hireRequests` to approve. |

**Response**
```typescript
// On Success
{ success: true }

// On Error (e.g., Microsoft Graph failure)
{ error: "Microsoft Integration missing. IT must connect tenant first." }
```

---

### `rejectHireRequestAction`

Cancels a pending hire request and updates its status to `REJECTED`.

**Location:** `actions/hire-requests.ts`
**Authentication:** Requires an authenticated Supabase user session with role `ADMIN` or `HR`.

**Input (`FormData`)**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | string | ✅ | UUID of the `hireRequests` to reject. |

**Response**
```typescript
// On Success
{ success: true }

// On Error
{ error: "Failed to reject request" }
```

---

### `resetMicrosoftPasswordAction`

Authenticates with Microsoft Graph to forcefully reset an employee's M365 password, generating a secure temporary password and emailing it to the employee's personal/recovery email.

**Location:** `actions/password-reset.ts`
**Authentication:** Requires an authenticated Supabase user session with role `ADMIN` or `HR`.

**Input**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employeeId` | string | ✅ | UUID of the user in the internal `users` table. |

**Response**
```typescript
// On Success
{ success: true, newPassword: "Reset!A1B2C" }

// On Error
{ error: "Unauthorized access. Only Admins and HR can reset passwords." }
```

---

### `toggleActionItemAction`

Updates the status of a specific task within an active onboarding workflow. Triggers revalidation of the UI.

**Location:** `actions/employee-actions.ts`
**Authentication:** Requires authenticated user. User must be assigned to the workflow, or be an `ADMIN`/`MANAGER`/`HR`.

**Input**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflowId` | string | ✅ | UUID of the `onboardingWorkflows`. |
| `itemKey` | string | ✅ | String identifier of the specific task item. |
| `completed` | boolean | ✅ | The new completion status. |

**Response**
```typescript
// On Success
{ success: true }

// On Error
{ error: "Task not found" }
```