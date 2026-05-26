#!/usr/bin/env node
// CODEGEN: reads skills/<dir>/SKILL.md → regenerates the skill template function
// in src/core/templates/workflows/<file>.ts, replacing the BEGIN:GENERATED_SKILL
// to END:GENERATED_SKILL block. The command template function is preserved.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Map dirName → { tsFile, fnName }
const SKILL_MAP = [
  { dirName: 'c3spec-explore',          tsFile: 'explore.ts',             fnName: 'getExploreSkillTemplate' },
  { dirName: 'c3spec-new-change',       tsFile: 'new-change.ts',          fnName: 'getNewChangeSkillTemplate' },
  { dirName: 'c3spec-continue-change',  tsFile: 'continue-change.ts',     fnName: 'getContinueChangeSkillTemplate' },
  { dirName: 'c3spec-apply-change',     tsFile: 'apply-change.ts',        fnName: 'getApplyChangeSkillTemplate' },
  { dirName: 'c3spec-ff-change',        tsFile: 'ff-change.ts',           fnName: 'getFfChangeSkillTemplate' },
  { dirName: 'c3spec-sync-specs',       tsFile: 'sync-specs.ts',          fnName: 'getSyncSpecsSkillTemplate' },
  { dirName: 'c3spec-archive-change',   tsFile: 'archive-change.ts',      fnName: 'getArchiveChangeSkillTemplate' },
  { dirName: 'c3spec-bulk-archive-change', tsFile: 'bulk-archive-change.ts', fnName: 'getBulkArchiveChangeSkillTemplate' },
  { dirName: 'c3spec-verify-change',    tsFile: 'verify-change.ts',       fnName: 'getVerifyChangeSkillTemplate' },
  { dirName: 'c3spec-onboard',          tsFile: 'onboard.ts',             fnName: 'getOnboardSkillTemplate' },
  { dirName: 'c3spec-propose',          tsFile: 'propose.ts',             fnName: 'getOpsxProposeSkillTemplate' },
];

const BEGIN = '// BEGIN:GENERATED_SKILL';
const END = '// END:GENERATED_SKILL';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Invalid SKILL.md: missing frontmatter delimiters');
  const fmText = match[1];
  const body = match[2];

  const fm = {};
  // Parse simple key: value pairs and nested metadata block
  const lines = fmText.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) { i++; continue; }
    const key = kv[1];
    const val = kv[2].trim();
    if (key === 'metadata') {
      // Parse nested key: value pairs (indented with 2 spaces)
      const meta = {};
      i++;
      while (i < lines.length && lines[i].startsWith('  ')) {
        const nested = lines[i].trim().match(/^(\w+):\s*"?([^"]*)"?$/);
        if (nested) meta[nested[1]] = nested[2];
        i++;
      }
      fm.metadata = meta;
      continue;
    }
    fm[key] = val;
    i++;
  }
  return { fm, body: body.replace(/^\n/, '') };
}

function escapeTemplateLiteral(str) {
  // Escape backticks and backslash-backtick sequences for use in a JS template literal
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function generateSkillBlock(dirName, fnName, fm, body) {
  const name = fm.name ?? dirName;
  const description = fm.description ?? '';
  const license = fm.license ?? 'MIT';
  const compatibility = fm.compatibility ?? 'Requires c3spec CLI.';
  const meta = fm.metadata ?? {};

  const metaEntries = Object.entries(meta)
    .filter(([k]) => k !== 'generatedBy') // generatedBy is set at write time, not in source
    .map(([k, v]) => `${k}: '${v}'`)
    .join(', ');
  const metaStr = metaEntries ? `{ ${metaEntries} }` : '{}';

  const escaped = escapeTemplateLiteral(body.replace(/\n$/, ''));

  return [
    BEGIN,
    `export function ${fnName}(): SkillTemplate {`,
    `  return {`,
    `    name: '${name}',`,
    `    description: '${description.replace(/'/g, "\\'")}',`,
    `    instructions: \`${escaped}\`,`,
    `    license: '${license}',`,
    `    compatibility: '${compatibility}',`,
    `    metadata: ${metaStr},`,
    `  };`,
    `}`,
    END,
  ].join('\n');
}

let generated = 0;
let skipped = 0;

for (const { dirName, tsFile, fnName } of SKILL_MAP) {
  const skillPath = path.join(ROOT, 'skills', dirName, 'SKILL.md');
  const tsPath = path.join(ROOT, 'src', 'core', 'templates', 'workflows', tsFile);

  if (!fs.existsSync(skillPath)) {
    console.warn(`  SKIP ${dirName}: skills/${dirName}/SKILL.md not found`);
    skipped++;
    continue;
  }
  if (!fs.existsSync(tsPath)) {
    console.warn(`  SKIP ${tsFile}: TypeScript file not found`);
    skipped++;
    continue;
  }

  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  const { fm, body } = parseFrontmatter(skillContent);

  const block = generateSkillBlock(dirName, fnName, fm, body);

  const tsContent = fs.readFileSync(tsPath, 'utf-8');
  const beginIdx = tsContent.indexOf(BEGIN);
  const endIdx = tsContent.indexOf(END);

  if (beginIdx === -1 || endIdx === -1) {
    console.error(`  ERROR ${tsFile}: missing BEGIN/END markers`);
    process.exitCode = 1;
    continue;
  }

  const before = tsContent.slice(0, beginIdx);
  const after = tsContent.slice(endIdx + END.length);
  const newContent = before + block + after;

  if (newContent === tsContent) {
    skipped++;
    continue;
  }

  fs.writeFileSync(tsPath, newContent, 'utf-8');
  console.log(`  ✓ ${tsFile}`);
  generated++;
}

console.log(`\nCodegen complete: ${generated} updated, ${skipped} unchanged.`);
