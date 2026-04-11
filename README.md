# Forge — AI-Optimized Next.js 16 Boilerplate

> The T3 stack, grown up. Full-stack Next.js 16 with Claude Code integration baked in from day one.

Forge is an opinionated boilerplate for developers who want to move fast without compromising on architecture. It takes everything that made [create-t3-app](https://create.t3.gg/) great — end-to-end type safety, a clean project structure, sane defaults — and extends it with a production-ready AI development workflow, an adapter-based config system, and Claude Code pre-configured and ready to use.

---

## Why Forge?

The T3 stack is a great starting point, but after a few projects you start feeling its edges. You're re-configuring the same Claude Code hooks every time. You're copy-pasting your auth setup. You're manually adding the same MCP servers to every repo. You're writing the same security rules into every CLAUDE.md.

Forge solves this by shipping that entire AI-native development environment as part of the boilerplate itself.

**What you get out of the box:**
- Next.js 16 App Router with `use cache`, Server Actions, and `proxy.ts`
- End-to-end type safety with tRPC v11 + Zod v4
- Prisma v7 with the adapter pattern (no driver config in schema)
- Better Auth — open-source, self-hostable, no vendor lock-in
- Tailwind v4 + shadcn/ui
- Claude Code fully pre-configured: CLAUDE.md, AGENTS.md, MCP servers, hooks, agents, slash commands, and skills
- Adapter-based architecture via `forge.config.ts` so you can toggle features without restructuring

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 | App Router, `use cache`, Server Actions, `proxy.ts` |
| Language | TypeScript (strict) | No `any`, full inference end-to-end |
| ORM | Prisma v7 | Mature ecosystem, adapter pattern, strong typing |
| API | tRPC v11 | End-to-end type safety, no REST boilerplate |
| Database | PostgreSQL | Reliable default, adapter pattern for flexibility |
| Auth | Better Auth | Open-source, self-hostable, feature-complete |
| Styling | Tailwind v4 + shadcn/ui | CSS-first config, accessible components |
| Animations | Motion (default) or GSAP | Configurable via `forge.config.ts` |
| Testing | Vitest + Playwright | Fast unit tests + full E2E coverage |
| Package manager | pnpm | Faster installs, strict hoisting |

---

## Quick Start

```bash
npx create-forge-app my-app
```

Pick your animation library when prompted, then:

```bash
cd my-app
cp .env.example .env
# Fill in DATABASE_URL and BETTER_AUTH_SECRET
pnpm db:push
pnpm dev
```

---

## Project Structure

```
forge/
├── src/
│   ├── app/                        # Next.js App Router
│   │   └── api/auth/[...all]/      # Better Auth handler
│   ├── server/
│   │   ├── api/routers/            # tRPC routers (one file per domain)
│   │   ├── api/trpc.ts             # publicProcedure / protectedProcedure
│   │   ├── better-auth/            # Auth config, client, server helpers
│   │   └── db.ts                   # Prisma client singleton
│   ├── components/                 # Shared UI (shadcn/ui lives in ui/)
│   ├── lib/forge.ts                # forge.config.ts type definitions
│   └── trpc/                       # tRPC React client setup
├── prisma/
│   └── schema.prisma               # Database schema
├── prisma.config.ts                # Prisma v7 datasource config
├── forge.config.ts                 # Adapter configuration — read this first
├── .claude/
│   ├── commands/                   # Custom slash commands
│   ├── agents/                     # Specialized sub-agents
│   ├── hooks/                      # Security & automation hooks
│   └── settings.json               # Hook configuration
├── .mcp.json                       # Pre-configured MCP servers
├── .next-docs/                     # Local Next.js 16 docs (for AGENTS.md)
├── CLAUDE.md                       # AI context for this project
└── AGENTS.md                       # Auto-generated Next.js 16 docs index
```

---

## The Adapter Pattern — `forge.config.ts`

Every optional feature in Forge is controlled through a single config file. Claude Code reads this to understand which libraries and patterns are active — so it writes Motion code vs GSAP code, not both.

```typescript
// forge.config.ts
import { defineConfig } from "~/lib/forge";

export default defineConfig({
  database: {
    adapter: "postgres",           // postgres | sqlite | turso (future)
  },
  animations: {
    default: "motion",             // "motion" | "gsap"
  },
  // storage: { adapter: "r2" },  // r2 | s3 | local (future)
  // jobs: { adapter: "inngest" }, // inngest | trigger.dev (future)
});
```

This is the first thing Claude Code reads before generating any code. When you scaffold a new feature, it will automatically use the right animation library, the right database patterns, and the right storage adapter based on your config.

---

## AI Setup

This is what makes Forge different from every other boilerplate.

### CLAUDE.md

The project-level AI context file. Under 200 lines, front-loaded with the most critical information. Includes:
- Project structure and key file paths
- Build, test, and dev commands
- The `forge.config.ts` adapter pattern (prominently documented)
- Security rules enforced at the instruction level
- A compressed Next.js 16 API index — function names mapped to local doc paths

The embedded docs index is based on [Vercel's agent evals research](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) (Jan 2026), which found that embedding a docs index directly in CLAUDE.md achieved a **100% pass rate** on Next.js 16 tasks vs 79% with skills. Claude reads the actual doc files before generating code rather than relying on stale training data.

### AGENTS.md

Auto-generated by Next.js's official `@next/codemod agents-md` tool. Contains the full Next.js 16 documentation index — every API, directive, and file convention mapped to a local doc file.

Re-generate when upgrading Next.js:
```bash
npx @next/codemod@canary agents-md --version 16.1.6 --output AGENTS.md
```

### Pre-configured MCP Servers (`.mcp.json`)

Five MCP servers ship with every Forge project:

| Server | Purpose |
|--------|---------|
| **context7** | Up-to-date docs for Next.js 16, Prisma v7, tRPC v11, Better Auth |
| **shadcn/ui** | Direct access to component registry — stops hallucinated component APIs |
| **GitHub** | PR and issue management from the terminal |
| **Playwright** | Browser automation and E2E test assistance |
| **Postgres** | Direct DB queries during development (with safety hooks) |

### Hooks (`.claude/hooks/`)

Hooks are shell scripts that run automatically at Claude Code lifecycle events. Unlike CLAUDE.md rules (advisory), hooks are **deterministic and guaranteed to execute**.

| Hook | Trigger | Purpose |
|------|---------|---------|
| `block-dangerous-commands.sh` | Before any Bash command | Blocks `rm -rf`, destructive SQL, force pushes to main, secret exposure |
| `protect-sensitive-files.sh` | Before any file edit | Blocks edits to `.env*`, `*.key`, `*.pem`, and hook files themselves |
| `typecheck-on-edit.sh` | After any file edit | Runs `tsc --noEmit` on save, surfaces type errors immediately |
| `desktop-notify.sh` | On Claude notification | Desktop notification when long tasks complete |

### Custom Agents (`.claude/agents/`)

Specialized sub-agents with scoped tools and system prompts:

- **security-auditor** — Read-only agent that audits for XSS, SQL injection, auth bypass, IDOR, CSRF, and missing input validation. Reports with severity levels and specific remediation steps.
- **reviewer** — Read-only code review agent. Checks quality, architecture, and Forge conventions.
- **test-writer** — Generates Vitest unit tests and Playwright E2E tests following Forge patterns.

### Custom Slash Commands (`.claude/commands/`)

Pre-built scaffolding commands for common Forge patterns:

```bash
/new-component     # React component + TypeScript types + test stub
/new-api-route     # tRPC router with typed procedures
/new-feature       # Full feature: component + API route + tests
/security-audit    # Run security-auditor agent against recent changes
/refactor-plan     # Analyze and plan before touching code
```

### Pre-installed Skills

Skills are packaged domain knowledge invocable with `/skill-name`.

**Addy Osmani's Web Quality Skills:**
- `/performance` — Load time and page speed optimization
- `/core-web-vitals` — LCP, INP, CLS optimization
- `/accessibility` — WCAG 2.1 compliance, screen readers, keyboard nav
- `/seo` — Meta tags, structured data, sitemaps
- `/web-quality-audit` — Comprehensive audit (all of the above)

**Vercel Agent Skills:**
- `/vercel-react-best-practices` — 40+ React/Next.js performance rules
- `/vercel-composition-patterns` — Compound components, state lifting
- `/web-design-guidelines` — UI/UX principles for production apps
- `/deploy-to-vercel` — Deployment config and edge functions

---

## Development

```bash
pnpm dev            # Start dev server (Turbopack)
pnpm build          # Production build
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright E2E
pnpm db:generate    # prisma migrate dev
pnpm db:push        # prisma db push (dev only)
pnpm db:studio      # Prisma Studio
```

---

## Auth Pattern

```typescript
// Server Components / API routes
import { auth } from "~/server/better-auth"
const session = await auth.api.getSession({ headers: await headers() })

// tRPC protected procedure
export const myRouter = createTRPCRouter({
  secret: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user // typed, guaranteed authenticated
  })
})

// Client-side
import { authClient } from "~/server/better-auth/client"
const { data: session } = authClient.useSession()
```

---

## Security

Security in Forge is enforced at multiple layers:

1. **Hooks** — deterministic blocking of dangerous commands and sensitive file edits
2. **CLAUDE.md rules** — advisory guidance for Claude Code on secure patterns
3. **Security agent** — on-demand audit with `/security-audit`
4. **Code conventions** — `protectedProcedure` for all mutations, Zod validation at boundaries, no raw SQL

The database MCP is intentionally connected to your dev database only. Never point it at production.

---

## Roadmap

- [x] Next.js 16 + tRPC v11 + Prisma v7 + Better Auth
- [x] Tailwind v4 + shadcn/ui
- [x] Full Claude Code setup (CLAUDE.md, AGENTS.md, MCP, hooks, agents, commands, skills)
- [x] Motion animation adapter
- [x] `create-forge-app` CLI with interactive setup (Motion / GSAP choice)
- [ ] GSAP animation adapter
- [ ] Background jobs adapter (Inngest / Trigger.dev)
- [ ] Storage adapter (R2 / S3 / local)
- [ ] Database options (SQLite / Turso for static/edge apps)
- [ ] Docker + CI/CD setup

---

## Contributing

Forge is opinionated by design. If you have suggestions that align with the project's goals — fast, AI-native, production-ready development — open an issue.

---

## Credits

Built on the shoulders of giants:
- [create-t3-app](https://create.t3.gg/) — the original inspiration
- [Better Auth](https://www.better-auth.com/) — auth without the lock-in
- [Vercel](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) — AGENTS.md research
- [Addy Osmani](https://skills.sh/addyosmani/web-quality-skills) — web quality skills
- [Vercel Labs](https://github.com/vercel-labs/agent-skills) — React/Next.js agent skills
