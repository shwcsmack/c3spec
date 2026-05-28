import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import glob from 'fast-glob';

const VALID_CATEGORIES = ['bug-patterns', 'workflow', 'constraints', 'design-decisions'] as const;
type MemoryCategory = (typeof VALID_CATEGORIES)[number];

const SECTION_HEADING_MAP: Record<MemoryCategory, string> = {
  'bug-patterns': '## Bug Patterns',
  workflow: '## Workflow',
  constraints: '## Constraints',
  'design-decisions': '## Design Decisions',
};

function isValidCategory(value: string): value is MemoryCategory {
  return VALID_CATEGORIES.includes(value as MemoryCategory);
}

export function registerMemoryCommand(program: Command): void {
  const memoryCmd = program
    .command('memory')
    .description('Manage the c3spec memory index');

  // memory list
  memoryCmd
    .command('list')
    .description('Print the MEMORY.md index')
    .action(async () => {
      const chalk = (await import('chalk')).default;
      const memoryIndexPath = path.join(process.cwd(), 'c3spec', 'memory', 'MEMORY.md');

      let content: string;
      try {
        content = await fs.readFile(memoryIndexPath, 'utf-8');
      } catch {
        console.error(
          "No memory index found. Ensure c3spec package resources are installed in pi and scaffolded in this project."
        );
        process.exit(1);
      }

      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('#')) {
          console.log(chalk.cyan(line));
        } else {
          console.log(line);
        }
      }
    });

  // memory add <category> <slug>
  memoryCmd
    .command('add <category> <slug>')
    .description('Scaffold a new memory file and add an index entry')
    .action(async (category: string, slug: string) => {
      const chalk = (await import('chalk')).default;

      if (!isValidCategory(category)) {
        console.error(
          `Error: Invalid category "${category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`
        );
        process.exit(1);
      }

      const targetDir = path.join(process.cwd(), 'c3spec', 'memory', category);
      const targetFile = path.join(targetDir, `${slug}.md`);

      try {
        await fs.access(targetFile);
        console.error(`Memory entry '${slug}' already exists at ${targetFile}`);
        process.exit(1);
      } catch {
        // File doesn't exist — proceed
      }

      await fs.mkdir(targetDir, { recursive: true });

      const fileContent = `---
name: ${slug}
description: TODO — one-line summary
metadata:
  type: ${category}
---

TODO — memory body. Structure:
- **Why**: <past incident or strong preference>
- **How to apply**: <when/where this kicks in>
`;

      await fs.writeFile(targetFile, fileContent, 'utf-8');

      // Update MEMORY.md index
      const memoryIndexPath = path.join(process.cwd(), 'c3spec', 'memory', 'MEMORY.md');
      let indexContent: string;
      try {
        indexContent = await fs.readFile(memoryIndexPath, 'utf-8');
      } catch {
        console.error(
          "No memory index found. Ensure c3spec package resources are installed in pi and scaffolded in this project."
        );
        process.exit(1);
      }

      const sectionHeading = SECTION_HEADING_MAP[category];
      const newEntry = `- [${slug}](${category}/${slug}.md) — TODO`;

      const lines = indexContent.split('\n');
      const headingIndex = lines.findIndex((line) => line.trim() === sectionHeading);

      if (headingIndex === -1) {
        // Section not found — append at end
        const trimmed = indexContent.trimEnd();
        const updated = `${trimmed}\n\n${sectionHeading}\n${newEntry}\n`;
        await fs.writeFile(memoryIndexPath, updated, 'utf-8');
      } else {
        // Insert after the heading (and any comment block lines that follow it)
        let insertIndex = headingIndex + 1;
        // Skip comment lines (HTML comments or blank lines directly after heading)
        while (
          insertIndex < lines.length &&
          (lines[insertIndex].trim().startsWith('<!--') ||
            lines[insertIndex].trim().startsWith('-->') ||
            (lines[insertIndex].trim() === '' && insertIndex === headingIndex + 1))
        ) {
          insertIndex++;
        }
        lines.splice(insertIndex, 0, newEntry);
        await fs.writeFile(memoryIndexPath, lines.join('\n'), 'utf-8');
      }

      console.log(
        chalk.green('✓') + ` Created ${targetFile}\n  Add to git and fill in the body.`
      );
    });

  // memory promote <slug>
  memoryCmd
    .command('promote <slug>')
    .description('Mark a retro candidate as promoted')
    .action(async (slug: string) => {
      const chalk = (await import('chalk')).default;

      // Check if a memory file exists for this slug
      const memoryFiles = await glob(`c3spec/memory/*/${slug}.md`, { cwd: process.cwd() });

      if (memoryFiles.length === 0) {
        console.error(
          `Memory file for '${slug}' not found. Run 'c3spec memory add <category> ${slug}' first.`
        );
        process.exit(1);
      }

      // Search retrospective files for unchecked candidates containing the slug
      const retroFiles = await glob('c3spec/changes/archive/*/retrospective.md', {
        cwd: process.cwd(),
      });

      let promoted = false;

      for (const retroRelPath of retroFiles) {
        const retroAbsPath = path.join(process.cwd(), retroRelPath);
        const retroContent = await fs.readFile(retroAbsPath, 'utf-8');
        const lines = retroContent.split('\n');

        let changed = false;
        const updatedLines = lines.map((line) => {
          if (line.includes('- [ ]') && line.includes(slug)) {
            changed = true;
            return line.replace('- [ ]', '- [x]');
          }
          return line;
        });

        if (changed) {
          await fs.writeFile(retroAbsPath, updatedLines.join('\n'), 'utf-8');
          console.log(chalk.green('✓') + ` Promoted: ${slug} in ${retroAbsPath}`);
          promoted = true;
        }
      }

      if (!promoted) {
        console.warn(
          `No unchecked retro candidate found containing '${slug}'. Nothing to promote.`
        );
      }
    });
}
