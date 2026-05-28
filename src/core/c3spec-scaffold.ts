/**
 * C3spec scaffold — sets up the workflow memory structure for a project that
 * has c3spec package resources available in pi for the project.
 */

import path from 'path';
import * as fs from 'fs';

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
 * Scaffold the c3spec workflow directory structure for the given project.
 *
 * @param c3specDir  Absolute path to the c3spec directory (e.g. projectRoot/c3spec/)
 * @param projectRoot  Absolute path to the project root
 */
export async function scaffoldC3specStructure(
  c3specDir: string,
  _projectRoot: string
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

  // Host-native skills, agents, hooks, and root instruction files are generated
  // by src/core/host-generation. Keeping this scaffold memory-only prevents
  // stale Cursor skill mirrors or legacy CLAUDE.md fragments from drifting.
}
