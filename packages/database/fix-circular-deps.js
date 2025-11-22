/**
 * Script to fix circular dependency issues in TypeORM entities
 * Converts regular imports to type imports and updates decorators to use string literals
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entitiesDir = path.join(__dirname, 'src', 'entities');

// Get all .entity.ts files
const entityFiles = fs.readdirSync(entitiesDir)
  .filter(file => file.endsWith('.entity.ts') && !file.endsWith('.d.ts'));

let totalFixed = 0;

console.log(`Processing ${entityFiles.length} entity files...`);

entityFiles.forEach(file => {
  const filePath = path.join(entitiesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace regular entity imports with type imports
  const importRegex = /^import \{ ([^}]+) \} from '(\.\/[^']+\.entity)';$/gm;
  let newContent = content.replace(importRegex, (match, imports, from) => {
    // Don't convert if it's already a type import
    if (match.includes('import type')) return match;
    modified = true;
    return `import type { ${imports} } from '${from}';`;
  });

  // Replace ManyToOne/OneToOne/OneToMany decorators with string literals
  // Pattern: @ManyToOne(() => EntityName, ...)
  newContent = newContent.replace(
    /@(ManyToOne|OneToOne|OneToMany)\(\(\) => ([A-Z]\w+),\s*([a-z]\w+)\s*=>\s*\1\.([a-z]\w+)/g,
    (match, decorator, entityName, param, property) => {
      modified = true;
      return `@${decorator}('${entityName}', '${property}'`;
    }
  );

  // Pattern: @ManyToOne(() => EntityName, { options })
  newContent = newContent.replace(
    /@(ManyToOne|OneToOne|OneToMany)\(\(\) => ([A-Z]\w+),\s*\{/g,
    (match, decorator, entityName) => {
      modified = true;
      return `@${decorator}('${entityName}', {`;
    }
  );

  // Pattern: @ManyToOne(() => EntityName)
  newContent = newContent.replace(
    /@(ManyToOne|OneToOne|OneToMany)\(\(\) => ([A-Z]\w+)\)/g,
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

console.log(`\nFixed ${totalFixed} files with circular dependency issues.`);
