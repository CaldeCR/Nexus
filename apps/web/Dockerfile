FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

# Manifests
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/web/vite.config.js ./apps/web/

# Install dependencies
RUN npm ci --workspace=apps/web

# Copy Web source files
COPY apps/web/index.html ./apps/web/
COPY apps/web/public ./apps/web/public
COPY apps/web/src ./apps/web/src

# Build Vite application
RUN npm run build:web

# Production Web Server
FROM nginx:alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
