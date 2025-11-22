/**
 * Fix circular dependencies in Transport module entities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entitiesDir = path.join(__dirname, 'src', 'entities');

// Only fix transport-related entities
const transportEntities = [
  'Driver.entity.ts',
  'ScheduledTrip.entity.ts',
  'TransportRoute.entity.ts',
  'VehicleUsage.entity.ts',
  'VehicleFuel.entity.ts'
];

let totalFixed = 0;

console.log(`Fixing ${transportEntities.length} transport entities...`);

transportEntities.forEach(file => {
  const filePath = path.join(entitiesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace entity imports with type imports (except Tenant)
  const entityImportRegex = /^import \{ ([^}]+) \} from '(\.\/(?!Tenant)[^']+\.entity)';$/gm;
  let newContent = content.replace(entityImportRegex, (match, imports, from) => {
    if (match.includes('import type')) return match;
    modified = true;
    return `import type { ${imports} } from '${from}';`;
  });

  // Replace decorators with string literals
  // Pattern: entity => entity.property
  newContent = newContent.replace(
    /@(ManyToOne|OneToOne|OneToMany)\(\(\) => ([A-Z]\w+),\s*([a-z]\w+)\s*=>\s*\3\.([a-z]\w+)/g,
    (match, decorator, entityName, param, property) => {
      modified = true;
      return `@${decorator}('${entityName}', '${property}'`;
    }
  );

  // Pattern: { options } only
  newContent = newContent.replace(
    /@(ManyToOne|OneToOne|OneToMany)\(\(\) => ([A-Z]\w+),\s*\{/g,
    (match, decorator, entityName) => {
      modified = true;
      return `@${decorator}('${entityName}', {`;
    }
  );

  // Pattern: no options at all
  newContent = newContent.replace(
    /@(ManyToOne|OneToMany|OneToOne)\(\(\) => ([A-Z]\w+)\)/g,
    (match, decorator, entityName) => {
      modified = true;
      return `@${decorator}('${entityName}')`;
    }
  );

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Fixed ${file}`);
    totalFixed++;
  }
});

console.log(`\nFixed ${totalFixed} transport entity files.`);
