# 🎯 PLAN D'ACTION PRIORISÉ
## Système de Gestion CROU Niger

**Date**: 2025-11-05
**Version**: 1.0.0
**Basé sur**: CODE_REVIEW.md

---

## 📋 RÉSUMÉ EXÉCUTIF

Ce plan d'action détaille les étapes nécessaires pour amener le système de gestion CROU de son état actuel (Dev-ready) vers un état Production-ready. Il est organisé par priorité et timeline.

**Timeline Globale**: 4-6 semaines jusqu'à production

```
│ Aujourd'hui │ Semaine 1-2 │ Semaine 3-4 │ Mois 2      │ Production  │
│              │             │             │             │             │
│ Dev Ready   │ → Staging   │ → Pre-Prod  │ → Prod Prep │ → PRODUCTION│
│  (Actuel)   │   Ready     │   Ready     │   Ready     │             │
```

---

## 🔴 PHASE 1: CORRECTIFS CRITIQUES (Semaine 1-2)

### Objectif
Corriger toutes les vulnérabilités critiques pour permettre un déploiement en staging.

### Statut des Corrections

#### ✅ Déjà Corrigé
1. **Secrets Fallback Retirés**
   - `apps/api/src/modules/auth/auth.service.ts`: Ajout de validation
   - Lève maintenant une erreur si JWT_SECRET manquant
   - Fichier: `apps/api/src/config/env-validation.ts` créé

2. **CORS Sécurisé**
   - `apps/api/src/config/cors.config.ts`: Liste blanche stricte
   - Même en dev, liste limitée aux origines connues
   - Pas de `callback(null, true)` global

3. **Validation Tenant ID**
   - `apps/api/src/shared/utils/validation.ts`: Nouvelles fonctions
   - `apps/api/src/shared/middlewares/tenant-isolation.middleware.ts`: Utilise validateUUID
   - Protection contre SQL injection

4. **RBAC Implémenté**
   - `packages/database/src/entities/User.entity.ts`: hasPermission() fonctionnel
   - Support wildcards (* pour ressource ou action)
   - getAllPermissions() retourne la liste réelle

#### 🟡 À Faire Cette Semaine

### 1.1 Protection XSS des Tokens (2 jours) 🔴

**Problème**: Tokens en localStorage vulnérables XSS

**Solution**:
```typescript
// Backend: apps/api/src/modules/auth/auth.controller.ts
export async function login(req: Request, res: Response) {
  const result = await authService.login(credentials);

  // Envoyer refresh token en httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
  });

  // Retourner seulement l'access token (courte durée)
  res.json({
    accessToken: result.accessToken,
    user: result.user,
    expiresIn: result.expiresIn
  });
}
```

**Frontend: apps/web/src/stores/auth.ts**
```typescript
// Ne plus persister le refresh token
// Seulement l'access token en mémoire
setTokens: (accessToken: string, _refreshToken: string) => {
  set({ accessToken });
  // Ne PAS stocker refreshToken côté client
}
```

**Tests**:
- [ ] Vérifier que refreshToken n'apparaît pas dans localStorage
- [ ] Vérifier que refreshToken est dans les cookies
- [ ] Tester le refresh automatique

**Effort**: 2 jours
**Assigné à**: Backend + Frontend devs

---

### 1.2 CSRF Protection (1 jour) 🟠

**Problème**: Pas de protection CSRF sur les mutations

**Solution**:
```typescript
// Backend: apps/api/src/middlewares/csrf.middleware.ts
import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Appliquer sur les routes mutantes
app.use('/api', csrfProtection);

// Route pour obtenir le token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**Frontend: apps/web/src/services/api/apiClient.ts**
```typescript
// Obtenir et inclure le CSRF token
private async getCsrfToken(): Promise<string> {
  const response = await axios.get('/api/csrf-token');
  return response.data.csrfToken;
}

// Ajouter aux requêtes mutantes
async post(url: string, data?: any) {
  const csrfToken = await this.getCsrfToken();
  return this.api.post(url, data, {
    headers: { 'X-CSRF-Token': csrfToken }
  });
}
```

**Packages à installer**:
```bash
cd apps/api
pnpm add csurf
pnpm add -D @types/csurf
```

**Tests**:
- [ ] Vérifier que POST sans CSRF token échoue
- [ ] Vérifier que POST avec CSRF token réussit
- [ ] Tester rotation des tokens

**Effort**: 1 jour
**Assigné à**: Backend dev

---

### 1.3 Tests de Sécurité (3 jours) 🟠

**Objectif**: Tests automatisés pour vérifier la sécurité

**Tests à implémenter**:

```typescript
// apps/api/src/__tests__/security.test.ts
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without JWT', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .expect(401);

      expect(response.body.error).toBe('Token manquant');
    });

    it('should reject expired JWT', async () => {
      const expiredToken = generateExpiredToken();
      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBe('Token expiré');
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@crou.gov.ne', password: 'wrong' });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@crou.gov.ne', password: 'wrong' })
        .expect(401);

      expect(response.body.error).toContain('verrouillé');
    });
  });

  describe('SQL Injection', () => {
    it('should reject SQL injection in tenant ID', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .query({ tenantId: "'; DROP TABLE users; --" })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });

    it('should validate UUID format for IDs', async () => {
      const response = await request(app)
        .get('/api/budgets/not-a-uuid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });
  });

  describe('RBAC', () => {
    it('should deny access without permission', async () => {
      const userToken = generateTokenForUser({ role: 'viewer' });
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(budgetData)
        .expect(403);
    });

    it('should allow access with correct permission', async () => {
      const adminToken = generateTokenForUser({ role: 'admin' });
      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(budgetData)
        .expect(201);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should prevent cross-tenant data access', async () => {
      const tenant1Token = generateTokenForTenant('tenant-1');
      const response = await request(app)
        .get('/api/budgets')
        .query({ tenantId: 'tenant-2' })
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(403);
    });

    it('should allow ministerial users to access all tenants', async () => {
      const ministryToken = generateTokenForMinistry();
      const response = await request(app)
        .get('/api/budgets')
        .query({ tenantId: 'any-tenant' })
        .set('Authorization', `Bearer ${ministryToken}`)
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should block after too many requests', async () => {
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/health');
      }

      const response = await request(app)
        .get('/api/health')
        .expect(429);
    });

    it('should block auth attempts after 5 tries', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@crou.gov.ne', password: 'wrong' });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@crou.gov.ne', password: 'wrong' })
        .expect(429);
    });
  });
});
```

**Couverture minimale**: 80%

**Tests**:
- [ ] Tests d'authentification
- [ ] Tests SQL injection
- [ ] Tests RBAC
- [ ] Tests multi-tenant
- [ ] Tests rate limiting

**Effort**: 3 jours
**Assigné à**: Backend dev + QA

---

### 1.4 Tests Unitaires Critiques (2 jours) 🟠

**Modules à tester en priorité**:

1. **AuthService** (apps/api/src/modules/auth/auth.service.ts)
2. **User Entity RBAC** (packages/database/src/entities/User.entity.ts)
3. **Tenant Isolation Middleware** (apps/api/src/shared/middlewares/tenant-isolation.middleware.ts)
4. **Validation Utils** (apps/api/src/shared/utils/validation.ts)

**Objectif**: Couverture ≥80% sur ces modules

**Commandes**:
```bash
cd apps/api
pnpm test --coverage
```

**Tests**:
- [ ] AuthService: 100% des méthodes
- [ ] User.hasPermission(): tous les cas
- [ ] Tenant isolation: tous les scénarios
- [ ] Validation: toutes les fonctions

**Effort**: 2 jours
**Assigné à**: Backend dev

---

### 🎯 Livrable Phase 1

**Critères de validation**:
- [x] Secrets validés au démarrage
- [x] CORS sécurisé
- [x] RBAC fonctionnel
- [ ] Tokens en httpOnly cookies
- [ ] CSRF protection active
- [ ] Tests de sécurité: 100%
- [ ] Tests unitaires critiques: ≥80%

**Output**: Version **1.1.0** déployable en **STAGING**

---

## 🟠 PHASE 2: MONITORING & PERFORMANCE (Semaine 3-4)

### Objectif
Ajouter observabilité et optimiser les performances.

### 2.1 Monitoring - Sentry (1 jour) 🟠

**Installation**:
```bash
cd apps/api
pnpm add @sentry/node @sentry/tracing

cd apps/web
pnpm add @sentry/react @sentry/tracing
```

**Backend**: `apps/api/src/main.ts`
```typescript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% des transactions
  integrations: [
    new Tracing.Integrations.Express({ app }),
  ],
});

// Request handler doit être avant toutes les routes
app.use(Sentry.Handlers.requestHandler());

// Tracing middleware
app.use(Sentry.Handlers.tracingHandler());

// Error handler doit être après toutes les routes
app.use(Sentry.Handlers.errorHandler());
```

**Frontend**: `apps/web/src/main.tsx`
```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [new BrowserTracing()],
});
```

**Tests**:
- [ ] Erreurs backend capturées dans Sentry
- [ ] Erreurs frontend capturées dans Sentry
- [ ] Transactions tracées correctement

**Effort**: 1 jour
**Assigné à**: DevOps + Backend dev

---

### 2.2 Métriques - Prometheus (2 jours) 🟠

**Installation**:
```bash
cd apps/api
pnpm add prom-client
```

**Configuration**: `apps/api/src/config/metrics.ts`
```typescript
import promClient from 'prom-client';

export const register = new promClient.Registry();

// Métriques par défaut (CPU, RAM, etc.)
promClient.collectDefaultMetrics({ register });

// Métriques custom
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
  registers: [register]
});

export const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});
```

**Middleware**: `apps/api/src/middlewares/metrics.middleware.ts`
```typescript
import { httpRequestDuration, httpRequestTotal } from '@/config/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
}
```

**Endpoint**: `apps/api/src/main.ts`
```typescript
import { register } from '@/config/metrics';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Tests**:
- [ ] Endpoint /metrics accessible
- [ ] Métriques collectées correctement
- [ ] Prometheus scrape configuré

**Effort**: 2 jours
**Assigné à**: DevOps + Backend dev

---

### 2.3 Optimisation N+1 (1 jour) 🟡

**Requêtes à optimiser**:

1. **Auth Login** `apps/api/src/modules/auth/auth.service.ts:84`

```typescript
// AVANT
const user = await this.userRepository.findOne({
  where: { email },
  relations: ['role', 'role.permissions', 'tenant']
});

// APRÈS
const user = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.role', 'role')
  .leftJoinAndSelect('role.permissions', 'permissions')
  .leftJoinAndSelect('user.tenant', 'tenant')
  .where('LOWER(user.email) = LOWER(:email)', { email })
  .getOne();
```

2. **Ajouter indexes** `packages/database/src/entities/User.entity.ts`

```typescript
@Entity('users')
@Index(['email']) // Index sur email pour recherches rapides
@Index(['tenantId', 'status']) // Index composite pour filtrage
export class User {
  // ...
}
```

**Tests**:
- [ ] Mesurer performances AVANT
- [ ] Mesurer performances APRÈS
- [ ] Vérifier amélioration ≥30%

**Effort**: 1 jour
**Assigné à**: Backend dev

---

### 2.4 Pagination Globale (1 jour) 🟡

**Middleware**: `apps/api/src/middlewares/pagination.middleware.ts`

```typescript
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function paginationMiddleware(req: Request, res: Response, next: NextFunction) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  (req as any).pagination = { page, limit, offset };

  next();
}

export function sendPaginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  pagination: PaginationParams
) {
  res.json({
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit)
    }
  });
}
```

**Appliquer partout**:
```typescript
app.use('/api', paginationMiddleware);

// Dans les controllers
const [data, total] = await repository.findAndCount({
  skip: req.pagination.offset,
  take: req.pagination.limit
});

sendPaginatedResponse(res, data, total, req.pagination);
```

**Tests**:
- [ ] Tous les endpoints list paginés
- [ ] Limite max respectée (100)
- [ ] Headers pagination présents

**Effort**: 1 jour
**Assigné à**: Backend dev

---

### 2.5 Rate Limiting Redis (1 jour) 🟡

**Installation**:
```bash
cd apps/api
pnpm add rate-limit-redis
```

**Configuration**: `apps/api/src/main.ts`
```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
    sendCommand: (...args: string[]) => redisClient.call(...args)
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**Tests**:
- [ ] Rate limiting partagé entre instances
- [ ] Compteurs persistants après restart
- [ ] Redis fonctionnel

**Effort**: 1 jour
**Assigné à**: DevOps + Backend dev

---

### 2.6 Bundle Optimization (1 jour) 🟡

**Analyse**:
```bash
cd apps/web
pnpm add -D rollup-plugin-visualizer
```

**Vite config**: `apps/web/vite.config.ts`
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ...
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'ui': ['@heroicons/react', 'lucide-react'],
          'query': ['@tanstack/react-query'],
        }
      }
    }
  }
});
```

**Lazy loading**: `apps/web/src/App.tsx`
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Financial = lazy(() => import('./pages/Financial'));
const Stocks = lazy(() => import('./pages/Stocks'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/financial" element={<Financial />} />
        <Route path="/stocks" element={<Stocks />} />
      </Routes>
    </Suspense>
  );
}
```

**Tests**:
- [ ] Bundle principal < 200KB gzipped
- [ ] Chunks séparés correctement
- [ ] Lazy loading fonctionne

**Effort**: 1 jour
**Assigné à**: Frontend dev

---

### 🎯 Livrable Phase 2

**Critères de validation**:
- [ ] Sentry intégré et fonctionnel
- [ ] Métriques Prometheus exposées
- [ ] Requêtes N+1 optimisées
- [ ] Pagination globale implémentée
- [ ] Rate limiting Redis actif
- [ ] Bundles optimisés
- [ ] Temps de réponse p95 < 500ms
- [ ] Bundle principal < 200KB

**Output**: Version **1.2.0** déployable en **PRE-PRODUCTION**

---

## 🟡 PHASE 3: PRODUCTION-READY (Mois 2)

### Objectif
Infrastructure, CI/CD et documentation pour production.

### 3.1 Docker & Docker Compose (2 jours) 🟡

**Dockerfile Backend**: `apps/api/Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Build
RUN pnpm --filter @crou/api build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copier les dépendances de production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# User non-root pour sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/api/dist/main.js"]
```

**Dockerfile Frontend**: `apps/web/Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile

COPY . .

# Build arguments pour env vars
ARG VITE_API_URL
ARG VITE_SENTRY_DSN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN pnpm --filter @crou/web build

# Production stage avec nginx
FROM nginx:alpine

# Copier la config nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Nginx config**: `apps/web/nginx.conf`
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Docker Compose**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: crou-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-crou_database}
      POSTGRES_USER: ${DB_USER:-crou_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-crou_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./apps/api/src/shared/database/migrations:/docker-entrypoint-initdb.d
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-crou_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - crou-network

  redis:
    image: redis:7-alpine
    container_name: crou-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD:-}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - crou-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: crou-api
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3001
      DATABASE_URL: postgresql://${DB_USER:-crou_user}:${DB_PASSWORD:-crou_password}@postgres:5432/${DB_NAME:-crou_database}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SENTRY_DSN: ${SENTRY_DSN:-}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3001:3001"
    restart: unless-stopped
    networks:
      - crou-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:3001/api}
        VITE_SENTRY_DSN: ${VITE_SENTRY_DSN:-}
    container_name: crou-web
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - crou-network

volumes:
  postgres_data:
  redis_data:

networks:
  crou-network:
    driver: bridge
```

**.dockerignore**:
```
node_modules
**/node_modules
dist
**/dist
.git
.env
.env.local
*.log
coverage
.turbo
```

**Tests**:
- [ ] Images Docker buildent correctement
- [ ] docker-compose up fonctionne
- [ ] Health checks passent
- [ ] Services communiquent entre eux

**Effort**: 2 jours
**Assigné à**: DevOps

---

### 3.2 CI/CD Pipeline (2 jours) 🟡

**GitHub Actions**: `.github/workflows/ci-cd.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'claude/**']
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  # Job 1: Lint & Type Check
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript check
        run: pnpm type-check

  # Job 2: Unit Tests
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Job 3: Integration Tests
  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: crou_test
          POSTGRES_USER: crou_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://crou_user:test_password@localhost:5432/crou_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          JWT_SECRET: test-secret-key-for-ci
          JWT_REFRESH_SECRET: test-refresh-secret-for-ci

  # Job 4: E2E Tests
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 30

  # Job 5: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run npm audit
        run: pnpm audit --audit-level=moderate

  # Job 6: Build Docker Images
  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: [lint, test-unit, test-integration]
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata for API
        id: meta-api
        uses: docker/metadata-action@v4
        with:
          images: ${{ secrets.DOCKER_USERNAME }}/crou-api
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-

      - name: Build and push API image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: ${{ steps.meta-api.outputs.tags }}
          labels: ${{ steps.meta-api.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata for Web
        id: meta-web
        uses: docker/metadata-action@v4
        with:
          images: ${{ secrets.DOCKER_USERNAME }}/crou-web
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-

      - name: Build and push Web image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: ${{ steps.meta-web.outputs.tags }}
          labels: ${{ steps.meta-web.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VITE_API_URL=${{ secrets.VITE_API_URL }}
            VITE_SENTRY_DSN=${{ secrets.VITE_SENTRY_DSN }}

  # Job 7: Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, test-e2e, security]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.crou.gov.ne
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging server
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/crou-app
            docker-compose pull
            docker-compose up -d --force-recreate
            docker-compose exec -T api npm run db:run

      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://staging.crou.gov.ne/health || exit 1
          curl -f https://staging.crou.gov.ne/api/health || exit 1

  # Job 8: Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, test-e2e, security]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://crou.gov.ne
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production server
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/crou-app
            docker-compose pull
            docker-compose up -d --force-recreate
            docker-compose exec -T api npm run db:run

      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://crou.gov.ne/health || exit 1
          curl -f https://crou.gov.ne/api/health || exit 1

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '✅ Production deployment successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/crou-app
            docker-compose down
            git checkout HEAD~1
            docker-compose up -d

      - name: Notify rollback
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          text: '❌ Production deployment failed! Rollback initiated.'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Secrets à configurer dans GitHub**:
```
DOCKER_USERNAME
DOCKER_PASSWORD
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
PROD_HOST
PROD_USER
PROD_SSH_KEY
VITE_API_URL
VITE_SENTRY_DSN
SLACK_WEBHOOK
```

**Tests**:
- [ ] Pipeline CI passe sur PR
- [ ] Build & push Docker sur push
- [ ] Deploy staging automatique
- [ ] Deploy production avec approval

**Effort**: 2 jours
**Assigné à**: DevOps

---

### 3.3 Documentation (3 jours) 🟡

**1. API Documentation - Swagger**

`apps/api/src/config/swagger.ts`:
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CROU Management System API',
      version: '1.0.0',
      description: 'API pour la gestion des Centres Régionaux des Œuvres Universitaires',
      contact: {
        name: 'Équipe CROU',
        email: 'support@crou.gov.ne'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development'
      },
      {
        url: 'https://api.crou.gov.ne',
        description: 'Production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
}
```

**2. Architecture Decision Records**

`docs/adr/001-monorepo-architecture.md`
`docs/adr/002-multi-tenant-strategy.md`
`docs/adr/003-authentication-jwt.md`

**3. Guide de Déploiement**

`docs/deployment/README.md`
`docs/deployment/production.md`
`docs/deployment/staging.md`
`docs/deployment/docker.md`

**4. Guide Utilisateur**

`docs/user-guide/README.md`
`docs/user-guide/authentication.md`
`docs/user-guide/financial.md`
etc.

**Tests**:
- [ ] API docs accessibles sur /api/docs
- [ ] Tous les endpoints documentés
- [ ] Guides de déploiement testés
- [ ] README à jour

**Effort**: 3 jours
**Assigné à**: Tech Lead + Dev

---

### 3.4 Backup Automatique (1 jour) 🟡

**Script**: `scripts/backup-database.sh`
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/crou"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Créer le répertoire de backup
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "🔄 Démarrage du backup de la base de données..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup réussi: $BACKUP_FILE"

  # Upload vers S3 (optionnel)
  if [ ! -z "$AWS_S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
    echo "✅ Backup uploadé vers S3"
  fi

  # Nettoyer les anciens backups
  find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "🧹 Anciens backups nettoyés (>$RETENTION_DAYS jours)"
else
  echo "❌ Erreur lors du backup"
  exit 1
fi
```

**Cron Job**:
```cron
# Backup quotidien à 2h du matin
0 2 * * * /opt/crou-app/scripts/backup-database.sh >> /var/log/crou-backup.log 2>&1
```

**Tests**:
- [ ] Backup manuel fonctionne
- [ ] Restore testé avec succès
- [ ] Cron job configuré
- [ ] S3 upload optionnel fonctionne

**Effort**: 1 jour
**Assigné à**: DevOps

---

### 🎯 Livrable Phase 3

**Critères de validation**:
- [ ] Docker images fonctionnelles
- [ ] docker-compose opérationnel
- [ ] CI/CD pipeline complet
- [ ] Deploy automatique staging
- [ ] Deploy production avec approval
- [ ] API docs Swagger complètes
- [ ] Documentation déploiement
- [ ] Backup automatique configuré
- [ ] Rollback testé

**Output**: Version **2.0.0** déployable en **PRODUCTION**

---

## 📊 TABLEAU DE BORD PROGRESSION

### Par Phase

| Phase | Tâches | Complétées | En cours | Restantes | % Complet |
|-------|--------|------------|----------|-----------|-----------|
| **Phase 1 (Critique)** | 9 | 4 | 0 | 5 | 44% |
| **Phase 2 (Performance)** | 6 | 0 | 0 | 6 | 0% |
| **Phase 3 (Production)** | 4 | 0 | 0 | 4 | 0% |
| **TOTAL** | 19 | 4 | 0 | 15 | 21% |

### Par Priorité

| Priorité | Tâches | Effort Total | Status |
|----------|--------|--------------|--------|
| 🔴 Critique | 5 | 10 jours | 44% |
| 🟠 Élevé | 7 | 9 jours | 0% |
| 🟡 Moyen | 7 | 11 jours | 0% |

### Timeline

```
Semaine 1    Semaine 2    Semaine 3    Semaine 4    Semaine 5-6
│            │            │            │            │
├─ Phase 1 ──┤            │            │            │
│  Critique  │            │            │            │
│            ├─ Phase 2 ──┤            │            │
│            │  Perf      │            │            │
│            │            ├─── Phase 3 ────────────┤
│            │            │   Production            │
│            │            │                         │
│            │            │                         │
v            v            v            v            v
Dev         Staging      Pre-Prod     Prod Prep   PRODUCTION
```

---

## ✅ CHECKLIST FINALE AVANT PRODUCTION

### Sécurité
- [ ] Tous les secrets externalisés et validés
- [ ] RBAC complètement fonctionnel
- [ ] Tokens en httpOnly cookies
- [ ] CSRF protection active
- [ ] Tests de sécurité: 100%
- [ ] Audit de sécurité externe réalisé
- [ ] Pentest réalisé
- [ ] SSL/TLS configuré
- [ ] Rate limiting opérationnel

### Performance
- [ ] Temps de réponse p95 < 500ms
- [ ] Requêtes N+1 optimisées
- [ ] Pagination partout
- [ ] Cache configuré
- [ ] Bundle frontend < 200KB
- [ ] Load testing validé (1000+ users)

### Qualité
- [ ] Tests unitaires ≥80%
- [ ] Tests intégration ≥70%
- [ ] Tests E2E critiques: 100%
- [ ] Pas de vulnérabilités critiques
- [ ] Code review complet
- [ ] Documentation à jour

### Infrastructure
- [ ] Docker images optimisées
- [ ] CI/CD pipeline fonctionnel
- [ ] Monitoring opérationnel (Sentry)
- [ ] Métriques exposées (Prometheus)
- [ ] Logs centralisés
- [ ] Alerting configuré
- [ ] Backup automatique testé
- [ ] Disaster recovery plan
- [ ] Rollback procédure testée

### Conformité
- [ ] RGPD compliance vérifiée
- [ ] Logs d'audit complets
- [ ] Retention policy définie
- [ ] Privacy policy à jour
- [ ] Terms of service à jour

---

## 📞 CONTACTS & RESPONSABILITÉS

### Équipe

| Rôle | Responsable | Email | Phases |
|------|-------------|-------|--------|
| **Tech Lead** | À définir | - | Toutes |
| **Backend Dev** | À définir | - | 1, 2 |
| **Frontend Dev** | À définir | - | 1, 2 |
| **DevOps** | À définir | - | 2, 3 |
| **QA** | À définir | - | 1, 2 |
| **Security** | À définir | - | 1 |

### Points de Décision

| Décision | Responsable | Deadline |
|----------|-------------|----------|
| Validation Phase 1 | Tech Lead | Semaine 2 |
| Go/No-Go Staging | Tech Lead + QA | Semaine 2 |
| Validation Phase 2 | Tech Lead | Semaine 4 |
| Go/No-Go Pre-Prod | Tech Lead + DevOps | Semaine 4 |
| Go/No-Go Production | Management | Semaine 6 |

---

## 📈 MÉTRIQUES DE SUCCÈS

### Objectifs Techniques

| Métrique | Cible | Actuel | Statut |
|----------|-------|--------|--------|
| Couverture tests | ≥80% | ~20% | 🔴 |
| Temps réponse p95 | <500ms | ? | ⚪ |
| Bundle size | <200KB | ~350KB | 🟡 |
| Uptime | ≥99.5% | N/A | ⚪ |
| Vulnérabilités | 0 critique | 5 | 🔴 |
| Score Lighthouse | ≥90 | ? | ⚪ |

### Objectifs Business

| Métrique | Cible | Date |
|----------|-------|------|
| Staging déployé | ✅ | Semaine 2 |
| Pre-Prod déployé | ✅ | Semaine 4 |
| Production déployée | ✅ | Semaine 6 |
| 100 utilisateurs actifs | ✅ | Semaine 8 |
| 8 CROU connectés | ✅ | Semaine 10 |

---

## 🚨 GESTION DES RISQUES

### Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Retard Phase 1** | Moyen | Élevé | +1 dev, overtime |
| **Bugs critiques en Staging** | Moyen | Élevé | Tests exhaustifs, rollback rapide |
| **Performance insuffisante** | Faible | Élevé | Load testing précoce, optimisations |
| **Vulnérabilité découverte** | Faible | Critique | Pentest externe, bug bounty |
| **Downtime migration** | Moyen | Moyen | Blue-green deployment, rollback plan |

### Plan de Contingence

**Si retard >1 semaine Phase 1**:
1. Prioriser uniquement les 🔴 critiques
2. Reporter Phase 2 éléments 🟡
3. Déployer staging avec limitations

**Si bugs critiques Staging**:
1. Stop déploiement
2. Hotfix immédiat
3. Tests additionnels
4. Nouvelle timeline

**Si performance insuffisante**:
1. Profiling approfondi
2. Optimisations ciblées
3. Scaling horizontal si nécessaire

---

## 📝 NOTES & CHANGEMENTS

### Changelog

**2025-11-05**: Plan initial créé
- Phase 1: 4/9 tâches complétées
- Phase 2-3: À démarrer

### Prochaines Revues

- **Hebdomadaire**: Lundi 9h
- **Go/No-Go Staging**: Semaine 2
- **Go/No-Go Prod**: Semaine 6

---

**FIN DU PLAN D'ACTION**

Pour toute question ou clarification, contacter le Tech Lead.
