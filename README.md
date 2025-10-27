# Système de Gestion CROU Niger

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.10-orange)](https://pnpm.io/)

> Progressive Web Application (PWA) pour la gestion centralisée des 8 Centres Régionaux des Œuvres Universitaires (CROU) du Niger.

## 🎯 Vue d'ensemble

Application web moderne de gestion centralisée permettant :
- Supervision ministérielle des 8 CROU du Niger
- Gestion centralisée des achats (céréales, transport, équipements)
- Automatisation des processus de gestion locale
- Contrôle budgétaire et traçabilité complète
- Génération de rapports consolidés nationaux

## ✨ Fonctionnalités

### Niveau Ministériel
- Dashboard exécutif consolidé (8 CROU)
- Gestion financière et budgétaire nationale
- Approvisionnements centralisés (achats groupés)
- Rapports consolidés et analyses comparatives
- Contrôle, audit et validation workflows

### Niveau CROU Local
- Gestion financière (budgets, recettes, dépenses)
- Stocks & inventaire temps réel
- Logement (cités universitaires, chambres, occupations)
- Transport (flotte, navettes, maintenance)
- Workflows de validation multi-niveaux

## 🏗️ Architecture

**Stack:** React 18 + Node.js/Express + PostgreSQL + TypeScript + PWA

**Monorepo:**
```
├── apps/api          # Backend Express + TypeORM
├── apps/web          # Frontend React PWA
└── packages/         # Packages partagés (database, ui, shared, etc.)
```

**Multi-tenant:** 1 base de données PostgreSQL avec isolation par `tenant_id`

## 🚀 Installation

### Prérequis
- Node.js >= 18.0.0
- pnpm >= 8.10.0
- PostgreSQL >= 15.0

### Setup
```bash
# Installation
pnpm install

# Configuration
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Base de données
createdb crou_db
pnpm run db:run
pnpm run db:seed

# Démarrer
pnpm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:3001

## 📚 Documentation

- **[PRD Complet](projet.prd)** - Product Requirements Document
- **[Routes API](ROUTES-API-SUMMARY.md)** - Documentation API complète
- **[Priorité 1](PRIORITE-1-COMPLETE.md)** - Rapport connexion routes

## 🛠️ Technologies

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Query, Zustand
**Backend:** Node.js, Express, TypeORM, JWT, Helmet, Winston
**Database:** PostgreSQL 15+, Redis
**DevOps:** Turbo, pnpm, Docker (à venir), ESLint, Prettier

## 💻 Scripts Principaux

```bash
pnpm run dev              # Démarrer tout
pnpm run build            # Build production
pnpm run test             # Tests
pnpm run lint             # Linter
pnpm run db:reset         # Reset DB complète

# Database
pnpm run db:generate      # Créer migration
pnpm run db:run           # Exécuter migrations
pnpm run db:seed          # Peupler données test

# Tests routes API
node apps/api/test-routes.js
```

## 📊 Statut Projet

**Modules Implémentés:** 9/9 (100%)

✅ Auth & Sécurité
✅ Dashboard
✅ Financial
✅ Stocks
✅ Housing (Nouveau)
✅ Reports
✅ Notifications
✅ Workflows
✅ Admin (Nouveau)

**Progression PRD:** 85% complété

## 🔐 Sécurité

- Multi-tenant avec isolation stricte
- RBAC (9+ rôles, permissions granulaires)
- JWT avec refresh tokens
- Audit trail complet
- Chiffrement AES-256 données sensibles

## 👤 Auteur

**Roufai Amadou**
- GitHub: [@roufai-ne](https://github.com/roufai-ne)
- Email: roufay_amadou@yahoo.fr

## 📄 Licence

MIT License - voir [LICENSE](LICENSE)

---

**Version:** 1.0.0 | **Date:** Octobre 2025 | **Statut:** 🚧 En développement actif
