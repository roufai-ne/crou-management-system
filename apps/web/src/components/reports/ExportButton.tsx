/**
 * FICHIER: apps/web/src/components/reports/ExportButton.tsx
 * COMPOSANT: ExportButton - Bouton d'export de rapports
 *
 * DESCRIPTION:
 * Composant réutilisable pour l'export de rapports
 * Intégration dans les modules existants
 * Support Excel et PDF
 *
 * FONCTIONNALITÉS:
 * - Export rapide Excel/PDF
 * - Intégration dans les modules
 * - Gestion des erreurs
 * - Feedback utilisateur
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { Button, Modal, Select, DateInput } from '@/components/ui';
import { DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useQuickReports } from '@/hooks/useReports';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  module: 'financial' | 'stocks' | 'housing' | 'transport' | 'consolidated';
  title?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  module,
  title = 'Exporter',
  variant = 'outline',
  size = 'md',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    generateFinancialReport,
    generateStocksReport,
    generateHousingReport,
    generateTransportReport,
    generateConsolidatedReport
  } = useQuickReports();

  const getModuleTitle = () => {
    switch (module) {
      case 'financial': return 'Rapport Financier';
      case 'stocks': return 'Rapport de Stocks';
      case 'housing': return 'Rapport de Logement';
      case 'transport': return 'Rapport de Transport';
      case 'consolidated': return 'Rapport Consolidé';
      default: return 'Rapport';
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      let reportPromise;
      
      switch (module) {
        case 'financial':
          reportPromise = generateFinancialReport({ startDate, endDate, format });
          break;
        case 'stocks':
          reportPromise = generateStocksReport({ startDate, endDate, format });
          break;
        case 'housing':
          reportPromise = generateHousingReport({ startDate, endDate, format });
          break;
        case 'transport':
          reportPromise = generateTransportReport({ startDate, endDate, format });
          break;
        case 'consolidated':
          reportPromise = generateConsolidatedReport({ startDate, endDate, format });
          break;
        default:
          throw new Error('Module non supporté');
      }

      const job = await reportPromise;
      toast.success(`Rapport ${format.toUpperCase()} généré avec succès !`);
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {title}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Générer ${getModuleTitle()}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez les paramètres pour générer votre rapport.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <DateInput
              label="Date de début"
              value={startDate}
              onChange={setStartDate}
            />
            <DateInput
              label="Date de fin"
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          <Select
            label="Format"
            value={format}
            onValueChange={(value) => setFormat(value as 'excel' | 'pdf')}
            options={[
              { value: 'excel', label: 'Excel (.xlsx)' },
              { value: 'pdf', label: 'PDF (.pdf)' }
            ]}
          />

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isGenerating}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              loading={isGenerating}
              leftIcon={<ChartBarIcon className="h-4 w-4" />}
            >
              {isGenerating ? 'Génération...' : 'Générer le Rapport'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
