---
description: Scaffold a new React component with TypeScript types and a test stub
argument-hint: ComponentName [--server] [--page]
---

Create a new component named "$ARGUMENTS" following Forge conventions.

**Steps:**
1. Determine location:
   - Default: `src/components/[ComponentName].tsx`
   - If `--server` flag: server component (no `"use client"`)
   - If `--page` flag: `src/app/[route]/page.tsx`

2. Create the component file with:
   - Proper TypeScript interface for props
   - Export default function
   - `"use client"` directive only if it uses hooks/event handlers
   - shadcn/ui imports if using UI primitives

3. Create a co-located test file `[ComponentName].test.tsx` with:
   - One render test (smoke test)
   - One behavior test (if component has interaction)

4. Show the user what was created and any next steps.
