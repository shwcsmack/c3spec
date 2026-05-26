import type { HostRenderer, SupportedHostId } from '../types.js';
import { assertSupportedHostId } from '../canonical.js';
import { claudeRenderer } from './claude.js';
import { codexRenderer } from './codex.js';
import { cursorRenderer } from './cursor.js';

const HOST_RENDERERS: Record<SupportedHostId, HostRenderer> = {
  cursor: cursorRenderer,
  claude: claudeRenderer,
  codex: codexRenderer,
};

export function getHostRenderer(hostId: string): HostRenderer {
  const supportedHostId = assertSupportedHostId(hostId);
  return HOST_RENDERERS[supportedHostId];
}

export function listHostRenderers(): HostRenderer[] {
  return Object.values(HOST_RENDERERS);
}

export { cursorRenderer, claudeRenderer, codexRenderer };
