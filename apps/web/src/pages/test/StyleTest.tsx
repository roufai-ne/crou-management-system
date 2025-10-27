import React from 'react';

export function StyleTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">Test des Styles CROU</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Carte Test 1</h2>
            <p className="text-gray-600">Si vous voyez cette carte avec des styles, Tailwind fonctionne !</p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Bouton Test
            </button>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Carte Test 2</h2>
            <p className="text-green-600">Carte avec thème vert</p>
            <div className="mt-4 w-full bg-green-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{width: '70%'}}></div>
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Carte Test 3</h2>
            <p className="text-red-600">Carte avec thème rouge</p>
            <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Badge
            </span>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Test des Composants</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Champ de saisie
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tapez quelque chose..."
              />
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Primaire
              </button>
              <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Secondaire
              </button>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Succès
              </button>
              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Danger
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Si vous voyez des couleurs, des espacements et des effets, Tailwind CSS fonctionne correctement !
          </p>
        </div>
      </div>
    </div>
  );
}
