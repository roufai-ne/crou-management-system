import React from 'react';

export function LoginTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Système CROU Niger
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="votre.email@crou.ne"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="••••••••"
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                Mot de passe oublié ?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Se connecter
            </button>

            {/* Test buttons */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Tests des styles :</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded text-sm transition duration-200"
                >
                  Succès
                </button>
                <button
                  type="button"
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded text-sm transition duration-200"
                >
                  Erreur
                </button>
                <button
                  type="button"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded text-sm transition duration-200"
                >
                  Alerte
                </button>
                <button
                  type="button"
                  className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 rounded text-sm transition duration-200"
                >
                  Info
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Status indicators */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4">
            <div className="flex items-center text-green-600">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs">Tailwind CSS</span>
            </div>
            <div className="flex items-center text-blue-600">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-xs">React</span>
            </div>
            <div className="flex items-center text-purple-600">
              <div className="h-2 w-2 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-xs">Vite</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Si vous voyez des couleurs et des effets, les styles fonctionnent !
          </p>
        </div>
      </div>
    </div>
  );
}
