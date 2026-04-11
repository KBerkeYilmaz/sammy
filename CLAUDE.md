# Forge — AI-Optimized Next.js 16 Boilerplate

**Stack:** Next.js 16 · tRPC v11 · Prisma v7 · Better Auth · Tailwind v4 · shadcn/ui · TypeScript strict · pnpm

## Key Commands
```
pnpm dev            # Start dev server (Turbopack)
pnpm build          # Production build
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright E2E
pnpm db:generate    # prisma migrate dev (requires DATABASE_URL)
pnpm db:push        # prisma db push
pnpm db:studio      # Prisma Studio
```

## Project Structure
```
src/
├── app/                        # Next.js App Router (pages, layouts, API routes)
│   └── api/auth/[...all]/      # Better Auth handler
├── server/
│   ├── api/routers/            # tRPC routers (one file per domain)
│   ├── api/trpc.ts             # publicProcedure / protectedProcedure
│   ├── better-auth/            # auth config, client, server helpers
│   └── db.ts                   # Prisma client singleton
├── components/                 # Shared UI components
├── lib/forge.ts                # forge.config.ts type definitions
└── trpc/                       # tRPC React client setup
prisma/schema.prisma            # Prisma schema (postgresql)
prisma.config.ts                # Prisma v7 datasource config
forge.config.ts                 # Adapter configuration (read before generating code)
```

## forge.config.ts — Read This First
Before writing code, check `forge.config.ts` to understand active adapters:
```typescript
// forge.config.ts controls which patterns to use:
// database.adapter → which ORM patterns apply
// animations.default → "motion" = use Motion library
// jobs.adapter → "inngest" | "trigger.dev"
// storage.adapter → "r2" | "s3" | "local"
```

## Auth Pattern (Better Auth)
```typescript
// Server-side session check (Server Components / API routes)
import { auth } from "~/server/better-auth"
const session = await auth.api.getSession({ headers: await headers() })

// tRPC protected procedure (already set up in trpc.ts)
export const myRouter = createTRPCRouter({
  secret: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user // typed, guaranteed authenticated
  })
})

// Client-side
import { authClient } from "~/server/better-auth/client"
const { data: session } = authClient.useSession()
```

## tRPC Pattern
```typescript
// Add to src/server/api/routers/[name].ts
export const myRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(({ ctx, input }) => ctx.db.myModel.findMany({ take: input.limit })),
})
// Register in src/server/api/root.ts
```

## Next.js 16 API Index
IMPORTANT: Prefer retrieval-led reasoning — read the referenced Next.js docs before generating code.

| API | What it does | Docs |
|-----|-------------|------|
| `'use cache'` | Cache Server Component / function output | https://nextjs.org/docs/app/api-reference/directives/use-cache |
| `cacheLife()` | Set cache lifetime (`"hours"`, `"days"`, custom profile) | https://nextjs.org/docs/app/api-reference/functions/cacheLife |
| `cacheTag()` | Tag cache entry for targeted invalidation | https://nextjs.org/docs/app/api-reference/functions/cacheTag |
| `revalidateTag()` | Invalidate cache by tag (Server Action / Route Handler) | https://nextjs.org/docs/app/api-reference/functions/revalidateTag |
| `connection()` | Force dynamic rendering (like `noStore()`) | https://nextjs.org/docs/app/api-reference/functions/connection |
| `forbidden()` | Return 403 response from Server Component | https://nextjs.org/docs/app/api-reference/functions/forbidden |
| `unauthorized()` | Return 401 response from Server Component | https://nextjs.org/docs/app/api-reference/functions/unauthorized |
| `cookies()` | Async: `const c = await cookies()` | https://nextjs.org/docs/app/api-reference/functions/cookies |
| `headers()` | Async: `const h = await headers()` | https://nextjs.org/docs/app/api-reference/functions/headers |
| `after()` | Run work after response is sent | https://nextjs.org/docs/app/api-reference/functions/after |
| `Suspense` | Wrap async Server Components for streaming | https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming |

## Security Rules
- NEVER hardcode secrets — use env vars validated in `src/env.js`
- ALL user inputs must be validated with Zod v4 before processing
- ALL API mutations must check auth via `protectedProcedure` or `auth.api.getSession()`
- NEVER log tokens, passwords, or PII
- NEVER use `$queryRaw` without parameterization — prefer Prisma model methods
- ALL file uploads must validate type, size, and MIME content
- Rate-limit all public API endpoints

## Code Conventions
- TypeScript strict — no `any`, prefer `unknown` with type guards
- Server Components by default; add `"use client"` only when needed (hooks, event handlers)
- Co-locate tests: `Component.tsx` + `Component.test.tsx`
- Import alias: `~/` maps to `src/`
- shadcn/ui components live in `src/components/ui/`
- Zod schemas defined close to where they're used, exported if reused

## Verification Checklist
Before marking a task complete:
1. `pnpm typecheck` passes
2. `pnpm build` succeeds (or at minimum no new errors)
3. New code has at least one test
4. No hardcoded secrets or env vars in code

## Available Skills (invoke with /skill-name)

**Next.js & React (Vercel)**
- `/vercel-react-best-practices` — 40+ performance rules, eliminating waterfalls, bundle size
- `/vercel-composition-patterns` — Compound components, state lifting, composition patterns
- `/web-design-guidelines` — UI/UX design principles for production apps
- `/deploy-to-vercel` — Deployment config, environment setup, edge functions

**Web Quality (Addy Osmani)**
- `/performance` — Load time, Core Web Vitals optimization
- `/core-web-vitals` — LCP, INP, CLS — page experience signals
- `/accessibility` — WCAG 2.1, screen readers, keyboard nav
- `/seo` — Meta tags, structured data, sitemaps
- `/web-quality-audit` — Comprehensive audit (all of the above)

**Forge Custom**
- `/new-component` — Scaffold component + test
- `/new-api-route` — tRPC router + procedure
- `/new-feature` — Full feature scaffold
- `/security-audit` — Run security auditor agent
- `/refactor-plan` — Analyze before touching code

**Next.js 16 Docs:** See AGENTS.md — full API index with local doc files in `.next-docs/`

---

## Sammy — Project Identity

**Sammy** is a GovCon Opportunity Intelligence demo for a co-founder interview at cleat.ai (CLEATUS). It ingests SAM.gov federal contract opportunities, embeds them with AWS Bedrock Titan, stores vectors in pgvector, and exposes a RAG chat interface (persona: **Scout**) powered by Claude Sonnet via Bedrock.

**Demo goal:** walk into the interview with a working MVP that mirrors cleat.ai's core pipeline.

**Priority order (if time-constrained):**
1. Chat UI with RAG streaming — must have
2. Deploy to Vercel + Neon — should have
3. Opportunity Explorer page — nice to have
4. Admin panel — skip if needed

---

## Sammy — Data Models

Three models live in `prisma/schema.prisma` (in addition to Better Auth models):

| Model | Purpose |
|-------|---------|
| `Opportunity` | Raw SAM.gov opportunity data. `noticeId` is the unique external key. |
| `OpportunityChunk` | Text chunks derived from an Opportunity. Has a `embedding vector(1024)` column added via raw SQL (not in schema). |
| `ChatSession` | Persists chat history as a JSON array of messages. |

**pgvector column** — NOT in Prisma schema. Added manually after `pnpm db:push`:
```bash
psql $DATABASE_URL -f prisma/migrations/add_pgvector.sql
```

---

## Sammy — AWS Bedrock Service

Location: `src/server/bedrock.ts`

```typescript
import { embedText, chatCompletion } from "~/server/bedrock"

// Embed a string → float[1024]
const embedding = await embedText("cybersecurity contract DoD")

// Stream a RAG response
const stream = await chatCompletion(SCOUT_SYSTEM_PROMPT, messages)
```

- **Embeddings model:** `amazon.titan-embed-text-v2:0` (1024 dims, normalized)
- **Chat model:** `anthropic.claude-sonnet-4-20250514-v1:0` (streaming via `InvokeModelWithResponseStreamCommand`)
- **Credentials:** read from `env.AWS_ACCESS_KEY_ID`, `env.AWS_SECRET_ACCESS_KEY`, `env.AWS_REGION`

---

## Sammy — SAM.gov API

**Base URL:** `https://api.sam.gov/prod/opportunities/v2/search`
**Auth:** `?api_key={SAM_GOV_API_KEY}` query param
**Rate limit:** 10 req/day — batch-pull and store; NEVER query live during demo

Key params: `limit`, `offset`, `postedFrom`/`postedTo` (MM/DD/YYYY), `ptype` (o/p/k/a), `naicsCode`, `deptname`

**Important:** `description` field in the response is a URL to a file, not inline text. Use `title + department + type + naicsCode + solicitationNumber` as the chunk text.

---

## Sammy — Scout System Prompt

```
You are Scout, a government contracting intelligence assistant. You help users discover, analyze, and understand federal contract opportunities from SAM.gov.

You have access to a database of recent federal contract opportunities. When answering questions:
1. Always ground your answers in the actual opportunity data provided as context
2. Cite specific opportunities by title and solicitation number
3. If the data doesn't contain relevant opportunities, say so clearly
4. Help users understand procurement types, NAICS codes, set-asides, and deadlines
5. Flag approaching deadlines proactively

You are NOT a lawyer. You ARE a research assistant helping users navigate the federal marketplace.
```

---

## Sammy — Environment Variables

Add to `.env` (and register in `src/env.js` under `server`):

```env
SAM_GOV_API_KEY=your_sam_gov_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
```

---

## Sammy — tRPC Routers

| Router | File | Key procedures |
|--------|------|---------------|
| `opportunities` | `src/server/api/routers/opportunities.ts` | `list` (paginated + filtered), `getById` |
| `ingest` | `src/server/api/routers/ingest.ts` | `trigger` (SAM.gov fetch + embed), `stats` |
| `chat` | `src/server/api/routers/chat.ts` | `send` (RAG pipeline), `sessions` |
