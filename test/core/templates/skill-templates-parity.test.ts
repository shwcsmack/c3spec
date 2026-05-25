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
  getExploreSkillTemplate: '6f003085aa0bf6cddc6dbf5c6a9566958edad8b99d07fe085f3153b060ef8156',
  getNewChangeSkillTemplate: '7ed2b026e688e4e979fe00e94d6ab2a3223cfce50fc012dd6b5c0b9bce25109c',
  getContinueChangeSkillTemplate: '5fb91351921a8b83814de0fa2d22a18594213202622f2454c23b5df629b28429',
  getApplyChangeSkillTemplate: '14246c0c0bf7028c145276cd18eb06a4dddbe39f3e3fc173339801c2d7341da6',
  getFfChangeSkillTemplate: '9005d8a935fb39c344c63f22a92079d99ab606bb44687a1004259cbbbbe3c54d',
  getSyncSpecsSkillTemplate: 'dd2be541cccd2fb7770f0c6bebb428c6e50d37f0e34f453459ab3d761848e1c9',
  getOnboardSkillTemplate: '5b38b8142a6c48d56ac54e93366ea4f12ffcbe4393c41dfbfb39735da5cd2746',
  getOpsxExploreCommandTemplate: '10d260a7f077665f35720bfe93770f4b2ac8f712fa45a74dfa2667823aa7bbb9',
  getOpsxNewCommandTemplate: 'a5aaeb140c5ff776fb9cec0e630126ec021c17015c9ab86a5f1d681c8653c2ec',
  getOpsxContinueCommandTemplate: '4958884f5f585ad8bd486a797df72ffdd2511bacdb041ce308cbfed0bdb93449',
  getOpsxApplyCommandTemplate: '7403bc13691345073b25b6f6e3f9f28c73598acdd197fc957928f415ede9533b',
  getOpsxFfCommandTemplate: 'd74e9b50638829aee548817d6613d8d546cbb0c9f5b96e60fef5d00f0a963e1b',
  getArchiveChangeSkillTemplate: '59e1037cba95bcce02a210261eb38863eaa2654c1b684ac77db388abd603d45e',
  getBulkArchiveChangeSkillTemplate: '0cd23ab6b103aa31f1a1aa66cc1df97a85d78eb3f603423b1d6d983b126b8877',
  getOpsxSyncCommandTemplate: '7675589fbab551de5575215a7059ee97cfbe68f4b21de1756e3463f67f80cda2',
  getVerifyChangeSkillTemplate: '7ba7da449234eabe9bddf777e4545b72bc422ef9e41a6f469191492293737ff0',
  getOpsxArchiveCommandTemplate: 'b5c43612406ff3af52b3e36833ccecbf29d868f477185c5c10ae44740d3d4b20',
  getOpsxOnboardCommandTemplate: '54e3e0472aca47f370289df1f05cc0208faa4a6782cdfbae47cef8f7dac5e41d',
  getOpsxBulkArchiveCommandTemplate: 'e7b53a99d138b7ea239e79c9fa0f4e8dcc2a58bc8a88120c5b621e0f7c2de924',
  getOpsxVerifyCommandTemplate: '760ef3ac5ef5dc5aa21eaffcaf77333288fe0699909fb7fc0913a3d5c5b3321b',
  getOpsxProposeSkillTemplate: 'eeef25ccaea18d8d3da1d6734b4e3fe8860379b9c44643470fdcef837bf84a9c',
  getOpsxProposeCommandTemplate: 'f1ed209fbf8c36db4faaaf0654cba4cdf4806da93033d68fec3a00069b225201',
  getFeedbackSkillTemplate: 'a11077179a3af2789530d6ba1181424bd7d6a56297b5f2649b9db61d4e62be01',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'c3spec-explore': '0bdb2e26862256c4372ded27bda97b6b4518a2b13527190503f6331e1bff8946',
  'c3spec-new-change': '0213bfce7f32714bdbc1f6703864a36e5c3b3acc336d8a5423ed745876953200',
  'c3spec-continue-change': '7aaba615ecfa1788aa33bfebd4db43b451491ef1fbd53f27303bdf9701ece925',
  'c3spec-apply-change': 'd78851d9f8a9d3746e7a76c0c4db406b3c5a45bb72046c88457b2589bec111ee',
  'c3spec-ff-change': '189c2e99050f79623ff14b8259d2e33ef23038a3edb81a07a064ce6f86314fc1',
  'c3spec-sync-specs': '7784a7110b7f66e724b94dc6394c0ead1985bad14007893831f9a4a618f65b26',
  'c3spec-archive-change': 'd49fcf2cfd796c372df4fbea8b3d4fc212144a4293d920984ceb8a070f2e8a00',
  'c3spec-bulk-archive-change': '54d6d32b753209a24aea9dfc822a4844d75cf96dc96c0f220c03e34c1e5cba74',
  'c3spec-verify-change': 'a1f148e4343fb723ddb519adaddce2e5d993c1f5fac0ee1d387da39e9fbc3da5',
  'c3spec-onboard': 'd730b6a57664e3d501e5744c2cdcfd194c88f7faf59d4b0c759138befba9b0b6',
  'c3spec-propose': '64d647ae9644d8641b01bf3fc24ad2a0ffbe2e6b9d90c9024f845d50bc0b9f33',
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
