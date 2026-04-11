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

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
