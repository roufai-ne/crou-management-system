# Audit Complet des Routes API Backend

**Date**: Novembre 2024 | **Version**: 1.0

## RÉSUMÉ

- Total Modules: 10
- Total Routes: 126
- Routes Authentifiées: 123 (97.6%)
- Routes Publiques: 3 (2.4%)

## TABLEAU RÉCAPITULATIF

| Module | Routes | Auth | Permissions | Rate Limit |
|--------|--------|------|-------------|-----------|
| Auth | 4 | Partielle | - | Oui |
| Dashboard | 7 | Oui | Oui | Oui |
| Financial | 23 | Oui | Oui | Oui |
| Stocks | 30 | Oui | Oui | Oui |
| Housing | 6 | Oui | Oui | Non |
| Reports | 7 | Oui | Non | Non |
| Notifications | 3 | Oui | Non | Non |
| Workflows | 8 | Oui | Non | Non |
| Transport | 33 | Oui | Oui | Oui |
| Admin | 7+ | Oui | Oui | Oui |

## MODULE AUTH

POST /login - Public
POST /refresh - Public
POST /logout - authenticateJWT
GET /profile - authenticateJWT

Rate Limiting: 5/15min

## MODULE DASHBOARD

GET /kpis/global - dashboard:read
GET /kpis/modules - dashboard:read
GET /evolution - dashboard:read
GET /expenses - dashboard:read
GET /alerts - dashboard:read
GET /activities - dashboard:read
POST /alerts/:alertId/acknowledge - dashboard:write

Rate Limiting: 30 req/min

## MODULE FINANCIAL (23 routes)

Budgets (7): GET, POST, GET/:id, PUT, DELETE, POST/:id/validate, POST/:id/submit
Transactions (5): GET, POST, GET/:id, PUT, POST/:id/validate
Categories (3): GET, POST, PUT/:id
Reports (4): GET, GET/budget-execution, GET/transactions, GET/export/:format
Validations (2): GET/validations/pending, GET/validations/history
Dashboard (3): GET/dashboard/kpis, /evolution, /alerts

Permissions: financial:read/write/validate
Rate Limiting: 50 req/15min

## MODULE STOCKS (30 routes)

Stocks (5), Mouvements (5), Alertes (4), Inventaire (3), Rapports (4), Dashboard (3), Fournisseurs (6)

Permissions: stocks:read/write/validate
Rate Limiting: 100 req/15min

## MODULE HOUSING (6 routes)

GET / - housing:read
POST / - housing:write
GET /:id - housing:read
PUT /:id - housing:write
DELETE /:id - housing:write
GET /:id/stats - housing:read

Rate Limiting: NON

## MODULE REPORTS (7 routes)

GET / - auth only
POST /generate - auth only
GET /:reportId - auth only
DELETE /:reportId - auth only
GET /export/:reportId - auth only
GET /export/:reportId/excel - auth only
GET /export/:reportId/pdf - auth only

PROBLEMES: Pas de permissions, rate limit, ou audit logging

## MODULE NOTIFICATIONS (3 routes)

GET /
PUT /:notificationId/read
DELETE /:notificationId

PROBLEMES: Pas de permissions, rate limit, ou audit logging

## MODULE WORKFLOWS (8 routes)

GET /
POST /
GET /:workflowId
PUT /:workflowId
DELETE /:workflowId
POST /:workflowId/instances
GET /instances/:instanceId
POST /instances/:instanceId/actions

PROBLEMES: Ordre routes problématique, pas de permissions

## MODULE TRANSPORT (33 routes)

Véhicules (5): GET, POST, GET/:id, PUT, DELETE
Utilisations (5): GET, POST, GET/:id, PUT, DELETE
Maintenances (5): GET, POST, GET/:id, PUT, DELETE
Chauffeurs (10): Available, Alerts, Statistics + CRUD + Actions
Itinéraires (6): Active + CRUD
Trajets (9): Statistics + CRUD + Start/Complete/Cancel
Métriques (1)

Permissions: transport:read/write
Rate Limiting: 50 req/15min

## MODULE ADMIN

Routes: /health, /permissions/available + delegated controllers
Auth: JWT + admin:access
Permissions: 24 permissions granulaires

## INCOHÉRENCES DÉTECTÉES

1. CRITIQUE: Deux middlewares d'auth différents
   - authenticateJWT (auth.routes.ts)
   - authMiddleware (reports, notifications, workflows)

2. Permissions Manquantes (18 routes)
   - Reports: 7 routes
   - Notifications: 3 routes
   - Workflows: 8 routes

3. Rate Limiting Manquant
   - Housing, Reports, Notifications, Workflows

4. Audit Logging Manquant
   - Reports, Notifications, Workflows

5. Ordre Routes Problématique
   - Workflows: /instances/:id peut conflictuer

6. Validateurs Incorrects
   - GET /budgets utilise budgetValidators.create

7. Route Legacy
   - /reports/export/:reportId crée confusion

## STATISTIQUES

Par Méthode:
- GET: 65 (51.6%)
- POST: 41 (32.5%)
- PUT: 15 (11.9%)
- DELETE: 5 (4.0%)

Par Type d'Auth:
- Authentifiées: 123 (97.6%)
- Publiques: 3 (2.4%)

Par Permissions:
- Avec Permissions: 86 (68.3%)
- Sans Permissions: 40 (31.7%)

## RECOMMANDATIONS PRIORITAIRES

PRIORITY 1 - URGENT:
- [ ] Ajouter Rate Limiting: Housing, Reports, Notifications, Workflows
- [ ] Ajouter Permissions: Reports, Notifications, Workflows
- [ ] Standardiser Middlewares: authMiddleware -> authenticateJWT

PRIORITY 2 - HIGH:
- [ ] Ajouter Audit Logging: Reports, Notifications, Workflows
- [ ] Vérifier Ordre Routes: Workflows
- [ ] Tester Multi-Tenant Isolation

PRIORITY 3 - MEDIUM:
- [ ] Routes Search/Filter globales
- [ ] Routes Export complètes
- [ ] Validateurs cohérents

PRIORITY 4 - LOW:
- [ ] OpenAPI/Swagger complet
- [ ] Guide intégration frontend
- [ ] Documentation permissions

Propriétaire: Équipe CROU
À Jour: Novembre 2024
