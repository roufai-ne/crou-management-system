-- ============================================================================
-- FICHIER: packages/database/seeds/add-procurement-permissions.sql
-- DESCRIPTION: Permissions pour le module Procurement (Achats & Commandes)
-- AUTEUR: Équipe CROU
-- DATE: Janvier 2025
-- ============================================================================

-- Insertion des permissions Procurement
INSERT INTO permissions (id, code, name, description, category, created_at, updated_at) VALUES
  (gen_random_uuid(), 'procurement:read', 'Lire les bons de commande', 'Consulter les BCs, demandes, réceptions', 'procurement', NOW(), NOW()),
  (gen_random_uuid(), 'procurement:write', 'Créer et soumettre des BCs', 'Créer des brouillons, soumettre pour approbation, marquer comme commandé', 'procurement', NOW(), NOW()),
  (gen_random_uuid(), 'procurement:approve', 'Approuver et annuler des BCs', 'Approuver les BCs (engage le budget), annuler les BCs', 'procurement', NOW(), NOW()),
  (gen_random_uuid(), 'procurement:receive', 'Réceptionner les marchandises', 'Enregistrer les réceptions de marchandises', 'procurement', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Attribution aux rôles
-- Directeur: Toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Directeur' AND p.code LIKE 'procurement:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Comptable: Lecture, écriture
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Comptable' AND p.code IN ('procurement:read', 'procurement:write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Économe: Lecture, écriture, réception
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Économe' AND p.code IN ('procurement:read', 'procurement:write', 'procurement:receive')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Magasinier: Lecture, réception
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Magasinier' AND p.code IN ('procurement:read', 'procurement:receive')
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
