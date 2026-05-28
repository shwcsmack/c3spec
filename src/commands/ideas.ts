import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

type IdeaEntry = {
  title: string;
  body: string[];
};

type IdeasDocument = {
  preamble: string[];
  entries: IdeaEntry[];
};

type RankedIdea = {
  id: number;
  title: string;
  score: number;
  confidence: number;
  rationale: string;
  source: 'model' | 'heuristic';
};

const IDEA_HEADING_RE = /^##\s+(\d+)\.\s+(.+)$/;
const IDEAS_DIGEST_RE = /^<!--\s*c3spec:ideas-digest\s+([a-f0-9]{64})\s*-->$/;

function ideasPath(cwd = process.cwd()): string {
  return path.join(cwd, 'IDEAS.md');
}

function stripDigestLines(lines: string[]): string[] {
  return lines.filter((line) => !IDEAS_DIGEST_RE.test(line.trim()));
}

function computeIdeasDigest(contentWithoutDigest: string): string {
  return createHash('sha256').update(contentWithoutDigest, 'utf-8').digest('hex');
}

export function parseIdeas(content: string): IdeasDocument {
  const lines = stripDigestLines(content.split('\n'));
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
  const cleanPreamble = stripDigestLines(doc.preamble).join('\n').replace(/\n+$/g, '');
  parts.push(cleanPreamble);

  doc.entries.forEach((entry, index) => {
    parts.push(`## ${index + 1}. ${entry.title}`);
    const body = entry.body.join('\n').replace(/^\n+/, '').replace(/\n+$/g, '');
    parts.push(body);
  });

  const contentWithoutDigest = `${parts.join('\n\n').replace(/\n{3,}/g, '\n\n')}\n`;
  const digest = computeIdeasDigest(contentWithoutDigest);
  return `${`<!-- c3spec:ideas-digest ${digest} -->\n`}${contentWithoutDigest}`;
}

export function renumberIdeas(doc: IdeasDocument): IdeasDocument {
  return doc;
}

function heuristicScoreIdea(entry: IdeaEntry): number {
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

function rankIdeasHeuristically(doc: IdeasDocument): RankedIdea[] {
  return doc.entries
    .map((entry, index) => {
      const score = heuristicScoreIdea(entry);
      return {
        id: index + 1,
        title: entry.title,
        score,
        confidence: 0.4,
        rationale: 'Heuristic fallback: keyword-based score.',
        source: 'heuristic' as const,
      };
    })
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.id - b.id);
}

function coerceJsonArray(text: string): unknown[] {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const parsed = JSON.parse(withoutFence);
  if (!Array.isArray(parsed)) throw new Error('Model output is not a JSON array.');
  return parsed;
}

function parseRankedIdeas(content: string, doc: IdeasDocument, source: 'model' | 'heuristic' = 'model'): RankedIdea[] {
  let parsed: unknown[];
  try {
    const asObject = JSON.parse(content);
    if (Array.isArray(asObject)) parsed = asObject;
    else if (Array.isArray((asObject as any)?.ranked)) parsed = (asObject as any).ranked;
    else parsed = coerceJsonArray(content);
  } catch {
    parsed = coerceJsonArray(content);
  }

  const byId = new Map<number, RankedIdea>();
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue;
    const id = Number((row as any).id);
    const score = Number((row as any).score);
    const confidence = Number((row as any).confidence);
    const rationale = String((row as any).rationale ?? '').trim();
    if (!Number.isInteger(id) || id < 1 || id > doc.entries.length) continue;
    if (!Number.isFinite(score) || !Number.isFinite(confidence) || !rationale) continue;
    byId.set(id, {
      id,
      title: doc.entries[id - 1].title,
      score: Math.max(0, Math.min(100, score)),
      confidence: Math.max(0, Math.min(1, confidence)),
      rationale,
      source,
    });
  }

  if (byId.size !== doc.entries.length) {
    throw new Error('Model triage did not return a complete valid ranking set.');
  }

  return [...byId.values()].sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.id - b.id);
}

function buildTriagePrompt(doc: IdeasDocument): string {
  const ideasPayload = doc.entries.map((entry, index) => ({
    id: index + 1,
    title: entry.title,
    body: entry.body.join('\n').trim(),
  }));

  return [
    'You are ranking software project backlog ideas for implementation priority.',
    'Return ONLY valid JSON in this shape: {"ranked":[{"id":number,"score":0-100,"confidence":0-1,"rationale":string}]}.',
    'Include exactly one ranked object per input idea id.',
    'Higher score means higher priority. Consider impact, urgency, effort-to-value, strategic alignment, and risk.',
    'Be concise and deterministic.',
    '',
    `Input ideas: ${JSON.stringify(ideasPayload)}`,
  ].join('\n');
}

async function rankIdeasWithModel(
  doc: IdeasDocument,
  options: { model?: string; apiKeyEnv?: string; baseUrl?: string }
): Promise<RankedIdea[] | null> {
  const model = options.model ?? process.env.C3SPEC_TRIAGE_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const apiKeyEnv = options.apiKeyEnv ?? 'OPENAI_API_KEY';
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) return null;

  const baseUrl = (options.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const prompt = buildTriagePrompt(doc);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Model triage HTTP ${response.status}`);
  }

  const payload = await response.json() as any;
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Model triage returned empty content.');

  return parseRankedIdeas(content, doc, 'model');
}

function rankIdeasWithPiAgent(doc: IdeasDocument, options: { model?: string; provider?: string; enabled?: boolean }): RankedIdea[] | null {
  if (options.enabled === false || process.env.C3SPEC_TRIAGE_PI === '0') return null;

  const prompt = buildTriagePrompt(doc);
  const args = ['-p', '--mode', 'text', '--no-tools', '--no-context-files'];

  const model = options.model ?? process.env.C3SPEC_TRIAGE_MODEL ?? process.env.OPENAI_MODEL;
  const provider = options.provider ?? process.env.C3SPEC_TRIAGE_PROVIDER;
  if (provider) args.push('--provider', provider);
  if (model) args.push('--model', model);
  args.push(prompt);

  try {
    const output = execFileSync('pi', args, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });

    if (!output || !output.trim()) throw new Error('pi returned empty content.');
    return parseRankedIdeas(output, doc, 'model');
  } catch {
    return null;
  }
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
    .description('Validate idea numbering, heading shape, and CLI-managed digest')
    .action(async () => {
      const target = ideasPath();
      const content = await fs.readFile(target, 'utf-8');
      const lines = stripDigestLines(content.split('\n'));

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

      const digestMatch = content.match(IDEAS_DIGEST_RE);
      if (!digestMatch) {
        errors.push('Missing c3spec ideas digest header. Run `c3spec ideas renumber` to normalize via CLI.');
      } else {
        const expectedDigest = computeIdeasDigest(lines.join('\n'));
        if (digestMatch[1] !== expectedDigest) {
          errors.push('Digest mismatch: IDEAS.md was edited outside CLI flow. Re-run your change with `c3spec ideas` commands.');
        }
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
    .option('--compact', 'Compact output (hide confidence and rationale)')
    .option('--model <name>', 'Model name override (default: C3SPEC_TRIAGE_MODEL env)')
    .option('--api-key-env <name>', 'Environment variable name for API key', 'OPENAI_API_KEY')
    .option('--base-url <url>', 'OpenAI-compatible base URL', 'https://api.openai.com/v1')
    .option('--no-pi', 'Disable pi-agent fallback triage')
    .action(async (options?: { json?: boolean; compact?: boolean; model?: string; apiKeyEnv?: string; baseUrl?: string; pi?: boolean }) => {
      const doc = await loadIdeasFile();

      let ranked: RankedIdea[];
      try {
        const modelRanked = await rankIdeasWithModel(doc, {
          model: options?.model,
          apiKeyEnv: options?.apiKeyEnv,
          baseUrl: options?.baseUrl,
        });

        if (modelRanked) {
          ranked = modelRanked;
        } else {
          const piRanked = rankIdeasWithPiAgent(doc, { model: options?.model, enabled: options?.pi });
          ranked = piRanked ?? rankIdeasHeuristically(doc);
        }
      } catch (error) {
        console.error(`Model triage failed; using fallback. ${(error as Error).message}`);
        const piRanked = rankIdeasWithPiAgent(doc, { model: options?.model, enabled: options?.pi });
        ranked = piRanked ?? rankIdeasHeuristically(doc);
      }

      if (options?.json) {
        console.log(JSON.stringify(ranked, null, 2));
        return;
      }

      console.log('Idea triage (highest score first):');
      for (const item of ranked) {
        if (options?.compact) {
          console.log(`- #${item.id} [${item.score}] ${item.title}`);
          continue;
        }
        console.log(`- #${item.id} [${item.score}] ${item.title}`);
        console.log(`  confidence: ${item.confidence.toFixed(2)} (${item.source})`);
        console.log(`  rationale: ${item.rationale}`);
      }
    });
}
