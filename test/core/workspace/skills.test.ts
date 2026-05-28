import { describe, expect, it } from 'vitest';
import { getWorkspaceSkillDirectory, getWorkspaceSkillToolIds, parseWorkspaceSkillToolsValue } from '../../../src/core/workspace/skills.js';

describe('workspace skill helpers (pi-only)', () => {
  it('parses workspace --tools values', () => {
    expect(getWorkspaceSkillToolIds()).toEqual(['pi']);
    expect(parseWorkspaceSkillToolsValue('all')).toEqual(['pi']);
    expect(parseWorkspaceSkillToolsValue('none')).toEqual([]);
    expect(parseWorkspaceSkillToolsValue('pi')).toEqual(['pi']);
  });

  it('builds workspace-root skill paths', () => {
    expect(getWorkspaceSkillDirectory('/repos/platform-workspace', 'pi')).toBe(
      '/repos/platform-workspace/.agents/skills'
    );
  });
});
