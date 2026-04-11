---
description: Scaffold a new tRPC router with typed procedures
argument-hint: routerName
---

Create a new tRPC router named "$ARGUMENTS" following Forge conventions.

**Steps:**
1. Create `src/server/api/routers/[routerName].ts` with:
   - `createTRPCRouter` import from `~/server/api/trpc`
   - At minimum: one `publicProcedure` and one `protectedProcedure` example
   - Zod v4 input validation schemas
   - Prisma db calls via `ctx.db`
   - Auth check via `ctx.session` in protected procedures

2. Register in `src/server/api/root.ts`:
   - Import the new router
   - Add to `appRouter`

3. Show the user the created files and how to call the procedure from the client using `api.[routerName].[procedureName].useQuery()`.
