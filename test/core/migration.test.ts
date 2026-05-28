import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { promises as fsp } from 'node:fs';
import { AI_TOOLS } from '../../src/core/config.js';
import { migrateIfNeeded, scanInstalledWorkflows } from '../../src/core/migration.js';

describe('migration (pi-only)', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = path.join(os.tmpdir(), `c3spec-migration-project-${randomUUID()}`);
    await fsp.mkdir(projectDir, { recursive: true });
  });

  afterEach(async () => {
    await fsp.rm(projectDir, { recursive: true, force: true });
  });

  it('does not crash when no managed artifacts exist', () => {
    migrateIfNeeded(projectDir, AI_TOOLS);
  });

  it('returns an array from scanInstalledWorkflows', () => {
    const workflows = scanInstalledWorkflows(projectDir, AI_TOOLS);
    expect(Array.isArray(workflows)).toBe(true);
  });
});
