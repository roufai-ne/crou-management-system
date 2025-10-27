import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              CROU Management System
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Application de test - Version simplifiée
            </p>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-green-600 font-medium">
                ✅ Application chargée avec succès
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Les composants de base fonctionnent correctement
              </p>
            </div>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
