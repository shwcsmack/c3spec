import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

type IdeaEntry = {
  title: string;
  body: string[];
};

type IdeasDocument = {
  preamble: string[];
  entries: IdeaEntry[];
};

const IDEA_HEADING_RE = /^##\s+(\d+)\.\s+(.+)$/;

function ideasPath(cwd = process.cwd()): string {
  return path.join(cwd, 'IDEAS.md');
}

export function parseIdeas(content: string): IdeasDocument {
  const lines = content.split('\n');
  const preamble: string[] = [];
  const entries: IdeaEntry[] = [];

  let current: IdeaEntry | null = null;

  for (const line of lines) {
    const match = line.match(IDEA_HEADING_RE);
    if (match) {
      if (current) entries.push(current);
      current = { title: match[2].trim(), body: [] };
      continue;
    }

    if (!current) {
      preamble.push(line);
    } else {
      current.body.push(line);
    }
  }

  if (current) entries.push(current);
  return { preamble, entries };
}

export function renderIdeas(doc: IdeasDocument): string {
  const parts: string[] = [];
  parts.push(doc.preamble.join('\n').replace(/\n+$/g, ''));

  doc.entries.forEach((entry, index) => {
    parts.push(`## ${index + 1}. ${entry.title}`);
    const body = entry.body.join('\n').replace(/^\n+/, '').replace(/\n+$/g, '');
    parts.push(body);
  });

  return `${parts.join('\n\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

export function renumberIdeas(doc: IdeasDocument): IdeasDocument {
  return doc;
}

function scoreIdea(entry: IdeaEntry): number {
  const haystack = `${entry.title}\n${entry.body.join('\n')}`.toLowerCase();
  let score = 0;

  const highValue = ['workflow', 'archive', 'spec', 'test', 'quality', 'lifecycle', 'tier'];
  const lowerPriority = ['research', 'investigate', 'explore'];

  for (const token of highValue) {
    if (haystack.includes(token)) score += 2;
  }

  for (const token of lowerPriority) {
    if (haystack.includes(token)) score -= 1;
  }

  if (haystack.includes('bug') || haystack.includes('friction')) score += 2;

  return score;
}

async function loadIdeasFile(targetPath = ideasPath()): Promise<IdeasDocument> {
  let content: string;
  try {
    content = await fs.readFile(targetPath, 'utf-8');
  } catch {
    throw new Error(`IDEAS.md not found at ${targetPath}`);
  }
  return parseIdeas(content);
}

async function saveIdeasFile(doc: IdeasDocument, targetPath = ideasPath()): Promise<void> {
  await fs.writeFile(targetPath, renderIdeas(doc), 'utf-8');
}

export function registerIdeasCommand(program: Command): void {
  const ideasCmd = program
    .command('ideas')
    .description('Manage IDEAS.md backlog entries');

  ideasCmd
    .command('add <title>')
    .description('Add a new idea entry to IDEAS.md')
    .requiredOption('--summary <text>', 'Summary paragraph for the idea')
    .option('-b, --bullet <text>', 'Action bullet (repeatable)', (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }, [])
    .action(async (title: string, options: { summary: string; bullet?: string[] }) => {
      const doc = await loadIdeasFile();
      const bullets = options.bullet ?? [];
      const body = [
        '',
        options.summary.trim(),
        '',
        ...(bullets.length > 0 ? bullets.map((line) => `- ${line}`) : ['- TODO: add implementation details']),
      ];

      doc.entries.push({ title: title.trim(), body });
      await saveIdeasFile(doc);
      console.log(`Added idea #${doc.entries.length}: ${title}`);
    });

  ideasCmd
    .command('remove <id>')
    .description('Remove an idea by number and renumber the list')
    .action(async (idRaw: string) => {
      const id = Number(idRaw);
      if (!Number.isInteger(id) || id < 1) {
        console.error('Error: id must be a positive integer.');
        process.exit(1);
      }

      const doc = await loadIdeasFile();
      if (id > doc.entries.length) {
        console.error(`Error: idea #${id} does not exist.`);
        process.exit(1);
      }

      const [removed] = doc.entries.splice(id - 1, 1);
      await saveIdeasFile(doc);
      console.log(`Removed idea #${id}: ${removed.title}`);
      console.log('Renumbered remaining ideas.');
    });

  ideasCmd
    .command('complete <id>')
    .description('Complete an idea (default mode: remove + renumber)')
    .option('--mode <mode>', 'Completion mode: remove|mark', 'remove')
    .action(async (idRaw: string, options: { mode: 'remove' | 'mark' }) => {
      const mode = options.mode ?? 'remove';
      if (mode !== 'remove' && mode !== 'mark') {
        console.error('Error: --mode must be remove or mark.');
        process.exit(1);
      }

      const id = Number(idRaw);
      if (!Number.isInteger(id) || id < 1) {
        console.error('Error: id must be a positive integer.');
        process.exit(1);
      }

      const doc = await loadIdeasFile();
      if (id > doc.entries.length) {
        console.error(`Error: idea #${id} does not exist.`);
        process.exit(1);
      }

      if (mode === 'remove') {
        const [removed] = doc.entries.splice(id - 1, 1);
        await saveIdeasFile(doc);
        console.log(`Completed and removed idea #${id}: ${removed.title}`);
        console.log('Renumbered remaining ideas.');
        return;
      }

      const entry = doc.entries[id - 1];
      const hasStatus = entry.body.some((line) => line.trim().startsWith('Status ('));
      if (!hasStatus) {
        entry.body = ['', `Status (${new Date().toISOString().slice(0, 10)}): completed`, '', ...entry.body.filter((line) => line.trim() !== '')];
      }
      await saveIdeasFile(doc);
      console.log(`Completed idea #${id} in mark mode: ${entry.title}`);
    });

  ideasCmd
    .command('renumber')
    .description('Normalize numbering in IDEAS.md')
    .action(async () => {
      const doc = await loadIdeasFile();
      await saveIdeasFile(doc);
      console.log(`Renumbered ${doc.entries.length} ideas.`);
    });

  ideasCmd
    .command('lint')
    .description('Validate idea numbering and heading shape')
    .action(async () => {
      const target = ideasPath();
      const content = await fs.readFile(target, 'utf-8');
      const lines = content.split('\n');

      let expected = 1;
      const errors: string[] = [];

      for (const line of lines) {
        const match = line.match(IDEA_HEADING_RE);
        if (!match) continue;
        const id = Number(match[1]);
        if (id !== expected) {
          errors.push(`Expected idea #${expected} but found #${id}`);
          expected = id;
        }
        expected += 1;
      }

      if (errors.length > 0) {
        console.error('IDEAS.md lint failed:');
        for (const error of errors) {
          console.error(`- ${error}`);
        }
        process.exit(1);
      }

      console.log('IDEAS.md lint passed.');
    });

  ideasCmd
    .command('triage')
    .description('Print a priority ranking for ideas')
    .option('--json', 'Output as JSON')
    .action(async (options?: { json?: boolean }) => {
      const doc = await loadIdeasFile();
      const ranked = doc.entries
        .map((entry, index) => ({ id: index + 1, title: entry.title, score: scoreIdea(entry) }))
        .sort((a, b) => b.score - a.score || a.id - b.id);

      if (options?.json) {
        console.log(JSON.stringify(ranked, null, 2));
        return;
      }

      console.log('Idea triage (highest score first):');
      for (const item of ranked) {
        console.log(`- #${item.id} [${item.score}] ${item.title}`);
      }
    });
}
