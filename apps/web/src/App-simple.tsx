/**
 * FICHIER: apps\web\src\App-simple.tsx
 * VERSION SIMPLIFIÉE DE L'APPLICATION CROU
 */

import React, { useState } from 'react';
import './styles/globals.css';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  level: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

function App() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  const [loginForm, setLoginForm] = useState({
    email: 'admin@crou.gov.ne',
    password: 'password123'
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (response.ok) {
        setAuth({
          isAuthenticated: true,
          user: data.user,
          token: data.tokens.accessToken
        });
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      alert('Erreur de connexion: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null
    });
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Système CROU</h1>
            <p className="text-gray-600 mt-2">Connexion à votre compte</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>Compte de test:</p>
            <p>Email: admin@crou.gov.ne</p>
            <p>Mot de passe: password123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Système CROU</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {auth.user?.name} ({auth.user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="text-sm font-medium text-gray-500 truncate">
                  Module Financier
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  💰
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Gestion budgets et transactions
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="text-sm font-medium text-gray-500 truncate">
                  Module Stocks
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  📦
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Gestion inventaire et approvisionnement
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="text-sm font-medium text-gray-500 truncate">
                  Module Logement
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  🏠
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Gestion hébergements étudiants
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="text-sm font-medium text-gray-500 truncate">
                  Module Rapports
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  📊
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Génération rapports et analyses
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="text-sm font-medium text-gray-500 truncate">
                  Module Notifications
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  🔔
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Système de notifications
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="text-sm font-medium text-gray-500 truncate">
                  Module Workflows
                </div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  ⚙️
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Processus de validation
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status API</h2>
              <div className="space-y-2 text-sm">
                <div>✅ Backend API: http://localhost:3001</div>
                <div>✅ Frontend Web: http://localhost:3000</div>
                <div>✅ Authentification: Fonctionnel</div>
                <div>✅ Modules: 6 modules disponibles</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
