/**
 * FICHIER: apps\api\src\modules\admin\index.ts
 * INDEX: Contrôleurs d'administration
 * 
 * DESCRIPTION:
 * Point d'entrée pour tous les contrôleurs d'administration
 * Configuration des routes et middlewares d'administration
 * 
 * ROUTES:
 * - /api/admin/users - Gestion des utilisateurs
 * - /api/admin/roles - Gestion des rôles et permissions
 * - /api/admin/tenants - Gestion des tenants
 * - /api/admin/stats - Statistiques d'utilisation
 * - /api/admin/audit - Logs d'audit (déjà créé)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';

// Import des contrôleurs
import usersController from './users.controller';
import rolesController from './roles.controller';
import tenantsController from './tenants.controller';
import statsController from './stats.controller';
import securityController from './security.controller';
import auditController from '../audit/audit.controller';

const router: Router = Router();

/**
 * Middleware global pour l'administration
 * Vérification des permissions d'accès à l'interface d'administration
 */
router.use(
  authenticateJWT,
  checkPermissions(['admin:access']),
  auditMiddleware({ 
    enabled: true, 
    sensitiveResource: true,
    logAllRequests: true 
  })
);

/**
 * Routes des contrôleurs d'administration
 */

// Gestion des utilisateurs
router.use('/users', usersController);

// Gestion des rôles et permissions
router.use('/roles', rolesController);

// Gestion des tenants
router.use('/tenants', tenantsController);

// Statistiques d'utilisation
router.use('/stats', statsController);

// Sécurité et monitoring
router.use('/security', securityController);

// Logs d'audit
router.use('/audit', auditController);

/**
 * Route de santé pour l'interface d'administration
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Interface d\'administration opérationnelle',
    timestamp: new Date(),
    user: {
      id: req.user?.id,
      permissions: req.user?.permissions
    }
  });
});

/**
 * Route d'information sur les permissions disponibles
 */
router.get('/permissions/available', 
  checkPermissions(['admin:permissions:read']),
  (req, res) => {
    const availablePermissions = [
      // Permissions utilisateurs
      'admin:users:read',
      'admin:users:create',
      'admin:users:update',
      'admin:users:delete',
      'admin:users:reset_password',
      
      // Permissions rôles
      'admin:roles:read',
      'admin:roles:create',
      'admin:roles:update',
      'admin:roles:delete',
      
      // Permissions permissions
      'admin:permissions:read',
      'admin:permissions:create',
      'admin:permissions:update',
      'admin:permissions:delete',
      
      // Permissions tenants
      'admin:tenants:read',
      'admin:tenants:create',
      'admin:tenants:update',
      'admin:tenants:delete',
      
      // Permissions statistiques
      'admin:stats:read',
      'admin:stats:export',
      
      // Permissions audit
      'admin:audit:read',
      'admin:audit:admin',
      
      // Permissions générales
      'admin:access',
      'cross_tenant:access',
      'ministry:global_view'
    ];

    res.json({
      success: true,
      data: {
        permissions: availablePermissions.map(permission => {
          const [module, resource, action] = permission.split(':');
          return {
            name: permission,
            module,
            resource,
            action,
            description: generatePermissionDescription(permission)
          };
        }),
        total: availablePermissions.length
      }
    });
  }
);

/**
 * Générer une description pour une permission
 */
function generatePermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    'admin:access': 'Accès à l\'interface d\'administration',
    'admin:users:read': 'Consulter les utilisateurs',
    'admin:users:create': 'Créer des utilisateurs',
    'admin:users:update': 'Modifier des utilisateurs',
    'admin:users:delete': 'Supprimer des utilisateurs',
    'admin:users:reset_password': 'Réinitialiser les mots de passe',
    'admin:roles:read': 'Consulter les rôles',
    'admin:roles:create': 'Créer des rôles',
    'admin:roles:update': 'Modifier des rôles',
    'admin:roles:delete': 'Supprimer des rôles',
    'admin:permissions:read': 'Consulter les permissions',
    'admin:permissions:create': 'Créer des permissions',
    'admin:permissions:update': 'Modifier des permissions',
    'admin:permissions:delete': 'Supprimer des permissions',
    'admin:tenants:read': 'Consulter les tenants',
    'admin:tenants:create': 'Créer des tenants',
    'admin:tenants:update': 'Modifier des tenants',
    'admin:tenants:delete': 'Supprimer des tenants',
    'admin:stats:read': 'Consulter les statistiques',
    'admin:stats:export': 'Exporter les statistiques',
    'admin:audit:read': 'Consulter les logs d\'audit',
    'admin:audit:admin': 'Administration des logs d\'audit',
    'cross_tenant:access': 'Accès cross-tenant',
    'ministry:global_view': 'Vue globale ministérielle'
  };

  return descriptions[permission] || 'Permission système';
}

export default router;