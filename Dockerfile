FROM node:22-bullseye AS builder

WORKDIR /app

COPY backend/package*.json backend/tsconfig.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/src ./src
RUN npm run build

# Production stage - Debian 11 for Prisma OpenSSL 1.1 compatibility
FROM node:22-bullseye

WORKDIR /app

# Install OpenSSL 1.1 (Prisma needs it)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

# Start: push schema then run server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
