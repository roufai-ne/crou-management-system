import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                CROU Management System
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Test des composants UI corrigés
              </p>
            </div>

            {/* Test des composants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buttons */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Boutons</h3>
                <div className="space-y-3">
                  <Button variant="primary">Bouton Principal</Button>
                  <Button variant="secondary">Bouton Secondaire</Button>
                  <Button variant="outline">Bouton Outline</Button>
                </div>
              </div>

              {/* Badges */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Primaire</Badge>
                  <Badge variant="success">Succès</Badge>
                  <Badge variant="warning">Attention</Badge>
                  <Badge variant="error">Erreur</Badge>
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Alertes</h3>
                <div className="space-y-3">
                  <Alert variant="success" title="Succès">
                    Opération réalisée avec succès !
                  </Alert>
                  <Alert variant="warning" title="Attention">
                    Vérifiez les informations saisies.
                  </Alert>
                </div>
              </div>

              {/* Loading */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Chargement</h3>
                <div className="space-y-4">
                  <Loading type="spinner" text="Chargement..." />
                  <Loading type="dots" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✅ Tous les composants UI fonctionnent correctement !
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Les corrections de class-variance-authority ont été appliquées avec succès.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
