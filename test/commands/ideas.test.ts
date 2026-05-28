import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  it('lists ideas with IDs and titles', async () => {
    const result = await runCLI(['ideas', 'list'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('#1 First');
    expect(result.stdout).toContain('#2 Second');
  });

  it('shows one idea by ID', async () => {
    const result = await runCLI(['ideas', 'show', '2'], { cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('## 2. Second');
    expect(result.stdout).toContain('Second summary.');
    expect(result.stdout).toContain('- b');
  });

  it('uses model triage by default when model and key are configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ranked: [
                  { id: 2, score: 91, confidence: 0.88, rationale: 'Higher impact right now.' },
                  { id: 1, score: 72, confidence: 0.77, rationale: 'Useful but less urgent.' },
                ],
              }),
            },
          },
        ],
      }),
    });

    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = mockFetch;

    try {
      const result = await runCLI(['ideas', 'triage'], {
        cwd: testDir,
        env: { OPENAI_API_KEY: 'test-key', C3SPEC_TRIAGE_MODEL: 'gpt-4o-mini' },
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('#2 [91] Second');
      expect(result.stdout).toContain('confidence: 0.88 (model)');
      expect(result.stdout).toContain('rationale: Higher impact right now.');
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  });

  it('uses OPENAI_MODEL when C3SPEC_TRIAGE_MODEL is unset', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                ranked: [
                  { id: 1, score: 88, confidence: 0.8, rationale: 'Good fit.' },
                  { id: 2, score: 50, confidence: 0.7, rationale: 'Lower impact.' },
                ],
              }),
            },
          },
        ],
      }),
    });

    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = mockFetch;

    try {
      const result = await runCLI(['ideas', 'triage'], {
        cwd: testDir,
        env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-4o-mini' },
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('#1 [88] First');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  });

  it('supports compact triage output', async () => {
    const result = await runCLI(['ideas', 'triage', '--compact'], { cwd: testDir, env: { C3SPEC_TRIAGE_PI: '0' } });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Idea triage (highest score first):');
    expect(result.stdout).not.toContain('confidence:');
    expect(result.stdout).not.toContain('rationale:');
  });

  it('falls back to heuristic triage when model call fails', async () => {
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('network down'));

    try {
      const result = await runCLI(['ideas', 'triage'], {
        cwd: testDir,
        env: { OPENAI_API_KEY: 'test-key', C3SPEC_TRIAGE_MODEL: 'gpt-4o-mini', C3SPEC_TRIAGE_PI: '0' },
      });

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Model triage failed; using fallback');
      expect(result.stdout).toContain('rationale: Heuristic fallback: keyword-based score.');
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  });
});
