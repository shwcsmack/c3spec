import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { getAvailableTools } from '../../src/core/available-tools.js';

describe('available-tools (pi-only)', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('returns empty when no runtime markers exist', () => {
    expect(getAvailableTools(testDir)).toEqual([]);
  });

  it('detects pi runtime marker', async () => {
    const marker = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
    await fs.mkdir(path.dirname(marker), { recursive: true });
    await fs.writeFile(marker, 'x');

    const tools = getAvailableTools(testDir);
    expect(tools).toHaveLength(1);
    expect(tools[0].value).toBe('pi');
  });
});
