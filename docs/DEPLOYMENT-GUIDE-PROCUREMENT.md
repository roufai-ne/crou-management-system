# Guide de Déploiement: Module Procurement & Séparation Finance/Stocks

**Version**: 1.0
**Date**: 19 Janvier 2025
**Auteur**: Équipe CROU

---

## 🎯 Résumé des Changements

Cette mise à jour apporte:

1. ✅ **Séparation UI Finance/Stocks**: Suppression de l'onglet Stocks du module Finance
2. ✅ **6 nouvelles permissions procurement**: Système RBAC complet pour les achats
3. ✅ **Attribution permissions aux rôles**: Directeur, Comptable, Gestionnaire Stocks
4. ✅ **Documentation complète**: 6 documents markdown créés

**Impact**:
- ⚠️ **Base de données**: Ajout de 6 permissions (migration seed requise)
- ⚠️ **Frontend**: Changement navigation Finance (rebuild requis)
- ✅ **Backward compatible**: Aucune rupture pour utilisateurs existants

---

## 📋 Prérequis

### Environnement
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm >= 9.x

### Outils
```bash
# Vérifier versions
node --version  # >= v18.0.0
npm --version   # >= 9.0.0
psql --version  # >= 14.0
```

### Backup Base de Données
```bash
# OBLIGATOIRE: Sauvegarder la base avant migration
pg_dump -U crou_user -d crou_database > backup_avant_procurement_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🚀 Procédure de Déploiement

### Option 1: Environnement de Développement (Recommandé)

#### Étape 1: Reset Complet (⚠️ Perte de données)

```bash
# Naviguez vers la racine du projet
cd /path/to/crou-management-system

# Reset base de données (supprime toutes les données)
npm run db:reset

# Exécuter les seeds (crée 54 permissions + rôles + utilisateurs)
npm run db:seed
```

**Résultat attendu**:
```
🌱 Création des permissions...
✅ 54 permissions créées (6 permissions procurement ajoutées)
🌱 Création des rôles...
✅ 9 rôles créés avec succès
   - Directeur CROU (80%) - Gestion complète CROU + Approbation achats
   - Comptable (50%) - Gestion financière + Création BCs
   - Gestionnaire Stocks (50%) - Gestion stocks + Réception marchandises
📊 Matrice des permissions:
   - Super Admin: 54/54 permissions (100%)
   - Directeur CROU: 41/54 permissions (76%)
   - Comptable: 10/54 permissions (19%)
   - Gestionnaire Stocks: 9/54 permissions (17%)
```

#### Étape 2: Build Frontend

```bash
cd apps/web
npm run build
```

**Résultat attendu**:
```
✓ built in 18.38s
```

#### Étape 3: Vérification

```bash
# Démarrer le backend
cd apps/api
npm run dev

# Dans un autre terminal, démarrer le frontend
cd apps/web
npm run dev
```

**Tests manuels**:
1. Connexion avec `admin@crou.ne` / `Admin@2025!`
2. Naviguer vers `/financial` → Vérifier absence onglet "Stocks"
3. Naviguer vers `/stocks` → Vérifier module Stocks séparé
4. Naviguer vers `/procurement` → Vérifier module Procurement
5. Tester création BC (si Comptable/Directeur)

---

### Option 2: Environnement de Production (Sans perte de données)

#### Étape 1: Migration Base de Données

##### 1.1 Créer Script de Migration SQL

Créez le fichier `migration_procurement_permissions.sql`:

```sql
-- ============================================
-- MIGRATION: Ajout permissions Procurement
-- Date: 2025-01-19
-- Version: 1.0
-- ============================================

BEGIN;

-- Vérifier que la table permissions existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        RAISE EXCEPTION 'Table permissions n''existe pas. Exécuter les seeds d''abord.';
    END IF;
END $$;

-- 1. Ajouter les 6 permissions procurement
INSERT INTO permissions (resource, actions, description, "isActive", "createdAt", "updatedAt")
VALUES
    ('procurement', '["read"]', 'Consulter les bons de commande et demandes d''achat', true, NOW(), NOW()),
    ('procurement', '["create", "update"]', 'Créer/Modifier les bons de commande', true, NOW(), NOW()),
    ('procurement', '["delete"]', 'Supprimer les bons de commande', true, NOW(), NOW()),
    ('procurement', '["approve"]', 'Approuver les bons de commande (engage budget)', true, NOW(), NOW()),
    ('procurement', '["receive"]', 'Réceptionner les marchandises (crée mouvements stocks)', true, NOW(), NOW()),
    ('procurement', '["export"]', 'Exporter les données d''achats', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Récupérer les IDs des permissions créées
CREATE TEMP TABLE tmp_procurement_permissions AS
SELECT id, actions FROM permissions WHERE resource = 'procurement';

-- 3. Attribuer permissions aux rôles

-- Super Admin: Toutes les permissions
INSERT INTO roles_permissions_permissions ("rolesId", "permissionsId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN tmp_procurement_permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Admin Ministère: read + export
INSERT INTO roles_permissions_permissions ("rolesId", "permissionsId")
SELECT r.id, p.id
FROM roles r
JOIN tmp_procurement_permissions p ON p.actions::jsonb @> '["read"]'::jsonb OR p.actions::jsonb @> '["export"]'::jsonb
WHERE r.name = 'Admin Ministère'
ON CONFLICT DO NOTHING;

-- Directeur CROU: read + write + approve + export
INSERT INTO roles_permissions_permissions ("rolesId", "permissionsId")
SELECT r.id, p.id
FROM roles r
JOIN tmp_procurement_permissions p ON
    p.actions::jsonb @> '["read"]'::jsonb OR
    p.actions::jsonb @> '["create", "update"]'::jsonb OR
    p.actions::jsonb @> '["approve"]'::jsonb OR
    p.actions::jsonb @> '["export"]'::jsonb
WHERE r.name = 'Directeur CROU'
ON CONFLICT DO NOTHING;

-- Comptable: read + write + export
INSERT INTO roles_permissions_permissions ("rolesId", "permissionsId")
SELECT r.id, p.id
FROM roles r
JOIN tmp_procurement_permissions p ON
    p.actions::jsonb @> '["read"]'::jsonb OR
    p.actions::jsonb @> '["create", "update"]'::jsonb OR
    p.actions::jsonb @> '["export"]'::jsonb
WHERE r.name = 'Comptable'
ON CONFLICT DO NOTHING;

-- Gestionnaire Stocks: read + receive
INSERT INTO roles_permissions_permissions ("rolesId", "permissionsId")
SELECT r.id, p.id
FROM roles r
JOIN tmp_procurement_permissions p ON
    p.actions::jsonb @> '["read"]'::jsonb OR
    p.actions::jsonb @> '["receive"]'::jsonb
WHERE r.name = 'Gestionnaire Stocks'
ON CONFLICT DO NOTHING;

-- 4. Vérification finale
DO $$
DECLARE
    v_total_permissions INT;
    v_directeur_permissions INT;
    v_comptable_permissions INT;
    v_gestionnaire_permissions INT;
BEGIN
    -- Compter total permissions
    SELECT COUNT(*) INTO v_total_permissions FROM permissions;

    -- Compter permissions par rôle
    SELECT COUNT(DISTINCT p.id) INTO v_directeur_permissions
    FROM roles r
    JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
    JOIN permissions p ON rp."permissionsId" = p.id
    WHERE r.name = 'Directeur CROU';

    SELECT COUNT(DISTINCT p.id) INTO v_comptable_permissions
    FROM roles r
    JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
    JOIN permissions p ON rp."permissionsId" = p.id
    WHERE r.name = 'Comptable';

    SELECT COUNT(DISTINCT p.id) INTO v_gestionnaire_permissions
    FROM roles r
    JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
    JOIN permissions p ON rp."permissionsId" = p.id
    WHERE r.name = 'Gestionnaire Stocks';

    -- Vérifications
    IF v_total_permissions < 54 THEN
        RAISE EXCEPTION 'Erreur: Total permissions = %, attendu >= 54', v_total_permissions;
    END IF;

    IF v_directeur_permissions < 41 THEN
        RAISE WARNING 'Directeur CROU a seulement % permissions (attendu: 41)', v_directeur_permissions;
    END IF;

    IF v_comptable_permissions < 10 THEN
        RAISE WARNING 'Comptable a seulement % permissions (attendu: 10)', v_comptable_permissions;
    END IF;

    IF v_gestionnaire_permissions < 9 THEN
        RAISE WARNING 'Gestionnaire Stocks a seulement % permissions (attendu: 9)', v_gestionnaire_permissions;
    END IF;

    RAISE NOTICE '✅ Migration réussie: % permissions totales', v_total_permissions;
    RAISE NOTICE '   - Directeur CROU: % permissions', v_directeur_permissions;
    RAISE NOTICE '   - Comptable: % permissions', v_comptable_permissions;
    RAISE NOTICE '   - Gestionnaire Stocks: % permissions', v_gestionnaire_permissions;
END $$;

-- Nettoyer table temporaire
DROP TABLE tmp_procurement_permissions;

COMMIT;
```

##### 1.2 Exécuter la Migration

```bash
# Définir mot de passe PostgreSQL
export PGPASSWORD=crou_password

# Exécuter la migration
psql -U crou_user -d crou_database -f migration_procurement_permissions.sql

# Vérifier le résultat
psql -U crou_user -d crou_database -c "
SELECT r.name, COUNT(p.id) as permissions_count
FROM roles r
JOIN roles_permissions_permissions rp ON r.id = rp.\"rolesId\"
JOIN permissions p ON rp.\"permissionsId\" = p.id
GROUP BY r.name
ORDER BY permissions_count DESC;
"
```

**Résultat attendu**:
```
           name           | permissions_count
--------------------------+-------------------
 Super Admin              |                54
 Directeur CROU           |                41
 Admin Ministère          |                22
 Comptable                |                10
 Gestionnaire Stocks      |                 9
 Gestionnaire Restauration|                 8
 Gestionnaire Logement    |                 7
 Gestionnaire Transport   |                 7
 Utilisateur              |                 9
(9 rows)
```

#### Étape 2: Build et Déploiement Frontend

```bash
# Build production
cd apps/web
npm run build

# Le dossier dist/ contient les fichiers à déployer
ls -lh dist/

# Déployer (selon votre infrastructure)
# Exemple: Copier vers serveur web
# scp -r dist/* user@server:/var/www/crou/
```

#### Étape 3: Redémarrage Backend

```bash
cd apps/api

# Build TypeScript
npm run build

# Redémarrer le service (selon votre setup)
# Exemple: PM2
# pm2 restart crou-api

# Exemple: systemd
# sudo systemctl restart crou-api
```

#### Étape 4: Vérification Production

```bash
# Tester API
curl -X GET https://your-domain.com/api/health

# Tester permissions (avec token JWT)
curl -X GET https://your-domain.com/api/admin/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Vérifier logs
tail -f /var/log/crou/api.log
```

---

## 🧪 Tests de Validation

### Test 1: Vérification Base de Données

```sql
-- 1. Compter les permissions procurement
SELECT COUNT(*) as procurement_permissions
FROM permissions
WHERE resource = 'procurement';
-- Attendu: 6

-- 2. Vérifier attributions Directeur
SELECT p.resource, p.actions, p.description
FROM roles r
JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
JOIN permissions p ON rp."permissionsId" = p.id
WHERE r.name = 'Directeur CROU' AND p.resource = 'procurement';
-- Attendu: 4 lignes (read, write, approve, export)

-- 3. Vérifier attributions Gestionnaire Stocks
SELECT p.resource, p.actions, p.description
FROM roles r
JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
JOIN permissions p ON rp."permissionsId" = p.id
WHERE r.name = 'Gestionnaire Stocks' AND p.resource = 'procurement';
-- Attendu: 2 lignes (read, receive)

-- 4. Vérifier utilisateurs existants conservent leurs rôles
SELECT u.email, r.name, COUNT(p.id) as permissions_count
FROM users u
JOIN roles r ON u."roleId" = r.id
JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
JOIN permissions p ON rp."permissionsId" = p.id
GROUP BY u.email, r.name
ORDER BY permissions_count DESC
LIMIT 10;
```

### Test 2: Tests Fonctionnels Frontend

**Connexion en tant que Directeur**:
```
Email: directeur@crou-niamey.ne
Mot de passe: Password@2025!
```

1. ✅ Naviguer vers `/financial` → Pas d'onglet "Stocks"
2. ✅ Naviguer vers `/stocks` → Module séparé accessible
3. ✅ Naviguer vers `/procurement` → Module accessible
4. ✅ Créer un BC → Bouton "Nouveau BC" visible
5. ✅ Approuver un BC → Bouton "Approuver" visible

**Connexion en tant que Comptable**:
```
Email: comptable@crou-niamey.ne (à créer si inexistant)
Mot de passe: Password@2025!
```

1. ✅ Créer BC → Autorisé
2. ❌ Approuver BC → Bouton caché (pas de permission)
3. ❌ Réceptionner → Bouton caché (pas de permission)

**Connexion en tant que Gestionnaire Stocks**:
```
Email: stocks@crou-niamey.ne
Mot de passe: Password@2025!
```

1. ✅ Voir BCs → Autorisé
2. ❌ Créer BC → Bouton caché (pas de permission)
3. ✅ Réceptionner → Bouton "Réceptionner" visible

### Test 3: Tests API (Postman/cURL)

```bash
# 1. Login Directeur
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "directeur@crou-niamey.ne",
    "password": "Password@2025!"
  }'

# Copier le token JWT de la réponse

# 2. Tester création BC (doit réussir)
curl -X POST http://localhost:3001/api/procurement/purchase-orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objet": "Test BC",
    "supplierId": "uuid-supplier",
    "budgetId": "uuid-budget",
    "items": []
  }'

# 3. Tester approbation (doit réussir pour Directeur)
curl -X PATCH http://localhost:3001/api/procurement/purchase-orders/UUID/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Login Utilisateur standard
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@crou-niamey.ne",
    "password": "Password@2025!"
  }'

# 5. Tester création BC (doit échouer - HTTP 403)
curl -X POST http://localhost:3001/api/procurement/purchase-orders \
  -H "Authorization: Bearer NEW_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 🔧 Rollback Procedure

En cas de problème, procédure de retour arrière:

### Option 1: Restauration Base de Données

```bash
# Stopper le backend
pm2 stop crou-api

# Restaurer la sauvegarde
psql -U crou_user -d crou_database < backup_avant_procurement_YYYYMMDD_HHMMSS.sql

# Redémarrer
pm2 start crou-api
```

### Option 2: Rollback Git (si commité)

```bash
# Identifier le commit avant les changements
git log --oneline

# Rollback (exemple)
git revert <commit-hash>

# Rebuild
npm run build

# Redéployer
```

### Option 3: Suppression Manuelle Permissions

```sql
BEGIN;

-- Supprimer les relations rôles-permissions procurement
DELETE FROM roles_permissions_permissions
WHERE "permissionsId" IN (
    SELECT id FROM permissions WHERE resource = 'procurement'
);

-- Supprimer les permissions procurement
DELETE FROM permissions WHERE resource = 'procurement';

COMMIT;
```

---

## 📊 Monitoring Post-Déploiement

### Métriques à Surveiller

1. **Base de données**:
   - Nombre de permissions: doit être 54
   - Nombre de rôles: doit être 9
   - Logs d'erreurs PostgreSQL

2. **Backend API**:
   - Logs d'authentification (succès/échecs)
   - Logs de vérification permissions
   - Erreurs HTTP 403 (refus d'accès)

3. **Frontend**:
   - Erreurs console navigateur
   - Navigation `/financial`, `/stocks`, `/procurement`
   - Temps de chargement pages

### Commandes de Monitoring

```bash
# Logs backend (PM2)
pm2 logs crou-api --lines 100

# Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log | grep ERROR

# Connexions actives
psql -U crou_user -d crou_database -c "
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'crou_database';
"

# Requêtes lentes
psql -U crou_user -d crou_database -c "
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

---

## 📝 Checklist de Déploiement

### Pré-Déploiement
- [ ] Backup base de données créé
- [ ] Build frontend réussi (npm run build)
- [ ] Build backend réussi (npm run build)
- [ ] Tests locaux passés
- [ ] Documentation lue et comprise

### Déploiement
- [ ] Migration SQL exécutée avec succès
- [ ] Vérification: 54 permissions dans DB
- [ ] Vérification: Directeur a 41 permissions
- [ ] Vérification: Comptable a 10 permissions
- [ ] Vérification: Gestionnaire Stocks a 9 permissions
- [ ] Frontend déployé
- [ ] Backend redémarré
- [ ] Health check API: ✅ OK

### Post-Déploiement
- [ ] Test connexion Super Admin
- [ ] Test connexion Directeur CROU
- [ ] Test navigation /financial (pas d'onglet Stocks)
- [ ] Test navigation /stocks (module séparé)
- [ ] Test navigation /procurement (module accessible)
- [ ] Test création BC (Comptable)
- [ ] Test approbation BC (Directeur)
- [ ] Test réception (Gestionnaire Stocks)
- [ ] Monitoring logs: pas d'erreurs critiques
- [ ] Communication équipe: changements déployés

---

## 🆘 Troubleshooting

### Problème: Permissions procurement non créées

**Symptômes**:
```sql
SELECT COUNT(*) FROM permissions WHERE resource = 'procurement';
-- Résultat: 0 (au lieu de 6)
```

**Solution**:
```bash
# Re-exécuter le seed
npm run db:seed

# Ou exécuter manuellement le script SQL
psql -U crou_user -d crou_database -f migration_procurement_permissions.sql
```

---

### Problème: Directeur ne peut pas approuver BC

**Symptômes**:
- HTTP 403 Forbidden lors de `PATCH /procurement/:id/approve`
- JWT décodé ne contient pas `procurement:approve`

**Diagnostic**:
```sql
-- Vérifier permissions du Directeur
SELECT p.resource, p.actions
FROM roles r
JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
JOIN permissions p ON rp."permissionsId" = p.id
WHERE r.name = 'Directeur CROU' AND p.resource = 'procurement';
```

**Solution**:
```sql
-- Ajouter manuellement permission approve au Directeur
INSERT INTO roles_permissions_permissions ("rolesId", "permissionsId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Directeur CROU'
  AND p.resource = 'procurement'
  AND p.actions::jsonb @> '["approve"]'::jsonb
ON CONFLICT DO NOTHING;
```

---

### Problème: Onglet Stocks toujours visible dans Finance

**Symptômes**:
- `/financial` affiche toujours l'onglet "Stocks"
- Build frontend semble réussi

**Diagnostic**:
```bash
# Vérifier version déployée
grep -n "StocksPage" apps/web/src/pages/financial/FinancialPage.tsx
# Ne devrait RIEN retourner

# Vérifier bundle frontend
grep -r "StocksPage" apps/web/dist/
```

**Solution**:
```bash
# Nettoyer cache + rebuild
cd apps/web
rm -rf node_modules/.vite
rm -rf dist
npm run build

# Vider cache navigateur (CTRL+SHIFT+DEL)
# Recharger avec CTRL+F5
```

---

### Problème: Erreur "PermissionResource not found"

**Symptômes**:
```
Error: Enum value 'procurement' not found in PermissionResource
```

**Solution**:
```bash
# Rebuild database package
cd packages/database
npm run build

# Rebuild backend
cd apps/api
npm run build

# Redémarrer
pm2 restart crou-api
```

---

## 📚 Références

### Documents Créés
1. [MODULE-SEPARATION-FINANCE-STOCKS.md](MODULE-SEPARATION-FINANCE-STOCKS.md)
2. [PROCUREMENT-PERMISSIONS-CONFIGURATION.md](PROCUREMENT-PERMISSIONS-CONFIGURATION.md)
3. [MODULE-PROCUREMENT-EVALUATION.md](MODULE-PROCUREMENT-EVALUATION.md)
4. [PROCUREMENT-COMPLETE-EVALUATION.md](PROCUREMENT-COMPLETE-EVALUATION.md)
5. [SESSION-SUMMARY-PROCUREMENT-STOCKS.md](SESSION-SUMMARY-PROCUREMENT-STOCKS.md)

### Fichiers Modifiés
- `packages/database/src/entities/Permission.entity.ts` (ligne 59)
- `packages/database/src/seeds/002-roles-permissions.seed.ts` (ligne 178-583)
- `apps/web/src/pages/financial/FinancialPage.tsx` (ligne 114-117 supprimées)

### Liens Utiles
- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)
- [PM2 Deployment](https://pm2.keymetrics.io/docs/usage/deployment/)

---

## ✅ Support

En cas de problème:

1. **Consulter les logs**:
   ```bash
   pm2 logs crou-api
   tail -f /var/log/postgresql/postgresql-14-main.log
   ```

2. **Vérifier la base de données**:
   ```sql
   SELECT COUNT(*) FROM permissions;
   SELECT name, COUNT(p.id) FROM roles r
   JOIN roles_permissions_permissions rp ON r.id = rp."rolesId"
   JOIN permissions p ON rp."permissionsId" = p.id
   GROUP BY name;
   ```

3. **Contacter l'équipe technique**:
   - Email: tech@crou.ne
   - Slack: #crou-tech-support
   - Documentation: Ce fichier + 5 autres MD

---

**Fin du Guide de Déploiement**

**Version**: 1.0
**Dernière mise à jour**: 19 Janvier 2025
