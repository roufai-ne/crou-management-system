-- SQL Script pour corriger les permissions des rôles Gestionnaire
-- Date: 2025-12-04
-- Description: Ajouter les permissions manquantes pour les rôles Gestionnaire Stocks, Gestionnaire Logement, et Gestionnaire Transport

-- 1. Trouver les IDs des permissions nécessaires
-- 2. Trouver les IDs des rôles Gestionnaire
-- 3. Créer les associations manquantes dans la table role_permissions

-- Créer une table temporaire pour stocker les IDs
CREATE TEMP TABLE temp_permissions AS
SELECT id, resource, actions FROM permissions 
WHERE (resource = 'dashboard' AND actions @> ARRAY['read'])
   OR (resource = 'stocks' AND actions @> ARRAY['read'])
   OR (resource = 'stocks' AND actions @> ARRAY['write'])
   OR (resource = 'housing' AND actions @> ARRAY['read'])
   OR (resource = 'housing' AND actions @> ARRAY['write'])
   OR (resource = 'transport' AND actions @> ARRAY['read'])
   OR (resource = 'transport' AND actions @> ARRAY['write'])
   OR (resource = 'reports' AND actions @> ARRAY['read']);

-- Afficher les permissions trouvées
SELECT '=== PERMISSIONS TROUVÉES ===' as info;
SELECT * FROM temp_permissions ORDER BY resource, actions;

-- Créer une table temporaire pour stocker les IDs des rôles
CREATE TEMP TABLE temp_roles AS
SELECT id, name FROM roles 
WHERE name IN ('Gestionnaire Stocks', 'Gestionnaire Logement', 'Gestionnaire Transport');

-- Afficher les rôles trouvés
SELECT '=== RÔLES TROUVÉS ===' as info;
SELECT * FROM temp_roles;

-- ========================================
-- GESTIONNAIRE STOCKS: dashboard:read, stocks:read, stocks:write, reports:read
-- ========================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM temp_roles r, temp_permissions p
WHERE r.name = 'Gestionnaire Stocks'
  AND (
    (p.resource = 'dashboard' AND p.actions @> ARRAY['read'])
    OR (p.resource = 'stocks' AND p.actions @> ARRAY['read'])
    OR (p.resource = 'stocks' AND p.actions @> ARRAY['write'])
    OR (p.resource = 'reports' AND p.actions @> ARRAY['read'])
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

SELECT '=== PERMISSIONS AJOUTÉES POUR GESTIONNAIRE STOCKS ===' as info;
SELECT COUNT(*) as count FROM role_permissions rp
JOIN temp_roles r ON r.id = rp.role_id
WHERE r.name = 'Gestionnaire Stocks';

-- ========================================
-- GESTIONNAIRE LOGEMENT: dashboard:read, housing:read, housing:write, reports:read
-- ========================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM temp_roles r, temp_permissions p
WHERE r.name = 'Gestionnaire Logement'
  AND (
    (p.resource = 'dashboard' AND p.actions @> ARRAY['read'])
    OR (p.resource = 'housing' AND p.actions @> ARRAY['read'])
    OR (p.resource = 'housing' AND p.actions @> ARRAY['write'])
    OR (p.resource = 'reports' AND p.actions @> ARRAY['read'])
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

SELECT '=== PERMISSIONS AJOUTÉES POUR GESTIONNAIRE LOGEMENT ===' as info;
SELECT COUNT(*) as count FROM role_permissions rp
JOIN temp_roles r ON r.id = rp.role_id
WHERE r.name = 'Gestionnaire Logement';

-- ========================================
-- GESTIONNAIRE TRANSPORT: dashboard:read, transport:read, transport:write, reports:read
-- ========================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM temp_roles r, temp_permissions p
WHERE r.name = 'Gestionnaire Transport'
  AND (
    (p.resource = 'dashboard' AND p.actions @> ARRAY['read'])
    OR (p.resource = 'transport' AND p.actions @> ARRAY['read'])
    OR (p.resource = 'transport' AND p.actions @> ARRAY['write'])
    OR (p.resource = 'reports' AND p.actions @> ARRAY['read'])
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

SELECT '=== PERMISSIONS AJOUTÉES POUR GESTIONNAIRE TRANSPORT ===' as info;
SELECT COUNT(*) as count FROM role_permissions rp
JOIN temp_roles r ON r.id = rp.role_id
WHERE r.name = 'Gestionnaire Transport';

-- Vérification finale
SELECT '=== VÉRIFICATION FINALE ===' as info;
SELECT 
    r.name as role_name,
    p.resource,
    p.actions,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name IN ('Gestionnaire Stocks', 'Gestionnaire Logement', 'Gestionnaire Transport')
ORDER BY r.name, p.resource, p.actions;

-- Nettoyer les tables temporaires
DROP TABLE temp_permissions;
DROP TABLE temp_roles;

SELECT '=== CORRECTIONS TERMINÉES AVEC SUCCÈS ===' as info;
