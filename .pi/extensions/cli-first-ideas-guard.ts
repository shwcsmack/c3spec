import path from 'node:path';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { isToolCallEventType } from '@earendil-works/pi-coding-agent';

function normalizeCommand(command: string): string {
  return command.replace(/\s+/g, ' ').trim();
}

function isIdeasReadCommand(command: string): boolean {
  const normalized = normalizeCommand(command);
  return (
    /(^|\s)c3spec ideas (triage|list)(\s|$)/.test(normalized) ||
    /(^|\s)c3spec ideas show\s+\d+(\s|$)/.test(normalized) ||
    /(^|\s)node\s+bin\/c3spec\.js\s+ideas\s+(triage|list)(\s|$)/.test(normalized) ||
    /(^|\s)node\s+bin\/c3spec\.js\s+ideas\s+show\s+\d+(\s|$)/.test(normalized)
  );
}

function isIdeasFilePath(targetPath: string): boolean {
  const normalized = targetPath.replace(/\\/g, '/');
  return (
    normalized === 'IDEAS.md' ||
    normalized.endsWith('/IDEAS.md') ||
    path.basename(normalized) === 'IDEAS.md'
  );
}

export default function registerCliFirstIdeasGuard(pi: ExtensionAPI) {
  let ideasReadViaCliInSession = false;

  pi.on('tool_call', async (event) => {
    if (isToolCallEventType('bash', event)) {
      if (isIdeasReadCommand(event.input.command)) {
        ideasReadViaCliInSession = true;
      }
      return;
    }

    if (isToolCallEventType('read', event)) {
      if (!ideasReadViaCliInSession && isIdeasFilePath(event.input.path)) {
        return {
          block: true,
          reason:
            'CLI-first rule: run `c3spec ideas list|show <id>|triage` (or `node bin/c3spec.js ideas ...`) before reading IDEAS.md.',
        };
      }
      return;
    }

    if (isToolCallEventType('edit', event) && isIdeasFilePath(event.input.path)) {
      return {
        block: true,
        reason:
          'Use CLI for IDEAS.md CRUD: `c3spec ideas add|remove|complete|renumber` (or `node bin/c3spec.js ...`). Direct file edits are blocked.',
      };
    }

    if (isToolCallEventType('write', event) && isIdeasFilePath(event.input.path)) {
      return {
        block: true,
        reason:
          'Use CLI for IDEAS.md CRUD: `c3spec ideas add|remove|complete|renumber` (or `node bin/c3spec.js ...`). Direct file writes are blocked.',
      };
    }
  });
}
