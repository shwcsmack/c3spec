import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import {
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  getConfiguredTools,
} from '../../../src/core/shared/tool-detection.js';

describe('tool-detection (pi-only)', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('returns pi as the only skill-capable tool', () => {
    expect(getToolsWithSkillsDir()).toEqual(['pi']);
  });

  it('detects unconfigured/configured pi skill status', async () => {
    expect(getToolSkillStatus(testDir, 'pi').configured).toBe(false);

    const skillDir = path.join(testDir, '.agents', 'skills', 'c3spec-start');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), 'x');

    expect(getToolSkillStatus(testDir, 'pi').configured).toBe(true);
  });

  it('returns pi in tool states and configured tool list when present', async () => {
    const states = getToolStates(testDir);
    expect(states.has('pi')).toBe(true);

    await fs.mkdir(path.join(testDir, '.agents', 'skills', 'c3spec-start'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md'), 'x');

    expect(getConfiguredTools(testDir)).toEqual(['pi']);
  });
});
