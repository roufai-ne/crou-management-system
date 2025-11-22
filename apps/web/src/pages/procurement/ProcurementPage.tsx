/**
 * FICHIER: apps/web/src/pages/procurement/ProcurementPage.tsx
 * PAGE: ProcurementPage - Module de gestion des achats
 *
 * DESCRIPTION:
 * Module principal pour la gestion des achats et approvisionnements
 * Bons de commande, demandes d'achat, réceptions, fournisseurs
 * Vue adaptée selon le niveau et permissions utilisateur
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { useAuth } from '@/stores/auth';
import { Container, Card, Badge, Button, Grid, KPICard, Tabs } from '@/components/ui';
import { 
  ShoppingCartIcon, 
  DocumentTextIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { PurchaseOrdersTab } from './PurchaseOrdersTab';
import { PurchaseRequestsTab } from './PurchaseRequestsTab';
import { ReceptionsTab } from './ReceptionsTab';
import { ExportButton } from '@/components/reports/ExportButton';

export const ProcurementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <ClipboardDocumentCheckIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-8">
          {/* KPIs Procurement */}
          <Grid cols={4} gap={6} className="mb-8">
            <KPICard
              title="Bons de commande"
              value="45"
              trend={{ direction: 'up' as const, value: 12.5 }}
              icon={<DocumentTextIcon className="h-6 w-6" />}
              description="En cours ce mois"
            />
            <KPICard
              title="Montant engagé"
              value="8.5M XOF"
              trend={{ direction: 'up' as const, value: 5.2 }}
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
              description="Budget engagé"
            />
            <KPICard
              title="En attente réception"
              value="12"
              trend={{ direction: 'down' as const, value: 8.1 }}
              icon={<TruckIcon className="h-6 w-6" />}
              description="Commandes à recevoir"
            />
            <KPICard
              title="Taux de réception"
              value="87%"
              trend={{ direction: 'up' as const, value: 3.4 }}
              icon={<ArchiveBoxIcon className="h-6 w-6" />}
              description="Dans les délais"
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
                  onClick={() => setActiveTab('purchase-orders')}
                  className="h-20 flex-col gap-2"
                >
                  <span className="text-lg">Nouveau Bon de Commande</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Créer un BC</span>
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<ClipboardDocumentCheckIcon className="h-4 w-4" />}
                  onClick={() => setActiveTab('requests')}
                  className="h-20 flex-col gap-2"
                >
                  <span className="text-lg">Demande d'Achat</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Nouvelle demande</span>
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<TruckIcon className="h-4 w-4" />}
                  onClick={() => setActiveTab('receptions')}
                  className="h-20 flex-col gap-2"
                >
                  <span className="text-lg">Réceptionner</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Gérer les réceptions</span>
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Statistiques récentes */}
          <Grid cols={2} gap={6}>
            <Card>
              <Card.Header>
                <Card.Title>Commandes récentes</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">BC-NIAMEY-2025-001</p>
                      <p className="text-sm text-gray-500">Fournitures de bureau</p>
                    </div>
                    <Badge variant="success">Approuvé</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">BC-NIAMEY-2025-002</p>
                      <p className="text-sm text-gray-500">Matériel informatique</p>
                    </div>
                    <Badge variant="warning">En attente</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">BC-NIAMEY-2025-003</p>
                      <p className="text-sm text-gray-500">Produits d'entretien</p>
                    </div>
                    <Badge variant="info">Commandé</Badge>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Réceptions en attente</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">BC-NIAMEY-2024-156</p>
                      <p className="text-sm text-gray-500">Prévu: 15 Jan 2025</p>
                    </div>
                    <Badge variant="warning">En retard</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">BC-NIAMEY-2025-001</p>
                      <p className="text-sm text-gray-500">Prévu: 20 Jan 2025</p>
                    </div>
                    <Badge variant="success">À l'heure</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">BC-NIAMEY-2025-003</p>
                      <p className="text-sm text-gray-500">Prévu: 25 Jan 2025</p>
                    </div>
                    <Badge variant="success">À l'heure</Badge>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </Grid>
        </div>
      )
    },
    {
      id: 'purchase-orders',
      label: 'Bons de Commande',
      icon: <DocumentTextIcon className="h-4 w-4" />,
      content: <PurchaseOrdersTab />
    },
    {
      id: 'requests',
      label: 'Demandes d\'Achat',
      icon: <ShoppingCartIcon className="h-4 w-4" />,
      content: <PurchaseRequestsTab />
    },
    {
      id: 'receptions',
      label: 'Réceptions',
      icon: <TruckIcon className="h-4 w-4" />,
      content: <ReceptionsTab />
    }
  ];

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achats & Approvisionnements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gestion des bons de commande, demandes d'achat et réceptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            module="financial"
            title="Exporter"
          />
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setActiveTab('purchase-orders')}
          >
            Nouveau BC
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab.id} value={tab.id}>
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {tabs.map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id}>
            {tab.content}
          </Tabs.Content>
        ))}
      </Tabs>
    </Container>
  );
};
