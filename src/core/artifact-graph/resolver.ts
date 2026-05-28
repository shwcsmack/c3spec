import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGlobalDataDir } from '../global-config.js';
import { C3SPEC_DIR_NAME } from '../config.js';
import type { SchemaYaml } from './types.js';

/**
 * Error thrown when loading a schema fails.
 */
export class SchemaLoadError extends Error {
  constructor(
    message: string,
    public readonly schemaPath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SchemaLoadError';
  }
}

const SPEC_DRIVEN_SCHEMA: SchemaYaml = {
  name: 'spec-driven',
  version: 1,
  description: 'Default OpenSpec workflow - proposal → specs → design → tasks',
  artifacts: [
    { id: 'proposal', generates: 'proposal.md', description: 'Initial proposal document outlining the change', template: 'proposal.md', requires: [] },
    { id: 'specs', generates: 'specs/**/*.md', description: 'Detailed specifications for the change', template: 'spec.md', requires: ['proposal'] },
    { id: 'design', generates: 'design.md', description: 'Technical design document with implementation details', template: 'design.md', requires: ['proposal'] },
    { id: 'tasks', generates: 'tasks.md', description: 'Implementation checklist with trackable tasks', template: 'tasks.md', requires: ['specs', 'design'] },
  ],
  apply: { requires: ['tasks'], tracks: 'tasks.md', instruction: 'Read context files, work through pending tasks, mark complete as you go.\nPause if you hit blockers or need clarification.' },
};

const WORKSPACE_PLANNING_SCHEMA: SchemaYaml = {
  name: 'workspace-planning',
  version: 1,
  description: 'Workspace planning workflow for cross-area changes',
  artifacts: [
    { id: 'proposal', generates: 'proposal.md', description: 'Shared workspace proposal with the product goal, scope, affected areas, and impact', template: 'proposal.md', requires: [] },
    { id: 'specs', generates: 'specs/**/*.md', description: 'Workspace-scoped specs organized by affected area and capability', template: 'spec.md', requires: ['proposal'] },
    { id: 'design', generates: 'design.md', description: 'Cross-area technical design and coordination decisions', template: 'design.md', requires: ['proposal'] },
    { id: 'tasks', generates: 'tasks.md', description: 'Coordination checklist for workspace planning and later affected-area implementation', template: 'tasks.md', requires: ['specs', 'design'] },
  ],
  apply: { requires: ['tasks'], tracks: 'tasks.md', instruction: 'Read the workspace planning context from status and instructions output before applying.\nSelect an affected area and confirm an allowed edit root before making implementation edits.\nUntil an explicit implementation context is available, treat linked repos and folders as read-only exploration context.' },
};

const SCHEMAS: Record<string, SchemaYaml> = {
  'spec-driven': SPEC_DRIVEN_SCHEMA,
  'workspace-planning': WORKSPACE_PLANNING_SCHEMA,
  'superpowers-bridge': WORKSPACE_PLANNING_SCHEMA,
};

const TEMPLATES: Record<string, Record<string, string>> = {
  'spec-driven': {
    'proposal.md': `## Why\n\n<!-- Explain the motivation for this change. What problem does this solve? Why now? -->\n\n## What Changes\n\n<!-- Describe what will change. Be specific about new capabilities, modifications, or removals. -->\n\n## Capabilities\n\n### New Capabilities\n<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->\n- \`<name>\`: <brief description of what this capability covers>\n\n### Modified Capabilities\n<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).\n     Only list here if spec-level behavior changes. Each needs a delta spec file.\n     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->\n- \`<existing-name>\`: <what requirement is changing>\n\n## Impact\n\n<!-- Affected code, APIs, dependencies, systems -->\n`,
    'design.md': `## Context\n\n<!-- Background and current state -->\n\n## Goals / Non-Goals\n\n**Goals:**\n<!-- What this design aims to achieve -->\n\n**Non-Goals:**\n<!-- What is explicitly out of scope -->\n\n## Decisions\n\n<!-- Key design decisions and rationale -->\n\n## Risks / Trade-offs\n\n<!-- Known risks and trade-offs -->\n`,
    'spec.md': `## ADDED Requirements\n\n### Requirement: <!-- requirement name -->\n<!-- requirement text -->\n\n#### Scenario: <!-- scenario name -->\n- **WHEN** <!-- condition -->\n- **THEN** <!-- expected outcome -->\n`,
    'tasks.md': `## 1. <!-- Task Group Name -->\n\n- [ ] 1.1 <!-- Task description -->\n- [ ] 1.2 <!-- Task description -->\n\n## 2. <!-- Task Group Name -->\n\n- [ ] 2.1 <!-- Task description -->\n- [ ] 2.2 <!-- Task description -->\n`,
  },
  'workspace-planning': {
    'proposal.md': `## Why\n\nDescribe the shared product goal, problem, or opportunity that makes this workspace-level change worth planning.\n\n## What Changes\n\n-\n\n## Affected Areas\n\n- Known:\n- Unresolved:\n\n## Capabilities\n\n### New Capabilities\n\n-\n\n### Modified Capabilities\n\n-\n\n## Impact\n\n- Workspace planning:\n- Linked repos or folders:\n- User-facing behavior:\n`,
    'design.md': `## Context\n\nSummarize the workspace planning context, relevant linked areas, and constraints.\n\n## Goals / Non-Goals\n\n**Goals:**\n-\n\n**Non-Goals:**\n- Creating repo-local implementation artifacts before an affected area is selected.\n\n## Decisions\n\n### Decision: <title>\n\n<decision and rationale>\n\nAlternative considered: <alternative and why it was not chosen>\n\n## Risks / Trade-offs\n\n- <risk> -> <mitigation>\n\n## Coordination Notes\n\n- Affected areas:\n- Open handoffs:\n- Implementation entry criteria:\n\n## Open Questions\n\n-\n`,
    'spec.md': `## ADDED Requirements\n\n### Requirement: <workspace requirement name>\nThe workspace plan SHALL describe the required behavior and affected area without creating repo-local artifacts during planning.\n\n#### Scenario: <scenario name>\n- **GIVEN** <context>\n- **WHEN** <action>\n- **THEN** <observable result>\n`,
    'tasks.md': `## 1. Workspace Planning\n\n- [ ] 1.1 Confirm the shared product goal and unresolved scope questions.\n- [ ] 1.2 Identify affected areas using registered workspace link names where applicable.\n- [ ] 1.3 Review workspace-scoped specs and design before selecting implementation areas.\n\n## 2. Affected Area Implementation\n\n- [ ] 2.1 Select an affected area and confirm its allowed edit root before implementation.\n- [ ] 2.2 Create or update repo-local implementation artifacts only after the area is selected.\n\n## 3. Verification\n\n- [ ] 3.1 Verify workspace planning artifacts remain the source of truth.\n- [ ] 3.2 Record manual acceptance evidence and follow-up fixes.\n`,
  },
};

function normalizeSchemaName(name: string): string {
  return name.replace(/\.ya?ml$/, '');
}

function resolveSchemaName(name: string): string {
  const normalized = normalizeSchemaName(name);
  return SCHEMAS[normalized] ? normalized : 'spec-driven';
}

export function getPackageSchemasDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.join(path.dirname(currentFile), '..', '..', '..', 'schemas');
}

export function getUserSchemasDir(): string {
  return path.join(getGlobalDataDir(), 'schemas');
}

export function getProjectSchemasDir(projectRoot: string): string {
  return path.join(projectRoot, C3SPEC_DIR_NAME, 'schemas');
}

export function getSchemaDir(name: string, _projectRoot?: string): string | null {
  const normalized = resolveSchemaName(name);
  return SCHEMAS[normalized] ? path.join(getPackageSchemasDir(), normalized) : null;
}

export function resolveSchema(name: string, _projectRoot?: string): SchemaYaml {
  return SCHEMAS[resolveSchemaName(name)];
}

export function listSchemas(_projectRoot?: string): string[] {
  return ['spec-driven', 'workspace-planning'];
}

export interface SchemaInfo {
  name: string;
  description: string;
  artifacts: string[];
  source: 'project' | 'user' | 'package';
}

export function listSchemasWithInfo(_projectRoot?: string): SchemaInfo[] {
  return listSchemas().map((name) => {
    const schema = resolveSchema(name);
    return {
      name,
      description: schema.description || '',
      artifacts: schema.artifacts.map((a) => a.id),
      source: 'package',
    };
  });
}

export function loadSchemaTemplate(schemaName: string, templatePath: string): string {
  const normalized = normalizeSchemaName(schemaName);
  if (!SCHEMAS[normalized]) {
    throw new SchemaLoadError(`Schema '${schemaName}' not found`, `${schemaName}/templates/${templatePath}`);
  }
  const content = TEMPLATES[normalized]?.[templatePath];
  if (!content) {
    throw new SchemaLoadError(`Template not found: ${templatePath}`, `${normalized}/templates/${templatePath}`);
  }
  return content;
}
