import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { InitCommand } from '../../src/core/init.js';
import { SyncCommand } from '../../src/core/sync.js';

describe('SyncCommand', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-sync-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('regenerates host artifacts from local canonical without refreshing canonical', async () => {
    const init = new InitCommand({ tools: 'claude', force: true });
    await init.execute(testDir);

    const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    await fs.writeFile(skillFile, '# hand edit\n');

    const sync = new SyncCommand();
    await expect(sync.execute(testDir)).resolves.toBeUndefined();

    const afterSync = await fs.readFile(skillFile, 'utf-8');
    expect(afterSync).toBe('# hand edit\n');
    await expect(fs.access(path.join(testDir, '.cursor', 'agents', 'implementer.md'))).rejects.toThrow();
    await expect(fs.access(path.join(testDir, '.codex', 'agents', 'implementer.toml'))).rejects.toThrow();
  });

  it('overwrites hand-edited generated files with --force', async () => {
    const init = new InitCommand({ tools: 'claude', force: true });
    await init.execute(testDir);

    const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    await fs.writeFile(skillFile, '# hand edit\n');

    const sync = new SyncCommand({ force: true });
    await sync.execute(testDir);

    const afterSync = await fs.readFile(skillFile, 'utf-8');
    expect(afterSync).toContain('name: c3spec-start');
    expect(afterSync).not.toBe('# hand edit\n');
  });
});
