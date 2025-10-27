import React, { useState } from 'react';
import { Container, Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { 
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useQuickReports } from '@/hooks/useReports';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quick');
  
  const {
    generateFinancialReport,
    generateStocksReport,
    generateHousingReport,
    generateTransportReport,
    generateConsolidatedReport
  } = useQuickReports();

  const tabs = [
    { id: 'quick', label: 'Rapports Rapides', icon: ChartBarIcon },
    { id: 'templates', label: 'Templates', icon: DocumentTextIcon },
    { id: 'jobs', label: 'Jobs', icon: ClockIcon },
    { id: 'scheduled', label: 'Planifiés', icon: CalendarIcon }
  ];

  return (
    <Container size="xl" className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Rapports</h1>
        <p className="text-lg text-gray-600 mt-2">
          Génération et planification de rapports Excel/PDF
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="quick">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Rapport Financier</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 mb-4">
                  Rapport complet des finances avec graphiques
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateFinancialReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'excel'
                    })}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateFinancialReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'pdf'
                    })}
                  >
                    PDF
                  </Button>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Rapport de Stocks</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 mb-4">
                  Rapport d'inventaire avec alertes
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateStocksReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'excel'
                    })}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateStocksReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'pdf'
                    })}
                  >
                    PDF
                  </Button>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Rapport de Logement</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 mb-4">
                  Rapport d'occupation et revenus
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateHousingReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'excel'
                    })}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateHousingReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'pdf'
                    })}
                  >
                    PDF
                  </Button>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Rapport de Transport</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 mb-4">
                  Rapport de performance du parc
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateTransportReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'excel'
                    })}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateTransportReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'pdf'
                    })}
                  >
                    PDF
                  </Button>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Rapport Consolidé</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 mb-4">
                  Rapport consolidé de tous les modules
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateConsolidatedReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'excel'
                    })}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateConsolidatedReport({
                      startDate: new Date(),
                      endDate: new Date(),
                      format: 'pdf'
                    })}
                  >
                    PDF
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <Card.Header>
              <Card.Title>Templates de Rapports</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Templates en Développement
                </h3>
                <p className="text-gray-600">
                  La gestion des templates sera disponible dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <Card.Header>
              <Card.Title>Jobs de Rapports</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Jobs en Développement
                </h3>
                <p className="text-gray-600">
                  Le suivi des jobs sera disponible dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <Card.Header>
              <Card.Title>Rapports Planifiés</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Planification en Développement
                </h3>
                <p className="text-gray-600">
                  La planification automatique sera disponible dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default ReportsPage;