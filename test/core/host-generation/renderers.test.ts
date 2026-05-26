import { describe, it, expect } from 'vitest';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { discoverCanonicalArtifacts } from '../../../src/core/host-generation/canonical.js';
import {
  claudeRenderer,
  codexRenderer,
  cursorRenderer,
  getHostRenderer,
  renderHostFiles,
} from '../../../src/core/host-generation/index.js';
import {
  extractSentinelMetadata,
  isGeneratedByC3spec,
  parseJsonSidecarSentinel,
  stripSentinel,
} from '../../../src/core/host-generation/sentinel.js';
import {
  formatTomlBasicString,
  formatTomlMultilineString,
  formatTomlString,
} from '../../../src/core/host-generation/renderers/toml-writer.js';

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

function parseMarkdownFrontmatter(content: string): Record<string, unknown> {
  const stripped = stripSentinel(content, 'markdown').content.trim();
  const match = stripped.match(FRONTMATTER_PATTERN);
  if (!match) {
    throw new Error('Missing markdown frontmatter');
  }
  return parseYaml(match[1]) as Record<string, unknown>;
}

function parseTomlAgent(content: string): Record<string, string> {
  const stripped = stripSentinel(content, 'toml').content.trim();
  const nameMatch = stripped.match(/^name = (.+)$/m);
  const descriptionMatch = stripped.match(/^description = (.+)$/m);
  const instructionsMatch = stripped.match(/^developer_instructions = ([\s\S]*)$/m);

  if (!nameMatch || !descriptionMatch || !instructionsMatch) {
    throw new Error('Invalid TOML agent shape');
  }

  const readTomlString = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('"""')) {
      return trimmed
        .replace(/^"""\n?/, '')
        .replace(/\n?"""$/, '')
        .replace(/\\"""\\/g, '"""')
        .replace(/\\\\/g, '\\');
    }
    return trimmed
      .replace(/^"/, '')
      .replace(/"$/, '')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  };

  return {
    name: readTomlString(nameMatch[1]),
    description: readTomlString(descriptionMatch[1]),
    developer_instructions: readTomlString(instructionsMatch[1]),
  };
}

describe('host-generation renderers', () => {
  const projectRoot = path.resolve(import.meta.dirname, '../../..');

  it('returns renderers only for supported hosts', () => {
    expect(getHostRenderer('cursor').hostId).toBe('cursor');
    expect(getHostRenderer('claude').hostId).toBe('claude');
    expect(getHostRenderer('codex').hostId).toBe('codex');
    expect(() => getHostRenderer('windsurf')).toThrow(/Unknown host ID/);
  });

  describe('toml writer escaping', () => {
    it('escapes quotes and backslashes in basic strings', () => {
      expect(formatTomlBasicString(String.raw`say "hi"`)).toBe(String.raw`"say \"hi\""`);
      expect(formatTomlBasicString(String.raw`path\to\file`)).toBe(String.raw`"path\\to\\file"`);
    });

    it('uses triple quotes for multiline and triple-quote edge cases', () => {
      const multiline = 'line one\nline two';
      expect(formatTomlMultilineString(multiline)).toBe(`"""\n${multiline}\n"""`);
      expect(formatTomlString('contains """ quote')).toContain('\\"""');
    });
  });

  describe('cursor renderer', () => {
    it('renders agents and hooks without skill mirrors', async () => {
      const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
      expect(errors).toEqual([]);

      const files = cursorRenderer.render(artifacts);

      expect(files.every((file) => file.generated)).toBe(true);
      expect(files.some((file) => file.path.startsWith('.cursor/agents/'))).toBe(true);
      expect(files.some((file) => file.path === path.join('.cursor', 'hooks.json'))).toBe(true);
      expect(files.some((file) => file.path.includes('.cursor/skills'))).toBe(false);

      const specReviewer = files.find((file) => file.path.endsWith('spec-reviewer.md'));
      expect(specReviewer).toBeDefined();
      const frontmatter = parseMarkdownFrontmatter(specReviewer!.content);
      expect(frontmatter.name).toBe('spec-reviewer');
      expect(frontmatter.readonly).toBe(true);

      const hooksFile = files.find((file) => file.path === path.join('.cursor', 'hooks.json'));
      const hooksJson = JSON.parse(hooksFile!.content) as {
        version: number;
        hooks: { sessionStart: Array<{ command: string }> };
        _c3spec?: unknown;
      };
      expect(hooksJson.version).toBe(1);
      expect(hooksJson.hooks.sessionStart[0]?.command).toBe('node .agents/hooks/memory-scan.js');
      expect(hooksJson).not.toHaveProperty('_c3spec');

      const sidecar = files.find((file) => file.path === `${path.join('.cursor', 'hooks.json')}.c3spec.json`);
      expect(parseJsonSidecarSentinel(sidecar!.content)?.source).toContain(
        '.agents/hooks/session-start.yaml'
      );
    });
  });

  describe('claude renderer', () => {
    it('renders skill mirrors, agents, settings, and CLAUDE.md', async () => {
      const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
      expect(errors).toEqual([]);

      const files = claudeRenderer.render(artifacts);

      expect(files.some((file) => file.path.startsWith('.claude/skills/'))).toBe(true);
      expect(files.some((file) => file.path.startsWith('.claude/agents/'))).toBe(true);
      expect(files.some((file) => file.path === path.join('.claude', 'settings.json'))).toBe(true);
      expect(files.some((file) => file.path === 'CLAUDE.md')).toBe(true);

      const skillFile = files.find((file) => file.path.endsWith('c3spec-start/SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(isGeneratedByC3spec(skillFile!.content, 'markdown')).toBe(true);
      expect(extractSentinelMetadata(skillFile!.content, 'markdown')?.source).toContain(
        '.agents/skills/c3spec-start/SKILL.md'
      );

      const settingsFile = files.find((file) => file.path === path.join('.claude', 'settings.json'));
      const settings = JSON.parse(settingsFile!.content) as {
        hooks: { SessionStart: Array<{ matcher: string; hooks: Array<{ command: string }> }> };
      };
      expect(settings.hooks.SessionStart[0]?.matcher).toContain('startup');
      expect(settings.hooks.SessionStart[0]?.hooks[0]?.command).toBe(
        'node .agents/hooks/memory-scan.js'
      );
      expect(settings).not.toHaveProperty('_c3spec');
      expect(
        parseJsonSidecarSentinel(
          files.find((file) => file.path === `${path.join('.claude', 'settings.json')}.c3spec.json`)!
            .content
        )
      ).not.toBeNull();
    });
  });

  describe('codex renderer', () => {
    it('renders toml agents, config, hooks, and AGENTS.md', async () => {
      const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
      expect(errors).toEqual([]);

      const files = codexRenderer.render(artifacts);

      expect(files.some((file) => file.path.startsWith('.codex/agents/'))).toBe(true);
      expect(files.some((file) => file.path === path.join('.codex', 'config.toml'))).toBe(true);
      expect(files.some((file) => file.path === path.join('.codex', 'hooks.json'))).toBe(true);
      expect(files.some((file) => file.path === 'AGENTS.md')).toBe(true);

      const agentFile = files.find((file) => file.path.endsWith('implementer.toml'));
      expect(agentFile).toBeDefined();
      const parsedAgent = parseTomlAgent(agentFile!.content);
      expect(parsedAgent.name).toBe('implementer');
      expect(parsedAgent.developer_instructions).toContain('bounded task');

      const configFile = files.find((file) => file.path === path.join('.codex', 'config.toml'));
      expect(configFile!.content).toContain('max_threads = 6');
      expect(configFile!.content).toContain('max_depth = 1');
      expect(isGeneratedByC3spec(configFile!.content, 'toml')).toBe(true);

      const hooksFile = files.find((file) => file.path === path.join('.codex', 'hooks.json'));
      const hooksJson = JSON.parse(hooksFile!.content) as {
        hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }> };
      };
      expect(hooksJson.hooks.SessionStart[0]?.hooks[0]?.command).toBe(
        'node .agents/hooks/memory-scan.js'
      );
      expect(hooksJson).not.toHaveProperty('_c3spec');
      expect(
        parseJsonSidecarSentinel(
          files.find((file) => file.path === `${path.join('.codex', 'hooks.json')}.c3spec.json`)!.content
        )
      ).not.toBeNull();
    });
  });

  it('renders deterministically for a given host', async () => {
    const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
    expect(errors).toEqual([]);

    const first = renderHostFiles('codex', artifacts);
    const second = renderHostFiles('codex', artifacts);

    expect(first.map((file) => ({ path: file.path, content: file.content }))).toEqual(
      second.map((file) => ({ path: file.path, content: file.content }))
    );
  });
});
