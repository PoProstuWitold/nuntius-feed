FROM node:jod-alpine AS base

# ----------------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat tzdata curl \
    && npm install -g pm2

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# ----------------------------
FROM base AS builder
WORKDIR /app

ENV BUILD_PHASE=true
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# ----------------------------
FROM base AS runner
WORKDIR /app

ENV DOCKER=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3006
ENV HOSTNAME="0.0.0.0"
ENV TZ=Europe/Warsaw

RUN apk add --no-cache libc6-compat tzdata curl \
    && npm install -g pm2

RUN addgroup --system --gid 1001 nuntius
RUN adduser --system --uid 1001 nuntius

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nuntius:nuntius /app/.next/standalone ./
COPY --from=builder --chown=nuntius:nuntius /app/.next/static ./.next/static

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nuntius

EXPOSE 3006

# healthcheck
ENV HEALTHCHECK_URL=http://localhost:3006/api/health
HEALTHCHECK --interval=120s --timeout=10s --start-period=30s --retries=3 \
CMD curl --fail --silent --show-error "$HEALTHCHECK_URL" >/dev/null || exit 1

CMD ["./entrypoint.sh"]
