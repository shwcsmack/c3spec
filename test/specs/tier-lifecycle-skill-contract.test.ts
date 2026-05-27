import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { REQUIRED_CANONICAL_SKILL_NAMES } from '../../src/core/host-generation/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const agentsSkillsRoot = path.join(projectRoot, '.agents', 'skills');

function skillPath(name: string): string {
  return path.join(agentsSkillsRoot, name, 'SKILL.md');
}

async function readSkill(name: string): Promise<string> {
  return fs.readFile(skillPath(name), 'utf8');
}

function extractFrontmatter(content: string): string | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1];
}

function extractFrontmatterName(content: string): string | undefined {
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) return undefined;
  const nameMatch = frontmatter.match(/^name:\s*(\S+)\s*$/m);
  return nameMatch?.[1];
}

function extractSection(content: string, heading: string): string | undefined {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+\\S|\\Z)`, 'm');
  const match = content.match(pattern);
  return match?.[1];
}

const RESUME_APPLY_ARCHIVE_HELPERS = [
  'c3spec-continue-change',
  'c3spec-apply-change',
  'c3spec-archive-change',
  'c3spec-bulk-archive-change',
] as const;

const TIER_WORKFLOW_SKILLS = [
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
] as const;

const TIER_LIFECYCLE_REQUIRED_ARTIFACTS = {
  t1: ['mini-plan.md', 'spec-impact.html', 'spec-impact.md', 'micro-retro.html', 'micro-retro.md'],
  t2: ['proposal.md', 'tasks.md', 'plan.md', 'verify.md', 'retrospective.md'],
  t3: ['brainstorm.md', 'proposal.md', 'design.md', 'tasks.md', 'plan.md', 'verify.md', 'retrospective.md'],
} as const;

describe('tier lifecycle skill contract', () => {
  describe('c3spec-tier-lifecycle reference skill', () => {
    it('exists at the canonical path', async () => {
      const stat = await fs.stat(skillPath('c3spec-tier-lifecycle'));
      expect(stat.isFile()).toBe(true);
    });

    it('has frontmatter name "c3spec-tier-lifecycle"', async () => {
      const content = await readSkill('c3spec-tier-lifecycle');
      expect(extractFrontmatterName(content)).toBe('c3spec-tier-lifecycle');
    });

    it('mentions tier.md as the lifecycle metadata anchor', async () => {
      const content = await readSkill('c3spec-tier-lifecycle');
      expect(content).toMatch(/tier\.md/);
    });

    it.each([
      ['T1', TIER_LIFECYCLE_REQUIRED_ARTIFACTS.t1],
      ['T2', TIER_LIFECYCLE_REQUIRED_ARTIFACTS.t2],
      ['T3', TIER_LIFECYCLE_REQUIRED_ARTIFACTS.t3],
    ] as const)('names every required %s artifact', async (_tier, artifacts) => {
      const content = await readSkill('c3spec-tier-lifecycle');
      for (const artifact of artifacts) {
        expect(content, `c3spec-tier-lifecycle must reference ${artifact}`).toContain(artifact);
      }
    });

    it('marks tasks.md and plan.md as non-pausing artifacts', async () => {
      const content = await readSkill('c3spec-tier-lifecycle');
      expect(content).toMatch(/tasks\.md.*non-pausing/i);
      expect(content).toMatch(/plan\.md.*non-pausing/i);
    });

    it('marks verify.md as non-blocking when verification passes', async () => {
      const content = await readSkill('c3spec-tier-lifecycle');
      expect(content).toMatch(/verify\.md.*non-blocking.*verification passes/i);
    });

    it('defines fast-forward behavior through retrospective with stop before archive', async () => {
      const content = await readSkill('c3spec-tier-lifecycle');
      expect(content).toMatch(/fast-forward behavior/i);
      expect(content).toMatch(/skip approval pauses/i);
      expect(content).toMatch(/skip HTML generation/i);
      expect(content).toMatch(/through retrospective/i);
      expect(content).toMatch(/stop after retrospective/i);
    });
  });

  describe('canonical skill registration includes c3spec-tier-lifecycle', () => {
    it('lists c3spec-tier-lifecycle in REQUIRED_CANONICAL_SKILL_NAMES', () => {
      expect(REQUIRED_CANONICAL_SKILL_NAMES).toContain('c3spec-tier-lifecycle');
    });

    it('lists c3spec-tier-lifecycle in scripts/check-canonical-skills.js', async () => {
      const scriptPath = path.join(projectRoot, 'scripts', 'check-canonical-skills.js');
      const content = await fs.readFile(scriptPath, 'utf8');
      expect(content).toMatch(/['"]c3spec-tier-lifecycle['"]/);
    });
  });

  describe('resume / apply / archive helpers reference the lifecycle contract', () => {
    it.each(TIER_WORKFLOW_SKILLS)('%s references c3spec-tier-lifecycle', async (skillName) => {
      const content = await readSkill(skillName);
      expect(
        content,
        `${skillName} must reference c3spec-tier-lifecycle so tier workflows consult the canonical contract`,
      ).toMatch(/c3spec-tier-lifecycle/);
    });

    it.each(RESUME_APPLY_ARCHIVE_HELPERS)(
      '%s references c3spec-tier-lifecycle',
      async (skillName) => {
        const content = await readSkill(skillName);
        expect(
          content,
          `${skillName} must reference c3spec-tier-lifecycle so it consults the canonical contract`,
        ).toMatch(/c3spec-tier-lifecycle/);
      },
    );

    it.each(RESUME_APPLY_ARCHIVE_HELPERS)('%s references tier.md', async (skillName) => {
      const content = await readSkill(skillName);
      expect(
        content,
        `${skillName} must mention tier.md so it can read on-disk lifecycle metadata`,
      ).toMatch(/tier\.md/);
    });
  });

  describe('tier and resume consumers align with pause policy', () => {
    it('tier2 no longer requires a blocking pause after verify.md on success', async () => {
      const content = await readSkill('c3spec-tier2-feature');
      expect(content).toMatch(/verify\.md.*non-blocking/i);
    });

    it('tier3 no longer requires tasks.md and plan.md confirmation pause', async () => {
      const content = await readSkill('c3spec-tier3-full');
      expect(content).toMatch(/tasks\.md.*non-pausing/i);
      expect(content).toMatch(/plan\.md.*non-pausing/i);
    });

    it('continue-change does not require post-plan confirmation pause text', async () => {
      const content = await readSkill('c3spec-continue-change');
      expect(content).not.toMatch(/Pause for user confirmation before invoking `c3spec-subagent-dev`\./);
      expect(content).toMatch(/plan\.md.*non-pausing/i);
    });
  });

  describe('c3spec-apply-change routes implementation through c3spec-subagent-dev', () => {
    it('references c3spec-subagent-dev', async () => {
      const content = await readSkill('c3spec-apply-change');
      expect(content).toMatch(/c3spec-subagent-dev/);
    });

    it('hands off to subagent-dev instead of looping tasks itself', async () => {
      const content = await readSkill('c3spec-apply-change');
      const handsOff = /hand(?:s|ing| off| implementation)/i.test(content)
        || /dispatch(?:ing|es)?/i.test(content);
      expect(
        handsOff,
        'c3spec-apply-change must describe handing implementation off to c3spec-subagent-dev',
      ).toBe(true);
    });

    it('keeps an explicit guardrail against direct checkbox mutation', async () => {
      const content = await readSkill('c3spec-apply-change');
      const checkboxGuardrailMarkers = [
        /never\s+(?:loop|flip|mark|mutate)[^.]*(?:checkbox|task|- \[ \]|- \[x\])/i,
        /(?:don't|do not|does not|do not)\s+(?:loop|flip|mark|mutate)[^.]*(?:checkbox|task|- \[ \]|- \[x\])/i,
        /checkbox\s+ownership\s+belongs\s+to/i,
      ];
      const hasGuardrail = checkboxGuardrailMarkers.some((pattern) => pattern.test(content));
      expect(
        hasGuardrail,
        'c3spec-apply-change must keep an explicit guardrail that it does not flip - [ ] / - [x] checkboxes',
      ).toBe(true);
    });

    it('does not reintroduce a directive to mutate tasks.md checkboxes', async () => {
      const content = await readSkill('c3spec-apply-change');
      // Split into sentences so we can check directives independently of nearby prohibitions.
      const sentences = content.split(/(?<=[.!?:])\s+|\n+/);
      const offending = sentences.filter((sentence) => {
        const negated = /\b(?:never|don't|do not|does not|cannot|not\s+(?:to|directly|own|loop|flip|mark)|without\s+marking|belongs\s+to)\b/i.test(sentence);
        if (negated) return false;
        return (
          /\bmark\b[^.]*-\s*\[x\]/i.test(sentence)
          || /\bflip\b[^.]*-\s*\[\s*\]/i.test(sentence)
          || /\bchange\b[^.]*-\s*\[\s*\][^.]*-\s*\[x\]/i.test(sentence)
        );
      });
      expect(
        offending,
        'c3spec-apply-change should not contain directive language instructing it to flip - [ ] / - [x]',
      ).toEqual([]);
    });
  });

  describe('c3spec-host-adapter Cursor section does not depend on .cursor/agents/<name>.md', () => {
    it('explicitly states .cursor/agents/<name>.md is not required', async () => {
      const content = await readSkill('c3spec-host-adapter');
      const cursorSection = extractSection(content, 'Cursor');
      expect(cursorSection, 'host adapter must contain a "## Cursor" section').toBeDefined();
      expect(cursorSection!).toMatch(
        /(?:do not|don't|does not|never)\s+require[^.]*\.cursor\/agents\/<name>\.md/i,
      );
    });

    it('does not declare .cursor/agents/<name>.md as a requirement for dispatch', async () => {
      const content = await readSkill('c3spec-host-adapter');
      const cursorSection = extractSection(content, 'Cursor');
      expect(cursorSection).toBeDefined();
      // Inspect sentences individually so an explicit negation like
      // "Do not require `.cursor/agents/<name>.md`" does not register as a regression.
      const sentences = cursorSection!.split(/(?<=[.!?])\s+|\n+/);
      const positiveRequirementMarkers = [
        /\brequires?\b[^.]*`?\.cursor\/agents\/<name>\.md/i,
        /\bmust\s+exist\b[^.]*`?\.cursor\/agents\/<name>\.md/i,
        /\bmust\s+have\b[^.]*`?\.cursor\/agents\/<name>\.md/i,
        /\bdispatch\b[^.]*via\s+`?\.cursor\/agents\/<name>\.md/i,
        /\bdepends?\s+on\b[^.]*`?\.cursor\/agents\/<name>\.md/i,
      ];
      const negationGuard = /\b(?:do not|don't|does not|cannot|never|no\s+longer|without)\b/i;
      const offending = sentences.filter((sentence) => {
        if (negationGuard.test(sentence)) return false;
        return positiveRequirementMarkers.some((pattern) => pattern.test(sentence));
      });
      expect(
        offending,
        'c3spec-host-adapter Cursor section must not contain a positive requirement on .cursor/agents/<name>.md',
      ).toEqual([]);
    });
  });
});
