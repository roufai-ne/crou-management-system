/**
 * FICHIER: packages/shared/src/constants/roleHierarchy.ts
 * CONSTANTES: Hiérarchie des rôles du système CROU
 *
 * DESCRIPTION:
 * Définit la hiérarchie des rôles utilisateurs avec leurs niveaux de permissions.
 * Utilisé pour la validation des opérations CRUD et le filtrage hiérarchique.
 *
 * NIVEAUX:
 * - 100: Super Admin (niveau le plus élevé)
 * - 80: Admin Ministère
 * - 60: Directeur CROU
 * - 40: Comptable
 * - 30: Gestionnaires (Stocks, Logement, Transport)
 * - 10: Utilisateur (niveau le plus bas)
 *
 * RÈGLES:
 * - Un utilisateur ne peut créer/modifier/supprimer que des utilisateurs de niveau INFÉRIEUR
 * - Super Admin a tous les privilèges
 * - Les gestionnaires ne peuvent créer que des "Utilisateur"
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

/**
 * Hiérarchie des rôles avec leurs niveaux de permission
 * Plus le nombre est élevé, plus le niveau de permission est élevé
 */
export const ROLE_HIERARCHY = {
  'Super Admin': 100,
  'Admin Ministère': 80,
  'Directeur CROU': 60,
  'Comptable': 40,
  'Gestionnaire Stocks': 30,
  'Gestionnaire Logement': 30,
  'Gestionnaire Transport': 30,
  'Utilisateur': 10
} as const;

/**
 * Type pour les noms de rôles valides
 */
export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Type pour les niveaux de permission
 */
export type RoleLevel = typeof ROLE_HIERARCHY[RoleName];

/**
 * Liste des rôles gestionnaires
 * Ces rôles ont des restrictions spéciales (ne peuvent créer que des "Utilisateur")
 */
export const MANAGER_ROLES: ReadonlyArray<RoleName> = [
  'Gestionnaire Stocks',
  'Gestionnaire Logement',
  'Gestionnaire Transport'
] as const;

/**
 * Rôles avec accès étendu (peuvent voir tous les tenants)
 */
export const EXTENDED_ACCESS_ROLES: ReadonlyArray<RoleName> = [
  'Super Admin',
  'Admin Ministère'
] as const;

/**
 * Classe utilitaire pour la gestion de la hiérarchie des rôles
 */
export class RoleHierarchyUtils {
  /**
   * Obtenir le niveau de permission d'un rôle
   * @param roleName - Nom du rôle
   * @returns Niveau de permission (0 si rôle inconnu)
   */
  static getLevel(roleName: string): number {
    return ROLE_HIERARCHY[roleName as RoleName] || 0;
  }

  /**
   * Vérifier si un utilisateur peut gérer un rôle cible
   * @param managerRole - Rôle de l'utilisateur qui effectue l'action
   * @param targetRole - Rôle cible de l'action
   * @returns true si l'utilisateur peut gérer ce rôle
   */
  static canManageRole(managerRole: string, targetRole: string): boolean {
    // Super Admin peut tout faire
    if (managerRole === 'Super Admin') {
      return true;
    }

    const managerLevel = this.getLevel(managerRole);
    const targetLevel = this.getLevel(targetRole);

    // Peut gérer uniquement les rôles de niveau strictement inférieur
    return targetLevel < managerLevel;
  }

  /**
   * Vérifier si un utilisateur peut modifier un autre utilisateur
   * @param modifierRole - Rôle de l'utilisateur qui modifie
   * @param targetUserRole - Rôle de l'utilisateur cible
   * @returns true si l'utilisateur peut modifier l'utilisateur cible
   */
  static canModifyUser(modifierRole: string, targetUserRole: string): boolean {
    return this.canManageRole(modifierRole, targetUserRole);
  }

  /**
   * Vérifier si un rôle est un gestionnaire
   * @param roleName - Nom du rôle
   * @returns true si le rôle est un gestionnaire
   */
  static isManager(roleName: string): boolean {
    return MANAGER_ROLES.includes(roleName as RoleName);
  }

  /**
   * Vérifier si un rôle a un accès étendu (tous les tenants)
   * @param roleName - Nom du rôle
   * @returns true si le rôle a un accès étendu
   */
  static hasExtendedAccess(roleName: string): boolean {
    return EXTENDED_ACCESS_ROLES.includes(roleName as RoleName);
  }

  /**
   * Obtenir les rôles qu'un utilisateur peut créer/modifier
   * @param userRole - Rôle de l'utilisateur
   * @param allRoles - Liste de tous les rôles disponibles
   * @returns Liste des rôles que l'utilisateur peut gérer
   */
  static getManageableRoles<T extends { name: string }>(
    userRole: string,
    allRoles: T[]
  ): T[] {
    // Super Admin peut gérer tous les rôles
    if (userRole === 'Super Admin') {
      return allRoles;
    }

    const userLevel = this.getLevel(userRole);

    // Gestionnaires ne peuvent créer que des "Utilisateur"
    if (this.isManager(userRole)) {
      return allRoles.filter(role => role.name === 'Utilisateur');
    }

    // Les autres peuvent gérer les rôles de niveau inférieur
    return allRoles.filter(role => {
      const roleLevel = this.getLevel(role.name);
      return roleLevel < userLevel;
    });
  }

  /**
   * Obtenir les utilisateurs visibles pour un rôle donné
   * @param userRole - Rôle de l'utilisateur connecté
   * @param allUsers - Liste de tous les utilisateurs
   * @returns Liste des utilisateurs visibles
   */
  static getVisibleUsers<T extends { role?: { name: string } }>(
    userRole: string,
    allUsers: T[]
  ): T[] {
    // Super Admin et Admin Ministère peuvent voir tous les utilisateurs
    if (this.hasExtendedAccess(userRole)) {
      return allUsers;
    }

    const userLevel = this.getLevel(userRole);

    // Les autres ne voient que les utilisateurs de niveau inférieur
    return allUsers.filter(user => {
      const targetRoleName = user.role?.name || '';
      const targetLevel = this.getLevel(targetRoleName);
      return targetLevel < userLevel;
    });
  }

  /**
   * Valider une opération de création de rôle
   * @param creatorRole - Rôle de l'utilisateur qui crée
   * @param targetRole - Rôle à créer
   * @throws Error si l'opération n'est pas permise
   */
  static validateRoleCreation(creatorRole: string, targetRole: string): void {
    if (!this.canManageRole(creatorRole, targetRole)) {
      throw new Error(
        `Vous ne pouvez pas créer un utilisateur avec le rôle "${targetRole}". Votre niveau de permission est insuffisant.`
      );
    }

    // Validation spéciale pour les gestionnaires
    if (this.isManager(creatorRole) && targetRole !== 'Utilisateur') {
      throw new Error(
        'Les gestionnaires ne peuvent créer que des utilisateurs avec le rôle "Utilisateur"'
      );
    }
  }

  /**
   * Valider une opération de modification de rôle
   * @param modifierRole - Rôle de l'utilisateur qui modifie
   * @param currentTargetRole - Rôle actuel de l'utilisateur cible
   * @param newTargetRole - Nouveau rôle à attribuer (optionnel)
   * @throws Error si l'opération n'est pas permise
   */
  static validateRoleUpdate(
    modifierRole: string,
    currentTargetRole: string,
    newTargetRole?: string
  ): void {
    // Vérifier qu'on peut modifier l'utilisateur actuel
    if (!this.canModifyUser(modifierRole, currentTargetRole)) {
      throw new Error(
        `Vous ne pouvez pas modifier un utilisateur avec le rôle "${currentTargetRole}".`
      );
    }

    // Si un nouveau rôle est spécifié, vérifier qu'on peut l'attribuer
    if (newTargetRole && !this.canManageRole(modifierRole, newTargetRole)) {
      throw new Error(
        `Vous ne pouvez pas attribuer le rôle "${newTargetRole}". Votre niveau de permission est insuffisant.`
      );
    }
  }

  /**
   * Valider une opération de suppression
   * @param deleterRole - Rôle de l'utilisateur qui supprime
   * @param targetRole - Rôle de l'utilisateur à supprimer
   * @throws Error si l'opération n'est pas permise
   */
  static validateRoleDeletion(deleterRole: string, targetRole: string): void {
    if (!this.canManageRole(deleterRole, targetRole)) {
      throw new Error(
        `Vous ne pouvez pas supprimer un utilisateur avec le rôle "${targetRole}".`
      );
    }
  }
}
