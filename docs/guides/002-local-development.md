# Harmony OP Developer Onboarding

> **Time:** ~10 minutes | **Difficulty:** Beginner

This guide provides the step-by-step process for getting the Harmony OP codebase running on your local development machine.

## Prerequisites
- [ ] Node.js (v20+) and npm (v10+) installed.
- [ ] Git installed.
- [ ] A local or remote PostgreSQL database (Supabase recommended).
- [ ] A Resend API key for local email testing.

## Steps

### 1. Clone the Repository
Pull the latest code to your local machine.
```bash
git clone https://github.com/your-org/harmony-op.git
cd harmony-op
npm install
```
✅ Expected: `node_modules` is populated without major errors.

### 2. Configure Environment Variables
Set up your local environment configuration.
1. Copy the example environment file (if available) or create a new `.env.local` file in the root directory.
2. Populate the required keys:

```env
# Database (Drizzle / Postgres)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Email
RESEND_API_KEY=re_[YOUR_KEY]

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Synchronize Database Schema
Push the Drizzle ORM schema to your development database.
```bash
npx drizzle-kit push
```
✅ Expected: Drizzle confirms the schema is in sync with no errors.
⚠️ If you see a connection error, verify your `DATABASE_URL` format and network access.

### 4. Start the Development Server
Launch the Next.js application.
```bash
npm run dev
```
✅ Expected: Terminal output indicates the server is running on `http://localhost:3000`.

## Verify It Works
1. Open `http://localhost:3000` in your web browser.
2. You should see the login screen or dashboard. 
3. Open the Drizzle database explorer by running `npx drizzle-kit studio` in a separate terminal to verify tables exist.

## Development Workflows

### Database Changes
If you modify `db/schema.ts`, you must push the changes to your local database:
```bash
npx drizzle-kit push
```

### Type Checking & Linting
Run these before submitting a Pull Request:
```bash
npm run lint    # Checks for ESLint errors
npx tsc --noEmit # Validates TypeScript types
```