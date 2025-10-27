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
// Utilitaires de formatage
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-NE', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
};
export const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(d);
};
export const formatDateTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
};
// Constantes
export const CROU_CENTERS = [
    { id: 'crou-niamey', name: 'CROU Niamey', code: 'NIA', region: 'Niamey' },
    { id: 'crou-maradi', name: 'CROU Maradi', code: 'MAR', region: 'Maradi' },
    { id: 'crou-zinder', name: 'CROU Zinder', code: 'ZIN', region: 'Zinder' },
    { id: 'crou-tahoua', name: 'CROU Tahoua', code: 'TAH', region: 'Tahoua' },
    { id: 'crou-agadez', name: 'CROU Agadez', code: 'AGA', region: 'Agadez' },
    { id: 'crou-dosso', name: 'CROU Dosso', code: 'DOS', region: 'Dosso' },
    { id: 'crou-tillaberi', name: 'CROU Tillabéri', code: 'TIL', region: 'Tillabéri' },
    { id: 'crou-diffa', name: 'CROU Diffa', code: 'DIF', region: 'Diffa' }
];
export const USER_ROLES = {
    MINISTRY_ADMIN: 'Administrateur Ministère',
    MINISTRY_FINANCE: 'Responsable Financier Ministère',
    MINISTRY_AUDIT: 'Auditeur Ministère',
    MINISTRY_VIEWER: 'Visualiseur Ministère',
    CROU_ADMIN: 'Administrateur CROU',
    CROU_FINANCE: 'Responsable Financier CROU',
    CROU_STOCK: 'Gestionnaire Stock CROU',
    CROU_HOUSING: 'Gestionnaire Logement CROU',
    CROU_TRANSPORT: 'Gestionnaire Transport CROU'
};
// Validation helpers
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const isValidCurrency = (amount) => {
    const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    return !isNaN(numericAmount) && numericAmount >= 0;
};
// Version du package
export const VERSION = '1.0.0';
//# sourceMappingURL=index.js.map