/**
 * FICHIER: packages\database\src\entities\User.entity.ts
 * ENTITÉ: User - Utilisateurs du système CROU
 *
 * DESCRIPTION:
 * Entité principale pour les 9 profils utilisateurs CROU/Ministère
 * Gestion multi-tenant avec tenant_id
 * Champs sécurisés avec hachage password bcrypt
 * Audit trail intégré (created_at, updated_at)
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec AuditLog (traçabilité)
 *
 * PROFILS SUPPORTÉS:
 * - Ministère: ministre, directeur_finances, resp_appro, controleur
 * - CROU: directeur, secretaire, chef_financier, comptable, intendant,
 *         magasinier, chef_transport, chef_logement, chef_restauration
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Tenant } from './Tenant.entity';
import { AuditLog } from './AuditLog.entity';
export declare enum UserRole {
    MINISTRE = "ministre",
    DIRECTEUR_FINANCES = "directeur_finances",
    RESP_APPRO = "resp_appro",
    CONTROLEUR = "controleur",
    DIRECTEUR = "directeur",
    SECRETAIRE = "secretaire",
    CHEF_FINANCIER = "chef_financier",
    COMPTABLE = "comptable",
    INTENDANT = "intendant",
    MAGASINIER = "magasinier",
    CHEF_TRANSPORT = "chef_transport",
    CHEF_LOGEMENT = "chef_logement",
    CHEF_RESTAURATION = "chef_restauration"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    tenantId: string;
    tenant: Tenant;
    phone: string;
    avatar: string;
    department: string;
    lastLoginAt: Date;
    lastLoginIp: string;
    loginAttempts: number;
    lockedUntil: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    auditLogs: AuditLog[];
    hashPassword(): Promise<void>;
    validatePassword(plainPassword: string): Promise<boolean>;
    isLocked(): boolean;
    incLoginAttempts(): void;
    resetLoginAttempts(): void;
    get tenantInfo(): {
        id: string;
        name: string;
        type: import("./Tenant.entity").TenantType;
    };
}
//# sourceMappingURL=User.entity.d.ts.map