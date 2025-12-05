-- Script pour analyser les permissions du Gestionnaire Stocks

-- 1. Vérifier les permissions définies dans la table permissions
SELECT id, resource, actions, description 
FROM permissions 
WHERE resource = 'stocks'
ORDER BY actions;

-- 2. Vérifier le rôle Gestionnaire Stocks
SELECT id, name, description 
FROM roles 
WHERE name = 'Gestionnaire Stocks';

-- 3. Vérifier les permissions liées au rôle Gestionnaire Stocks
SELECT 
    r.name as role_name,
    p.resource,
    p.actions,
    p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.name = 'Gestionnaire Stocks'
ORDER BY p.resource, p.actions;

-- 4. Vérifier les utilisateurs avec le rôle Gestionnaire Stocks
SELECT 
    u.id,
    u.email,
    u.firstName,
    u.lastName,
    r.name as role_name,
    t.name as tenant_name
FROM users u
JOIN roles r ON u."roleId" = r.id
LEFT JOIN tenants t ON u."tenantId" = t.id
WHERE r.name = 'Gestionnaire Stocks';

-- 5. Vérifier toutes les permissions disponibles pour stocks
SELECT DISTINCT unnest(actions) as action
FROM permissions
WHERE resource = 'stocks';
