import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runCLI } from '../helpers/run-cli.js';

describe('top-level list command flags', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-list-command-tmp');

  beforeEach(async () => {
    await fs.mkdir(path.join(testDir, 'c3spec', 'changes', 'demo'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'c3spec', 'changes', 'demo', 'tasks.md'), '- [x] one\n', 'utf-8');

    await fs.mkdir(path.join(testDir, 'c3spec', 'specs', 'alpha'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'c3spec', 'specs', 'alpha', 'spec.md'),
      '## Purpose\nP\n\n## Requirements\n### Requirement: [ALPHA-001] A SHALL B\nA SHALL B\n\n#### Scenario: S\n- x\n',
      'utf-8',
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('requirement: CLI-LIST-004 lists specs when --specs is provided', async () => {
    const result = await runCLI(['list', '--specs'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Specs:');
    expect(result.stdout).toContain('alpha');
  });

  it('requirement: CLI-LIST-004 lists changes when --changes is provided', async () => {
    const result = await runCLI(['list', '--changes'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Changes:');
    expect(result.stdout).toContain('demo');
  });
});
