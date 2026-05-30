import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';

describe('subagent bootstrap skill gating', () => {
  it('requires bootstrap gate in c3spec-subagent-dev', async () => {
    const content = await fs.readFile('.agents/skills/c3spec-subagent-dev/SKILL.md', 'utf-8');
    expect(content).toContain('c3spec subagent bootstrap --change <id>');
    expect(content).toMatch(/If bootstrap exits non-zero, stop/i);
  });

  it('requires bootstrap gate before apply-change handoff', async () => {
    const content = await fs.readFile('.agents/skills/c3spec-apply-change/SKILL.md', 'utf-8');
    expect(content).toContain('c3spec subagent bootstrap --change <name>');
    expect(content).toMatch(/do not dispatch subagents/i);
  });
});
