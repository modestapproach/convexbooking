FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
RUN npm install -g corepack@latest && corepack enable

# ---- install deps ----
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY turbo.json ./
# Copy all workspace manifests so Yarn resolves the full dependency graph
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages
RUN yarn install

# ---- build ----
FROM deps AS builder
COPY . .

# NEXT_PUBLIC_* values are baked into the browser bundle. The guided setup
# writes app/.env.self-host (gitignored), which is sourced only for `next build`.
# Real secrets are injected at runtime through Cloudflare Worker secrets.
ARG NEXTAUTH_SECRET=placeholder-build-only-replaced-at-runtime
ARG CALENDSO_ENCRYPTION_KEY=placeholder-build-only

ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    CALENDSO_ENCRYPTION_KEY=$CALENDSO_ENCRYPTION_KEY \
    BUILD_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_DB_MIGRATIONS=1 \
    NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=6144

# Run next build directly — skips the sentry:release step in the npm script.
# copy-app-store-static first: turbo's `build` task depends on it, a raw
# `next build` does not, and the OG-image route imports the JSON it writes.
WORKDIR /app/apps/web
RUN test -f /app/.env.self-host || (echo "Missing app/.env.self-host; run pnpm self-host:configure" && exit 1)
RUN set -a && . /app/.env.self-host && set +a && yarn copy-app-store-static && yarn next build

# ---- runtime ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone output includes the server + all traced node_modules.
# outputFileTracingRoot (workspace root) ensures packages/* are included.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
