/**
 * FICHIER: apps\web\src\components\auth\ProtectedRoute.tsx
 * COMPOSANT: ProtectedRoute - Contrôle d'accès aux routes
 * 
 * DESCRIPTION:
 * Composant HOC pour protéger les routes selon les permissions utilisateur
 * Vérification authentification et permissions granulaires
 * Redirection automatique vers login si non autorisé
 * Support permissions multiples et conditions complexes
 * 
 * FONCTIONNALITÉS:
 * - Vérification authentification obligatoire
 * - Contrôle permissions par module/action
 * - Support permissions multiples (ET/OU)
 * - Gestion des niveaux d'accès (Ministère/CROU)
 * - Écrans d'erreur personnalisés
 * - Redirection avec retour après login
 * 
 * PROPS:
 * - children: ReactNode - Composants protégés
 * - requiredPermissions?: Permission[] - Permissions requises
 * - requireAll?: boolean - Toutes permissions requises (défaut: une seule)
 * - allowedRoles?: UserRole[] - Rôles autorisés spécifiques
 * - allowedLevels?: ('ministere' | 'crou')[] - Niveaux autorisés
 * - fallback?: ReactNode - Composant affiché si accès refusé
 * 
 * USAGE:
 * <ProtectedRoute requiredPermissions={['financial:write']}>
 *   <FinancialEditPage />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute 
 *   requiredPermissions={['admin:read', 'admin:write']} 
 *   requireAll={true}
 *   allowedLevels={['ministere']}
 * >
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  ExclamationTriangleIcon,
  LockClosedIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

import { useAuth, Permission, UserRole } from '@/stores/auth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Interface des props
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  allowedRoles?: UserRole[];
  allowedLevels?: ('ministere' | 'crou')[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Composant ProtectedRoute principal
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requireAll = false,
  allowedRoles = [],
  allowedLevels = [],
  fallback,
  redirectTo = '/auth/login'
}) => {
  const { user, isAuthenticated, isLoading, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  // Affichage du loading pendant la vérification
  if (isLoading) {
    return <LoadingScreen message="Vérification des autorisations..." />;
  }

  // Redirection si non authentifié
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Vérification des permissions
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll 
      ? requiredPermissions.every(permission => hasPermission(permission))
      : hasAnyPermission(requiredPermissions);
  }

  // Vérification des rôles autorisés
  const hasAllowedRole = allowedRoles.length === 0 || allowedRoles.includes(user.role);

  // Vérification des niveaux autorisés
  const hasAllowedLevel = allowedLevels.length === 0 || allowedLevels.includes(user.level);

  // Si toutes les vérifications passent, afficher le contenu
  if (hasRequiredPermissions && hasAllowedRole && hasAllowedLevel) {
    return <>{children}</>;
  }

  // Sinon, afficher le fallback ou l'écran d'accès refusé
  if (fallback) {
    return <>{fallback}</>;
  }

  return <AccessDeniedScreen 
    user={user}
    requiredPermissions={requiredPermissions}
    allowedRoles={allowedRoles}
    allowedLevels={allowedLevels}
  />;
};

// Composant d'écran d'accès refusé
interface AccessDeniedScreenProps {
  user: any;
  requiredPermissions: Permission[];
  allowedRoles: UserRole[];
  allowedLevels: ('ministere' | 'crou')[];
}

const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  user,
  requiredPermissions,
  allowedRoles,
  allowedLevels
}) => {
  // Déterminer la raison du refus d'accès
  const getReason = (): string => {
    if (allowedLevels.length > 0 && !allowedLevels.includes(user.level)) {
      const levelNames = {
        ministere: 'Niveau Ministère',
        crou: 'Niveau CROU'
      };
      return `Cette page nécessite un accès ${allowedLevels.map(l => levelNames[l]).join(' ou ')}.`;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return `Cette page est réservée à certains profils utilisateur spécifiques.`;
    }
    
    if (requiredPermissions.length > 0) {
      return `Vous n'avez pas les permissions nécessaires pour accéder à cette page.`;
    }
    
    return `Accès non autorisé à cette page.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <LockClosedIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Accès Refusé
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {getReason()}
          </p>
        </div>

        {/* Informations utilisateur actuel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-4">
            <UserIcon className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">{user.name}</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Rôle:</span> {user.role.replace('_', ' ')}</p>
            <p><span className="font-medium">Niveau:</span> {user.level === 'ministere' ? 'Ministère' : 'CROU'}</p>
            {user.crouId && (
              <p><span className="font-medium">CROU:</span> {user.crouId}</p>
            )}
          </div>
        </div>

        {/* Actions disponibles */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour à la page précédente
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Retour au tableau de bord
          </button>
        </div>

        {/* Contact support */}
        <div className="text-sm text-gray-500">
          <p>
            Si vous pensez qu'il s'agit d'une erreur, 
            <button className="font-medium text-primary-600 hover:text-primary-500 ml-1">
              contactez votre administrateur
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook utilitaire pour vérifier les permissions dans les composants
export const usePermissionCheck = (permission: Permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Hook pour vérifier plusieurs permissions
export const usePermissionsCheck = (
  permissions: Permission[], 
  requireAll = false
) => {
  const { hasPermission, hasAnyPermission } = useAuth();
  
  return requireAll 
    ? permissions.every(p => hasPermission(p))
    : hasAnyPermission(permissions);
};

// Composant wrapper pour cacher/afficher selon permissions
interface PermissionGateProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredPermissions,
  requireAll = false,
  fallback = null
}) => {
  const hasPermissions = usePermissionsCheck(requiredPermissions, requireAll);
  
  return hasPermissions ? <>{children}</> : <>{fallback}</>;
};

export default ProtectedRoute;
