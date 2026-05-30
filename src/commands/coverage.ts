import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';

type RequirementRef = { id?: string; title: string; line: number };
type SpecCoverage = { spec: string; requirements: RequirementRef[] };
type Baseline = Record<string, { exemptRequirementIds?: string[]; allowMissingIds?: boolean }>;

const REQUIREMENT_HEADER_RE = /^###\s+Requirement:\s*(?:\[([A-Z0-9-]+)\]\s*)?(.+)$/;
// Canonical token format: requirement: <PREFIX-NNN>
// Examples: requirement: WORKFLOW-ROUTING-013, requirement: CLI-VALIDATE-007
const REQUIREMENT_TOKEN_RE = /requirement:\s*([A-Z][A-Z0-9-]*-\d{3,})\b/g;

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function listFilesRecursive(root: string, allow: (p: string) => boolean): Promise<string[]> {
  if (!(await fileExists(root))) return [];
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (allow(full)) out.push(full);
    }
  }
  return out.sort();
}

export async function scanSpecs(projectRoot: string): Promise<SpecCoverage[]> {
  const specsRoot = path.join(projectRoot, 'c3spec', 'specs');
  if (!(await fileExists(specsRoot))) return [];
  const dirs = await fs.readdir(specsRoot, { withFileTypes: true });
  const result: SpecCoverage[] = [];
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const specPath = path.join(specsRoot, dir.name, 'spec.md');
    if (!(await fileExists(specPath))) continue;
    const content = await fs.readFile(specPath, 'utf8');
    const requirements: RequirementRef[] = [];
    content.split(/\r?\n/).forEach((line, i) => {
      const m = line.match(REQUIREMENT_HEADER_RE);
      if (!m) return;
      requirements.push({ id: m[1], title: m[2].trim(), line: i + 1 });
    });
    result.push({ spec: dir.name, requirements });
  }
  return result;
}

export async function scanTestRequirementRefs(projectRoot: string): Promise<Map<string, string[]>> {
  const testFiles = await listFilesRecursive(path.join(projectRoot, 'test'), (p) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(p));
  const refs = new Map<string, string[]>();
  for (const file of testFiles) {
    const content = await fs.readFile(file, 'utf8');
    for (const m of content.matchAll(REQUIREMENT_TOKEN_RE)) {
      const id = m[1];
      refs.set(id, [...(refs.get(id) ?? []), path.relative(projectRoot, file)]);
    }
  }
  return refs;
}

async function loadBaseline(projectRoot: string): Promise<Baseline> {
  const baselinePath = path.join(projectRoot, 'c3spec', 'spec-coverage-baseline.json');
  if (!(await fileExists(baselinePath))) return {};
  try {
    return JSON.parse(await fs.readFile(baselinePath, 'utf8')) as Baseline;
  } catch {
    return {};
  }
}

export async function runCoverageAudit(projectRoot: string, strict: boolean, json: boolean): Promise<void> {
  const [specs, refs, baseline] = await Promise.all([
    scanSpecs(projectRoot),
    scanTestRequirementRefs(projectRoot),
    loadBaseline(projectRoot),
  ]);

  const duplicateIds = new Set<string>();
  const seen = new Set<string>();
  const missingId: Array<{ spec: string; title: string; line: number }> = [];
  const uncovered: string[] = [];

  for (const spec of specs) {
    const specBaseline = baseline[spec.spec] ?? {};
    const exemptions = new Set(specBaseline.exemptRequirementIds ?? []);
    for (const req of spec.requirements) {
      if (!req.id) {
        if (!specBaseline.allowMissingIds) missingId.push({ spec: spec.spec, title: req.title, line: req.line });
        continue;
      }
      if (seen.has(req.id)) duplicateIds.add(req.id);
      seen.add(req.id);
      if (!refs.has(req.id) && !exemptions.has(req.id)) uncovered.push(req.id);
    }
  }

  const unknownRefs = [...refs.keys()].filter((id) => !seen.has(id));
  const hasErrors = duplicateIds.size > 0 || (strict && (missingId.length > 0 || uncovered.length > 0));

  const uncoveredSet = new Set(uncovered);
  const perSpec = specs.map((spec) => {
    const specBaseline = baseline[spec.spec] ?? {};
    const exempt = new Set(specBaseline.exemptRequirementIds ?? []);
    const requirementIds = spec.requirements.map((r) => r.id).filter((id): id is string => !!id);
    const uncoveredIds = requirementIds.filter((id) => uncoveredSet.has(id));
    return {
      spec: spec.spec,
      requirements: spec.requirements.length,
      missingIds: spec.requirements.filter((r) => !r.id).length,
      exemptIds: exempt.size,
      uncovered: uncoveredIds.length,
      covered: Math.max(0, requirementIds.length - uncoveredIds.length - exempt.size),
    };
  });

  const payload = {
    strict,
    totals: {
      specs: specs.length,
      requirements: specs.reduce((n, s) => n + s.requirements.length, 0),
      missingIds: missingId.length,
      uncovered: uncovered.length,
      unknownRefs: unknownRefs.length,
      duplicateIds: duplicateIds.size,
    },
    perSpec,
    missingId,
    uncovered,
    duplicateIds: [...duplicateIds],
    unknownRefs,
  };

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`Spec coverage: ${payload.totals.specs} specs, ${payload.totals.requirements} requirements`);
    if (missingId.length) console.log(`- missing IDs: ${missingId.length}`);
    if (uncovered.length) console.log(`- uncovered requirements: ${uncovered.length}`);
    if (unknownRefs.length) console.log(`- unknown test references: ${unknownRefs.length}`);
    if (duplicateIds.size) console.log(`- duplicate requirement IDs: ${duplicateIds.size}`);
    for (const row of perSpec) {
      console.log(`  ${row.spec}: covered=${row.covered} uncovered=${row.uncovered} exempt=${row.exemptIds} missingIds=${row.missingIds}`);
    }
    if (!missingId.length && !uncovered.length && !unknownRefs.length && !duplicateIds.size) console.log('All requirements are covered.');
  }

  process.exitCode = hasErrors ? 1 : 0;
}

export function registerCoverageCommand(program: Command): void {
  program
    .command('coverage')
    .description('Audit requirement-to-test coverage across c3spec/specs')
    .option('--strict', 'Fail when requirements are missing IDs or uncovered')
    .option('--json', 'Output JSON')
    .action(async (options?: { strict?: boolean; json?: boolean }) => {
      await runCoverageAudit(process.cwd(), !!options?.strict, !!options?.json);
    });
}
