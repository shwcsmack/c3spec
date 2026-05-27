import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import {
  discoverCanonicalArtifacts,
  parseAgentManifest,
  parseHookManifest,
  parseSkillFile,
  validateHostIds,
} from '../../../src/core/host-generation/canonical.js';
import {
  REQUIRED_CANONICAL_AGENT_NAMES,
  REQUIRED_CANONICAL_SKILL_NAMES,
  SUPPORTED_HOST_IDS,
} from '../../../src/core/host-generation/types.js';

describe('host-generation canonical artifacts', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-host-generation-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('validateHostIds', () => {
    it('accepts supported host IDs', () => {
      expect(validateHostIds(['cursor', 'claude', 'codex'])).toEqual([]);
    });

    it('rejects unknown host IDs', () => {
      const errors = validateHostIds(['cursor', 'windsurf']);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Unknown host ID "windsurf"');
      expect(errors[0]?.message).toContain(SUPPORTED_HOST_IDS.join(', '));
    });
  });

  describe('parseSkillFile', () => {
    it('parses valid skill frontmatter and body', () => {
      const content = `---
name: demo-skill
description: Demo skill for tests
---

# Body

Do the thing.
`;

      const { skill, errors } = parseSkillFile(content, '.agents/skills/demo-skill/SKILL.md', 'demo-skill');

      expect(errors).toEqual([]);
      expect(skill).toEqual({
        name: 'demo-skill',
        description: 'Demo skill for tests',
        directoryName: 'demo-skill',
        body: '# Body\n\nDo the thing.\n',
        sourcePath: '.agents/skills/demo-skill/SKILL.md',
      });
    });

    it('rejects name and directory mismatch', () => {
      const content = `---
name: other-skill
description: Demo skill for tests
---

Body
`;

      const { skill, errors } = parseSkillFile(content, '.agents/skills/demo-skill/SKILL.md', 'demo-skill');

      expect(skill).toBeUndefined();
      expect(errors[0]?.message).toBe(
        'Skill frontmatter name "other-skill" does not match directory name "demo-skill"'
      );
    });

    it('rejects invalid YAML frontmatter', () => {
      const content = `---
name: [unterminated
description: Demo
---

Body
`;

      const { skill, errors } = parseSkillFile(content, 'bad/SKILL.md', 'bad');

      expect(skill).toBeUndefined();
      expect(errors[0]?.message).toContain('Invalid skill frontmatter YAML');
    });

    it('rejects missing name and description', () => {
      const content = `---
license: MIT
---

Body only
`;

      const { skill, errors } = parseSkillFile(content, 'bad-skill/SKILL.md');

      expect(skill).toBeUndefined();
      expect(errors.map((error) => error.message)).toEqual([
        'Skill frontmatter is missing required field "name"',
        'Skill frontmatter is missing required field "description"',
      ]);
    });

    it('rejects files without frontmatter', () => {
      const { skill, errors } = parseSkillFile('# No frontmatter', 'plain/SKILL.md');

      expect(skill).toBeUndefined();
      expect(errors[0]?.message).toBe('Missing YAML frontmatter in skill file');
    });
  });

  describe('parseAgentManifest', () => {
    it('parses multiline instructions', () => {
      const content = `name: demo-agent
description: Demo agent
instructions: |
  Line one
  Line two

  Still part of instructions.
model: sonnet
reasoningEffort: medium
sandboxMode: read-only
`;

      const { agent, errors } = parseAgentManifest(content, '.agents/agents/demo-agent.yaml', 'demo-agent.yaml');

      expect(errors).toEqual([]);
      expect(agent?.instructions).toBe(
        'Line one\nLine two\n\nStill part of instructions.'
      );
      expect(agent?.model).toBe('sonnet');
      expect(agent?.reasoningEffort).toBe('medium');
      expect(agent?.sandboxMode).toBe('read-only');
    });

    it('rejects missing required fields', () => {
      const content = `name: incomplete
description: Missing instructions
`;

      const { agent, errors } = parseAgentManifest(content, 'incomplete.yaml');

      expect(agent).toBeUndefined();
      expect(errors.some((error) => error.message.includes('instructions'))).toBe(true);
    });

    it('rejects name/file mismatch', () => {
      const content = `name: other-name
description: Demo
instructions: Do work
`;

      const { agent, errors } = parseAgentManifest(content, 'implementer.yaml', 'implementer.yaml');

      expect(agent).toBeUndefined();
      expect(errors[0]?.message).toContain('does not match file name');
    });
  });

  describe('parseHookManifest', () => {
    it('parses a valid session-start hook', () => {
      const content = `name: demo-hook
event: session-start
command: node .agents/hooks/memory-scan.js
description: Load memory at session start.
`;

      const { hook, errors } = parseHookManifest(content, '.agents/hooks/session-start.yaml');

      expect(errors).toEqual([]);
      expect(hook).toEqual({
        name: 'demo-hook',
        event: 'session-start',
        command: 'node .agents/hooks/memory-scan.js',
        description: 'Load memory at session start.',
        sourcePath: '.agents/hooks/session-start.yaml',
      });
    });

    it('rejects missing required fields and unsupported events', () => {
      const content = `name: bad-hook
event: pre-tool-use
command: echo hi
`;

      const { hook, errors } = parseHookManifest(content, 'bad.yaml');

      expect(hook).toBeUndefined();
      expect(errors.map((error) => error.message)).toEqual([
        'Hook manifest event "pre-tool-use" is not supported (expected session-start)',
        'Hook manifest is missing required field "description"',
      ]);
    });
  });

  describe('discoverCanonicalArtifacts', () => {
    async function writeBundledCanonicalLayout(root: string) {
      for (const skillName of REQUIRED_CANONICAL_SKILL_NAMES) {
        const skillDir = path.join(root, '.agents', 'skills', skillName);
        await fs.mkdir(skillDir, { recursive: true });
        await fs.writeFile(
          path.join(skillDir, 'SKILL.md'),
          `---
name: ${skillName}
description: ${skillName} description
---

Body for ${skillName}
`
        );
      }

      for (const agentName of REQUIRED_CANONICAL_AGENT_NAMES) {
        const agentPath = path.join(root, '.agents', 'agents', `${agentName}.yaml`);
        await fs.mkdir(path.dirname(agentPath), { recursive: true });
        await fs.writeFile(
          agentPath,
          `name: ${agentName}
description: ${agentName} description
instructions: |
  Multi
  line
  instructions for ${agentName}
`
        );
      }

      const hookPath = path.join(root, '.agents', 'hooks', 'session-start.yaml');
      await fs.mkdir(path.dirname(hookPath), { recursive: true });
      await fs.writeFile(
        hookPath,
        `name: c3spec-memory-scan
event: session-start
command: node .agents/hooks/memory-scan.js
description: Load the c3spec memory index at session start.
`
      );
    }

    it('discovers and validates bundled canonical layout in a temp project', async () => {
      await writeBundledCanonicalLayout(testDir);

      const { artifacts, errors } = await discoverCanonicalArtifacts(testDir);

      expect(errors).toEqual([]);
      expect(artifacts.skills).toHaveLength(REQUIRED_CANONICAL_SKILL_NAMES.length);
      expect(artifacts.skills.map((skill) => skill.name)).toContain('c3spec-tier-lifecycle');
      expect(artifacts.agents).toHaveLength(REQUIRED_CANONICAL_AGENT_NAMES.length);
      expect(artifacts.hooks).toHaveLength(1);
      expect(artifacts.hooks[0]?.event).toBe('session-start');
    });

    it('reports missing required canonical skills', async () => {
      await writeBundledCanonicalLayout(testDir);
      await fs.rm(path.join(testDir, '.agents', 'skills', 'c3spec-host-adapter'), {
        recursive: true,
        force: true,
      });

      const { errors } = await discoverCanonicalArtifacts(testDir);

      expect(errors.some((error) => error.message.includes('c3spec-host-adapter'))).toBe(true);
    });

    it('reports missing lifecycle contract skill', async () => {
      await writeBundledCanonicalLayout(testDir);
      await fs.rm(path.join(testDir, '.agents', 'skills', 'c3spec-tier-lifecycle'), {
        recursive: true,
        force: true,
      });

      const { errors } = await discoverCanonicalArtifacts(testDir);

      expect(errors.some((error) => error.message.includes('c3spec-tier-lifecycle'))).toBe(true);
    });

    it('reports missing required canonical hooks', async () => {
      await writeBundledCanonicalLayout(testDir);
      await fs.rm(path.join(testDir, '.agents', 'hooks', 'session-start.yaml'));

      const { errors } = await discoverCanonicalArtifacts(testDir);

      expect(errors.some((error) => error.message.includes('c3spec-memory-scan'))).toBe(true);
    });
  });

  describe('repository bundled canonical artifacts', () => {
    it('loads the worktree .agents layout without validation errors', async () => {
      const projectRoot = path.resolve(import.meta.dirname, '../../..');
      const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);

      expect(errors).toEqual([]);
      expect(artifacts.skills.map((skill) => skill.name)).toEqual(
        [...REQUIRED_CANONICAL_SKILL_NAMES].sort()
      );
      expect(artifacts.skills.some((skill) => skill.name === 'c3spec-tier-lifecycle')).toBe(true);
      expect(artifacts.agents.map((agent) => agent.name)).toEqual(
        [...REQUIRED_CANONICAL_AGENT_NAMES].sort()
      );
      expect(artifacts.hooks[0]?.name).toBe('c3spec-memory-scan');
    });
  });
});
