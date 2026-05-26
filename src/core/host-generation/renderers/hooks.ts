import type { CanonicalHookManifest } from '../types.js';

export function buildSessionStartHookJson(
  command: string,
  host: 'cursor' | 'claude' | 'codex'
): Record<string, unknown> {
  if (host === 'cursor') {
    return {
      version: 1,
      hooks: {
        sessionStart: [
          {
            command,
          },
        ],
      },
    };
  }

  if (host === 'claude') {
    return {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup|resume|clear|compact',
            hooks: [
              {
                type: 'command',
                command,
              },
            ],
          },
        ],
      },
    };
  }

  return {
    hooks: {
      SessionStart: [
        {
          matcher: 'startup|resume|clear|compact',
          hooks: [
            {
              type: 'command',
              command,
              statusMessage: 'Loading c3spec memory index',
            },
          ],
        },
      ],
    },
  };
}

export function resolveSessionStartCommand(hooks: CanonicalHookManifest[]): string {
  const sessionStartHook = hooks.find((hook) => hook.event === 'session-start');
  return sessionStartHook?.command ?? 'node .agents/hooks/memory-scan.js';
}

export function resolveSessionStartSource(hooks: CanonicalHookManifest[]): string {
  const sessionStartHook = hooks.find((hook) => hook.event === 'session-start');
  return (sessionStartHook?.sourcePath ?? '.agents/hooks/session-start.yaml').replace(/\\/g, '/');
}
