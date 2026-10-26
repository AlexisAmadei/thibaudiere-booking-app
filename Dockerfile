# syntax=docker/dockerfile:1

# One image, one process: the Hono server serves the built SPA and `/api` on $PORT.
# See docs/adr/0001-sqlite-node-server-on-dokploy.md.
# Bun is the package manager only; the server runs on Node.

# Keep in step with `packageManager` in package.json.
ARG BUN_VERSION=1.4.2

FROM oven/bun:${BUN_VERSION}-slim AS bun

FROM node:24-slim AS base
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

FROM base AS build
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM base AS prod-deps
COPY package.json bun.lock ./
# No compiler toolchain: better-sqlite3 loads its bundled N-API prebuild, and its
# `node-gyp rebuild` is left out of `trustedDependencies` in package.json.
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --production

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
# Mount the Dokploy volume at /app/data. The server creates the schema on first start.
ENV DATABASE_PATH=/app/data/thibaudiere.sqlite
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server ./server
# Owned by `node` so a fresh named volume mounted here inherits a writable directory.
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "server/index.ts"]
