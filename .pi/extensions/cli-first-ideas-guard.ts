import path from 'node:path';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { isToolCallEventType } from '@earendil-works/pi-coding-agent';

function isIdeasTriageCommand(command: string): boolean {
  const normalized = command.replace(/\s+/g, ' ').trim();
  return (
    /(^|\s)c3spec ideas triage(\s|$)/.test(normalized) ||
    /(^|\s)node\s+bin\/c3spec\.js\s+ideas\s+triage(\s|$)/.test(normalized)
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
  let triageRanInSession = false;

  pi.on('tool_call', async (event) => {
    if (isToolCallEventType('bash', event)) {
      if (isIdeasTriageCommand(event.input.command)) {
        triageRanInSession = true;
      }
      return;
    }

    if (isToolCallEventType('read', event)) {
      if (!triageRanInSession && isIdeasFilePath(event.input.path)) {
        return {
          block: true,
          reason:
            'CLI-first rule: run `c3spec ideas triage` (or `node bin/c3spec.js ideas triage`) before reading IDEAS.md.',
        };
      }
    }
  });
}
