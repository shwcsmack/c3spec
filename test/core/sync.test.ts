import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { SyncCommand } from '../../src/core/sync.js';
import { applyHostGenerationPipeline } from '../../src/core/host-generation/apply.js';

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

  async function setupProject(): Promise<void> {
    await fs.mkdir(path.join(testDir, 'c3spec'), { recursive: true });
    await applyHostGenerationPipeline(testDir, ['pi'], { ensureCanonical: true, force: true });
  }

  it('sync runs for pi runtime', async () => {
    await setupProject();
    const sync = new SyncCommand();
    await expect(sync.execute(testDir)).resolves.toBeUndefined();
  });

  it('force sync runs for pi runtime', async () => {
    await setupProject();
    const sync = new SyncCommand({ force: true });
    await expect(sync.execute(testDir)).resolves.toBeUndefined();
  });
});
