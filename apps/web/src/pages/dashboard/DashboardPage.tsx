/**
 * FICHIER: apps/web/src/pages/dashboard/DashboardPage.tsx
 * PAGE: DashboardPage - Page principale du tableau de bord CROU
 *
 * DESCRIPTION:
 * Tableau de bord principal affichant les KPIs et données critiques
 * Adapté selon le niveau utilisateur (Ministère vs CROU)
 * Vue d'ensemble temps réel des activités et performances
 *
 * FONCTIONNALITÉS:
 * - KPIs principaux par module (Finance, Stocks, Logement, Transport)
 * - Graphiques d'évolution temporelle
 * - Alertes et notifications importantes
 * - Liens rapides vers modules détaillés
 * - Filtrage par période et CROU (niveau Ministère)
 *
 * VUES DIFFÉRENCIÉES:
 * - Ministère: Vue consolidée tous CROUs
 * - CROU: Vue spécifique au centre local
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { useAuth } from '@/stores/auth';
import { Container, LoadingScreen } from '@/components/ui';
import { MinistryDashboard } from '@/components/dashboard/MinistryDashboard';
import { ModernCROUDashboard } from '@/components/dashboard/ModernCROUDashboard';


// Composant principal DashboardPage
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Afficher un écran de chargement si l'utilisateur n'est pas encore chargé
  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-6">
      {/* Rendre le dashboard approprié selon le niveau utilisateur */}
      {user.level === 'ministere' ? (
        <MinistryDashboard />
      ) : (
        <ModernCROUDashboard />
      )}
    </div>
  );
};

export default DashboardPage;
