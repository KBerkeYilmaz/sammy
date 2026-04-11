---
description: Scaffold a complete feature (component + tRPC route + tests)
argument-hint: FeatureName
---

Scaffold a complete "$ARGUMENTS" feature following the Forge full-stack pattern.

**Steps:**
1. **Plan first** — Ask: What data does this feature need? What mutations does it perform? Does it require auth?

2. **Database** (if needed):
   - Add model to `prisma/schema.prisma`
   - Remind user to run `pnpm db:generate` after

3. **API layer** — Create tRPC router at `src/server/api/routers/[featureName].ts`:
   - Query procedures for reading data
   - Mutation procedures for writes
   - Proper auth guards

4. **UI layer** — Create component at `src/components/[FeatureName]/`:
   - Main feature component
   - Separate sub-components if needed
   - Loading and error states with Suspense

5. **Tests** — Create test files for both the router and component

6. **Summary** — List all created files and any manual steps (migrations, env vars, etc.)
