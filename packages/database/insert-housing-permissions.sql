-- Insert missing housing permissions
INSERT INTO permissions (resource, actions, description) VALUES
  ('housing', '["create","update","read","process"]', 'Gérer les campagnes d''attribution en masse'),
  ('housing', '["create","update","read","approve"]', 'Gérer les demandes de logement'),
  ('housing', '["create","read","verify"]', 'Gérer les documents justificatifs'),
  ('housing', '["read","generate"]', 'Générer les rapports d''occupation')
ON CONFLICT DO NOTHING;

-- Verify
SELECT resource, actions, description
FROM permissions
WHERE resource = 'housing'
ORDER BY description;
