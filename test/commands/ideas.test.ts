import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';

describe('ideas command', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-ideas-command-tmp');
  const ideasPath = path.join(testDir, 'IDEAS.md');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(
      ideasPath,
      `# Ideas\n\nBacklog.\n\n## 1. First\n\nFirst summary.\n\n- a\n\n## 2. Second\n\nSecond summary.\n\n- b\n`,
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('adds a new idea with summary and bullets', async () => {
    const result = await runCLI(
      ['ideas', 'add', 'Third', '--summary', 'Third summary.', '--bullet', 'x', '--bullet', 'y'],
      { cwd: testDir }
    );

    expect(result.exitCode).toBe(0);
    const content = await fs.readFile(ideasPath, 'utf-8');
    expect(content).toContain('## 3. Third');
    expect(content).toContain('Third summary.');
    expect(content).toContain('- x');
    expect(content).toContain('- y');
  });

  it('removes an idea and renumbers', async () => {
    const result = await runCLI(['ideas', 'remove', '1'], { cwd: testDir });
    expect(result.exitCode).toBe(0);

    const content = await fs.readFile(ideasPath, 'utf-8');
    expect(content).not.toContain('## 1. First');
    expect(content).toContain('## 1. Second');
  });

  it('lints numbering and fails on gaps', async () => {
    await fs.writeFile(
      ideasPath,
      `# Ideas\n\n## 1. First\n\nA\n\n## 3. Third\n\nC\n`,
      'utf-8'
    );

    const result = await runCLI(['ideas', 'lint'], { cwd: testDir });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('IDEAS.md lint failed');
  });
});
