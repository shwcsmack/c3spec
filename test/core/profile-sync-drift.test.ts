import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { hasProjectConfigDrift } from '../../src/core/profile-sync-drift.js';
import { CORE_WORKFLOWS } from '../../src/core/profiles.js';

describe('profile sync drift detection (pi-only)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `c3spec-profile-sync-drift-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(path.join(tempDir, 'c3spec'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns false when no runtime artifacts are present', () => {
    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both')).toBe(false);
  });
});
