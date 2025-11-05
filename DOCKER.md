# 🐳 Guide Docker - Système CROU

Guide complet pour utiliser Docker avec le système de gestion CROU.

---

## 📋 Table des Matières

- [Prérequis](#-prérequis)
- [Démarrage Rapide](#-démarrage-rapide)
- [Configuration](#-configuration)
- [Commandes Docker](#-commandes-docker)
- [Développement](#-développement)
- [Production](#-production)
- [Maintenance](#-maintenance)
- [Troubleshooting](#-troubleshooting)

---

## 🔧 Prérequis

### Installer Docker

**Windows:**
- Télécharger [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Minimum : 8GB RAM, 2 CPU cores

**macOS:**
```bash
brew install --cask docker
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Vérifier l'installation
```bash
docker --version          # Docker version 20.10+
docker-compose --version  # Docker Compose version 2.0+
```

---

## 🚀 Démarrage Rapide

### 1. Configuration initiale

```bash
# Copier le fichier de configuration
cp .env.docker.example .env.docker

# Éditer les variables (OBLIGATOIRE en production!)
nano .env.docker  # ou votre éditeur préféré
```

**⚠️ IMPORTANT**: Changer les mots de passe en production !

### 2. Build et démarrage

```bash
# Build toutes les images
docker-compose build

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

### 3. Accéder à l'application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

### 4. Initialiser la base de données

```bash
# Exécuter les migrations
docker-compose exec api pnpm run db:run

# Peupler avec des données de test
docker-compose exec api pnpm run db:seed
```

---

## ⚙️ Configuration

### Fichiers de configuration

| Fichier | Description |
|---------|-------------|
| `.env.docker` | Variables d'environnement principales |
| `docker-compose.yml` | Configuration production |
| `docker-compose.dev.yml` | Configuration développement |
| `apps/api/Dockerfile` | Image API Backend |
| `apps/web/Dockerfile` | Image Frontend React |

### Variables d'environnement principales

```bash
# Base de données
DB_USER=crou_user
DB_PASSWORD=CHANGEZ_MOI_EN_PRODUCTION
DB_NAME=crou_db

# JWT Secrets (générer avec: openssl rand -base64 64)
JWT_SECRET=votre_secret_jwt_super_fort
JWT_REFRESH_SECRET=votre_secret_refresh_super_fort

# URLs
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001/api
```

---

## 🐳 Commandes Docker

### Gestion des services

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart api

# Voir l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f              # Tous les services
docker-compose logs -f api          # Seulement l'API
docker-compose logs -f web          # Seulement le frontend
docker-compose logs -f postgres     # Seulement PostgreSQL
```

### Build des images

```bash
# Build toutes les images
docker-compose build

# Build avec force (sans cache)
docker-compose build --no-cache

# Build une image spécifique
docker-compose build api
docker-compose build web
```

### Accès aux containers

```bash
# Shell dans le container API
docker-compose exec api sh

# Shell dans le container Web
docker-compose exec web sh

# Shell PostgreSQL
docker-compose exec postgres psql -U crou_user -d crou_db

# Shell Redis
docker-compose exec redis redis-cli -a redis_password_change_me
```

### Base de données

```bash
# Exécuter les migrations
docker-compose exec api pnpm run db:run

# Créer une nouvelle migration
docker-compose exec api pnpm run db:generate -- NomDeLaMigration

# Annuler la dernière migration
docker-compose exec api pnpm run db:revert

# Peupler la base de données
docker-compose exec api pnpm run db:seed

# Reset complet de la DB
docker-compose exec api pnpm run db:reset
```

### Nettoyage

```bash
# Arrêter et supprimer les containers
docker-compose down

# Supprimer aussi les volumes (⚠️ perte de données!)
docker-compose down -v

# Nettoyer les images non utilisées
docker system prune -a

# Nettoyer tout Docker
docker system prune -a --volumes
```

---

## 💻 Développement

### Configuration développement

Le fichier `docker-compose.dev.yml` inclut des outils supplémentaires :

- **pgAdmin** : Interface PostgreSQL (http://localhost:5050)
- **Redis Commander** : Interface Redis (http://localhost:8081)

```bash
# Démarrer en mode développement
docker-compose -f docker-compose.dev.yml up -d

# Accéder à pgAdmin
# URL: http://localhost:5050
# Email: admin@crou.local
# Password: admin

# Accéder à Redis Commander
# URL: http://localhost:8081
```

### Hot reload (développement local)

Pour le développement avec hot-reload, utilisez les commandes pnpm directement :

```bash
# Démarrer uniquement PostgreSQL et Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Démarrer l'API en mode dev (dans un terminal)
cd apps/api
pnpm run dev

# Démarrer le frontend en mode dev (dans un autre terminal)
cd apps/web
pnpm run dev
```

### Variables d'environnement dev

```bash
# apps/api/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=crou_dev_db
DATABASE_USER=crou_dev
DATABASE_PASSWORD=crou_dev_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_dev_password
```

---

## 🏭 Production

### Checklist avant déploiement

- [ ] Changer TOUS les mots de passe dans `.env.docker`
- [ ] Générer des secrets JWT forts (openssl rand -base64 64)
- [ ] Configurer les URLs de production
- [ ] Configurer HTTPS/TLS
- [ ] Activer les backups automatiques
- [ ] Configurer le monitoring (Sentry, logs)
- [ ] Tester les health checks
- [ ] Configurer le firewall

### Build production

```bash
# Créer .env.docker avec les valeurs de production
cp .env.docker.example .env.docker
nano .env.docker  # Éditer avec les valeurs prod

# Build optimisé pour production
docker-compose build --no-cache

# Démarrer en production
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### Générer des secrets forts

```bash
# JWT Secret
openssl rand -base64 64

# JWT Refresh Secret
openssl rand -base64 64

# Mot de passe PostgreSQL (32 caractères)
openssl rand -base64 32

# Mot de passe Redis (32 caractères)
openssl rand -base64 32
```

### Reverse Proxy (Nginx/Traefik)

Exemple de configuration Nginx pour production :

```nginx
# /etc/nginx/sites-available/crou
server {
    listen 80;
    server_name crou.gouv.ne www.crou.gouv.ne;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crou.gouv.ne www.crou.gouv.ne;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/crou.gouv.ne/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crou.gouv.ne/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 Maintenance

### Backups

#### Backup PostgreSQL

```bash
# Backup manuel
docker-compose exec postgres pg_dump -U crou_user crou_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup automatique (cron)
# Ajouter dans crontab: crontab -e
0 2 * * * docker-compose exec postgres pg_dump -U crou_user crou_db > /backups/crou_$(date +\%Y\%m\%d).sql
```

#### Restauration

```bash
# Restaurer depuis un backup
docker-compose exec -T postgres psql -U crou_user crou_db < backup.sql
```

### Mise à jour des images

```bash
# Pull les dernières images
docker-compose pull

# Rebuild et redémarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f
```

### Monitoring

```bash
# Stats en temps réel
docker stats

# Utilisation des volumes
docker system df

# Logs des dernières 100 lignes
docker-compose logs --tail=100

# Suivre les logs en temps réel
docker-compose logs -f --tail=50
```

---

## 🐛 Troubleshooting

### Problème : Containers ne démarrent pas

```bash
# Voir les logs d'erreur
docker-compose logs

# Vérifier l'état
docker-compose ps

# Nettoyer et redémarrer
docker-compose down
docker-compose up -d
```

### Problème : Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est ready
docker-compose exec postgres pg_isready -U crou_user

# Tester la connexion
docker-compose exec postgres psql -U crou_user -d crou_db -c "SELECT version();"

# Voir les logs PostgreSQL
docker-compose logs postgres
```

### Problème : Port déjà utilisé

```bash
# Trouver le processus qui utilise le port
# Windows
netstat -ano | findstr :3001

# Linux/macOS
lsof -i :3001

# Changer le port dans .env.docker
API_PORT=3002
WEB_PORT=3001
```

### Problème : Espace disque plein

```bash
# Voir l'utilisation
docker system df

# Nettoyer les ressources non utilisées
docker system prune -a

# Supprimer les volumes non utilisés
docker volume prune
```

### Problème : Build échoue

```bash
# Build avec logs détaillés
docker-compose build --progress=plain --no-cache

# Build une image spécifique
docker build -f apps/api/Dockerfile . --no-cache
```

### Problème : Container redémarre en boucle

```bash
# Voir pourquoi le container crash
docker-compose logs api --tail=100

# Démarrer sans détacher pour voir les erreurs
docker-compose up api
```

---

## 📊 Architecture Docker

```
┌─────────────────────────────────────────────┐
│           Internet / Utilisateurs            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Nginx Reverse Proxy (optionnel)     │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼────────┐
│   Frontend     │   │   API Backend  │
│   (Nginx)      │   │   (Node.js)    │
│   Port: 80     │   │   Port: 3001   │
└────────────────┘   └────────┬───────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
           ┌────────▼────────┐ ┌───────▼────────┐
           │   PostgreSQL    │ │     Redis      │
           │   Port: 5432    │ │   Port: 6379   │
           └─────────────────┘ └────────────────┘
```

---

## 🔗 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Nginx Docker](https://hub.docker.com/_/nginx)

---

**Date:** Octobre 2025
**Version:** 1.0.0
