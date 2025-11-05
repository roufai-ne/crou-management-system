# ============================================
# Dockerfile - Frontend React PWA CROU
# ============================================
# Multi-stage build avec Nginx pour servir l'application
# Production-ready avec optimisations PWA

# ============================================
# Stage 1: Base Dependencies
# ============================================
FROM node:18-alpine AS base

# Installation de pnpm
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration workspace
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# ============================================
# Stage 2: Dependencies Installation
# ============================================
FROM base AS deps

# Copier les package.json de tous les packages nécessaires
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Installer toutes les dépendances
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Builder
# ============================================
FROM base AS builder

# Copier les node_modules depuis l'étape deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules

# Copier le code source
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Build l'application
WORKDIR /app/apps/web

# Variables d'environnement pour le build
ARG VITE_API_URL=http://localhost:3001/api
ARG VITE_WS_URL=ws://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build de production avec optimisations PWA
RUN pnpm run build

# ============================================
# Stage 4: Nginx Production Server
# ============================================
FROM nginx:1.25-alpine AS runner

# Installer des outils utiles pour debugging
RUN apk add --no-cache curl

# Copier la configuration Nginx personnalisée
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés depuis le builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copier le service worker et le manifest PWA
COPY --from=builder /app/apps/web/dist/sw.js /usr/share/nginx/html/
COPY --from=builder /app/apps/web/dist/manifest.json /usr/share/nginx/html/

# Créer un script d'injection des variables d'environnement au runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-env.sh && \
    echo 'set -e' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'if [ -f /usr/share/nginx/html/index.html ]; then' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '  echo "Injecting environment variables..."' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '  sed -i "s|VITE_API_URL_PLACEHOLDER|${VITE_API_URL:-http://localhost:3001/api}|g" /usr/share/nginx/html/index.html' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '  sed -i "s|VITE_WS_URL_PLACEHOLDER|${VITE_WS_URL:-ws://localhost:3001}|g" /usr/share/nginx/html/index.html' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'fi' >> /docker-entrypoint.d/40-inject-env.sh && \
    chmod +x /docker-entrypoint.d/40-inject-env.sh

# Exposer le port HTTP
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Nginx démarre automatiquement via l'image de base
