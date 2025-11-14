/**
 * Script automatique de correction du dark mode
 * Ajoute les classes dark: manquantes dans tous les fichiers TSX
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns de remplacement
const replacements = [
  // Textes
  {
    pattern: /className="([^"]*?)text-gray-900(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1text-gray-900 dark:text-white$2"',
    description: 'text-gray-900 → text-gray-900 dark:text-white'
  },
  {
    pattern: /className="([^"]*?)text-gray-800(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1text-gray-800 dark:text-gray-100$2"',
    description: 'text-gray-800 → text-gray-800 dark:text-gray-100'
  },
  {
    pattern: /className="([^"]*?)text-gray-700(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1text-gray-700 dark:text-gray-300$2"',
    description: 'text-gray-700 → text-gray-700 dark:text-gray-300'
  },
  {
    pattern: /className="([^"]*?)text-gray-600(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1text-gray-600 dark:text-gray-400$2"',
    description: 'text-gray-600 → text-gray-600 dark:text-gray-400'
  },
  {
    pattern: /className="([^"]*?)text-gray-500(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1text-gray-500 dark:text-gray-400$2"',
    description: 'text-gray-500 → text-gray-500 dark:text-gray-400'
  },
  {
    pattern: /className="([^"]*?)text-gray-400(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1text-gray-400 dark:text-gray-500$2"',
    description: 'text-gray-400 → text-gray-400 dark:text-gray-500'
  },

  // Backgrounds
  {
    pattern: /className="([^"]*?)bg-white(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1bg-white dark:bg-gray-800$2"',
    description: 'bg-white → bg-white dark:bg-gray-800'
  },
  {
    pattern: /className="([^"]*?)bg-gray-50(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1bg-gray-50 dark:bg-gray-900$2"',
    description: 'bg-gray-50 → bg-gray-50 dark:bg-gray-900'
  },
  {
    pattern: /className="([^"]*?)bg-gray-100(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1bg-gray-100 dark:bg-gray-800$2"',
    description: 'bg-gray-100 → bg-gray-100 dark:bg-gray-800'
  },
  {
    pattern: /className="([^"]*?)bg-gray-200(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1bg-gray-200 dark:bg-gray-700$2"',
    description: 'bg-gray-200 → bg-gray-200 dark:bg-gray-700'
  },

  // Borders
  {
    pattern: /className="([^"]*?)border-gray-100(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1border-gray-100 dark:border-gray-800$2"',
    description: 'border-gray-100 → border-gray-100 dark:border-gray-800'
  },
  {
    pattern: /className="([^"]*?)border-gray-200(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1border-gray-200 dark:border-gray-700$2"',
    description: 'border-gray-200 → border-gray-200 dark:border-gray-700'
  },
  {
    pattern: /className="([^"]*?)border-gray-300(?!\s+dark:)([^"]*?)"/g,
    replacement: 'className="$1border-gray-300 dark:border-gray-600$2"',
    description: 'border-gray-300 → border-gray-300 dark:border-gray-600'
  }
];

// Fichiers à exclure
const excludePatterns = [
  '**/node_modules/**',
  '**/*.test.tsx',
  '**/*.spec.tsx',
  '**/*.stories.tsx',
  '**/ProfilePage.old.tsx',
  '**/dist/**',
  '**/build/**'
];

// Fonction pour traiter un fichier
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  replacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      content = content.replace(pattern, replacement);
      modified = true;
      changes.push(`  - ${description}: ${matches.length} occurrence(s)`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
    changes.forEach(change => console.log(change));
    console.log('');
  }

  return modified;
}

// Fonction principale
function main() {
  const srcDir = path.join(__dirname, 'src');

  console.log('🔍 Recherche des fichiers TSX...\n');

  const files = glob.sync('**/*.tsx', {
    cwd: srcDir,
    absolute: true,
    ignore: excludePatterns
  });

  console.log(`📁 ${files.length} fichiers TSX trouvés\n`);
  console.log('🔧 Application des corrections...\n');

  let modifiedCount = 0;
  files.forEach(file => {
    if (processFile(file)) {
      modifiedCount++;
    }
  });

  console.log('\n✨ Terminé!');
  console.log(`📊 ${modifiedCount} fichier(s) modifié(s) sur ${files.length}`);
}

// Exécution
try {
  main();
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
