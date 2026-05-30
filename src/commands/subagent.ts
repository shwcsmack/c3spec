import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateChangeExists } from './workflow/shared.js';

type CheckCategory = 'runtime' | 'artifacts' | 'roles' | 'memory';
type CheckStatus = 'pass' | 'fail' | 'warn';

interface BootstrapCheckResult {
  checkId: string;
  category: CheckCategory;
  status: CheckStatus;
  required: boolean;
  message: string;
}

interface BootstrapFailure {
  code: string;
  checkId: string;
  message: string;
  nextSteps: string[];
}

interface BootstrapResult {
  ok: boolean;
  change: string;
  tier: 1 | 2 | 3 | null;
  checks: BootstrapCheckResult[];
  failures: BootstrapFailure[];
  nextSteps: string[];
}

const EXIT_CODES = {
  OK: 0,
  RUNTIME: 20,
  CHANGE_TIER: 21,
  ARTIFACTS: 22,
  ROLES: 23,
  USAGE: 24,
  INTERNAL: 25,
} as const;

interface BootstrapOptions {
  change?: string;
  json?: boolean;
}

export function registerSubagentCommand(program: Command): void {
  const subagentCmd = program.command('subagent').description('Subagent workflow utilities');

  subagentCmd
    .command('bootstrap')
    .description('Validate subagent dispatch readiness for a change')
    .option('--change <id>', 'Change name')
    .option('--json', 'Output as JSON')
    .action(async (options: BootstrapOptions) => {
      try {
        const exitCode = await runBootstrap(options, process.cwd());
        process.exitCode = exitCode;
      } catch (error) {
        const result: BootstrapResult = {
          ok: false,
          change: options.change ?? '',
          tier: null,
          checks: [],
          failures: [
            {
              code: 'BOOTSTRAP_INTERNAL_ERROR',
              checkId: 'internal.unexpected',
              message: (error as Error).message,
              nextSteps: ['Retry command. If issue persists, inspect stack trace with DEBUG logs.'],
            },
          ],
          nextSteps: ['Fix internal bootstrap error before dispatching subagents.'],
        };

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.error('Bootstrap failed: internal error');
          console.error(`- ${(error as Error).message}`);
        }

        process.exitCode = EXIT_CODES.INTERNAL;
      }
    });
}

export async function runBootstrap(options: BootstrapOptions, projectRoot: string): Promise<number> {
  if (!options.change) {
    const payload: BootstrapResult = {
      ok: false,
      change: '',
      tier: null,
      checks: [],
      failures: [
        {
          code: 'BOOTSTRAP_USAGE_ERROR',
          checkId: 'usage.change-required',
          message: 'Missing required option --change <id>.',
          nextSteps: ['Re-run with: c3spec subagent bootstrap --change <id>'],
        },
      ],
      nextSteps: ['Provide a valid change id.'],
    };
    printResult(payload, options.json === true);
    return EXIT_CODES.USAGE;
  }

  const checks: BootstrapCheckResult[] = [];
  const failures: BootstrapFailure[] = [];

  let changeName: string;
  try {
    changeName = await validateChangeExists(options.change, projectRoot);
  } catch (error) {
    failures.push({
      code: 'BOOTSTRAP_CHANGE_UNRESOLVED',
      checkId: 'artifacts.change-exists',
      message: (error as Error).message,
      nextSteps: ['Create/select a valid change directory and retry.'],
    });
    const payload: BootstrapResult = {
      ok: false,
      change: options.change,
      tier: null,
      checks,
      failures,
      nextSteps: ['Resolve change selection failure before dispatch.'],
    };
    printResult(payload, options.json === true);
    return EXIT_CODES.CHANGE_TIER;
  }

  const changeDir = path.join(projectRoot, 'c3spec', 'changes', changeName);
  const tier = deriveTier(changeName, changeDir);
  if (!tier) {
    failures.push({
      code: 'BOOTSTRAP_TIER_AMBIGUOUS',
      checkId: 'artifacts.tier-derived',
      message: 'Unable to derive tier unambiguously from on-disk metadata.',
      nextSteps: ['Add c3spec/changes/<id>/tier.md with a valid Tier field (1, 2, or 3).'],
    });
    const payload: BootstrapResult = {
      ok: false,
      change: changeName,
      tier: null,
      checks,
      failures,
      nextSteps: ['Fix tier metadata and retry bootstrap.'],
    };
    printResult(payload, options.json === true);
    return EXIT_CODES.CHANGE_TIER;
  }

  // runtime
  const runtimeOk = fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'c3spec-host-adapter', 'SKILL.md'));
  checks.push({
    checkId: 'runtime.pi-contract',
    category: 'runtime',
    status: runtimeOk ? 'pass' : 'fail',
    required: true,
    message: runtimeOk
      ? 'Pi runtime dispatch contract surface is present.'
      : 'Missing c3spec host-adapter skill required for pi runtime dispatch contract.',
  });
  if (!runtimeOk) {
    failures.push({
      code: 'BOOTSTRAP_RUNTIME_UNSUPPORTED',
      checkId: 'runtime.pi-contract',
      message: 'Runtime dispatch contract not available.',
      nextSteps: ['Restore .agents/skills/c3spec-host-adapter/SKILL.md and retry.'],
    });
  }

  // artifacts
  const missingArtifacts = requiredArtifactsForTier(tier).filter((p) => !fs.existsSync(path.join(changeDir, p)));
  const hasDeltaSpecForT3 = tier !== 3 || globHasSpec(changeDir);
  const artifactsOk = missingArtifacts.length === 0 && hasDeltaSpecForT3;
  checks.push({
    checkId: 'artifacts.apply-readiness',
    category: 'artifacts',
    status: artifactsOk ? 'pass' : 'fail',
    required: true,
    message: artifactsOk
      ? 'Required apply-readiness artifacts are present.'
      : `Missing required artifacts: ${[
          ...missingArtifacts,
          ...(hasDeltaSpecForT3 ? [] : ['specs/<capability>/spec.md']),
        ].join(', ')}`,
  });
  if (!artifactsOk) {
    failures.push({
      code: 'BOOTSTRAP_ARTIFACTS_MISSING',
      checkId: 'artifacts.apply-readiness',
      message: 'Required artifacts for subagent dispatch are missing.',
      nextSteps: ['Generate missing planning artifacts and retry bootstrap.'],
    });
  }

  // roles
  const roleFiles = ['implementer.yaml', 'spec-reviewer.yaml', 'quality-reviewer.yaml'];
  const missingRoles = roleFiles.filter(
    (file) => !fs.existsSync(path.join(projectRoot, '.agents', 'agents', file))
  );
  const rolesOk = missingRoles.length === 0;
  checks.push({
    checkId: 'roles.named-agent-surfaces',
    category: 'roles',
    status: rolesOk ? 'pass' : 'fail',
    required: true,
    message: rolesOk ? 'All required named-agent role definitions are present.' : `Missing role files: ${missingRoles.join(', ')}`,
  });
  if (!rolesOk) {
    failures.push({
      code: 'BOOTSTRAP_ROLES_UNAVAILABLE',
      checkId: 'roles.named-agent-surfaces',
      message: 'Required named-agent role definitions are missing.',
      nextSteps: ['Restore missing .agents/agents/*.yaml role files and retry.'],
    });
  }

  // memory (informational)
  const memoryPath = path.join(projectRoot, 'c3spec', 'memory', 'MEMORY.md');
  const memoryOk = fs.existsSync(memoryPath);
  checks.push({
    checkId: 'memory.index-readable',
    category: 'memory',
    status: memoryOk ? 'pass' : 'warn',
    required: false,
    message: memoryOk
      ? 'Memory index available for context injection.'
      : 'Memory index missing; dispatch may proceed but without memory context loading.',
  });

  const ok = failures.length === 0;
  const payload: BootstrapResult = {
    ok,
    change: changeName,
    tier,
    checks,
    failures,
    nextSteps: ok ? ['Bootstrap passed. Subagent dispatch may proceed.'] : failures.flatMap((f) => f.nextSteps),
  };

  printResult(payload, options.json === true);

  if (ok) return EXIT_CODES.OK;
  if (failures.some((f) => f.code.startsWith('BOOTSTRAP_RUNTIME'))) return EXIT_CODES.RUNTIME;
  if (failures.some((f) => f.code.startsWith('BOOTSTRAP_ARTIFACTS') || f.code.startsWith('BOOTSTRAP_CHANGE') || f.code.startsWith('BOOTSTRAP_TIER'))) {
    return failures.some((f) => f.code.startsWith('BOOTSTRAP_ARTIFACTS')) ? EXIT_CODES.ARTIFACTS : EXIT_CODES.CHANGE_TIER;
  }
  if (failures.some((f) => f.code.startsWith('BOOTSTRAP_ROLES'))) return EXIT_CODES.ROLES;
  return EXIT_CODES.INTERNAL;
}

function printResult(result: BootstrapResult, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Subagent bootstrap for change: ${result.change}`);
  if (result.tier) console.log(`Derived tier: ${result.tier}`);
  for (const check of result.checks) {
    const marker = check.status === 'pass' ? '[PASS]' : check.status === 'warn' ? '[WARN]' : '[FAIL]';
    console.log(`${marker} ${check.checkId}: ${check.message}`);
  }
  if (result.failures.length > 0) {
    console.log('\nFailures:');
    for (const failure of result.failures) {
      console.log(`- ${failure.code} (${failure.checkId}): ${failure.message}`);
    }
  }
}

function deriveTier(changeName: string, changeDir: string): 1 | 2 | 3 | null {
  const tierPath = path.join(changeDir, 'tier.md');
  if (fs.existsSync(tierPath)) {
    const content = fs.readFileSync(tierPath, 'utf-8');
    const match = content.match(/-\s*Tier:\s*([123])\b/i);
    if (match) return Number(match[1]) as 1 | 2 | 3;
  }

  if (changeName.startsWith('tier1-')) return 1;
  if (changeName.startsWith('tier2-')) return 2;

  const hasT3Hints = fs.existsSync(path.join(changeDir, 'brainstorm.md')) || fs.existsSync(path.join(changeDir, 'design.md'));
  if (hasT3Hints) return 3;

  return null;
}

function requiredArtifactsForTier(tier: 1 | 2 | 3): string[] {
  if (tier === 1) return ['mini-plan.md'];
  if (tier === 2) return ['proposal.md', 'tasks.md', 'plan.md'];
  return ['brainstorm.md', 'proposal.md', 'design.md', 'tasks.md', 'plan.md'];
}

function globHasSpec(changeDir: string): boolean {
  const specsRoot = path.join(changeDir, 'specs');
  if (!fs.existsSync(specsRoot)) return false;

  const stack = [specsRoot];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && entry.name === 'spec.md') return true;
    }
  }
  return false;
}
