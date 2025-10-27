/**
 * FICHIER: packages\shared\src\index.ts
 * PACKAGE: @crou/shared - Types et utilitaires partagés
 *
 * DESCRIPTION:
 * Point d'entrée principal du package shared CROU
 * Types, interfaces et utilitaires communs
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type UserRole = 'MINISTRY_ADMIN' | 'MINISTRY_FINANCE' | 'MINISTRY_AUDIT' | 'MINISTRY_VIEWER' | 'CROU_ADMIN' | 'CROU_FINANCE' | 'CROU_STOCK' | 'CROU_HOUSING' | 'CROU_TRANSPORT';
export interface Tenant {
    id: string;
    name: string;
    code: string;
    type: 'MINISTRY' | 'CROU';
    region?: string;
    isActive: boolean;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface Budget {
    id: string;
    title: string;
    amount: number;
    spent: number;
    remaining: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    tenantId: string;
    createdAt: Date;
}
export interface Transaction {
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    budgetId?: string;
    tenantId: string;
    createdAt: Date;
}
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    userId: string;
    tenantId: string;
    read: boolean;
    createdAt: Date;
}
export declare const formatCurrency: (amount: number) => string;
export declare const formatDate: (date: Date | string) => string;
export declare const formatDateTime: (date: Date | string) => string;
export declare const CROU_CENTERS: readonly [{
    readonly id: "crou-niamey";
    readonly name: "CROU Niamey";
    readonly code: "NIA";
    readonly region: "Niamey";
}, {
    readonly id: "crou-maradi";
    readonly name: "CROU Maradi";
    readonly code: "MAR";
    readonly region: "Maradi";
}, {
    readonly id: "crou-zinder";
    readonly name: "CROU Zinder";
    readonly code: "ZIN";
    readonly region: "Zinder";
}, {
    readonly id: "crou-tahoua";
    readonly name: "CROU Tahoua";
    readonly code: "TAH";
    readonly region: "Tahoua";
}, {
    readonly id: "crou-agadez";
    readonly name: "CROU Agadez";
    readonly code: "AGA";
    readonly region: "Agadez";
}, {
    readonly id: "crou-dosso";
    readonly name: "CROU Dosso";
    readonly code: "DOS";
    readonly region: "Dosso";
}, {
    readonly id: "crou-tillaberi";
    readonly name: "CROU Tillabéri";
    readonly code: "TIL";
    readonly region: "Tillabéri";
}, {
    readonly id: "crou-diffa";
    readonly name: "CROU Diffa";
    readonly code: "DIF";
    readonly region: "Diffa";
}];
export declare const USER_ROLES: {
    readonly MINISTRY_ADMIN: "Administrateur Ministère";
    readonly MINISTRY_FINANCE: "Responsable Financier Ministère";
    readonly MINISTRY_AUDIT: "Auditeur Ministère";
    readonly MINISTRY_VIEWER: "Visualiseur Ministère";
    readonly CROU_ADMIN: "Administrateur CROU";
    readonly CROU_FINANCE: "Responsable Financier CROU";
    readonly CROU_STOCK: "Gestionnaire Stock CROU";
    readonly CROU_HOUSING: "Gestionnaire Logement CROU";
    readonly CROU_TRANSPORT: "Gestionnaire Transport CROU";
};
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidCurrency: (amount: string) => boolean;
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map