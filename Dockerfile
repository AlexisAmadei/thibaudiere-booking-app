# syntax=docker/dockerfile:1

# One image, one process: the Hono server serves the built SPA and `/api` on $PORT.
# See docs/adr/0001-sqlite-node-server-on-dokploy.md.

FROM node:24-slim AS base
ARG PNPM_VERSION=12.15.0
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS prod-deps
# Toolchain for native modules (better-sqlite3) when no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json pnpm-workspace.yaml ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server ./server
USER node
EXPOSE 3000
CMD ["node", "server/index.ts"]
