/**
 * C3spec scaffold — sets up the workflow memory structure and CLAUDE.md fragment
 * for a project that has run `c3spec init`.
 */

import path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const MEMORY_MD_CONTENT = `# Memory Index

One line per entry. Load this index at the start of every \`/c3spec:start\` session.

## Bug Patterns
<!-- entries added here as bug patterns are captured from cycles -->

## Workflow
<!-- entries added here as workflow learnings are captured from cycles -->

## Constraints
<!-- entries added here as constraints are discovered -->

## Design Decisions
<!-- entries added here as design decisions are captured from cycles -->
`;

/**
 * Scaffold the c3spec workflow directory structure and CLAUDE.md fragment
 * for the given project.
 *
 * @param c3specDir  Absolute path to the c3spec directory (e.g. projectRoot/c3spec/)
 * @param projectRoot  Absolute path to the project root
 */
export async function scaffoldC3specStructure(
  c3specDir: string,
  projectRoot: string
): Promise<void> {
  // ─── 1. Create memory subdirectories ──────────────────────────────────────
  const memoryDirs = [
    path.join(c3specDir, 'memory'),
    path.join(c3specDir, 'memory', 'bug-patterns'),
    path.join(c3specDir, 'memory', 'workflow'),
    path.join(c3specDir, 'memory', 'constraints'),
    path.join(c3specDir, 'memory', 'design-decisions'),
  ];

  for (const dir of memoryDirs) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  // ─── 2. Write memory/MEMORY.md (only if not already present) ──────────────
  const memoryIndexPath = path.join(c3specDir, 'memory', 'MEMORY.md');
  if (!fs.existsSync(memoryIndexPath)) {
    await fs.promises.writeFile(memoryIndexPath, MEMORY_MD_CONTENT, 'utf8');
  }

  // ─── 3. Copy skill directories to .cursor/skills/ ─────────────────────────
  // TODO: copy bundled skills from schemas/superpowers-bridge/skills/ once bundled
  const skillsSentinel = path.join(projectRoot, '.cursor', 'skills', 'c3spec-start', 'SKILL.md');
  if (!fs.existsSync(skillsSentinel)) {
    // Skills not present — copy from package's bundled schema (not yet bundled).
    const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../../../');
    const bundledSkillsDir = path.join(packageRoot, 'schemas', 'superpowers-bridge', 'skills');
    if (fs.existsSync(bundledSkillsDir)) {
      const destSkillsDir = path.join(projectRoot, '.cursor', 'skills');
      await fs.promises.mkdir(destSkillsDir, { recursive: true });
      await fs.promises.cp(bundledSkillsDir, destSkillsDir, { recursive: true });
    }
    // If bundledSkillsDir does not exist yet, silently skip.
  }
  // If sentinel exists, skills are already in place — skip.

  // ─── 4. Handle CLAUDE.md fragment ─────────────────────────────────────────
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');

  // Read the fragment from the bundled schema templates
  const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../../../');
  const fragmentPath = path.join(
    packageRoot,
    'c3spec',
    'schemas',
    'superpowers-bridge',
    'templates',
    'adopters',
    'CLAUDE.md.fragment.md'
  );

  if (!fs.existsSync(fragmentPath)) {
    // Fragment not available (e.g. in a published package without bundled schemas). Skip.
    return;
  }

  const fragment = await fs.promises.readFile(fragmentPath, 'utf8');

  // Check whether CLAUDE.md already contains the routing section
  if (fs.existsSync(claudeMdPath)) {
    const existing = await fs.promises.readFile(claudeMdPath, 'utf8');
    if (existing.includes('## Workflow routing')) {
      // Already injected — nothing to do.
      return;
    }
    // Append with a newline separator
    await fs.promises.writeFile(claudeMdPath, existing + '\n' + fragment, 'utf8');
  } else {
    // Create a new CLAUDE.md containing just the fragment
    await fs.promises.writeFile(claudeMdPath, fragment, 'utf8');
  }
}
