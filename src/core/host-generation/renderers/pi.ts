import type { CanonicalHostArtifacts, GeneratedHostFile, HostRenderer } from '../types.js';

export const piRenderer: HostRenderer = {
  hostId: 'pi',

  render(_input: CanonicalHostArtifacts): GeneratedHostFile[] {
    return [];
  },
};
