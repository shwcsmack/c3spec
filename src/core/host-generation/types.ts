export type SupportedHostId = 'cursor' | 'claude' | 'codex';

export const SUPPORTED_HOST_IDS: readonly SupportedHostId[] = ['claude', 'codex', 'cursor'];

export const REQUIRED_CANONICAL_SKILL_NAMES = [
  'c3spec-start',
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
  'c3spec-subagent-dev',
  'c3spec-host-adapter',
] as const;

export type RequiredCanonicalSkillName = (typeof REQUIRED_CANONICAL_SKILL_NAMES)[number];

export const REQUIRED_CANONICAL_AGENT_NAMES = [
  'implementer',
  'spec-reviewer',
  'quality-reviewer',
] as const;

export type RequiredCanonicalAgentName = (typeof REQUIRED_CANONICAL_AGENT_NAMES)[number];

export const REQUIRED_CANONICAL_HOOK_NAMES = [
  'c3spec-memory-scan',
] as const;

export type RequiredCanonicalHookName = (typeof REQUIRED_CANONICAL_HOOK_NAMES)[number];

export interface CanonicalSkill {
  name: string;
  description: string;
  directoryName: string;
  body: string;
  sourcePath: string;
}

export interface CanonicalAgentManifest {
  name: string;
  description: string;
  instructions: string;
  model?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  sandboxMode?: 'read-only' | 'workspace-write';
  sourcePath: string;
}

export type CanonicalHookEvent = 'session-start';

export interface CanonicalHookManifest {
  name: string;
  event: CanonicalHookEvent;
  command: string;
  description: string;
  sourcePath: string;
}

export interface CanonicalHostArtifacts {
  skills: CanonicalSkill[];
  agents: CanonicalAgentManifest[];
  hooks: CanonicalHookManifest[];
}

export interface CanonicalValidationError {
  path: string;
  message: string;
}

export type SentinelFormat = 'markdown' | 'json' | 'toml';

export interface GeneratedHostFile {
  path: string;
  content: string;
  source: string;
  generated: true;
}

export interface HostRenderer {
  hostId: SupportedHostId;
  render(input: CanonicalHostArtifacts): GeneratedHostFile[];
}
