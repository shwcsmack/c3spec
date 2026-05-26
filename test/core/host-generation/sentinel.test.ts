import { describe, it, expect } from 'vitest';
import {
  buildJsonSidecarSentinel,
  computeContentHash,
  hasGeneratedContentDrifted,
  isGeneratedByC3spec,
  parseJsonSidecarSentinel,
  stripSentinel,
  withSentinel,
} from '../../../src/core/host-generation/sentinel.js';

describe('host-generation sentinel', () => {
  const source = '.agents/skills/demo-skill/SKILL.md';
  const baseMarkdown = '---\nname: demo\n---\n\nBody text\n';

  it('embeds and detects markdown sentinels', () => {
    const generated = withSentinel(baseMarkdown, source, 'markdown');

    expect(isGeneratedByC3spec(generated, 'markdown')).toBe(true);
    expect(hasGeneratedContentDrifted(generated, 'markdown')).toBe(false);
    expect(generated).toContain('c3spec-source: .agents/skills/demo-skill/SKILL.md');
    expect(generated).toMatch(/c3spec-hash: [a-f0-9]{64}/);
  });

  it('detects hand-edited markdown content', () => {
    const generated = withSentinel(baseMarkdown, source, 'markdown');
    const edited = generated.replace('Body text', 'Hand edited body');

    expect(isGeneratedByC3spec(edited, 'markdown')).toBe(true);
    expect(hasGeneratedContentDrifted(edited, 'markdown')).toBe(true);
  });

  it('treats missing sentinel as not generated', () => {
    expect(isGeneratedByC3spec(baseMarkdown, 'markdown')).toBe(false);
    expect(hasGeneratedContentDrifted(baseMarkdown, 'markdown')).toBe(false);
  });

  it('builds json sidecar sentinels without modifying host json', () => {
    const baseJson = `${JSON.stringify({ version: 1, hooks: {} }, null, 2)}\n`;
    const sidecar = buildJsonSidecarSentinel(baseJson, '.agents/hooks/session-start.yaml');

    expect(JSON.parse(baseJson)).toEqual({ version: 1, hooks: {} });
    expect(JSON.parse(baseJson)).not.toHaveProperty('_c3spec');
    expect(parseJsonSidecarSentinel(sidecar)).toEqual({
      generated: true,
      source: '.agents/hooks/session-start.yaml',
      hash: computeContentHash(baseJson),
    });
  });

  it('rejects malformed json sidecar sentinels', () => {
    expect(parseJsonSidecarSentinel(JSON.stringify({ generated: true }))).toBeNull();
  });

  it('supports sidecar drift detection for host json', () => {
    const original = `${JSON.stringify({ version: 1 }, null, 2)}\n`;
    const edited = `${JSON.stringify({ version: 2 }, null, 2)}\n`;
    const sidecar = buildJsonSidecarSentinel(original, '.agents/hooks/session-start.yaml');
    const metadata = parseJsonSidecarSentinel(sidecar);

    expect(metadata?.hash).toBe(computeContentHash(original));
    expect(metadata?.hash).not.toBe(computeContentHash(edited));
  });

  it('embeds and detects toml sentinels', () => {
    const baseToml = '[agents]\nmax_threads = 6\nmax_depth = 1\n';
    const generated = withSentinel(baseToml, 'c3spec/host-generation/codex-config', 'toml');

    expect(isGeneratedByC3spec(generated, 'toml')).toBe(true);
    expect(hasGeneratedContentDrifted(generated, 'toml')).toBe(false);
    expect(generated.startsWith('# c3spec-generated: true')).toBe(true);
  });

  it('strips sentinels and preserves payload hash contract', () => {
    const generated = withSentinel(baseMarkdown, source, 'markdown');
    const stripped = stripSentinel(generated, 'markdown');

    expect(stripped.metadata?.source).toBe(source);
    expect(stripped.content.trim()).toBe(baseMarkdown.trim());
    expect(stripped.metadata?.hash).toBe(computeContentHash(`${stripped.content}`));
  });

  it('does not mutate markdown with partial sentinel-looking comments', () => {
    const malformed = `${baseMarkdown}\n<!-- c3spec-generated: true\nc3spec-hash: ${'a'.repeat(64)} -->\n`;
    const stripped = stripSentinel(malformed, 'markdown');

    expect(stripped.metadata).toBeNull();
    expect(stripped.content).toBe(malformed);
  });

  it('does not strip later toml comments that resemble sentinels', () => {
    const toml = `[agents]\nmax_depth = 1\n# c3spec-generated: true\n`;
    const stripped = stripSentinel(toml, 'toml');

    expect(stripped.metadata).toBeNull();
    expect(stripped.content).toBe(toml);
  });

  it('does not mutate toml with partial leading sentinel comments', () => {
    const toml = `# c3spec-generated: true\n[agents]\nmax_depth = 1\n`;
    const stripped = stripSentinel(toml, 'toml');

    expect(stripped.metadata).toBeNull();
    expect(stripped.content).toBe(toml);
  });
});
