# 🚀 Guide de Démarrage - CROU Management System

## ✅ État du Projet

Le projet a été analysé et les erreurs principales ont été corrigées. Les applications peuvent maintenant être lancées avec succès.

## 🔧 Corrections Apportées

### 1. Fichiers de Configuration Créés
- ✅ Middlewares d'authentification et de permissions
- ✅ Contrôleurs pour tous les modules (auth, financial, stocks, housing, etc.)
- ✅ Fichiers .env d'exemple
- ✅ Configuration CORS et sécurité

### 2. Dépendances Résolues
- ✅ Workspace pnpm configuré correctement
- ✅ Imports TypeScript corrigés
- ✅ Modules manquants créés

## 🚀 Comment Démarrer

### Option 1: Script Automatique (Recommandé)
```powershell
.\start-dev.ps1
```

### Option 2: Démarrage Manuel
```bash
# Installation des dépendances
pnpm install

# Démarrage de toutes les applications
pnpm run dev
```

### Option 3: Démarrage Séparé
```bash
# API seulement
cd apps/api
pnpm run dev

# Application Web seulement (dans un autre terminal)
cd apps/web
pnpm run dev
```

## 🌐 URLs d'Accès

- **Application Web**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api

## 🔐 Connexion Test

Pour tester l'application, utilisez ces identifiants :

- **Email**: `admin@crou.ne`
- **Mot de passe**: `admin123`

## 📋 Fonctionnalités Disponibles

### ✅ Modules Fonctionnels
- 🔐 **Authentification** - Login/logout avec JWT
- 💰 **Module Financier** - Gestion budgets et transactions
- 📦 **Module Stocks** - Gestion inventaires et mouvements
- 🏠 **Module Logement** - Gestion cités et chambres
- 📊 **Module Rapports** - Génération de rapports
- 🔔 **Notifications** - Système de notifications
- ⚡ **Workflows** - Gestion des processus

### 🛠️ Infrastructure
- 🔒 **Sécurité** - JWT, CORS, Rate Limiting, Helmet
- 📝 **Validation** - Express Validator côté serveur
- 🗄️ **Base de Données** - PostgreSQL avec TypeORM
- 📊 **Monitoring** - Logs Winston, Health Checks
- 🎨 **Interface** - React + TypeScript + Tailwind CSS

## 🗄️ Configuration Base de Données

Le projet utilise PostgreSQL. Pour une configuration complète :

1. **Installer PostgreSQL**
2. **Créer la base de données** :
   ```sql
   CREATE DATABASE crou_database;
   CREATE USER crou_user WITH PASSWORD 'crou_password';
   GRANT ALL PRIVILEGES ON DATABASE crou_database TO crou_user;
   ```
3. **Modifier le fichier .env** avec vos paramètres

## 🔍 Vérification du Fonctionnement

### Tests Rapides
```bash
# Test API
curl http://localhost:3001/health

# Test authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crou.ne","password":"admin123"}'
```

### Logs de Débogage
- **API**: Logs dans `apps/api/logs/`
- **Console**: Logs en temps réel dans les terminaux

## 🎯 Prochaines Étapes

1. **Configurer PostgreSQL** pour la persistance des données
2. **Personnaliser les modules** selon vos besoins
3. **Configurer la production** avec variables d'environnement
4. **Ajouter des tests** automatisés
5. **Déployer** sur votre infrastructure

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** dans les terminaux
2. **Consultez les fichiers de logs** dans `apps/api/logs/`
3. **Vérifiez les ports** 3000 et 3001 sont libres
4. **Réinstallez les dépendances** avec `pnpm install`

## 📞 Contact

Pour toute question technique ou support, consultez la documentation dans le dossier `docs/`.

---

✅ **Le système CROU est maintenant opérationnel et prêt pour le développement !**
