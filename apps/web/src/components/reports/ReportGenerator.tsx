/**
 * FICHIER: apps\web\src\components\reports\ReportGenerator.tsx
 * COMPOSANT: ReportGenerator - Générateur de rapports
 * 
 * DESCRIPTION:
 * Composant pour la génération de rapports Excel/PDF
 * Interface utilisateur intuitive
 * Support de tous les types de rapports
 * 
 * FONCTIONNALITÉS:
 * - Sélection du type de rapport
 * - Configuration des paramètres
 * - Prévisualisation des données
 * - Génération et téléchargement
 * - Historique des rapports
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, 
  Download, 
  Settings, 
  Calendar,
  Filter,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

// Types pour les rapports
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  formats: string[];
  sections: string[];
}

interface ReportFormat {
  type: string;
  name: string;
  description: string;
  mimeType: string;
  features: string[];
}

interface ReportConfig {
  type: 'excel' | 'pdf';
  format: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  filters?: any;
  options?: any;
}

interface ReportHistory {
  id: string;
  name: string;
  type: string;
  format: string;
  status: 'completed' | 'failed' | 'processing';
  createdAt: Date;
  size?: number;
  downloadUrl?: string;
}

export function ReportGenerator() {
  const { hasPermission } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('excel');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [formats, setFormats] = useState<ReportFormat[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);

  // Charger les templates et formats
  useEffect(() => {
    loadTemplates();
    loadFormats();
    loadHistory();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await useApi().apiClient.get('/reports/templates');
      setTemplates(data.data);
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    }
  };

  const loadFormats = async () => {
    try {
      const { data } = await useApi().apiClient.get('/reports/formats');
      setFormats(data.data);
    } catch (error) {
      console.error('Erreur chargement formats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      // TODO: Implémenter l'API d'historique
      setHistory([]);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast.error('Veuillez sélectionner un type de rapport');
      return;
    }

    setIsGenerating(true);

    try {
      const config: ReportConfig = {
        type: selectedFormat as 'excel' | 'pdf',
        format: selectedTemplate,
        period: selectedPeriod as any,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        filters: {},
        options: {
          includeCharts: true,
          includeDetails: true,
          includeSummary: true,
          language: 'fr'
        }
      };

      // Données mockées pour la démonstration
      const mockData = getMockData(selectedTemplate);

      const response = await useApi().apiClient.post(`/reports/${selectedTemplate}`, {
        ...config,
        data: mockData
      }, {
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers['content-disposition']?.split('filename=')[1] || 'rapport';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Rapport généré avec succès !');
      
      // Ajouter à l'historique
      const newReport: ReportHistory = {
        id: Date.now().toString(),
        name: `Rapport ${templates.find(t => t.id === selectedTemplate)?.name}`,
        type: selectedTemplate,
        format: selectedFormat,
        status: 'completed',
        createdAt: new Date(),
        size: blob.size
      };
      setHistory(prev => [newReport, ...prev]);

    } catch (error: any) {
      console.error('Erreur génération rapport:', error);
      toast.error('Erreur lors de la génération du rapport');
      
      // Ajouter à l'historique avec statut échec
      const failedReport: ReportHistory = {
        id: Date.now().toString(),
        name: `Rapport ${templates.find(t => t.id === selectedTemplate)?.name}`,
        type: selectedTemplate,
        format: selectedFormat,
        status: 'failed',
        createdAt: new Date()
      };
      setHistory(prev => [failedReport, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMockData = (template: string) => {
    switch (template) {
      case 'financial':
        return {
          budgets: [
            {
              id: '1',
              title: 'Budget Éducation',
              category: 'Éducation',
              amount: 5000000,
              spent: 3750000,
              status: 'active',
              createdAt: new Date()
            },
            {
              id: '2',
              title: 'Budget Logement',
              category: 'Logement',
              amount: 3000000,
              spent: 2400000,
              status: 'active',
              createdAt: new Date()
            }
          ],
          transactions: [
            {
              id: '1',
              description: 'Achat matériel éducatif',
              amount: 150000,
              type: 'debit',
              category: 'Éducation',
              status: 'completed',
              date: new Date(),
              reference: 'EDU-001'
            },
            {
              id: '2',
              description: 'Maintenance logements',
              amount: 75000,
              type: 'debit',
              category: 'Logement',
              status: 'completed',
              date: new Date(),
              reference: 'LOG-001'
            }
          ],
          cashFlow: [
            {
              mois: 'Janvier 2024',
              recettes: 8000000,
              depenses: 6000000
            },
            {
              mois: 'Février 2024',
              recettes: 7500000,
              depenses: 5500000
            }
          ]
        };

      case 'stocks':
        return {
          stocks: [
            {
              id: '1',
              name: 'Ordinateurs',
              description: 'Ordinateurs de bureau',
              quantity: 50,
              price: 150000,
              threshold: 10,
              status: 'normal',
              category: 'Informatique'
            },
            {
              id: '2',
              name: 'Tables',
              description: 'Tables de bureau',
              quantity: 5,
              price: 25000,
              threshold: 10,
              status: 'alert',
              category: 'Mobilier'
            }
          ],
          movements: [
            {
              id: '1',
              type: 'in',
              quantity: 10,
              date: new Date(),
              reason: 'Achat',
              user: 'Magasinier'
            },
            {
              id: '2',
              type: 'out',
              quantity: 5,
              date: new Date(),
              reason: 'Distribution',
              user: 'Magasinier'
            }
          ],
          alerts: [
            {
              id: '1',
              type: 'low_stock',
              message: 'Stock faible pour les tables',
              status: 'active',
              date: new Date()
            }
          ]
        };

      case 'housing':
        return {
          housings: [
            {
              id: '1',
              name: 'Résidence A',
              type: 'Résidence',
              capacity: 100,
              occupied: 85,
              status: 'active',
              address: 'Niamey, Niger'
            },
            {
              id: '2',
              name: 'Résidence B',
              type: 'Résidence',
              capacity: 80,
              occupied: 60,
              status: 'active',
              address: 'Niamey, Niger'
            }
          ],
          rooms: [
            {
              id: '1',
              name: 'Chambre 101',
              type: 'Chambre',
              capacity: 2,
              occupied: 2,
              status: 'occupied',
              housingId: '1'
            },
            {
              id: '2',
              name: 'Chambre 102',
              type: 'Chambre',
              capacity: 2,
              occupied: 1,
              status: 'available',
              housingId: '1'
            }
          ],
          occupancies: [
            {
              id: '1',
              studentName: 'Ahmed Ali',
              roomId: '1',
              startDate: new Date(),
              status: 'active'
            }
          ]
        };

      case 'transport':
        return {
          vehicles: [
            {
              id: '1',
              make: 'Toyota',
              model: 'Hilux',
              licensePlate: 'RN-1234',
              type: 'Pickup',
              status: 'active',
              mileage: 50000,
              year: 2020
            },
            {
              id: '2',
              make: 'Nissan',
              model: 'Navara',
              licensePlate: 'RN-5678',
              type: 'Pickup',
              status: 'maintenance',
              mileage: 75000,
              year: 2019
            }
          ],
          maintenances: [
            {
              id: '1',
              vehicleId: '1',
              type: 'Révision',
              description: 'Révision périodique',
              cost: 150000,
              date: new Date(),
              status: 'completed'
            }
          ],
          usages: [
            {
              id: '1',
              vehicleId: '1',
              driver: 'Chauffeur A',
              purpose: 'Transport étudiants',
              startDate: new Date(),
              endDate: new Date(),
              distance: 100
            }
          ]
        };

      case 'dashboard':
        return {
          kpis: [
            {
              name: 'Budget Total',
              value: '15,000,000 FCFA',
              unit: 'FCFA',
              trend: 'up'
            },
            {
              name: 'Taux d\'Occupation',
              value: '85%',
              unit: '%',
              trend: 'stable'
            },
            {
              name: 'Véhicules Actifs',
              value: '8/10',
              unit: 'véhicules',
              trend: 'down'
            }
          ],
          charts: [],
          metrics: []
        };

      default:
        return {};
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'processing':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Générateur de Rapports</h1>
          <p className="text-gray-600 mt-1">
            Générez des rapports Excel et PDF personnalisés
          </p>
        </div>
        <Button
          onClick={loadTemplates}
          variant="outline"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Configuration du Rapport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection du type de rapport */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Type de Rapport
                </label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                  options={templates.map(template => ({
                    value: template.id,
                    label: template.name
                  }))}
                  placeholder="Sélectionnez un type de rapport"
                />
                {selectedTemplate && (
                  <p className="text-sm text-gray-600">
                    {templates.find(t => t.id === selectedTemplate)?.description}
                  </p>
                )}
              </div>

              {/* Sélection du format */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Format de Sortie
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {formats.map(format => (
                    <Card
                      key={format.type}
                      className={`cursor-pointer transition-colors ${
                        selectedFormat === format.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFormat(format.type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          <div>
                            <h3 className="font-medium">{format.name}</h3>
                            <p className="text-sm text-gray-600">{format.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Période */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Période
                </label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                  options={[
                    { value: 'daily', label: 'Quotidien' },
                    { value: 'weekly', label: 'Hebdomadaire' },
                    { value: 'monthly', label: 'Mensuel' },
                    { value: 'quarterly', label: 'Trimestriel' },
                    { value: 'yearly', label: 'Annuel' },
                    { value: 'custom', label: 'Personnalisé' }
                  ]}
                />
              </div>

              {/* Dates personnalisées */}
              {selectedPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date de Début
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date de Fin
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Bouton de génération */}
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedTemplate || isGenerating}
                  leftIcon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                >
                  {isGenerating ? 'Génération...' : 'Générer le Rapport'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historique des Rapports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun rapport généré</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(report.status)}
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <p className="text-sm text-gray-600">
                            {report.type} • {report.format} • {report.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(report.status) as any}>
                          {report.status}
                        </Badge>
                        {report.size && (
                          <span className="text-sm text-gray-500">
                            {(report.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Templates Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium">{template.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.formats.map((format) => (
                          <Badge key={format} variant="blue">
                            {format.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
