# ─── Build stage ─────────────────────────────────────────────────────────────
# Builds the React SPA with Vite
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# Workspace manifests — cached layer
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Source code
COPY apps/web/ ./apps/web/

# In production nginx proxies /api → api:3001, so the URL is relative
ENV VITE_API_URL=/api

WORKDIR /app/apps/web
RUN pnpm build

# ─── Runtime stage (nginx) ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Static files produced by Vite
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Nginx config: serves SPA, proxies /api, handles SSL
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
