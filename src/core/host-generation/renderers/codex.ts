import path from 'path';
import type {
  CanonicalAgentManifest,
  CanonicalHostArtifacts,
  GeneratedHostFile,
  HostRenderer,
} from '../types.js';
import { buildJsonSidecarSentinel, withSentinel } from '../sentinel.js';
import { buildInstructionDocument } from './instructions.js';
import { buildSessionStartHookJson, resolveSessionStartCommand, resolveSessionStartSource } from './hooks.js';
import {
  formatTomlInteger,
  formatTomlKeyValue,
  formatTomlTableHeader,
} from './toml-writer.js';

const CODEX_CONFIG_SOURCE = 'c3spec/host-generation/codex-config';

function renderCodexAgent(agent: CanonicalAgentManifest): GeneratedHostFile {
  const relativePath = path.join('.codex', 'agents', `${agent.name}.toml`);
  const source = agent.sourcePath.replace(/\\/g, '/');
  const lines = [
    formatTomlKeyValue('name', agent.name),
    formatTomlKeyValue('description', agent.description),
    formatTomlKeyValue('developer_instructions', agent.instructions.trim()),
    '',
  ];

  const body = `${lines.join('\n')}`;
  return {
    path: relativePath,
    content: withSentinel(body, source, 'toml'),
    source,
    generated: true,
  };
}

function renderCodexConfig(): GeneratedHostFile {
  const body = `${formatTomlTableHeader('agents')}\n${formatTomlInteger('max_threads', 6)}\n${formatTomlInteger('max_depth', 1)}\n`;

  return {
    path: path.join('.codex', 'config.toml'),
    content: withSentinel(body, CODEX_CONFIG_SOURCE, 'toml'),
    source: CODEX_CONFIG_SOURCE,
    generated: true,
  };
}

function renderCodexHooks(hooks: CanonicalHostArtifacts['hooks']): GeneratedHostFile[] {
  const command = resolveSessionStartCommand(hooks);
  const source = resolveSessionStartSource(hooks);
  const payload = buildSessionStartHookJson(command, 'codex');
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  const hooksPath = path.join('.codex', 'hooks.json');

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

function renderAgentsMd(): GeneratedHostFile {
  const source = '.agents/';
  const body = buildInstructionDocument();

  return {
    path: 'AGENTS.md',
    content: withSentinel(body, source, 'markdown'),
    source,
    generated: true,
  };
}

export const codexRenderer: HostRenderer = {
  hostId: 'codex',

  render(input: CanonicalHostArtifacts): GeneratedHostFile[] {
    const files: GeneratedHostFile[] = [
      ...input.agents.map(renderCodexAgent),
      renderCodexConfig(),
      ...renderCodexHooks(input.hooks),
      renderAgentsMd(),
    ];

    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
  },
};
