# Post-Mortem 002: Microsoft Tenant Integration & SSO Challenges

**Date:** 2026-03-16
**Authors:** Harmony OP Engineering

## Symptoms
- The "God-Mode" provisioning engine and the password reset features failed to authenticate with the Microsoft Graph API, returning `401 Unauthorized` or `403 Forbidden` errors.
- Tenant integration was the "painfullest thing", causing HR requests to stall in the "Pending" state without actually provisioning the users in Azure AD.

## Root Cause
Integrating with Microsoft Entra ID requires exact configuration of OAuth 2.0 Client Credentials flow. The failures stemmed from:
1. **Missing API Permissions:** The Azure App Registration did not have `User.ReadWrite.All`, `Directory.ReadWrite.All`, and `GroupMember.ReadWrite.All` permissions.
2. **Missing Admin Consent:** Even when permissions were added, they required a global admin to click "Grant admin consent for [Tenant]".
3. **Payload Formatting:** The token request to `https://login.microsoftonline.com/[tenant]/oauth2/v2.0/token` requires `application/x-www-form-urlencoded` payloads, but initial implementations may have used JSON.

## Resolution
1. **Infrastructure Adapter Update:** Created a robust `resetMicrosoftPasswordAction` (and similar actions in `hire-requests.ts`) that correctly fetched the `access_token` using URL encoded parameters.
2. **Clear Documentation:** Added explicit setup instructions to the `README.md` and the Settings dashboard, detailing the exact Azure portal steps (Registration -> Permissions -> Admin Consent).

## Lessons Learned
- **Fail Gracefully:** When Graph API integration fails, the system must catch the error, alert the Admin via the UI, and prevent the application from crashing.
- **Detailed Setup Guides:** Third-party integrations involving complex IAM (Identity and Access Management) require fool-proof, step-by-step UI guides to prevent misconfiguration.