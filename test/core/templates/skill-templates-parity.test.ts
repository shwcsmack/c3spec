import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
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
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '79566a7365eed94ae78075a433e929e3f5f5d70e1a26507fb3b1abbba000392f',
  getNewChangeSkillTemplate: '4e658193012d1ec236d1d108d83e129c923fad45469e776a6f9acb185c4bfe61',
  getContinueChangeSkillTemplate: '5fb91351921a8b83814de0fa2d22a18594213202622f2454c23b5df629b28429',
  getApplyChangeSkillTemplate: '62cd0c2225ccf45af497e330eba65e2ad34c96179ef28f7e5fa3387bb2f0d067',
  getFfChangeSkillTemplate: '92cfd4bf8a9e33a7878dd0cc05fc7c67a17a238958c863e047b41267aabdcfe3',
  getSyncSpecsSkillTemplate: 'dd2be541cccd2fb7770f0c6bebb428c6e50d37f0e34f453459ab3d761848e1c9',
  getOnboardSkillTemplate: 'd1d9d84f61dead746e887655674b2a0cf2c62ae285da2b1c96043443169571f3',
  getOpsxExploreCommandTemplate: '6d98e95ba9294a7e4a2d523bd5da52934b873aa1663649eea9c5a68d905cd747',
  getOpsxNewCommandTemplate: '431de267c135dd59f579d8658bba55549d3b5a1f8baf10d0b71ab31636592fd2',
  getOpsxContinueCommandTemplate: '4641057fb3328fe021e6e0b526f4389a51d51832c3fd2b3653908c45a9312f95',
  getOpsxApplyCommandTemplate: '679fb6e470fa90c81ddf718edd14fccf0cb633844f9797a9ff475412cd2b707a',
  getOpsxFfCommandTemplate: 'c69c1abf65fff1c97ffa10ec3381b08df5d64fe9c595c7822dc06d09b41086e6',
  getArchiveChangeSkillTemplate: '59e1037cba95bcce02a210261eb38863eaa2654c1b684ac77db388abd603d45e',
  getBulkArchiveChangeSkillTemplate: '0cd23ab6b103aa31f1a1aa66cc1df97a85d78eb3f603423b1d6d983b126b8877',
  getOpsxSyncCommandTemplate: '0691cfaef409b0024dcc4424eda90c2d18931ddc87c82a478c83d0cdaa83bf9c',
  getVerifyChangeSkillTemplate: '7ba7da449234eabe9bddf777e4545b72bc422ef9e41a6f469191492293737ff0',
  getOpsxArchiveCommandTemplate: '6537a302789cfafc7dda2ebefd6216e6ff68186cc36293618ac89c3496dd3ae2',
  getOpsxOnboardCommandTemplate: 'db4a1e21cdfddc9a6bca056d13dd0ece4111ad4fc9046de1310aef5d35650b85',
  getOpsxBulkArchiveCommandTemplate: 'e7b53a99d138b7ea239e79c9fa0f4e8dcc2a58bc8a88120c5b621e0f7c2de924',
  getOpsxVerifyCommandTemplate: 'a31659ffdfcb778a272353c2d55870b9de30ed9217fcf2a501c60cf1fcc36576',
  getOpsxProposeSkillTemplate: 'bc8bbabeeafae54a5ca8c621e58d38548f19cf46c022712abeb6f93e4f8045b2',
  getOpsxProposeCommandTemplate: 'f80220ac221514654e4274e2e52c91f40a2e9359c8a880cdecae527b36a6b96b',
  getFeedbackSkillTemplate: 'a11077179a3af2789530d6ba1181424bd7d6a56297b5f2649b9db61d4e62be01',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'c3spec-explore': '849fe788754af33af4f3bd12a241df493e37cae7ed71021a2f65b45844b05831',
  'c3spec-new-change': 'bfc40192584bef5b65a76b8bf2e2b06d8e30e806174ab5db4d6429bef2b573d5',
  'c3spec-continue-change': '7aaba615ecfa1788aa33bfebd4db43b451491ef1fbd53f27303bdf9701ece925',
  'c3spec-apply-change': 'bcc128aa51cda7218b2c0722131ee720b983f4144bf4d83c453776c79e98ac32',
  'c3spec-ff-change': '1dff8a96232d9c95ebbc0d90be3df91d174603c90a55d5a6681929f71809023b',
  'c3spec-sync-specs': '7784a7110b7f66e724b94dc6394c0ead1985bad14007893831f9a4a618f65b26',
  'c3spec-archive-change': 'd49fcf2cfd796c372df4fbea8b3d4fc212144a4293d920984ceb8a070f2e8a00',
  'c3spec-bulk-archive-change': '54d6d32b753209a24aea9dfc822a4844d75cf96dc96c0f220c03e34c1e5cba74',
  'c3spec-verify-change': 'a1f148e4343fb723ddb519adaddce2e5d993c1f5fac0ee1d387da39e9fbc3da5',
  'c3spec-onboard': 'ebab1e954c2feef590e1d0cad31491fdfc43c0ffdd69e7d762b76bf3b11cba05',
  'c3spec-propose': '4cbea28c211ccefd6b5fb328fe6069995dbf678f5b5d7b4026f14e58433abde2',
};

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

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
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

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['c3spec-explore', getExploreSkillTemplate],
      ['c3spec-new-change', getNewChangeSkillTemplate],
      ['c3spec-continue-change', getContinueChangeSkillTemplate],
      ['c3spec-apply-change', getApplyChangeSkillTemplate],
      ['c3spec-ff-change', getFfChangeSkillTemplate],
      ['c3spec-sync-specs', getSyncSpecsSkillTemplate],
      ['c3spec-archive-change', getArchiveChangeSkillTemplate],
      ['c3spec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['c3spec-verify-change', getVerifyChangeSkillTemplate],
      ['c3spec-onboard', getOnboardSkillTemplate],
      ['c3spec-propose', getOpsxProposeSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  it('guards unsupported workspace workflows from repo-local fallback edits', () => {
    const guardedSkills: Array<[string, () => SkillTemplate, string]> = [
      ['c3spec-apply-change', getApplyChangeSkillTemplate, 'full workspace apply is not supported'],
      ['c3spec-sync-specs', getSyncSpecsSkillTemplate, 'workspace spec sync is not supported'],
      ['c3spec-archive-change', getArchiveChangeSkillTemplate, 'workspace archive is not supported'],
      ['c3spec-bulk-archive-change', getBulkArchiveChangeSkillTemplate, 'workspace bulk archive is not supported'],
      ['c3spec-verify-change', getVerifyChangeSkillTemplate, 'full workspace implementation verification is not supported'],
    ];

    for (const [dirName, createTemplate, guardText] of guardedSkills) {
      const content = generateSkillContent(createTemplate(), 'PARITY-BASELINE');

      expect(content, dirName).toContain('actionContext.mode: "workspace-planning"');
      expect(content, dirName).toContain(guardText);
      expect(content, dirName).not.toContain('c3spec/changes/<name>');
      expect(content, dirName).not.toContain('mv c3spec/changes');
    }
  });
});
