/**
 * FICHIER: apps/api/test-routes.js
 * SCRIPT: Test des routes API
 *
 * DESCRIPTION:
 * Script Node.js simple pour tester que toutes les routes API sont accessibles
 * Vérifie les endpoints publics et la disponibilité des routes
 *
 * USAGE:
 * node apps/api/test-routes.js
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = process.env.PORT || 3001;

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Routes à tester (endpoints publics)
const routesToTest = [
  { method: 'GET', path: '/health', description: 'Health check simple' },
  { method: 'GET', path: '/api/health', description: 'Health check API avec DB' },
  { method: 'GET', path: '/api', description: 'API info endpoint' }
];

// Routes protégées à vérifier (doivent retourner 401)
const protectedRoutes = [
  { method: 'GET', path: '/api/dashboard', description: 'Dashboard (protégé)' },
  { method: 'GET', path: '/api/financial', description: 'Financial (protégé)' },
  { method: 'GET', path: '/api/stocks', description: 'Stocks (protégé)' },
  { method: 'GET', path: '/api/housing', description: 'Housing (protégé)' },
  { method: 'GET', path: '/api/reports', description: 'Reports (protégé)' },
  { method: 'GET', path: '/api/workflows', description: 'Workflows (protégé)' },
  { method: 'GET', path: '/api/admin/health', description: 'Admin health (protégé)' }
];

/**
 * Faire une requête HTTP
 */
function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Tester une route publique
 */
async function testPublicRoute(route) {
  try {
    const response = await makeRequest(route.method, route.path);

    if (response.statusCode === 200) {
      console.log(`${colors.green}✓${colors.reset} ${route.method} ${route.path} - ${route.description}`);
      return { success: true, route };
    } else {
      console.log(`${colors.red}✗${colors.reset} ${route.method} ${route.path} - Status ${response.statusCode}`);
      return { success: false, route, statusCode: response.statusCode };
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${route.method} ${route.path} - Error: ${error.message}`);
    return { success: false, route, error: error.message };
  }
}

/**
 * Tester une route protégée (doit retourner 401)
 */
async function testProtectedRoute(route) {
  try {
    const response = await makeRequest(route.method, route.path);

    if (response.statusCode === 401) {
      console.log(`${colors.green}✓${colors.reset} ${route.method} ${route.path} - ${route.description} (401 OK)`);
      return { success: true, route };
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} ${route.method} ${route.path} - Expected 401, got ${response.statusCode}`);
      return { success: false, route, statusCode: response.statusCode };
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${route.method} ${route.path} - Error: ${error.message}`);
    return { success: false, route, error: error.message };
  }
}

/**
 * Vérifier que le serveur est démarré
 */
async function checkServerRunning() {
  try {
    await makeRequest('GET', '/health');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}Test des routes API CROU${colors.reset}`);
  console.log(`${colors.blue}Serveur: http://${API_HOST}:${API_PORT}${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Vérifier que le serveur est démarré
  console.log(`${colors.yellow}Vérification du serveur...${colors.reset}`);
  const isRunning = await checkServerRunning();

  if (!isRunning) {
    console.log(`${colors.red}✗ Serveur non accessible!${colors.reset}`);
    console.log(`${colors.yellow}Assurez-vous que le serveur est démarré: npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Serveur accessible\n${colors.reset}`);

  // Tester les routes publiques
  console.log(`${colors.cyan}Test des routes publiques:${colors.reset}`);
  const publicResults = [];
  for (const route of routesToTest) {
    const result = await testPublicRoute(route);
    publicResults.push(result);
  }

  console.log('');

  // Tester les routes protégées
  console.log(`${colors.cyan}Test des routes protégées (doivent retourner 401):${colors.reset}`);
  const protectedResults = [];
  for (const route of protectedRoutes) {
    const result = await testProtectedRoute(route);
    protectedResults.push(result);
  }

  console.log('\n' + '='.repeat(60));

  // Résumé
  const publicSuccess = publicResults.filter(r => r.success).length;
  const protectedSuccess = protectedResults.filter(r => r.success).length;
  const totalSuccess = publicSuccess + protectedSuccess;
  const totalTests = routesToTest.length + protectedRoutes.length;

  console.log(`${colors.cyan}RÉSUMÉ:${colors.reset}`);
  console.log(`Routes publiques: ${publicSuccess}/${routesToTest.length} ${publicSuccess === routesToTest.length ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Routes protégées: ${protectedSuccess}/${protectedRoutes.length} ${protectedSuccess === protectedRoutes.length ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Total: ${totalSuccess}/${totalTests} tests réussis`);

  console.log('='.repeat(60) + '\n');

  if (totalSuccess === totalTests) {
    console.log(`${colors.green}✓ Tous les tests ont réussi!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Certains tests ont échoué${colors.reset}\n`);
    process.exit(1);
  }
}

// Lancer les tests
main().catch(error => {
  console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});
