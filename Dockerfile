FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json backend/tsconfig.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/src ./src
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy prisma schema first (needed for postinstall)
COPY backend/prisma ./prisma

# Copy package files and install
COPY backend/package*.json ./
# Include devDependencies so prisma generate works
RUN npm ci && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
