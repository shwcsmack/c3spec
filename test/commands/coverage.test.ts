import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runCoverageAudit } from '../../src/commands/coverage.js';

describe('coverage command', () => {
  let tmp: string;
  let cwd: string;

  beforeEach(async () => {
    cwd = process.cwd();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'c3spec-coverage-'));
    process.chdir(tmp);
    await fs.mkdir(path.join(tmp, 'c3spec', 'specs', 'demo'), { recursive: true });
    await fs.mkdir(path.join(tmp, 'test'), { recursive: true });
  });

  afterEach(async () => {
    process.chdir(cwd);
    process.exitCode = 0;
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('warn mode does not fail on uncovered requirements', async () => {
    await fs.writeFile(
      path.join(tmp, 'c3spec', 'specs', 'demo', 'spec.md'),
      '# demo\n\n## Purpose\n\nP\n\n## Requirements\n### Requirement: [DEM-001] First\nText SHALL be true\n\n#### Scenario: S\n- x\n',
      'utf8',
    );

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    await runCoverageAudit(tmp, false, true);
    console.log = orig;
    expect(process.exitCode).toBe(0);
    const json = JSON.parse(logs.join('\n'));
    expect(Array.isArray(json.perSpec)).toBe(true);
    expect(json.perSpec[0].spec).toBe('demo');
  });

  it('strict mode fails on uncovered requirements', async () => {
    await fs.writeFile(
      path.join(tmp, 'c3spec', 'specs', 'demo', 'spec.md'),
      '# demo\n\n## Purpose\n\nP\n\n## Requirements\n### Requirement: [DEM-001] First\nText SHALL be true\n\n#### Scenario: S\n- x\n',
      'utf8',
    );

    await runCoverageAudit(tmp, true, true);
    expect(process.exitCode).toBe(1);
  });

  it('passes strict mode when requirement references exist', async () => {
    await fs.writeFile(
      path.join(tmp, 'c3spec', 'specs', 'demo', 'spec.md'),
      '# demo\n\n## Purpose\n\nP\n\n## Requirements\n### Requirement: [DEM-001] First\nText SHALL be true\n\n#### Scenario: S\n- x\n',
      'utf8',
    );
    const reqId = 'DEM' + '-001';
    await fs.writeFile(
      path.join(tmp, 'test', 'demo.test.ts'),
      `import { it } from 'vitest'; it('requirement: ${reqId}', () => {});\n`,
      'utf8',
    );

    await runCoverageAudit(tmp, true, true);
    expect(process.exitCode).toBe(0);
  });
});
