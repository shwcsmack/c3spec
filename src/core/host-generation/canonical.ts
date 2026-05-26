import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import {
  REQUIRED_CANONICAL_AGENT_NAMES,
  REQUIRED_CANONICAL_HOOK_NAMES,
  REQUIRED_CANONICAL_SKILL_NAMES,
  SUPPORTED_HOST_IDS,
  type CanonicalAgentManifest,
  type CanonicalHookManifest,
  type CanonicalHostArtifacts,
  type CanonicalSkill,
  type CanonicalValidationError,
  type SupportedHostId,
} from './types.js';

const AGENTS_DIR = '.agents';
const SKILLS_DIR = path.join(AGENTS_DIR, 'skills');
const AGENT_MANIFESTS_DIR = path.join(AGENTS_DIR, 'agents');
const HOOKS_DIR = path.join(AGENTS_DIR, 'hooks');

const SKILL_FILE_NAME = 'SKILL.md';
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validationError(sourcePath: string, message: string): CanonicalValidationError {
  return { path: sourcePath, message };
}

export function isSupportedHostId(value: string): value is SupportedHostId {
  return (SUPPORTED_HOST_IDS as readonly string[]).includes(value);
}

export function assertSupportedHostId(value: string): SupportedHostId {
  if (!isSupportedHostId(value)) {
    throw new Error(`Unknown host ID "${value}". Supported hosts: ${SUPPORTED_HOST_IDS.join(', ')}`);
  }
  return value;
}

export function validateHostIds(hostIds: readonly string[]): CanonicalValidationError[] {
  const errors: CanonicalValidationError[] = [];
  for (const hostId of hostIds) {
    if (!isSupportedHostId(hostId)) {
      errors.push({
        path: hostId,
        message: `Unknown host ID "${hostId}". Supported hosts: ${SUPPORTED_HOST_IDS.join(', ')}`,
      });
    }
  }
  return errors;
}

export function parseSkillFile(
  content: string,
  sourcePath: string,
  directoryName?: string
): { skill?: CanonicalSkill; errors: CanonicalValidationError[] } {
  const errors: CanonicalValidationError[] = [];
  const match = content.match(FRONTMATTER_PATTERN);

  if (!match) {
    return {
      errors: [validationError(sourcePath, 'Missing YAML frontmatter in skill file')],
    };
  }

  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [validationError(sourcePath, `Invalid skill frontmatter YAML: ${message}`)],
    };
  }

  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    return {
      errors: [validationError(sourcePath, 'Skill frontmatter must be a YAML mapping')],
    };
  }

  const record = frontmatter as Record<string, unknown>;
  const name = record.name;
  const description = record.description;

  if (!nonEmptyString(name)) {
    errors.push(validationError(sourcePath, 'Skill frontmatter is missing required field "name"'));
  }
  if (!nonEmptyString(description)) {
    errors.push(validationError(sourcePath, 'Skill frontmatter is missing required field "description"'));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const skillName = (name as string).trim();
  const skillDescription = (description as string).trim();
  const resolvedDirectoryName =
    directoryName ?? path.basename(path.dirname(sourcePath));
  if (directoryName && skillName !== directoryName) {
    errors.push(
      validationError(
        sourcePath,
        `Skill frontmatter name "${skillName}" does not match directory name "${directoryName}"`
      )
    );
    return { errors };
  }

  return {
    skill: {
      name: skillName,
      description: skillDescription,
      directoryName: resolvedDirectoryName,
      body: match[2].replace(/^\n/, ''),
      sourcePath,
    },
    errors: [],
  };
}

export function parseAgentManifest(
  content: string,
  sourcePath: string,
  fileName?: string
): { agent?: CanonicalAgentManifest; errors: CanonicalValidationError[] } {
  const errors: CanonicalValidationError[] = [];

  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [validationError(sourcePath, `Invalid agent manifest YAML: ${message}`)],
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      errors: [validationError(sourcePath, 'Agent manifest must be a YAML mapping')],
    };
  }

  const record = parsed as Record<string, unknown>;
  const name = record.name;
  const description = record.description;
  const instructions = record.instructions;

  if (!nonEmptyString(name)) {
    errors.push(validationError(sourcePath, 'Agent manifest is missing required field "name"'));
  }
  if (!nonEmptyString(description)) {
    errors.push(validationError(sourcePath, 'Agent manifest is missing required field "description"'));
  }
  if (!nonEmptyString(instructions)) {
    errors.push(validationError(sourcePath, 'Agent manifest is missing required field "instructions"'));
  }

  if (record.reasoningEffort !== undefined) {
    const effort = record.reasoningEffort;
    if (effort !== 'low' && effort !== 'medium' && effort !== 'high') {
      errors.push(
        validationError(
          sourcePath,
          'Agent manifest field "reasoningEffort" must be low, medium, or high when present'
        )
      );
    }
  }

  if (record.sandboxMode !== undefined) {
    const mode = record.sandboxMode;
    if (mode !== 'read-only' && mode !== 'workspace-write') {
      errors.push(
        validationError(
          sourcePath,
          'Agent manifest field "sandboxMode" must be read-only or workspace-write when present'
        )
      );
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const agentName = (name as string).trim();
  const expectedName = fileName ? path.basename(fileName, path.extname(fileName)) : undefined;
  if (expectedName && agentName !== expectedName) {
    errors.push(
      validationError(
        sourcePath,
        `Agent manifest name "${agentName}" does not match file name "${expectedName}"`
      )
    );
    return { errors };
  }

  const agent: CanonicalAgentManifest = {
    name: agentName,
    description: (description as string).trim(),
    instructions: (instructions as string).trim(),
    sourcePath,
  };

  if (nonEmptyString(record.model)) {
    agent.model = record.model.trim();
  }
  if (record.reasoningEffort === 'low' || record.reasoningEffort === 'medium' || record.reasoningEffort === 'high') {
    agent.reasoningEffort = record.reasoningEffort;
  }
  if (record.sandboxMode === 'read-only' || record.sandboxMode === 'workspace-write') {
    agent.sandboxMode = record.sandboxMode;
  }

  return { agent, errors: [] };
}

export function parseHookManifest(
  content: string,
  sourcePath: string
): { hook?: CanonicalHookManifest; errors: CanonicalValidationError[] } {
  const errors: CanonicalValidationError[] = [];

  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [validationError(sourcePath, `Invalid hook manifest YAML: ${message}`)],
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      errors: [validationError(sourcePath, 'Hook manifest must be a YAML mapping')],
    };
  }

  const record = parsed as Record<string, unknown>;
  const name = record.name;
  const event = record.event;
  const command = record.command;
  const description = record.description;

  if (!nonEmptyString(name)) {
    errors.push(validationError(sourcePath, 'Hook manifest is missing required field "name"'));
  }
  if (!nonEmptyString(event)) {
    errors.push(validationError(sourcePath, 'Hook manifest is missing required field "event"'));
  } else if (event !== 'session-start') {
    errors.push(
      validationError(sourcePath, `Hook manifest event "${event}" is not supported (expected session-start)`)
    );
  }
  if (!nonEmptyString(command)) {
    errors.push(validationError(sourcePath, 'Hook manifest is missing required field "command"'));
  }
  if (!nonEmptyString(description)) {
    errors.push(validationError(sourcePath, 'Hook manifest is missing required field "description"'));
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    hook: {
      name: (name as string).trim(),
      event: 'session-start',
      command: (command as string).trim(),
      description: (description as string).trim(),
      sourcePath,
    },
    errors: [],
  };
}

export function validateRequiredCanonicalArtifacts(
  artifacts: CanonicalHostArtifacts
): CanonicalValidationError[] {
  const errors: CanonicalValidationError[] = [];

  for (const requiredSkill of REQUIRED_CANONICAL_SKILL_NAMES) {
    if (!artifacts.skills.some((skill) => skill.name === requiredSkill)) {
      errors.push({
        path: path.join(SKILLS_DIR, requiredSkill, SKILL_FILE_NAME),
        message: `Missing required canonical skill "${requiredSkill}"`,
      });
    }
  }

  for (const requiredAgent of REQUIRED_CANONICAL_AGENT_NAMES) {
    if (!artifacts.agents.some((agent) => agent.name === requiredAgent)) {
      errors.push({
        path: path.join(AGENT_MANIFESTS_DIR, `${requiredAgent}.yaml`),
        message: `Missing required canonical agent "${requiredAgent}"`,
      });
    }
  }

  for (const requiredHook of REQUIRED_CANONICAL_HOOK_NAMES) {
    if (!artifacts.hooks.some((hook) => hook.name === requiredHook)) {
      errors.push({
        path: path.join(HOOKS_DIR, 'session-start.yaml'),
        message: `Missing required canonical hook "${requiredHook}"`,
      });
    }
  }

  return errors;
}

async function readDirectoryEntries(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function discoverCanonicalArtifacts(
  projectRoot: string
): Promise<{ artifacts: CanonicalHostArtifacts; errors: CanonicalValidationError[] }> {
  const artifacts: CanonicalHostArtifacts = {
    skills: [],
    agents: [],
    hooks: [],
  };
  const errors: CanonicalValidationError[] = [];

  const skillsRoot = path.join(projectRoot, SKILLS_DIR);
  for (const entry of await readDirectoryEntries(skillsRoot)) {
    const skillPath = path.join(skillsRoot, entry, SKILL_FILE_NAME);
    let content: string;
    try {
      content = await fs.readFile(skillPath, 'utf8');
    } catch {
      continue;
    }

    const result = parseSkillFile(content, skillPath, entry);
    errors.push(...result.errors);
    if (result.skill) {
      artifacts.skills.push(result.skill);
    }
  }

  const agentsRoot = path.join(projectRoot, AGENT_MANIFESTS_DIR);
  for (const entry of await readDirectoryEntries(agentsRoot)) {
    if (!entry.endsWith('.yaml') && !entry.endsWith('.yml')) {
      continue;
    }

    const agentPath = path.join(agentsRoot, entry);
    const content = await fs.readFile(agentPath, 'utf8');
    const result = parseAgentManifest(content, agentPath, entry);
    errors.push(...result.errors);
    if (result.agent) {
      artifacts.agents.push(result.agent);
    }
  }

  const hooksRoot = path.join(projectRoot, HOOKS_DIR);
  for (const entry of await readDirectoryEntries(hooksRoot)) {
    if (!entry.endsWith('.yaml') && !entry.endsWith('.yml')) {
      continue;
    }

    const hookPath = path.join(hooksRoot, entry);
    const content = await fs.readFile(hookPath, 'utf8');
    const result = parseHookManifest(content, hookPath);
    errors.push(...result.errors);
    if (result.hook) {
      artifacts.hooks.push(result.hook);
    }
  }

  artifacts.skills.sort((a, b) => a.name.localeCompare(b.name));
  artifacts.agents.sort((a, b) => a.name.localeCompare(b.name));
  artifacts.hooks.sort((a, b) => a.name.localeCompare(b.name));

  errors.push(...validateRequiredCanonicalArtifacts(artifacts));

  return { artifacts, errors };
}

export const CANONICAL_PATHS = {
  agentsDir: AGENTS_DIR,
  skillsDir: SKILLS_DIR,
  agentManifestsDir: AGENT_MANIFESTS_DIR,
  hooksDir: HOOKS_DIR,
  skillFileName: SKILL_FILE_NAME,
} as const;
