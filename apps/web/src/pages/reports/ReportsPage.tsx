import React, { useState } from 'react';
import { Container, Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import {
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon, EyeIcon
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
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <Card.Title>Templates de Rapports</Card.Title>
                  <Button variant="primary" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouveau Template
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    Les templates permettent de personnaliser la présentation de vos rapports avec des variables dynamiques.
                  </p>

                  {/* Liste des templates prédéfinis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Template Financier */}
                    <Card className="border-2 border-gray-200">
                      <Card.Header>
                        <Card.Title className="text-base flex items-center">
                          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
                          Rapport Financier Standard
                        </Card.Title>
                      </Card.Header>
                      <Card.Content>
                        <p className="text-sm text-gray-600 mb-3">
                          Template par défaut pour les rapports financiers avec budgets, dépenses et revenus.
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="info">Financier</Badge>
                          <Badge variant="success">Actif</Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Aperçu
                          </Button>
                        </div>
                      </Card.Content>
                    </Card>

                    {/* Template Stocks */}
                    <Card className="border-2 border-gray-200">
                      <Card.Header>
                        <Card.Title className="text-base flex items-center">
                          <DocumentTextIcon className="h-5 w-5 mr-2 text-green-500" />
                          Rapport d'Inventaire
                        </Card.Title>
                      </Card.Header>
                      <Card.Content>
                        <p className="text-sm text-gray-600 mb-3">
                          Template pour les rapports de stocks avec mouvements et alertes.
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="success">Stocks</Badge>
                          <Badge variant="success">Actif</Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Aperçu
                          </Button>
                        </div>
                      </Card.Content>
                    </Card>

                    {/* Template Transport */}
                    <Card className="border-2 border-gray-200">
                      <Card.Header>
                        <Card.Title className="text-base flex items-center">
                          <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-500" />
                          Rapport Transport
                        </Card.Title>
                      </Card.Header>
                      <Card.Content>
                        <p className="text-sm text-gray-600 mb-3">
                          Template pour les rapports de transport et maintenance véhicules.
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="warning">Transport</Badge>
                          <Badge variant="success">Actif</Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Aperçu
                          </Button>
                        </div>
                      </Card.Content>
                    </Card>

                    {/* Template Personnalisé */}
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <Card.Content className="flex flex-col items-center justify-center py-8">
                        <PlusIcon className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-2">Créer un template personnalisé</p>
                        <p className="text-xs text-gray-500 text-center mb-4">
                          Définissez vos propres sections et variables
                        </p>
                        <Button variant="outline" size="sm">
                          Nouveau Template
                        </Button>
                      </Card.Content>
                    </Card>
                  </div>

                  {/* Variables disponibles */}
                  <Card className="mt-6 bg-blue-50 border-blue-200">
                    <Card.Header>
                      <Card.Title className="text-base">Variables Disponibles</Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <p className="text-sm text-gray-700 mb-3">
                        Utilisez ces variables dans vos templates pour insérer des données dynamiques:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <code className="bg-white px-2 py-1 rounded border">{`{{tenant.name}}`}</code>
                        <code className="bg-white px-2 py-1 rounded border">{`{{date}}`}</code>
                        <code className="bg-white px-2 py-1 rounded border">{`{{period}}`}</code>
                        <code className="bg-white px-2 py-1 rounded border">{`{{total}}`}</code>
                        <code className="bg-white px-2 py-1 rounded border">{`{{currency}}`}</code>
                        <code className="bg-white px-2 py-1 rounded border">{`{{user.name}}`}</code>
                      </div>
                    </Card.Content>
                  </Card>
                </div>
              </Card.Content>
            </Card>
          </div>
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