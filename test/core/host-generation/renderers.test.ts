import { describe, it, expect } from 'vitest';
import path from 'path';
import { discoverCanonicalArtifacts } from '../../../src/core/host-generation/canonical.js';
import { getHostRenderer, piRenderer, renderHostFiles } from '../../../src/core/host-generation/index.js';

describe('host-generation renderers', () => {
  const projectRoot = path.resolve(import.meta.dirname, '../../..');

  it('returns renderer only for supported host', () => {
    expect(getHostRenderer('pi').hostId).toBe('pi');
    expect(() => getHostRenderer('cursor')).toThrow(/Unknown host ID/);
  });

  it('pi renderer returns generated files shape', async () => {
    const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
    expect(errors).toEqual([]);

    const files = piRenderer.render(artifacts);
    expect(Array.isArray(files)).toBe(true);
    expect(files.every((file) => file.generated)).toBe(true);
  });

  it('renders deterministically for pi host', async () => {
    const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
    expect(errors).toEqual([]);

    const first = renderHostFiles('pi', artifacts);
    const second = renderHostFiles('pi', artifacts);

    expect(first.map((file) => ({ path: file.path, content: file.content }))).toEqual(
      second.map((file) => ({ path: file.path, content: file.content }))
    );
  });
});
