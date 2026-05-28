import type { HostRenderer, SupportedHostId } from '../types.js';
import { assertSupportedHostId } from '../canonical.js';
import { piRenderer } from './pi.js';

const HOST_RENDERERS: Record<SupportedHostId, HostRenderer> = {
  pi: piRenderer,
};

export function getHostRenderer(hostId: string): HostRenderer {
  const supportedHostId = assertSupportedHostId(hostId);
  return HOST_RENDERERS[supportedHostId];
}

export function listHostRenderers(): HostRenderer[] {
  return Object.values(HOST_RENDERERS);
}

export { piRenderer };
