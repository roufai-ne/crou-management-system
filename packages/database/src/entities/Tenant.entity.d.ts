/**
 * FICHIER: packages\database\src\entities\Tenant.entity.ts
 * ENTITÉ: Tenant - Tenants multi-tenant (Ministère + 8 CROU)
 */
export declare enum TenantType {
    MINISTERE = "ministere",
    CROU = "crou"
}
export declare class Tenant {
    id: string;
    name: string;
    code: string;
    type: TenantType;
    region: string;
    config: Record<string, any>;
    isActive: boolean;
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Tenant.entity.d.ts.map