import path from 'path';
import type {
  CanonicalAgentManifest,
  CanonicalHookManifest,
  CanonicalHostArtifacts,
  GeneratedHostFile,
  HostRenderer,
} from '../types.js';
import { buildJsonSidecarSentinel, withSentinel } from '../sentinel.js';
import { buildYamlFrontmatter } from './format.js';
import { buildSessionStartHookJson, resolveSessionStartCommand, resolveSessionStartSource } from './hooks.js';

const READONLY_AGENTS = new Set(['spec-reviewer', 'quality-reviewer']);

function renderCursorAgent(agent: CanonicalAgentManifest): GeneratedHostFile {
  const relativePath = path.join('.cursor', 'agents', `${agent.name}.md`);
  const frontmatter: Record<string, string | boolean> = {
    name: agent.name,
    description: agent.description,
  };

  if (READONLY_AGENTS.has(agent.name)) {
    frontmatter.readonly = true;
  }

  const body = `${buildYamlFrontmatter(frontmatter)}${agent.instructions.trim()}\n`;
  const source = agent.sourcePath.replace(/\\/g, '/');

  return {
    path: relativePath,
    content: withSentinel(body, source, 'markdown'),
    source,
    generated: true,
  };
}

function renderCursorHooks(hooks: CanonicalHookManifest[]): GeneratedHostFile[] {
  const command = resolveSessionStartCommand(hooks);
  const source = resolveSessionStartSource(hooks);
  const payload = buildSessionStartHookJson(command, 'cursor');
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  const hooksPath = path.join('.cursor', 'hooks.json');

  return [
    {
      path: hooksPath,
      content,
      source,
      generated: true,
    },
    {
      path: `${hooksPath}.c3spec.json`,
      content: buildJsonSidecarSentinel(content, source),
      source,
      generated: true,
    },
  ];
}

export const cursorRenderer: HostRenderer = {
  hostId: 'cursor',

  render(input: CanonicalHostArtifacts): GeneratedHostFile[] {
    const files: GeneratedHostFile[] = input.agents.map(renderCursorAgent);
    files.push(...renderCursorHooks(input.hooks));
    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
  },
};
