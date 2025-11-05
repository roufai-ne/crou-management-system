/**
 * FICHIER: apps\api\src\modules\admin\users.controller.ts
 * CONTRÔLEUR: Administration des utilisateurs
 * 
 * DESCRIPTION:
 * Contrôleur pour la gestion CRUD des utilisateurs
 * Interface d'administration pour les utilisateurs du système
 * Gestion des rôles, statuts et permissions utilisateurs
 * 
 * FONCTIONNALITÉS:
 * - CRUD complet des utilisateurs
 * - Gestion des rôles et permissions
 * - Activation/désactivation des comptes
 * - Réinitialisation des mots de passe
 * - Filtrage et recherche avancée
 * - Export des données utilisateurs
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { 
  injectTenantIdMiddleware,
  ministerialAccessMiddleware 
} from '@/shared/middlewares/tenant-isolation.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { User, UserStatus } from '../../../../../packages/database/src/entities/User.entity';
import { Role } from '../../../../../packages/database/src/entities/Role.entity';
import { Tenant } from '../../../../../packages/database/src/entities/Tenant.entity';
import { AuditService } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { logger } from '@/shared/utils/logger';
import bcrypt from 'bcryptjs';

const router: Router = Router();
const auditService = new AuditService();

/**
 * Interface pour les filtres de recherche utilisateurs
 */
interface UserSearchFilters {
  search?: string;
  status?: UserStatus;
  roleId?: string;
  tenantId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Interface pour la création/modification d'utilisateur
 */
interface UserCreateData {
  email: string;
  name: string;
  password?: string;
  roleId: string;
  tenantId: string;
  phone?: string;
  department?: string;
  status?: UserStatus;
}

/**
 * GET /api/admin/users
 * Liste des utilisateurs avec filtres et pagination
 */
router.get('/',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Construire les filtres
      const filters: UserSearchFilters = {
        search: req.query.search as string,
        status: req.query.status as UserStatus,
        roleId: req.query.roleId as string,
        tenantId: req.query.tenantId as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }

      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      // Si pas d'accès étendu, limiter au tenant de l'utilisateur
      if (!hasExtendedAccess && tenantContext) {
        filters.tenantId = tenantContext.tenantId;
      }

      // Construire la requête
      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.tenant', 'tenant')
        .select([
          'user.id',
          'user.email',
          'user.name',
          'user.status',
          'user.phone',
          'user.department',
          'user.lastLoginAt',
          'user.loginAttempts',
          'user.createdAt',
          'user.updatedAt',
          'role.id',
          'role.name',
          'role.description',
          'tenant.id',
          'tenant.name',
          'tenant.code',
          'tenant.type'
        ]);

      // Appliquer les filtres
      if (filters.search) {
        queryBuilder.andWhere(
          '(user.name ILIKE :search OR user.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters.status) {
        queryBuilder.andWhere('user.status = :status', { status: filters.status });
      }

      if (filters.roleId) {
        queryBuilder.andWhere('user.roleId = :roleId', { roleId: filters.roleId });
      }

      if (filters.tenantId) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      if (filters.dateFrom) {
        queryBuilder.andWhere('user.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters.dateTo) {
        queryBuilder.andWhere('user.createdAt <= :dateTo', { dateTo: filters.dateTo });
      }

      // Pagination
      queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(filters.offset)
        .take(filters.limit! + 1); // +1 pour détecter s'il y a plus

      const users = await queryBuilder.getMany();
      const hasMore = users.length > filters.limit!;
      
      if (hasMore) {
        users.pop();
      }

      // Compter le total
      const totalQuery = userRepository.createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .leftJoin('user.tenant', 'tenant');

      // Réappliquer les mêmes filtres pour le count
      if (filters.search) {
        totalQuery.andWhere(
          '(user.name ILIKE :search OR user.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }
      if (filters.status) {
        totalQuery.andWhere('user.status = :status', { status: filters.status });
      }
      if (filters.roleId) {
        totalQuery.andWhere('user.roleId = :roleId', { roleId: filters.roleId });
      }
      if (filters.tenantId) {
        totalQuery.andWhere('user.tenantId = :tenantId', { tenantId: filters.tenantId });
      }
      if (filters.dateFrom) {
        totalQuery.andWhere('user.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
      }
      if (filters.dateTo) {
        totalQuery.andWhere('user.createdAt <= :dateTo', { dateTo: filters.dateTo });
      }

      const total = await totalQuery.getCount();

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            hasMore
          },
          filters
        }
      });

    } catch (error) {
      logger.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Détail d'un utilisateur
 */
router.get('/:id',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.role.permissions', 'permissions')
        .leftJoinAndSelect('user.tenant', 'tenant')
        .where('user.id = :userId', { userId })
        .select([
          'user.id',
          'user.email',
          'user.name',
          'user.status',
          'user.phone',
          'user.department',
          'user.lastLoginAt',
          'user.lastLoginIp',
          'user.loginAttempts',
          'user.lockedUntil',
          'user.createdAt',
          'user.updatedAt',
          'role.id',
          'role.name',
          'role.description',
          'permissions.id',
          'permissions.name',
          'permissions.resource',
          'permissions.action',
          'tenant.id',
          'tenant.name',
          'tenant.code',
          'tenant.type'
        ]);

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { 
          tenantId: tenantContext.tenantId 
        });
      }

      const user = await queryBuilder.getOne();

      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'L\'utilisateur demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Audit de l'accès
      await auditService.logResourceAccess(
        req.user!.id,
        'user_details',
        AuditAction.VIEW,
        userId,
        tenantContext?.tenantId,
        req.ip,
        { targetUser: user.email }
      );

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      logger.error('Erreur récupération utilisateur:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de l\'utilisateur'
      });
    }
  }
);

/**
 * POST /api/admin/users
 * Création d'un nouvel utilisateur
 */
router.post('/',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const userData: UserCreateData = req.body;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Validation des données
      if (!userData.email || !userData.name || !userData.roleId || !userData.tenantId) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Email, nom, rôle et tenant sont requis'
        });
      }

      // Si pas d'accès étendu, forcer le tenant de l'utilisateur
      if (!hasExtendedAccess && tenantContext) {
        userData.tenantId = tenantContext.tenantId;
      }

      // Vérifier que l'email n'existe pas déjà
      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Email déjà utilisé',
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Vérifier que le rôle existe
      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({
        where: { id: userData.roleId }
      });

      if (!role) {
        return res.status(400).json({
          error: 'Rôle invalide',
          message: 'Le rôle spécifié n\'existe pas'
        });
      }

      // Vérifier que le tenant existe
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.findOne({
        where: { id: userData.tenantId }
      });

      if (!tenant) {
        return res.status(400).json({
          error: 'Tenant invalide',
          message: 'Le tenant spécifié n\'existe pas'
        });
      }

      // Générer un mot de passe temporaire si pas fourni
      const tempPassword = userData.password || generateTemporaryPassword();

      // Créer l'utilisateur
      const newUser = userRepository.create({
        email: userData.email,
        name: userData.name,
        password: tempPassword, // Sera hashé automatiquement par l'entité
        roleId: userData.roleId,
        tenantId: userData.tenantId,
        phone: userData.phone,
        department: userData.department,
        status: userData.status || UserStatus.PENDING,
        createdBy: req.user!.id
      });

      const savedUser = await userRepository.save(newUser);

      // Audit de la création
      await auditService.logResourceAccess(
        req.user!.id,
        'user',
        AuditAction.CREATE,
        savedUser.id,
        tenantContext?.tenantId,
        req.ip,
        {
          newUser: {
            email: savedUser.email,
            name: savedUser.name,
            roleId: savedUser.roleId,
            tenantId: savedUser.tenantId
          },
          tempPasswordGenerated: !userData.password
        }
      );

      // Retourner l'utilisateur créé (sans le mot de passe)
      const { password, ...userResponse } = savedUser;

      res.status(201).json({
        success: true,
        data: { 
          user: userResponse,
          tempPassword: !userData.password ? tempPassword : undefined
        },
        message: 'Utilisateur créé avec succès'
      });

    } catch (error) {
      logger.error('Erreur création utilisateur:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de l\'utilisateur'
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Modification d'un utilisateur
 */
router.put('/:id',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const updateData: Partial<UserCreateData> = req.body;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const userRepository = AppDataSource.getRepository(User);
      
      // Récupérer l'utilisateur existant
      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.id = :userId', { userId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { 
          tenantId: tenantContext.tenantId 
        });
      }

      const existingUser = await queryBuilder.getOne();

      if (!existingUser) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'L\'utilisateur demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = {
        email: existingUser.email,
        name: existingUser.name,
        roleId: existingUser.roleId,
        tenantId: existingUser.tenantId,
        status: existingUser.status,
        phone: existingUser.phone,
        department: existingUser.department
      };

      // Vérifier l'email unique si modifié
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await userRepository.findOne({
          where: { email: updateData.email }
        });

        if (emailExists) {
          return res.status(409).json({
            error: 'Email déjà utilisé',
            message: 'Un autre utilisateur utilise déjà cet email'
          });
        }
      }

      // Vérifier le rôle si modifié
      if (updateData.roleId && updateData.roleId !== existingUser.roleId) {
        const roleRepository = AppDataSource.getRepository(Role);
        const role = await roleRepository.findOne({
          where: { id: updateData.roleId }
        });

        if (!role) {
          return res.status(400).json({
            error: 'Rôle invalide',
            message: 'Le rôle spécifié n\'existe pas'
          });
        }
      }

      // Vérifier le tenant si modifié (et si accès étendu)
      if (updateData.tenantId && updateData.tenantId !== existingUser.tenantId) {
        if (!hasExtendedAccess) {
          return res.status(403).json({
            error: 'Changement de tenant interdit',
            message: 'Vous ne pouvez pas changer le tenant d\'un utilisateur'
          });
        }

        const tenantRepository = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepository.findOne({
          where: { id: updateData.tenantId }
        });

        if (!tenant) {
          return res.status(400).json({
            error: 'Tenant invalide',
            message: 'Le tenant spécifié n\'existe pas'
          });
        }
      }

      // Appliquer les modifications
      Object.assign(existingUser, {
        ...updateData,
        updatedAt: new Date()
      });

      // Si mot de passe fourni, il sera hashé automatiquement
      const updatedUser = await userRepository.save(existingUser);

      // Audit de la modification
      await auditService.logResourceAccess(
        req.user!.id,
        'user',
        AuditAction.UPDATE,
        userId,
        tenantContext?.tenantId,
        req.ip,
        {
          oldValues,
          newValues: updateData,
          targetUser: updatedUser.email
        }
      );

      // Retourner l'utilisateur modifié (sans le mot de passe)
      const { password, ...userResponse } = updatedUser;

      res.json({
        success: true,
        data: { user: userResponse },
        message: 'Utilisateur modifié avec succès'
      });

    } catch (error) {
      logger.error('Erreur modification utilisateur:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification de l\'utilisateur'
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Suppression d'un utilisateur
 */
router.delete('/:id',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Empêcher l'auto-suppression
      if (userId === req.user!.id) {
        return res.status(400).json({
          error: 'Auto-suppression interdite',
          message: 'Vous ne pouvez pas supprimer votre propre compte'
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.id = :userId', { userId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { 
          tenantId: tenantContext.tenantId 
        });
      }

      const user = await queryBuilder.getOne();

      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'L\'utilisateur demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Sauvegarder les données pour l'audit
      const deletedUserData = {
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        tenantId: user.tenantId
      };

      // Supprimer l'utilisateur
      await userRepository.remove(user);

      // Audit de la suppression
      await auditService.logResourceAccess(
        req.user!.id,
        'user',
        AuditAction.DELETE,
        userId,
        tenantContext?.tenantId,
        req.ip,
        {
          deletedUser: deletedUserData
        }
      );

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });

    } catch (error) {
      logger.error('Erreur suppression utilisateur:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de l\'utilisateur'
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/toggle-status
 * Activer/désactiver un utilisateur
 */
router.post('/:id/toggle-status',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({
          error: 'Statut invalide',
          message: 'Le statut doit être: active, inactive, suspended, ou pending'
        });
      }

      // Empêcher l'auto-modification de statut
      if (userId === req.user!.id) {
        return res.status(400).json({
          error: 'Auto-modification interdite',
          message: 'Vous ne pouvez pas modifier votre propre statut'
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.id = :userId', { userId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { 
          tenantId: tenantContext.tenantId 
        });
      }

      const user = await queryBuilder.getOne();

      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'L\'utilisateur demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      const oldStatus = user.status;
      user.status = status;
      user.updatedAt = new Date();

      // Si suspension, débloquer les tentatives de connexion
      if (status === UserStatus.SUSPENDED) {
        user.loginAttempts = 0;
        user.lockedUntil = null;
      }

      await userRepository.save(user);

      // Audit du changement de statut
      await auditService.logResourceAccess(
        req.user!.id,
        'user_status',
        AuditAction.UPDATE,
        userId,
        tenantContext?.tenantId,
        req.ip,
        {
          targetUser: user.email,
          oldStatus,
          newStatus: status
        }
      );

      res.json({
        success: true,
        data: { 
          userId,
          oldStatus,
          newStatus: status
        },
        message: `Statut utilisateur modifié: ${status}`
      });

    } catch (error) {
      logger.error('Erreur modification statut utilisateur:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification du statut'
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/reset-password
 * Réinitialiser le mot de passe d'un utilisateur
 */
router.post('/:id/reset-password',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.id = :userId', { userId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { 
          tenantId: tenantContext.tenantId 
        });
      }

      const user = await queryBuilder.getOne();

      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'L\'utilisateur demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Générer un nouveau mot de passe temporaire
      const tempPassword = generateTemporaryPassword();
      
      user.password = tempPassword; // Sera hashé automatiquement
      user.status = UserStatus.PENDING; // Forcer le changement au prochain login
      user.loginAttempts = 0;
      user.lockedUntil = null;
      user.updatedAt = new Date();

      await userRepository.save(user);

      // Audit de la réinitialisation
      await auditService.logResourceAccess(
        req.user!.id,
        'user_password',
        AuditAction.UPDATE,
        userId,
        tenantContext?.tenantId,
        req.ip,
        {
          targetUser: user.email,
          action: 'password_reset'
        }
      );

      res.json({
        success: true,
        data: { 
          userId,
          tempPassword,
          email: user.email
        },
        message: 'Mot de passe réinitialisé avec succès'
      });

    } catch (error) {
      logger.error('Erreur réinitialisation mot de passe:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la réinitialisation du mot de passe'
      });
    }
  }
);

/**
 * Générer un mot de passe temporaire sécurisé
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const symbols = '!@#$%&*';
  let password = '';
  
  // Au moins une majuscule, une minuscule, un chiffre et un symbole
  password += chars.charAt(Math.floor(Math.random() * 26)); // Majuscule
  password += chars.charAt(Math.floor(Math.random() * 26) + 26); // Minuscule
  password += chars.charAt(Math.floor(Math.random() * 10) + 52); // Chiffre
  password += symbols.charAt(Math.floor(Math.random() * symbols.length)); // Symbole
  
  // Compléter avec des caractères aléatoires
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export default router;
