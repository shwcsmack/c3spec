import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const CANONICAL_INTERVIEW_SKILLS = [
  'c3spec-start',
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
] as const;

const ONE_QUESTION_MARKERS = [
  /one interview question per message/i,
  /one clarifying question per turn/i,
  /one at a time if follow-up is needed/i,
];

describe('workflow-routing interview pacing', () => {
  it('documents one-question interview pacing in the workflow-routing spec', async () => {
    const specPath = path.join(projectRoot, 'c3spec/specs/workflow-routing/spec.md');
    const content = await fs.readFile(specPath, 'utf8');

    expect(content).toMatch(/### Requirement: One-question interview pacing/);
    expect(content).toMatch(/c3spec-start interview pacing/);
    expect(content).toMatch(/Tier 3 brainstorm discovery pacing/);
  });

  it.each(CANONICAL_INTERVIEW_SKILLS)('encodes interview pacing in %s', async (skillName) => {
    const skillPath = path.join(projectRoot, '.agents/skills', skillName, 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf8');

    const matchesMarker = ONE_QUESTION_MARKERS.some((pattern) => pattern.test(content));
    expect(matchesMarker, `${skillName} must mention one-question interview pacing`).toBe(true);
    expect(content).toMatch(
      /numbered (interview )?questions?|numbered question dumps|batch multiple clarifying questions/i
    );
  });
});
