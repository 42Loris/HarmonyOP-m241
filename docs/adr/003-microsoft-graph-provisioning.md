# ADR-003: Microsoft Graph API for Provisioning

**Status:** Accepted
**Date:** 2026-05-04
**Authors:** Harmony OP Engineering

## Context
The core value proposition of Harmony OP is eliminating manual IT data entry. When an HR manager approves a hire, the system must immediately and physically create the user account in the organization's identity provider, assign licenses, and generate credentials. 

## Decision
We decided to integrate directly with the Microsoft Graph API using OAuth 2.0 Client Credentials (a "God-Mode" backend integration) rather than relying on third-party automation tools like Zapier or Make.

## Options Considered

### Option A: Direct Microsoft Graph API Integration
- **Pros:** Full control over user creation, password resets, and Entra ID (Azure AD) group assignments. Lowest latency and no third-party data privacy concerns.
- **Cons:** Highly complex authentication setup (Tenant ID, Client ID, Client Secret) and strict API Permission requirements (`User.ReadWrite.All`, etc.).

### Option B: Third-party Automation (Zapier / Make.com)
- **Pros:** Faster initial setup and visual workflow builders.
- **Cons:** Brittle, expensive at scale, and introduces security compliance risks by giving a third party access to Active Directory creation.

## Consequences
- **Easier:** Managing the entire provisioning lifecycle entirely within our codebase (`actions/hire-requests.ts`).
- **Harder:** The initial setup for the user (Tenant Configuration) is painful and requires admin consent in the Azure Portal.
- **Monitor:** Token expiration, Microsoft API rate limits, and securing the `clientSecret` in our database.

## References
- Microsoft Graph API Documentation
- `lib/infrastructure/microsoft-graph.ts`