# ============================================
# Dockerfile - API Backend CROU
# ============================================
# Multi-stage build pour optimiser la taille de l'image finale
# Production-ready avec Node.js 18 Alpine

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

# Copier les package.json de tous les packages
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Installer toutes les dépendances (dev + production)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Builder
# ============================================
FROM base AS builder

# Copier les node_modules depuis l'étape deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copier le code source
COPY apps/api ./apps/api
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

# Build l'application
WORKDIR /app/apps/api
RUN pnpm run build

# ============================================
# Stage 4: Production Runner
# ============================================
FROM node:18-alpine AS runner

# Installer dumb-init pour gestion propre des signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY --chown=nodejs:nodejs pnpm-workspace.yaml package.json ./
COPY --chown=nodejs:nodejs turbo.json ./

# Copier uniquement les production dependencies
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Copier les package.json
COPY --chown=nodejs:nodejs apps/api/package.json ./apps/api/
COPY --chown=nodejs:nodejs packages/database/package.json ./packages/database/
COPY --chown=nodejs:nodejs packages/shared/package.json ./packages/shared/

# Installer uniquement les dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Copier le build depuis l'étape builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copier les entités et migrations (nécessaires pour TypeORM)
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/src/entities ./packages/database/src/entities
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/src/migrations ./packages/database/src/migrations

# Créer les répertoires pour les logs et uploads
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app/logs /app/uploads

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port de l'API
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Utiliser dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["node", "apps/api/dist/main.js"]
