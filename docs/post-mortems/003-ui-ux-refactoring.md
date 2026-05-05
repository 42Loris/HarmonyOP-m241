# Post-Mortem 003: UI/UX Refactoring and Component Duplication

**Date:** 2026-03-05
**Authors:** Harmony OP Engineering

## Symptoms
- Profile pages (`/profiles/[id]`) had duplicate or misaligned "delete" buttons, confusing users.
- The dashboard cards had poor click targets, requiring users to click exactly on the text rather than the card itself.
- High layout shift and flashing during data fetching on the client side.

## Root Cause
1. **Component Refactoring:** During rapid prototyping, inline SVG trash icons were used. Later, a `DeleteIconButton` component was created, but the old inline buttons were left in the DOM, resulting in two delete buttons per list item.
2. **CSS Misconfiguration:** Link targets on dashboard cards were not utilizing absolute positioning to cover the card area (the "stretched link" pattern).
3. **Missing Suspense Boundaries:** Data fetching in Next.js Server Components was blocking the entire page render without intermediate loading states.

## Resolution
1. **Cleanup:** Removed duplicate inline SVGs and standardized on the single `<DeleteIconButton />` component, ensuring the HTML forms were structured correctly to pass hidden input IDs.
2. **Stretched Links:** Implemented the "stretched link" CSS pattern (`after:absolute after:inset-0`) to make the entire dashboard card clickable.
3. **Loading States:** Implemented Next.js `loading.tsx` files (e.g., `app/requests/loading.tsx` and `app/workflows/loading.tsx`) utilizing `lucide-react` spinners and Framer Motion for polished, zero-layout-shift perceived performance.

## Lessons Learned
- **Centralize UI Primitives:** Never inline interactive elements if a reusable component exists.
- **Always provide feedback:** Data fetching should always be wrapped in `<Suspense>` or a `loading.tsx` boundary so the user knows the application is working.