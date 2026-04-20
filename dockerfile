FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_APP_URL=https://sammy.berkeyilmaz.dev
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Coolify/Traefik uses this to know the container is alive before routing traffic
# wget is available in alpine; curl is not
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

EXPOSE 3000
CMD ["node", "server.js"]
