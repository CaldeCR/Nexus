FROM node:20-alpine AS builder

WORKDIR /app

# Manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/

# Install all dependencies including devDependencies for build
RUN npm ci --workspace=apps/api

# Copy API source
COPY apps/api/src ./apps/api/src

# Compile TypeScript
RUN npm run build:api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --omit=dev --workspace=apps/api && npm cache clean --force

COPY --from=builder /app/apps/api/dist ./apps/api/dist

RUN mkdir -p /app/data

EXPOSE 4001

CMD ["node", "apps/api/dist/main.js"]
