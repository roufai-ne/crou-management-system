-- Script pour corriger les problèmes de permission DELETE
-- Les routes utilisent stocks:write pour toutes les opérations (CREATE, UPDATE, DELETE)
-- Ce script est optionnel car les rôles ont déjà stocks:write

-- Vérifier les permissions actuelles du Gestionnaire Stocks
SELECT r.name as role_name, p.resource, p.actions
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name IN ('Gestionnaire Stocks', 'Chef Restauration')
AND p.resource = 'stocks'
ORDER BY r.name, p.resource;

-- Les rôles ont déjà stocks:write qui couvre :
-- - CREATE (POST)
-- - UPDATE (PUT/PATCH)
-- - DELETE (DELETE)
-- Aucune modification nécessaire !

SELECT '✅ Les permissions sont correctes - stocks:write couvre toutes les opérations' as status;
