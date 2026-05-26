/**
 * One-off script to extract skill templates from TypeScript and write SKILL.md files.
 * Run with: npx tsx scripts/extract-skills.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { getExploreSkillTemplate } from '../src/core/templates/workflows/explore.js';
import { getNewChangeSkillTemplate } from '../src/core/templates/workflows/new-change.js';
import { getContinueChangeSkillTemplate } from '../src/core/templates/workflows/continue-change.js';
import { getApplyChangeSkillTemplate } from '../src/core/templates/workflows/apply-change.js';
import { getFfChangeSkillTemplate } from '../src/core/templates/workflows/ff-change.js';
import { getSyncSpecsSkillTemplate } from '../src/core/templates/workflows/sync-specs.js';
import { getArchiveChangeSkillTemplate } from '../src/core/templates/workflows/archive-change.js';
import { getBulkArchiveChangeSkillTemplate } from '../src/core/templates/workflows/bulk-archive-change.js';
import { getVerifyChangeSkillTemplate } from '../src/core/templates/workflows/verify-change.js';
import { getOnboardSkillTemplate } from '../src/core/templates/workflows/onboard.js';
import { getOpsxProposeSkillTemplate } from '../src/core/templates/workflows/propose.js';

interface SkillEntry {
  dirName: string;
  template: ReturnType<typeof getExploreSkillTemplate>;
}

const skills: SkillEntry[] = [
  { dirName: 'c3spec-explore', template: getExploreSkillTemplate() },
  { dirName: 'c3spec-new-change', template: getNewChangeSkillTemplate() },
  { dirName: 'c3spec-continue-change', template: getContinueChangeSkillTemplate() },
  { dirName: 'c3spec-apply-change', template: getApplyChangeSkillTemplate() },
  { dirName: 'c3spec-ff-change', template: getFfChangeSkillTemplate() },
  { dirName: 'c3spec-sync-specs', template: getSyncSpecsSkillTemplate() },
  { dirName: 'c3spec-archive-change', template: getArchiveChangeSkillTemplate() },
  { dirName: 'c3spec-bulk-archive-change', template: getBulkArchiveChangeSkillTemplate() },
  { dirName: 'c3spec-verify-change', template: getVerifyChangeSkillTemplate() },
  { dirName: 'c3spec-onboard', template: getOnboardSkillTemplate() },
  { dirName: 'c3spec-propose', template: getOpsxProposeSkillTemplate() },
];

for (const { dirName, template } of skills) {
  const outDir = path.join('skills', dirName);
  fs.mkdirSync(outDir, { recursive: true });

  const metadataLines: string[] = [];
  if (template.metadata) {
    for (const [k, v] of Object.entries(template.metadata)) {
      metadataLines.push(`  ${k}: "${v}"`);
    }
  }
  metadataLines.push('  generatedBy: "source"');

  const frontmatter = [
    '---',
    `name: ${template.name}`,
    `description: ${template.description}`,
    `license: ${template.license ?? 'MIT'}`,
    `compatibility: ${template.compatibility ?? 'Requires c3spec CLI.'}`,
    'metadata:',
    ...metadataLines,
    '---',
  ].join('\n');

  const content = `${frontmatter}\n\n${template.instructions}\n`;
  fs.writeFileSync(path.join(outDir, 'SKILL.md'), content, 'utf-8');
  console.log(`✓ ${dirName}/SKILL.md`);
}

console.log('\nDone. Review skills/ directory.');
