/**
 * FICHIER: apps/web/src/pages/financial/FinancialPage.tsx
 * PAGE: FinancialPage - Module de gestion financière
 *
 * DESCRIPTION:
 * Module principal pour la gestion financière des CROUs
 * Budgets, dépenses, recettes, rapports financiers
 * Vue adaptée selon le niveau et permissions utilisateur
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { useAuth } from '@/stores/auth';
import { Container, Card, Badge, Button, Grid, Section, KPICard, Tabs } from '@/components/ui';
import { BanknotesIcon, DocumentArrowDownIcon, ChartBarIcon, CurrencyDollarIcon, PlusIcon, ListBulletIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { BudgetsPage } from './BudgetsPage';
import { TransactionsTab } from './TransactionsTab';
import { AllocationsPage } from './AllocationsPage';
import { StocksPage } from '../stocks/StocksPage';
import { ExportButton } from '@/components/reports/ExportButton';

export const FinancialPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <ChartBarIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-8">
          {/* KPIs Financiers */}
          <Grid cols={4} gap={6} className="mb-8">
            <KPICard
              title="Budget Total"
              value="2.5M XOF"
              change="+5.2%"
              trend="up"
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
            />
            <KPICard
              title="Dépenses"
              value="1.8M XOF"
              change="+2.1%"
              trend="up"
              icon={<ChartBarIcon className="h-6 w-6" />}
            />
            <KPICard
              title="Recettes"
              value="1.2M XOF"
              change="+8.3%"
              trend="up"
              icon={<BanknotesIcon className="h-6 w-6" />}
            />
            <KPICard
              title="Solde"
              value="700K XOF"
              change="+12.5%"
              trend="up"
              icon={<DocumentArrowDownIcon className="h-6 w-6" />}
            />
          </Grid>

          {/* Actions rapides */}
          <Card>
            <Card.Header>
              <Card.Title>Actions Rapides</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => setActiveTab('budgets')}
                  className="h-20 flex-col gap-2"
                >
                  <span className="text-lg">Nouveau Budget</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Créer un budget</span>
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<BanknotesIcon className="h-4 w-4" />}
                  onClick={() => setActiveTab('transactions')}
                  className="h-20 flex-col gap-2"
                >
                  <span className="text-lg">Nouvelle Transaction</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Enregistrer une dépense</span>
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                  onClick={() => setActiveTab('reports')}
                  className="h-20 flex-col gap-2"
                >
                  <span className="text-lg">Générer Rapport</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Exporter les données</span>
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      )
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: <ListBulletIcon className="h-4 w-4" />,
      content: <BudgetsPage />
    },
    {
      id: 'stocks',
      label: 'Stocks',
      icon: <BanknotesIcon className="h-4 w-4" />,
      content: <StocksPage />
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <BanknotesIcon className="h-4 w-4" />,
      content: <TransactionsTab />
    },
    {
      id: 'allocations',
      label: 'Allocations',
      icon: <ArrowsRightLeftIcon className="h-4 w-4" />,
      content: <AllocationsPage />
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      content: (
        <Card>
          <Card.Header>
            <Card.Title>Rapports Financiers</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-center py-12">
              <DocumentArrowDownIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Module Rapports en Développement
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                La génération de rapports sera disponible dans la prochaine version.
              </p>
            </div>
          </Card.Content>
        </Card>
      )
    }
  ];

  return (
    <Container size="xl" className="py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BanknotesIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion Financière
            </h1>
          </div>
          <ExportButton module="financial" />
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Module financier {user?.level === 'ministere' ? 'national' : 'local'} - {user?.tenant?.name || 'CROU'}
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        className="space-y-8"
      />
    </Container>
  );
};

export default FinancialPage;
