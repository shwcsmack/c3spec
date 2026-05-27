/**
 * Canonical skill installation helpers — copy from bundled `.agents/skills/`.
 */

import path from 'path';
import { createRequire } from 'module';
import { promises as fs } from 'fs';
import { REQUIRED_CANONICAL_SKILL_NAMES } from '../host-generation/types.js';

const require = createRequire(import.meta.url);

export const WORKFLOW_TO_CANONICAL_SKILL: Record<string, string> = {
  explore: 'c3spec-explore',
  sync: 'c3spec-sync-specs',
  archive: 'c3spec-archive-change',
  'bulk-archive': 'c3spec-bulk-archive-change',
  verify: 'c3spec-verify-change',
  onboard: 'c3spec-onboard',
};

export const CANONICAL_SKILL_NAMES = [...REQUIRED_CANONICAL_SKILL_NAMES] as const;

export type CanonicalSkillName = (typeof CANONICAL_SKILL_NAMES)[number];

export function resolveBundledAgentsDir(): string {
  const packageJsonPath = require.resolve('../../../package.json');
  return path.join(path.dirname(packageJsonPath), '.agents');
}

export async function readBundledCanonicalSkill(skillName: string): Promise<string | null> {
  const skillPath = path.join(resolveBundledAgentsDir(), 'skills', skillName, 'SKILL.md');
  try {
    return await fs.readFile(skillPath, 'utf8');
  } catch {
    return null;
  }
}

export function workflowIdToCanonicalSkill(workflowId: string): string | undefined {
  return WORKFLOW_TO_CANONICAL_SKILL[workflowId];
}

export async function readBundledSkillsForWorkflows(
  workflowIds: readonly string[]
): Promise<Array<{ workflowId: string; dirName: string; content: string }>> {
  const results: Array<{ workflowId: string; dirName: string; content: string }> = [];

  for (const workflowId of workflowIds) {
    const dirName = workflowIdToCanonicalSkill(workflowId);
    if (!dirName) {
      continue;
    }

    const content = await readBundledCanonicalSkill(dirName);
    if (content) {
      results.push({ workflowId, dirName, content });
    }
  }

  return results;
}
