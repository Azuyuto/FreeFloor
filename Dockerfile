FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# Railway nadpisuje PORT w runtime — nie ustawiaj tu stałej wartości.

# sharp (next/image) na Alpine
RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

RUN mkdir -p public/categories public/avatars public/sounds && \
    chown -R nextjs:nodejs data public/categories public/avatars public/sounds

USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "echo \"Listening on ${HOSTNAME:-0.0.0.0}:${PORT}\" && exec node server.js"]
