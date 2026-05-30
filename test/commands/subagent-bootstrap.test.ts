import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runCLI } from '../helpers/run-cli.js';

describe('subagent bootstrap command', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-subagent-bootstrap-tmp');

  async function scaffoldBase(changeName: string): Promise<string> {
    const changeDir = path.join(testDir, 'c3spec', 'changes', changeName);
    await fs.mkdir(path.join(testDir, '.agents', 'skills', 'c3spec-host-adapter'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.agents', 'agents'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'c3spec', 'memory'), { recursive: true });
    await fs.mkdir(changeDir, { recursive: true });

    await fs.writeFile(path.join(testDir, '.agents', 'skills', 'c3spec-host-adapter', 'SKILL.md'), '# host adapter\n');
    await fs.writeFile(path.join(testDir, '.agents', 'agents', 'implementer.yaml'), 'name: implementer\n');
    await fs.writeFile(path.join(testDir, '.agents', 'agents', 'spec-reviewer.yaml'), 'name: spec-reviewer\n');
    await fs.writeFile(path.join(testDir, '.agents', 'agents', 'quality-reviewer.yaml'), 'name: quality-reviewer\n');
    await fs.writeFile(path.join(testDir, 'c3spec', 'memory', 'MEMORY.md'), '# memory\n');

    return changeDir;
  }

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('returns usage-class code when --change is missing', async () => {
    const result = await runCLI(['subagent', 'bootstrap'], { cwd: testDir });
    expect(result.exitCode).toBe(24);
  });

  it('passes for tier 3 change with required artifacts', async () => {
    const changeName = 'subagent-bootstrap-cli';
    const changeDir = await scaffoldBase(changeName);

    await fs.writeFile(path.join(changeDir, 'tier.md'), '- Tier: 3\n');
    await fs.writeFile(path.join(changeDir, 'brainstorm.md'), 'x\n');
    await fs.writeFile(path.join(changeDir, 'proposal.md'), 'x\n');
    await fs.writeFile(path.join(changeDir, 'design.md'), 'x\n');
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [ ] a\n');
    await fs.writeFile(path.join(changeDir, 'plan.md'), '## Stage 1\n');
    await fs.mkdir(path.join(changeDir, 'specs', 'workflow-routing'), { recursive: true });
    await fs.writeFile(path.join(changeDir, 'specs', 'workflow-routing', 'spec.md'), '## ADDED Requirements\n');

    const result = await runCLI(['subagent', 'bootstrap', '--change', changeName, '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.tier).toBe(3);
    expect(payload.checks.some((c: any) => c.checkId === 'runtime.pi-contract')).toBe(true);
  });

  it('returns artifacts exit code when required artifacts are missing', async () => {
    const changeName = 'tier2-test-change';
    const changeDir = await scaffoldBase(changeName);
    await fs.writeFile(path.join(changeDir, 'tier.md'), '- Tier: 2\n');
    await fs.writeFile(path.join(changeDir, 'proposal.md'), 'x\n');

    const result = await runCLI(['subagent', 'bootstrap', '--change', changeName], { cwd: testDir });
    expect(result.exitCode).toBe(22);
    expect(result.stdout).toContain('BOOTSTRAP_ARTIFACTS_MISSING');
  });

  it('returns roles exit code when required role files are missing', async () => {
    const changeName = 'tier1-test-change';
    const changeDir = await scaffoldBase(changeName);
    await fs.writeFile(path.join(changeDir, 'tier.md'), '- Tier: 1\n');
    await fs.writeFile(path.join(changeDir, 'mini-plan.md'), '- [ ] a\n');
    await fs.rm(path.join(testDir, '.agents', 'agents', 'quality-reviewer.yaml'));

    const result = await runCLI(['subagent', 'bootstrap', '--change', changeName], { cwd: testDir });
    expect(result.exitCode).toBe(23);
    expect(result.stdout).toContain('BOOTSTRAP_ROLES_UNAVAILABLE');
  });

  it('keeps memory warning non-blocking', async () => {
    const changeName = 'tier1-memory-warning';
    const changeDir = await scaffoldBase(changeName);
    await fs.writeFile(path.join(changeDir, 'tier.md'), '- Tier: 1\n');
    await fs.writeFile(path.join(changeDir, 'mini-plan.md'), '- [ ] a\n');
    await fs.rm(path.join(testDir, 'c3spec', 'memory', 'MEMORY.md'));

    const result = await runCLI(['subagent', 'bootstrap', '--change', changeName, '--json'], { cwd: testDir });
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    const memoryCheck = payload.checks.find((c: any) => c.checkId === 'memory.index-readable');
    expect(memoryCheck.status).toBe('warn');
    expect(payload.ok).toBe(true);
  });
});
