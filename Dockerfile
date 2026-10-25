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
# Toolchain for native modules (better-sqlite3) when no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --production

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server ./server
USER node
EXPOSE 3000
CMD ["node", "server/index.ts"]
