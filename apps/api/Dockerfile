# ─── Build stage ─────────────────────────────────────────────────────────────
# Installs all deps, generates Prisma client, compiles TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# Workspace manifests — cached layer, invalidated only when deps change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Source code
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN pnpm prisma generate && pnpm build

# ─── Runtime stage ────────────────────────────────────────────────────────────
# Contains compiled JS + dependencies only (no TypeScript sources)
FROM node:20-alpine AS runner
WORKDIR /app

# pnpm virtual store — includes prisma CLI (needed for migrate deploy)
COPY --from=builder /app/node_modules          ./node_modules
# api-local node_modules: symlinks to virtual store + generated .prisma/client
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
# Compiled NestJS output
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
# Prisma schema — required by `prisma migrate deploy` at startup
COPY --from=builder /app/apps/api/prisma       ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Entrypoint: runs migrations then starts the server
COPY apps/api/entrypoint.sh ./apps/api/
RUN chmod +x ./apps/api/entrypoint.sh

EXPOSE 3001
WORKDIR /app/apps/api
ENTRYPOINT ["./entrypoint.sh"]
