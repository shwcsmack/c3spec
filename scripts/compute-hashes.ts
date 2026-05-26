import { createHash } from 'node:crypto';
import {
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../src/core/shared/skill-generation.js';
import { getSkillTemplates } from '../src/core/shared/skill-generation.js';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const factories: Record<string, () => unknown> = {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxFfCommandTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getOpsxSyncCommandTemplate,
  getVerifyChangeSkillTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxProposeCommandTemplate,
  getFeedbackSkillTemplate,
};

console.log('FUNCTION_HASHES:');
const fh: Record<string, string> = {};
for (const [name, fn] of Object.entries(factories)) {
  fh[name] = hash(stableStringify(fn()));
}
console.log(JSON.stringify(fh, null, 2));

console.log('\nGENERATED_SKILL_CONTENT_HASHES:');
const skillTemplates = getSkillTemplates();
const version = '0.0.0-test';
const gh: Record<string, string> = {};
for (const { template, dirName } of skillTemplates) {
  const content = generateSkillContent(template, version);
  gh[dirName] = hash(content);
}
console.log(JSON.stringify(gh, null, 2));
