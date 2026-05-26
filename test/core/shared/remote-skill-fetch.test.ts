import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRemoteSkills } from '../../../src/core/shared/remote-skill-fetch.js';
import type { SkillTemplateEntry } from '../../../src/core/shared/skill-generation.js';

const SAMPLE_ENTRY: SkillTemplateEntry = {
  template: {
    name: 'c3spec-explore',
    description: 'Explore mode',
    instructions: 'Bundled instructions',
    license: 'MIT',
    compatibility: 'Requires c3spec CLI.',
    metadata: { author: 'c3spec', version: '1.0' },
  },
  dirName: 'c3spec-explore',
  workflowId: 'explore',
};

const REMOTE_SKILL_MD = `---
name: c3spec-explore
description: Explore mode (remote)
license: MIT
compatibility: Requires c3spec CLI.
metadata:
  author: "c3spec"
  version: "1.0"
---

Remote instructions content here.
`;

describe('fetchRemoteSkills', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses remote instructions when fetch succeeds', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => REMOTE_SKILL_MD,
    } as Response);

    const results = await fetchRemoteSkills([SAMPLE_ENTRY]);

    expect(results).toHaveLength(1);
    expect(results[0].usedRemote).toBe(true);
    expect(results[0].entry.template.instructions).toBe('Remote instructions content here.\n');
    // Metadata from bundled template is preserved (only instructions replaced)
    expect(results[0].entry.template.name).toBe('c3spec-explore');
    expect(results[0].entry.template.license).toBe('MIT');
  });

  it('falls back to bundled template on non-200 response', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    } as Response);

    const results = await fetchRemoteSkills([SAMPLE_ENTRY]);

    expect(results[0].usedRemote).toBe(false);
    expect(results[0].entry.template.instructions).toBe('Bundled instructions');
  });

  it('falls back to bundled template on network error', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const results = await fetchRemoteSkills([SAMPLE_ENTRY]);

    expect(results[0].usedRemote).toBe(false);
    expect(results[0].entry.template.instructions).toBe('Bundled instructions');
  });

  it('falls back to bundled template on abort (timeout)', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    const results = await fetchRemoteSkills([SAMPLE_ENTRY]);

    expect(results[0].usedRemote).toBe(false);
    expect(results[0].entry.template.instructions).toBe('Bundled instructions');
  });

  it('falls back when SKILL.md has no frontmatter delimiters', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => 'just raw content with no frontmatter',
    } as Response);

    const results = await fetchRemoteSkills([SAMPLE_ENTRY]);

    expect(results[0].usedRemote).toBe(false);
    expect(results[0].entry.template.instructions).toBe('Bundled instructions');
  });

  it('fetches all entries in parallel and returns them in order', async () => {
    const entries: SkillTemplateEntry[] = [
      { ...SAMPLE_ENTRY, dirName: 'c3spec-explore', workflowId: 'explore' },
      {
        ...SAMPLE_ENTRY,
        dirName: 'c3spec-new-change',
        workflowId: 'new',
        template: { ...SAMPLE_ENTRY.template, instructions: 'Bundled new-change' },
      },
    ];

    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => REMOTE_SKILL_MD } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' } as Response);

    const results = await fetchRemoteSkills(entries);

    expect(results).toHaveLength(2);
    expect(results[0].usedRemote).toBe(true);
    expect(results[0].entry.dirName).toBe('c3spec-explore');
    expect(results[1].usedRemote).toBe(false);
    expect(results[1].entry.dirName).toBe('c3spec-new-change');
    expect(results[1].entry.template.instructions).toBe('Bundled new-change');
  });

  it('returns empty array for empty input', async () => {
    const results = await fetchRemoteSkills([]);
    expect(results).toHaveLength(0);
  });

  it('fetches from the correct GitHub URL', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: async () => '' } as Response);

    await fetchRemoteSkills([SAMPLE_ENTRY]);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/shwcsmack/c3spec/main/skills/c3spec-explore/SKILL.md',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});
