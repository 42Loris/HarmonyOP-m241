# ADR-002: Supabase Auth and Drizzle ORM

**Status:** Accepted
**Date:** 2026-05-04
**Authors:** Harmony OP Engineering

## Context
The platform must securely support multiple organizations (Multi-Tenancy) with strict data isolation. We need a relational database to track complex workflows (Hire Requests -> Onboarding Workflows -> Profile Tasks), and an ORM that provides end-to-end type safety.

## Decision
We chose Supabase (PostgreSQL + Auth) paired with Drizzle ORM.

## Options Considered

### Option A: Supabase + Drizzle ORM
- **Pros:** Drizzle provides SQL-like syntax with absolute TypeScript safety. Supabase offers a robust hosted Postgres instance with built-in Auth, simplifying tenant management.
- **Cons:** Drizzle's migration system (`drizzle-kit`) requires strict management of schema changes.

### Option B: MongoDB + Prisma
- **Pros:** Flexible schema design, Prisma's easy-to-use client.
- **Cons:** Relational integrity is harder to enforce in MongoDB. Prisma's heavy client bundle size impacts edge/serverless performance compared to Drizzle.

## Consequences
- **Easier:** Enforcing multi-tenant security (`orgId`) directly in our SQL queries using Drizzle's typed conditions (`eq`, `and`).
- **Harder:** Database schema migrations require careful execution (`npx drizzle-kit push`) and synchronized updates to the `schema.ts`.
- **Monitor:** Potential duplicate schema declarations or foreign key cascade issues during rapid development.

## References
- `db/schema.ts`
- Drizzle ORM Documentation