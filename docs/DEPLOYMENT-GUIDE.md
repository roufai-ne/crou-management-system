# 🚀 Guide de Déploiement CROU

**Version**: 1.0.0
**Date**: 31 Octobre 2025
**Status**: Production Ready (80%)

---

## 📋 Prérequis

### Système
- **Node.js**: v18+ ou v20+
- **PostgreSQL**: v14+ ou v15+
- **Redis**: v7+ (optionnel mais recommandé)
- **pnpm**: v8+

### Outils
```bash
# Installer pnpm si nécessaire
npm install -g pnpm

# Vérifier les versions
node --version
psql --version
redis-server --version
pnpm --version
```

---

## 🔧 Installation

### 1. Cloner le Projet

```bash
git clone <repository-url> crou-management-system
cd crou-management-system
```

### 2. Installer les Dépendances

```bash
# Installation de toutes les dépendances du monorepo
pnpm install
```

### 3. Configuration Environnement

```bash
# Copier les fichiers d'environnement
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Éditer les fichiers .env avec vos valeurs
nano .env
nano apps/api/.env
nano apps/web/.env
```

**Variables critiques à modifier**:
```env
# .env (racine)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crou_database
DB_USER=crou_user
DB_PASSWORD=<votre-mot-de-passe-fort>

# apps/api/.env
JWT_SECRET=<générer-avec-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<générer-avec-openssl-rand-base64-64>
CORS_ORIGIN=https://votre-domaine.com

# apps/web/.env
VITE_API_URL=https://api.votre-domaine.com/api
```

---

## 💾 Base de Données

### 1. Créer la Base de Données

```bash
# Option 1: Avec createdb
createdb crou_database

# Option 2: Avec psql
psql -U postgres
CREATE DATABASE crou_database;
CREATE USER crou_user WITH PASSWORD 'votre-mot-de-passe';
GRANT ALL PRIVILEGES ON DATABASE crou_database TO crou_user;
\q
```

### 2. Exécuter les Migrations

```bash
cd packages/database

# Voir l'état des migrations
pnpm migration:show

# Exécuter toutes les migrations
pnpm migration:run

# Vérifier que tout est OK
pnpm migration:show
```

### 3. Charger les Données Initiales

```bash
# Exécuter tous les seeds
pnpm seed:run

# Ou individuellement
pnpm seed:tenants    # 9 organisations
pnpm seed:roles      # 8 rôles + 40 permissions
pnpm seed:users      # 26 utilisateurs
```

### 4. Vérifier la Base

```bash
psql -d crou_database

# Compter les enregistrements
SELECT 'tenants' as table, COUNT(*) FROM tenants
UNION ALL SELECT 'roles', COUNT(*) FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'users', COUNT(*) FROM users;

# Devrait afficher:
# tenants     | 9
# roles       | 8
# permissions | 40
# users       | 26
```

---

## 🏗️ Build

### Backend

```bash
cd apps/api
pnpm build

# Vérifier le build
ls -la dist/
```

### Frontend

```bash
cd apps/web
pnpm build

# Vérifier le build
ls -la dist/
```

### Database Package

```bash
cd packages/database
pnpm build
```

---

## 🚀 Déploiement

### Option 1: Déploiement Manuel

#### Backend (API)

```bash
cd apps/api

# Variables d'environnement production
export NODE_ENV=production
export PORT=3001

# Démarrer avec Node
node dist/main.js

# OU avec PM2 (recommandé)
pm2 start dist/main.js --name crou-api -i max
pm2 save
pm2 startup
```

#### Frontend (Web)

```bash
cd apps/web

# Build production
pnpm build

# Servir avec nginx ou autre serveur web
# Copier dist/ vers /var/www/crou
cp -r dist/* /var/www/crou/
```

### Option 2: Déploiement Docker

```bash
# Build et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Services disponibles:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - API: localhost:3001
# - Web: localhost:3000
```

### Option 3: Déploiement Docker Production

```bash
# Build les images
docker-compose -f docker-compose.yml build

# Démarrer en mode production
docker-compose -f docker-compose.yml up -d

# Vérifier le statut
docker-compose ps
```

---

## 🔐 Sécurité Post-Déploiement

### 1. Changer les Mots de Passe

```bash
# Se connecter avec chaque compte et changer le mot de passe
# Super Admin: admin@crou.ne / Admin@2025!
# Tous les autres: Password@2025!
```

### 2. Configurer SSL/TLS

```bash
# Nginx avec Let's Encrypt
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### 3. Configurer le Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Bloquer l'accès direct à PostgreSQL et Redis
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
```

### 4. Variables Sensibles

```bash
# Générer des secrets forts
openssl rand -base64 64

# Mettre à jour dans .env
JWT_SECRET=<nouveau-secret-64-caractères>
JWT_REFRESH_SECRET=<nouveau-secret-64-caractères>
```

---

## 📊 Monitoring

### Health Check

```bash
# Backend API
curl http://localhost:3001/health

# Réponse attendue:
# {"status":"ok","timestamp":"2025-10-31T10:00:00.000Z"}
```

### Logs

```bash
# Avec PM2
pm2 logs crou-api

# Avec Docker
docker-compose logs -f api

# Fichiers logs
tail -f apps/api/logs/api.log
```

### Base de Données

```bash
# Connexions actives
psql -d crou_database -c "SELECT count(*) FROM pg_stat_activity;"

# Taille de la base
psql -d crou_database -c "SELECT pg_size_pretty(pg_database_size('crou_database'));"
```

---

## 🔄 Maintenance

### Backup Base de Données

```bash
# Backup manuel
pg_dump crou_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup automatique (cron)
# Ajouter dans crontab: crontab -e
0 3 * * * pg_dump crou_database > /backups/crou_$(date +\%Y\%m\%d).sql
```

### Restauration

```bash
# Restaurer depuis un backup
psql crou_database < backup_20251031_030000.sql
```

### Mise à Jour

```bash
# 1. Backup de la base
pg_dump crou_database > backup_avant_maj.sql

# 2. Pull les nouveaux changements
git pull origin main

# 3. Installer les dépendances
pnpm install

# 4. Exécuter les nouvelles migrations
cd packages/database
pnpm migration:run

# 5. Rebuild
cd apps/api && pnpm build
cd apps/web && pnpm build

# 6. Redémarrer
pm2 restart crou-api
# OU
docker-compose restart
```

---

## 🐛 Dépannage

### Problème: API ne démarre pas

```bash
# Vérifier les logs
pm2 logs crou-api

# Vérifier la connexion DB
psql -d crou_database -c "SELECT 1"

# Vérifier les variables d'environnement
cat apps/api/.env
```

### Problème: Frontend ne charge pas

```bash
# Vérifier la configuration nginx
sudo nginx -t

# Vérifier les logs nginx
sudo tail -f /var/log/nginx/error.log

# Vérifier que le build existe
ls -la apps/web/dist/
```

### Problème: Base de données lente

```bash
# Analyser les requêtes lentes
psql -d crou_database -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Réindexer
psql -d crou_database -c "REINDEX DATABASE crou_database;"

# Vacuum
psql -d crou_database -c "VACUUM ANALYZE;"
```

---

## 📞 Support

**Équipe CROU**
Email: support@crou.ne
Téléphone: +227 20 73 31 29

**Documentation**
- Configuration: PRIORITE-1-COMPLETE.md
- Migrations: MIGRATIONS-SEEDS-COMPLETE.md
- API: (Swagger à venir)

---

## ✅ Checklist Déploiement Production

- [ ] Node.js v18+ installé
- [ ] PostgreSQL v14+ installé
- [ ] Redis installé et démarré
- [ ] pnpm installé
- [ ] Dépendances installées
- [ ] .env configurés (tous les 3)
- [ ] Secrets JWT générés
- [ ] Base de données créée
- [ ] Migrations exécutées
- [ ] Seeds exécutés
- [ ] Backend build OK
- [ ] Frontend build OK
- [ ] SSL/TLS configuré
- [ ] Firewall configuré
- [ ] Mots de passe changés
- [ ] Backup automatique configuré
- [ ] Monitoring configuré
- [ ] Logs vérifiés
- [ ] Health check OK
- [ ] Tests de charge effectués

---

**Dernière mise à jour**: 31 Octobre 2025
**Version**: 1.0.0
