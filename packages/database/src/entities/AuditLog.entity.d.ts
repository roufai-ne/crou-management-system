/**
 * FICHIER: packages\database\src\entities\AuditLog.entity.ts
 * ENTITÉ: AuditLog - Journal d'audit pour traçabilité
 */
export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    LOGIN = "login",
    LOGOUT = "logout",
    VIEW = "view",
    EXPORT = "export",
    VALIDATE = "validate"
}
export declare class AuditLog {
    id: string;
    userId: string;
    user: User;
    action: AuditAction;
    tableName: string;
    recordId: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
//# sourceMappingURL=AuditLog.entity.d.ts.map