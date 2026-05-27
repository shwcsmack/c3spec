import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../src/core/init.js';
import { saveGlobalConfig, getGlobalConfig } from '../../src/core/global-config.js';

const { confirmMock, showWelcomeScreenMock, searchableMultiSelectMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  showWelcomeScreenMock: vi.fn().mockResolvedValue(undefined),
  searchableMultiSelectMock: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
}));

vi.mock('../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: showWelcomeScreenMock,
}));

vi.mock('../../src/prompts/searchable-multi-select.js', () => ({
  searchableMultiSelect: searchableMultiSelectMock,
}));

const CANONICAL_SKILL_NAMES = [
  'c3spec-start',
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
  'c3spec-subagent-dev',
  'c3spec-host-adapter',
] as const;

describe('InitCommand', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-init-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid reading real config
    configTempDir = path.join(os.tmpdir(), `c3spec-config-init-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;

    // Mock console.log to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('execute with --tools flag', () => {
    it('should create C3Spec directory structure', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const c3specPath = path.join(testDir, 'c3spec');
      expect(await directoryExists(c3specPath)).toBe(true);
      expect(await directoryExists(path.join(c3specPath, 'specs'))).toBe(true);
      expect(await directoryExists(path.join(c3specPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(c3specPath, 'changes', 'archive'))).toBe(true);
    });

    it('should create config.yaml with default schema', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, 'c3spec', 'config.yaml');
      expect(await fileExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('schema: superpowers-bridge');
    });

    it('should create canonical and Claude host skills', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      for (const skillName of CANONICAL_SKILL_NAMES) {
        const canonicalSkill = path.join(testDir, '.agents', 'skills', skillName, 'SKILL.md');
        const claudeSkill = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(canonicalSkill)).toBe(true);
        expect(await fileExists(claudeSkill)).toBe(true);

        const content = await fs.readFile(claudeSkill, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('description:');
        expect(content).toContain('c3spec-generated: true');
      }

      expect(await fileExists(path.join(testDir, '.claude', 'agents', 'implementer.md'))).toBe(true);
    });

    it('should not create slash commands for Claude Code', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should create skills in canonical .agents directory for Cursor', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
      expect(await fileExists(path.join(testDir, '.cursor', 'agents', 'implementer.md'))).toBe(true);
    });

    it('should create skills in canonical .agents directory for Codex', async () => {
      const initCommand = new InitCommand({ tools: 'codex', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should create skills for multiple tools at once', async () => {
      const initCommand = new InitCommand({ tools: 'claude,cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const agentsSkill = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(agentsSkill)).toBe(true);
    });

    it('should select all tools with --tools all option', async () => {
      const initCommand = new InitCommand({ tools: 'all', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const agentsSkill = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(agentsSkill)).toBe(true);
    });

    it('should skip tool configuration with --tools none option', async () => {
      const initCommand = new InitCommand({ tools: 'none', force: true });

      await initCommand.execute(testDir);

      // Should create C3Spec structure but no skills
      const c3specPath = path.join(testDir, 'c3spec');
      expect(await directoryExists(c3specPath)).toBe(true);

      // No tool-specific directories should be created
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      expect(await directoryExists(claudeSkillsDir)).toBe(false);
    });

    it('should throw error for invalid tool names', async () => {
      const initCommand = new InitCommand({ tools: 'invalid-tool', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/Invalid tool\(s\): invalid-tool/);
    });

    it('should handle comma-separated tool names with spaces', async () => {
      const initCommand = new InitCommand({ tools: 'claude, cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const agentsSkill = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(agentsSkill)).toBe(true);
    });

    it('should reject combining reserved keywords with explicit tool ids', async () => {
      const initCommand = new InitCommand({ tools: 'all,claude', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(
        /Cannot combine reserved values "all" or "none" with specific tool IDs/
      );
    });

    it('should not create config.yaml if it already exists', async () => {
      // Pre-create config.yaml
      const c3specDir = path.join(testDir, 'c3spec');
      await fs.mkdir(c3specDir, { recursive: true });
      const configPath = path.join(c3specDir, 'config.yaml');
      const existingContent = 'schema: custom-schema\n';
      await fs.writeFile(configPath, existingContent);

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toBe(existingContent);
    });

    it('should handle non-existent target directory', async () => {
      const newDir = path.join(testDir, 'new-project');
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(newDir);

      const c3specPath = path.join(newDir, 'c3spec');
      expect(await directoryExists(c3specPath)).toBe(true);
    });

    it('should work in extend mode (re-running init)', async () => {
      const initCommand1 = new InitCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      // Run init again with a different tool
      const initCommand2 = new InitCommand({ tools: 'cursor', force: true });
      await initCommand2.execute(testDir);

      // Both tools should have skills
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const agentsSkill = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(agentsSkill)).toBe(true);
    });

    it('should refresh skills on re-run for the same tool', async () => {
      const initCommand1 = new InitCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const originalContent = await fs.readFile(skillFile, 'utf-8');

      await fs.writeFile(skillFile, '# Modified content\n');

      const initCommand2 = new InitCommand({ tools: 'claude', force: false });
      await initCommand2.execute(testDir);

      const newContent = await fs.readFile(skillFile, 'utf-8');
      expect(newContent).toBe('# Modified content\n');
    });
  });

  describe('skill content validation', () => {
    it('should generate valid SKILL.md with YAML frontmatter', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: c3spec-start');
      expect(content).toContain('description:');
      expect(content).toMatch(/---\n\n/);
      expect(content).toContain('c3spec-generated: true');
    });

    it('should include c3spec-start routing instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content.toLowerCase()).toContain('c3spec');
    });

    it('should include subagent-dev skill', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-subagent-dev', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('name: c3spec-subagent-dev');
    });
  });

  describe('command generation', () => {
    it('should not generate Claude slash commands', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should not generate Cursor slash commands', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.cursor', 'commands', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error for insufficient permissions', async () => {
      // Mock the permission check to fail
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);

      const originalWriteFile = fs.writeFile;
      vi.spyOn(fs, 'writeFile').mockImplementation(
        async (filePath: any, ...args: any[]) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('.c3spec-test-')
          ) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile.call(fs, filePath, ...args);
        }
      );

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(readOnlyDir)).rejects.toThrow(/Insufficient permissions/);
    });

    it('should throw error in non-interactive mode without --tools flag and no detected tools', async () => {
      const initCommand = new InitCommand({ interactive: false });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/No tools detected and no --tools flag/);
    });
  });

  describe('tool-specific adapters', () => {
    it('should generate Codex agent TOML in project .codex/agents', async () => {
      const initCommand = new InitCommand({ tools: 'codex', force: true });
      await initCommand.execute(testDir);

      const agentFile = path.join(testDir, '.codex', 'agents', 'implementer.toml');
      expect(await fileExists(agentFile)).toBe(true);
    });
  });
});

describe('InitCommand - profile and detection features', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-init-profile-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid polluting real config
    configTempDir = path.join(os.tmpdir(), `c3spec-config-test-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should use --profile flag to override global config', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new', 'apply'],
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true, profile: 'core' });
    await initCommand.execute(testDir);

    const startSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(startSkill)).toBe(true);
  });

  it('should reject invalid --profile values', async () => {
    const initCommand = new InitCommand({
      tools: 'claude',
      force: true,
      profile: 'invalid-profile',
    });

    await expect(initCommand.execute(testDir)).rejects.toThrow(
      /Invalid profile "invalid-profile"/
    );
  });

  it('should use detected tools in non-interactive mode when no --tools flag', async () => {
    // Create a generated Claude skill to simulate configured host detection
    await fs.mkdir(path.join(testDir, '.claude', 'skills', 'c3spec-start'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'), '');

    const initCommand = new InitCommand({ interactive: false, force: true });
    await initCommand.execute(testDir);

    // Should have used claude (detected)
    const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });

  it('should let host generation own CLAUDE.md without legacy scaffold fragments', async () => {
    const initCommand = new InitCommand({ tools: 'all', force: true });
    await initCommand.execute(testDir);

    const claudeMd = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd.match(/C3SPEC:START/g)).toHaveLength(1);
    expect(claudeMd).toContain('c3spec-generated: true');
    expect(claudeMd).not.toContain('opsx:start');
    expect(claudeMd).not.toContain('openspec/memory/MEMORY.md');

    expect(await fileExists(path.join(testDir, '.cursor', 'skills', 'c3spec-start', 'SKILL.md'))).toBe(false);
  });

  it('should preselect configured tools but not directory-detected tools in extend mode', async () => {
    await fs.mkdir(path.join(testDir, 'c3spec'), { recursive: true });

    const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'c3spec-start');
    await fs.mkdir(claudeSkillDir, { recursive: true });
    await fs.writeFile(path.join(claudeSkillDir, 'SKILL.md'), 'configured');

    // Host-native marker detected only (not configured with C3Spec-generated files yet)
    await fs.mkdir(path.join(testDir, '.cursor', 'agents'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.cursor', 'agents', 'implementer.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['claude']);

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean; detected?: boolean }> }];

    const claude = choices.find((choice) => choice.value === 'claude');
    const cursor = choices.find((choice) => choice.value === 'cursor');

    expect(claude?.preSelected).toBe(true);
    expect(cursor?.preSelected).toBe(false);
    expect(cursor?.detected).toBe(true);
  });

  it('should preselect detected tools for first-time interactive setup', async () => {
    // First-time init: no c3spec/ directory and no configured C3Spec skills.
    await fs.mkdir(path.join(testDir, '.cursor', 'agents'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.cursor', 'agents', 'implementer.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['cursor']);

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean }> }];
    const cursor = choices.find((choice) => choice.value === 'cursor');

    expect(cursor?.preSelected).toBe(true);
  });

  it('should respect custom profile from global config', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new'],
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const startSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(startSkill)).toBe(true);
  });

  it('should ignore legacy commands-only profile migration for first-class host generation', async () => {
    await fs.mkdir(path.join(testDir, 'c3spec'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'commands', 'c3spec'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md'), '# explore\n');

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const config = getGlobalConfig();
    expect(config.profile).not.toBe('custom');
    expect(config.delivery).not.toBe('commands');

    const startSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(startSkill)).toBe(true);
  });

  it('should not prompt for confirmation when applying custom profile in interactive init', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new'],
    });

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
    vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);

    await initCommand.execute(testDir);

    expect(showWelcomeScreenMock).toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();

    const startSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(startSkill)).toBe(true);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    expect(logCalls.some((entry) => entry.includes('Applying custom profile'))).toBe(false);
  });

  it('should always generate host skills regardless of delivery=skills', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'skills',
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    const cmdFile = path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
  });

  it('should always generate host skills regardless of delivery=commands', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'commands',
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    const cmdFile = path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
  });

  it('should not remove host skills on re-init when delivery changes', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'both',
    });

    const initCommand1 = new InitCommand({ tools: 'claude', force: true });
    await initCommand1.execute(testDir);

    saveGlobalConfig({
      featureFlags: {},
      profile: 'core',
      delivery: 'skills',
    });

    const initCommand2 = new InitCommand({ tools: 'claude', force: true });
    await initCommand2.execute(testDir);

    const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function initHostProject(projectRoot: string, tools = 'claude'): Promise<void> {
  const init = new InitCommand({ tools, force: true });
  await init.execute(projectRoot);
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
