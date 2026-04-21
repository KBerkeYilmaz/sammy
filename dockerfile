FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Prune to only what @sammy/web needs ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @sammy/web --docker

# ---- Install deps from pruned lockfile (cached until deps change) ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/full/packages/db/prisma ./packages/db/prisma/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN pnpm install --frozen-lockfile
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_APP_URL=https://sammy.berkeyilmaz.dev
RUN pnpm turbo run build --filter=@sammy/web

# ---- Production runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# standalone output is rooted at the monorepo root (outputFileTracingRoot)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Coolify/Traefik uses this to know the container is alive before routing traffic
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

ENV HOSTNAME=0.0.0.0
EXPOSE 3000
# With outputFileTracingRoot at monorepo root, server.js lives at apps/web/server.js
CMD ["node", "apps/web/server.js"]
