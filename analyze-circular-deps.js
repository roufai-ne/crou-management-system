/**
 * Script d'analyse des imports circulaires dans les entités TypeORM
 * Parcourt tous les fichiers .entity.ts et détecte les cycles d'imports
 */

const fs = require('fs');
const path = require('path');

const ENTITIES_DIR = path.join(__dirname, 'packages', 'database', 'src', 'entities');

// Structure pour stocker les résultats
const result = {
  circularDependencies: [],
  problematicRelations: [],
  stats: {
    totalEntities: 0,
    entitiesWithCircularImports: 0,
    criticalCycles: 0
  }
};

// Map des entités et leurs imports
const entityGraph = new Map();
const entityRelations = new Map();

/**
 * Extraire le nom de l'entité depuis le nom de fichier
 */
function getEntityName(filename) {
  return filename.replace('.entity.ts', '');
}

/**
 * Parser un fichier d'entité pour extraire les imports et relations
 */
function parseEntityFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const entityName = getEntityName(filename);
  
  const imports = [];
  const relations = [];
  
  // Regex pour détecter les imports d'entités
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]\.\/([^'"]+)\.entity['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importedEntities = match[1].split(',').map(e => e.trim());
    const fromFile = match[2];
    
    importedEntities.forEach(entity => {
      if (entity && !entity.startsWith('//')) {
        imports.push({
          entity: fromFile,
          importedName: entity
        });
      }
    });
  }
  
  // Regex pour détecter les décorateurs de relations
  const relationRegex = /@(ManyToOne|OneToMany|OneToOne|ManyToMany)\s*\(\s*(?:['"]([^'"]+)['"]|\(\)\s*=>\s*([A-Za-z]+))/g;
  
  while ((match = relationRegex.exec(content)) !== null) {
    const relationType = match[1];
    const targetEntity = match[2] || match[3]; // String reference ou arrow function
    const isStringReference = !!match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    relations.push({
      type: relationType,
      targetEntity,
      isStringReference,
      line: lineNumber,
      usesArrowFunction: !isStringReference
    });
  }
  
  return {
    entityName,
    imports,
    relations,
    filePath
  };
}

/**
 * Construire le graphe de dépendances
 */
function buildDependencyGraph() {
  const files = fs.readdirSync(ENTITIES_DIR)
    .filter(f => f.endsWith('.entity.ts') && !f.endsWith('.d.ts'));
  
  result.stats.totalEntities = files.length;
  
  files.forEach(file => {
    const filePath = path.join(ENTITIES_DIR, file);
    const entityData = parseEntityFile(filePath);
    
    entityGraph.set(entityData.entityName, {
      imports: entityData.imports.map(i => i.entity),
      relations: entityData.relations,
      filePath: entityData.filePath
    });
    
    entityRelations.set(entityData.entityName, entityData.relations);
  });
}

/**
 * Détecter les cycles directs (A -> B -> A)
 */
function detectDirectCycles() {
  const visited = new Set();
  const cycles = [];
  
  for (const [entityName, data] of entityGraph) {
    data.imports.forEach(importedEntity => {
      const importedData = entityGraph.get(importedEntity);
      
      if (importedData && importedData.imports.includes(entityName)) {
        const cycleKey = [entityName, importedEntity].sort().join('-');
        
        if (!visited.has(cycleKey)) {
          visited.add(cycleKey);
          cycles.push({
            cycle: [entityName, importedEntity, entityName],
            details: `${entityName} imports ${importedEntity}, ${importedEntity} imports ${entityName}`,
            severity: 'high',
            recommendation: 'Use string references in decorators instead of arrow functions'
          });
        }
      }
    });
  }
  
  return cycles;
}

/**
 * Détecter les cycles indirects (A -> B -> C -> A)
 */
function detectIndirectCycles() {
  const cycles = [];
  
  function dfs(entity, path, visited) {
    if (path.includes(entity)) {
      // Cycle détecté
      const cycleStart = path.indexOf(entity);
      const cycle = path.slice(cycleStart).concat(entity);
      
      // Éviter les doublons
      const cycleKey = cycle.slice(0, -1).sort().join('-');
      if (!visited.has(cycleKey)) {
        visited.add(cycleKey);
        
        const details = cycle.slice(0, -1)
          .map((e, i) => `${e} imports ${cycle[i + 1]}`)
          .join(', ');
        
        cycles.push({
          cycle,
          details,
          severity: cycle.length > 4 ? 'medium' : 'high',
          recommendation: 'Break the circular dependency using string references or lazy imports'
        });
      }
      return;
    }
    
    const data = entityGraph.get(entity);
    if (!data) return;
    
    data.imports.forEach(importedEntity => {
      dfs(importedEntity, [...path, entity], visited);
    });
  }
  
  const globalVisited = new Set();
  
  for (const entityName of entityGraph.keys()) {
    dfs(entityName, [], globalVisited);
  }
  
  return cycles;
}

/**
 * Vérifier les relations problématiques
 */
function checkProblematicRelations() {
  const problematic = [];
  
  for (const [entityName, relations] of entityRelations) {
    relations.forEach(relation => {
      const entityData = entityGraph.get(entityName);
      const targetData = entityGraph.get(relation.targetEntity);
      
      // Vérifier si l'entité utilise une fonction fléchée mais n'importe pas l'entité cible
      if (relation.usesArrowFunction && entityData) {
        const hasImport = entityData.imports.includes(relation.targetEntity);
        
        if (!hasImport && targetData) {
          problematic.push({
            entity: entityName,
            relation: relation.type,
            target: relation.targetEntity,
            issue: `Uses arrow function () => ${relation.targetEntity} but doesn't import ${relation.targetEntity}`,
            line: relation.line,
            severity: 'critical',
            fix: `Add import { ${relation.targetEntity} } from './${relation.targetEntity}.entity' or use string reference`
          });
        }
      }
      
      // Vérifier si l'entité utilise une string reference mais importe quand même
      if (relation.isStringReference && entityData) {
        const hasImport = entityData.imports.includes(relation.targetEntity);
        
        if (hasImport) {
          problematic.push({
            entity: entityName,
            relation: relation.type,
            target: relation.targetEntity,
            issue: `Uses string reference '${relation.targetEntity}' but still imports it (unnecessary)`,
            line: relation.line,
            severity: 'low',
            fix: `Remove the import statement for ${relation.targetEntity} since you're using string reference`
          });
        }
      }
      
      // Vérifier si l'entité cible n'existe pas
      if (!targetData && !['User', 'Tenant', 'Student', 'Housing', 'Room'].includes(relation.targetEntity)) {
        problematic.push({
          entity: entityName,
          relation: relation.type,
          target: relation.targetEntity,
          issue: `References non-existent entity '${relation.targetEntity}'`,
          line: relation.line,
          severity: 'critical',
          fix: `Create ${relation.targetEntity}.entity.ts or fix the entity name`
        });
      }
    });
  }
  
  return problematic;
}

/**
 * Analyser les entités avec imports circulaires
 */
function analyzeCircularImports() {
  const entitiesWithCircular = new Set();
  
  result.circularDependencies.forEach(cycle => {
    cycle.cycle.slice(0, -1).forEach(entity => {
      entitiesWithCircular.add(entity);
    });
    
    if (cycle.severity === 'high') {
      result.stats.criticalCycles++;
    }
  });
  
  result.stats.entitiesWithCircularImports = entitiesWithCircular.size;
}

/**
 * Fonction principale d'analyse
 */
function analyze() {
  console.log('🔍 Analyse des imports circulaires dans les entités TypeORM...\n');
  
  // Construire le graphe
  console.log('📊 Construction du graphe de dépendances...');
  buildDependencyGraph();
  console.log(`✅ ${result.stats.totalEntities} entités analysées\n`);
  
  // Détecter les cycles directs
  console.log('🔄 Détection des cycles directs (A ↔ B)...');
  const directCycles = detectDirectCycles();
  console.log(`   Trouvé: ${directCycles.length} cycles directs\n`);
  
  // Détecter les cycles indirects
  console.log('🔄 Détection des cycles indirects (A → B → C → A)...');
  const indirectCycles = detectIndirectCycles();
  console.log(`   Trouvé: ${indirectCycles.length} cycles indirects\n`);
  
  // Fusionner tous les cycles
  result.circularDependencies = [...directCycles, ...indirectCycles];
  
  // Vérifier les relations problématiques
  console.log('⚠️  Vérification des relations problématiques...');
  result.problematicRelations = checkProblematicRelations();
  console.log(`   Trouvé: ${result.problematicRelations.length} relations problématiques\n`);
  
  // Analyser les statistiques
  analyzeCircularImports();
  
  // Afficher le résumé
  console.log('📈 RÉSUMÉ:');
  console.log(`   Total entités: ${result.stats.totalEntities}`);
  console.log(`   Entités avec imports circulaires: ${result.stats.entitiesWithCircularImports}`);
  console.log(`   Cycles critiques: ${result.stats.criticalCycles}`);
  console.log(`   Relations problématiques: ${result.problematicRelations.length}\n`);
  
  // Sauvegarder le rapport JSON
  const reportPath = path.join(__dirname, 'circular-deps-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ Rapport sauvegardé: ${reportPath}\n`);
  
  // Afficher les détails des cycles critiques
  if (result.stats.criticalCycles > 0) {
    console.log('🚨 CYCLES CRITIQUES DÉTECTÉS:');
    result.circularDependencies
      .filter(c => c.severity === 'high')
      .forEach((cycle, i) => {
        console.log(`\n${i + 1}. ${cycle.cycle.join(' → ')}`);
        console.log(`   ${cycle.details}`);
        console.log(`   ➡️  ${cycle.recommendation}`);
      });
  }
  
  // Afficher les relations critiques
  const criticalRelations = result.problematicRelations.filter(r => r.severity === 'critical');
  if (criticalRelations.length > 0) {
    console.log('\n\n🚨 RELATIONS CRITIQUES:');
    criticalRelations.forEach((rel, i) => {
      console.log(`\n${i + 1}. ${rel.entity} (ligne ${rel.line})`);
      console.log(`   ${rel.issue}`);
      console.log(`   ➡️  ${rel.fix}`);
    });
  }
  
  return result;
}

// Exécuter l'analyse
try {
  const report = analyze();
  
  // Retourner un code d'erreur si des problèmes critiques sont détectés
  if (report.stats.criticalCycles > 0 || 
      report.problematicRelations.some(r => r.severity === 'critical')) {
    console.log('\n⚠️  Des problèmes critiques ont été détectés!');
    process.exit(1);
  } else {
    console.log('\n✅ Aucun problème critique détecté');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'analyse:', error);
  process.exit(1);
}
