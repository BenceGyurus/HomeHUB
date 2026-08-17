FROM node:22-bookworm-slim AS base

# Install runtime libraries needed by SQLite
RUN apt-get update && apt-get install -y libsqlite3-0 --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install build dependencies for native C++ addons (better-sqlite3)
FROM base AS deps
RUN apt-get update && apt-get install -y python3 make g++ gcc sqlite3 libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_WORKER_CONCURRENCY=1

RUN npm run build

# Production runtime image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV AUTH_TRUST_HOST="true"

COPY --from=builder /app/public ./public
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set the correct permission for prerender cache
RUN mkdir -p .next /app/data && chmod -R 777 /app/data

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
