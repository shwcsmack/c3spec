import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const ENDGAME_SKILLS = [
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
  'c3spec-archive-change',
] as const;

describe('finish-branch endgame contract', () => {
  it('requirement: WORKFLOW-ROUTING-009 documents standardized finish outcome and failure recovery in workflow-routing spec', async () => {
    const specPath = path.join(projectRoot, 'c3spec/specs/workflow-routing/spec.md');
    const content = await fs.readFile(specPath, 'utf8');

    expect(content).toMatch(/Finish Branch Outcome/);
    expect(content).toMatch(/if finishing fails, it SHALL preserve archive results/i);
    expect(content).toMatch(/recovery guidance/i);
  });

  it.each(ENDGAME_SKILLS)('requirement: WORKFLOW-ROUTING-009 %s defines finish outcome contract and failure guidance', async (skillName) => {
    const skillPath = path.join(projectRoot, '.agents', 'skills', skillName, 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf8');

    expect(content).toMatch(/c3spec-finishing-development-branch/);
    expect(content).toMatch(/## Finish Branch Outcome/);
    expect(content).toMatch(/PR-ready:/);
    expect(content).toMatch(/Next action:/);
    expect(content).toMatch(/fails?.*recovery guidance/i);
  });
});
