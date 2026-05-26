import path from 'path';
import type {
  CanonicalAgentManifest,
  CanonicalHostArtifacts,
  CanonicalSkill,
  GeneratedHostFile,
  HostRenderer,
} from '../types.js';
import { buildJsonSidecarSentinel, withSentinel } from '../sentinel.js';
import { buildYamlFrontmatter } from './format.js';
import { buildInstructionDocument } from './instructions.js';
import { buildSessionStartHookJson, resolveSessionStartCommand, resolveSessionStartSource } from './hooks.js';

function renderClaudeSkill(skill: CanonicalSkill): GeneratedHostFile {
  const relativePath = path.join('.claude', 'skills', skill.directoryName, 'SKILL.md');
  const source = skill.sourcePath.replace(/\\/g, '/');
  const body = `${buildYamlFrontmatter({
    name: skill.name,
    description: skill.description,
  })}${skill.body.trim()}\n`;

  return {
    path: relativePath,
    content: withSentinel(body, source, 'markdown'),
    source,
    generated: true,
  };
}

function renderClaudeAgent(agent: CanonicalAgentManifest): GeneratedHostFile {
  const relativePath = path.join('.claude', 'agents', `${agent.name}.md`);
  const source = agent.sourcePath.replace(/\\/g, '/');
  const body = `${buildYamlFrontmatter({
    name: agent.name,
    description: agent.description,
  })}${agent.instructions.trim()}\n`;

  return {
    path: relativePath,
    content: withSentinel(body, source, 'markdown'),
    source,
    generated: true,
  };
}

function renderClaudeSettings(hooks: CanonicalHostArtifacts['hooks']): GeneratedHostFile[] {
  const command = resolveSessionStartCommand(hooks);
  const source = resolveSessionStartSource(hooks);
  const payload = buildSessionStartHookJson(command, 'claude');
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  const settingsPath = path.join('.claude', 'settings.json');

  return [
    {
      path: settingsPath,
      content,
      source,
      generated: true,
    },
    {
      path: `${settingsPath}.c3spec.json`,
      content: buildJsonSidecarSentinel(content, source),
      source,
      generated: true,
    },
  ];
}

function renderClaudeMd(): GeneratedHostFile {
  const source = '.agents/';
  const body = buildInstructionDocument();

  return {
    path: 'CLAUDE.md',
    content: withSentinel(body, source, 'markdown'),
    source,
    generated: true,
  };
}

export const claudeRenderer: HostRenderer = {
  hostId: 'claude',

  render(input: CanonicalHostArtifacts): GeneratedHostFile[] {
    const files: GeneratedHostFile[] = [
      ...input.skills.map(renderClaudeSkill),
      ...input.agents.map(renderClaudeAgent),
      ...renderClaudeSettings(input.hooks),
      renderClaudeMd(),
    ];

    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
  },
};
