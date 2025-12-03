# Guide de Configuration - Système CROU

Ce document décrit toutes les variables de configuration disponibles pour le système CROU Management.

## 📋 Table des matières

- [Configuration de base](#configuration-de-base)
- [Base de données](#base-de-données)
- [Sécurité](#sécurité)
- [Variables d'environnement frontend](#frontend)
- [Déploiement](#déploiement)

---

## Configuration de base

### Fichier .env

Copiez le fichier `.env.example` en `.env` et configurez les valeurs :

```bash
cp .env.example .env
```

**⚠️ IMPORTANT** : Ne jamais committer le fichier `.env` dans Git !

### Génération de secrets sécurisés

Pour générer des secrets JWT sécurisés (64 caractères minimum recommandés) :

```bash
# Méthode 1 : Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Méthode 2 : OpenSSL
openssl rand -hex 64
```

---

## Base de données

### Variables requises

Ces variables **DOIVENT** être définies (pas de valeurs par défaut) :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=crou_user
DB_PASSWORD=votre_mot_de_passe_fort
DB_NAME=crou_database
```

### URL de connexion PostgreSQL

Alternative pour configurer la connexion :

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### Migrations

Exécuter les migrations :

```bash
cd packages/database
pnpm run migration:run
```

Créer une nouvelle migration :

```bash
pnpm run migration:generate src/migrations/NomDeLaMigration
```

---

## Sécurité

### JWT et authentification

#### Variables critiques

```env
# DOIVENT être différents et d'au moins 32 caractères
JWT_SECRET=secret_64_caracteres_minimum
JWT_REFRESH_SECRET=autre_secret_different_64_caracteres

# Durées d'expiration
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Format des durées** : `15m`, `1h`, `7d`, `30d`, etc.

#### Validation automatique

Le système valide automatiquement au démarrage :
- ✅ Longueur minimale de 32 caractères (erreur en production)
- ✅ Secrets différents entre JWT_SECRET et JWT_REFRESH_SECRET
- ✅ Format valide des durées

### Politique de verrouillage de compte

Personnalisable via variables d'environnement :

```env
# Nombre de tentatives avant verrouillage
MAX_LOGIN_ATTEMPTS=5

# Durée du verrouillage (minutes)
ACCOUNT_LOCKOUT_DURATION_MINUTES=30

# Réinitialisation du compteur après X minutes sans tentative
LOGIN_ATTEMPTS_RESET_MINUTES=15
```

**Recommandations** :
- MIN: 3 tentatives (trop restrictif)
- MAX: 10 tentatives (risque sécurité)
- OPTIMAL: 5-7 tentatives

### Politique de mots de passe

```env
# Longueur minimale (min: 8)
PASSWORD_MIN_LENGTH=8

# Exigences de complexité
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true

# Expiration (0 = désactivé)
PASSWORD_EXPIRY_DAYS=90
```

### Session et timeout

```env
# Déconnexion automatique après X minutes d'inactivité
SESSION_TIMEOUT_MINUTES=30

# 0 = désactivé
```

### CORS

En développement, `localhost` est automatiquement autorisé.

En production, définir explicitement les origines :

```env
ALLOWED_ORIGINS=https://app.crou.ne,https://admin.crou.ne
```

Format : liste séparée par des virgules, sans espaces.

### Rate Limiting

Le système implémente plusieurs niveaux de rate limiting :

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| Authentification | 5 requêtes | 15 minutes |
| Validation budget | 10 validations | 1 heure |
| Approbation transactions | 20 approbations | 1 heure |
| Upload fichiers | 10 uploads | 1 heure |
| Génération rapports | 15 rapports | 1 heure |
| API Admin | 50 requêtes | 1 heure |
| Global | 100 requêtes | 15 minutes |

Les limites sont configurées dans `apps/api/src/shared/middlewares/rate-limiters.middleware.ts`.

---

## Audit et Logging

### Configuration

```env
# Activer l'audit des connexions
AUDIT_LOGIN_ENABLED=true

# Activer l'audit des actions sensibles
AUDIT_SENSITIVE_ACTIONS_ENABLED=true

# Rétention des logs (jours)
AUDIT_RETENTION_DAYS=365

# Niveau de log (debug | info | warn | error)
LOG_LEVEL=info

# Chemin du fichier de log
LOG_FILE_PATH=./logs/api.log
```

### Niveaux de log

- `debug` : Tous les logs (développement uniquement)
- `info` : Informations générales
- `warn` : Avertissements
- `error` : Erreurs uniquement (recommandé en production)

### Visualisation des logs

```bash
# Voir les logs en temps réel
tail -f logs/api.log

# Filtrer les erreurs
grep "ERROR" logs/api.log

# Statistiques
cat logs/api.log | grep "ERROR" | wc -l
```

---

## Frontend

### Variables Vite (préfixe VITE_)

```env
# Port du serveur de développement
VITE_PORT=3000

# URL de l'API backend
VITE_API_URL=http://localhost:3001

# Version affichée dans l'UI
VITE_APP_VERSION=1.0.0

# Endpoint pour monitoring des erreurs client
VITE_ERROR_LOGGING_ENDPOINT=https://api.crou.ne/client-errors
```

### Proxy de développement

Le proxy Vite est automatiquement configuré pour rediriger `/api/*` vers le backend.

Configuration dans `apps/web/vite.config.ts`.

---

## Déploiement

### Checklist de production

#### Avant le déploiement

- [ ] Copier `.env.example` en `.env`
- [ ] Générer des secrets JWT forts (64+ caractères)
- [ ] Configurer `DATABASE_URL` ou variables DB
- [ ] Définir `NODE_ENV=production`
- [ ] Configurer `ALLOWED_ORIGINS` avec les domaines réels
- [ ] Vérifier `LOG_LEVEL=error` ou `warn`
- [ ] Configurer les sauvegardes DB
- [ ] Tester les migrations sur une copie
- [ ] Configurer le monitoring des erreurs

#### Sécurité production

```env
NODE_ENV=production
LOG_LEVEL=error
AUDIT_LOGIN_ENABLED=true
AUDIT_SENSITIVE_ACTIONS_ENABLED=true
MAX_LOGIN_ATTEMPTS=5
PASSWORD_MIN_LENGTH=10
SESSION_TIMEOUT_MINUTES=30
```

#### Variables à ne PAS oublier

1. **Secrets JWT** : DOIVENT être différents de développement
2. **Base de données** : Credentials de production
3. **CORS** : Domaines réels uniquement
4. **Email** : Configuration SMTP si notifications activées

### Vérification de la configuration

Au démarrage, le système affiche :

```
🔒 Configuration de sécurité:
   Tentatives connexion max: 5
   Durée verrouillage: 30 minutes
   Longueur mot de passe min: 8 caractères
   Expiration mot de passe: 90 jours
   Timeout session: 30 minutes
   Audit activé: ✓
```

Des avertissements sont affichés si des valeurs sont sous-optimales.

### Variables par environnement

| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| NODE_ENV | development | staging | production |
| LOG_LEVEL | debug | info | error |
| SESSION_TIMEOUT | 60 | 30 | 30 |
| MAX_LOGIN_ATTEMPTS | 10 | 5 | 5 |

---

## Dépannage

### Erreur : "Variables d'environnement manquantes"

Vérifier que toutes les variables requises sont définies dans `.env` :

```bash
# Vérifier les variables définies
grep -v "^#" .env | grep -v "^$"
```

### Erreur : "JWT_SECRET trop court"

En production, le système refuse de démarrer si les secrets sont < 32 caractères.

Générer de nouveaux secrets :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Erreur : "JWT_SECRET et JWT_REFRESH_SECRET doivent être différents"

Les deux secrets doivent être uniques. Générez-en deux différents.

### Erreur : "Format JWT_EXPIRES_IN invalide"

Formats valides : `15m`, `1h`, `7d`, `30d`, etc.

Formats invalides : `15`, `1 hour`, `7 days`

### Problème de CORS en production

Vérifier que `ALLOWED_ORIGINS` contient le domaine exact du frontend (avec https://).

---

## Ressources

- [Documentation TypeORM](https://typeorm.io/)
- [Documentation Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Guide JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Support

Pour toute question sur la configuration :

1. Consulter `.env.example` pour les valeurs par défaut
2. Vérifier les logs dans `./logs/api.log`
3. Consulter la documentation dans `docs/`
4. Ouvrir une issue sur GitHub

---

**Dernière mise à jour** : Décembre 2025
