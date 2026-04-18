FROM node:22-alpine AS builder

WORKDIR /app

# Force rebuild cache - v3
ARG CACHE_BUST=3

# 配置国内 npm 镜像
RUN npm config set registry https://registry.npmmirror.com

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate && npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# 配置国内 npm 镜像
RUN npm config set registry https://registry.npmmirror.com

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built files and Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
