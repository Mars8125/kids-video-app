FROM node:22-bullseye AS builder

WORKDIR /app

# Use npmmirror for fast China access
RUN npm config set registry https://registry.npmmirror.com

COPY backend/package*.json backend/tsconfig.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/src ./src
RUN npm run build

# Production stage
FROM node:22-bullseye

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
# Use npmmirror for production deps too
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
