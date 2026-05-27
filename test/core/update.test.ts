import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateCommand, scanInstalledWorkflows } from '../../src/core/update.js';
import { InitCommand } from '../../src/core/init.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';
import { C3SPEC_MARKERS } from '../../src/core/config.js';
import * as hostApply from '../../src/core/host-generation/apply.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';

const CANONICAL_SKILL_NAMES = [
  'c3spec-start',
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
  'c3spec-subagent-dev',
  'c3spec-host-adapter',
] as const;

function consoleCalls(spy: ReturnType<typeof vi.spyOn<typeof console, 'log'>>): string[] {
  return spy.mock.calls.map((call) => call.map((arg) => String(arg)).join(' '));
}

describe('UpdateCommand', () => {
  let testDir: string;
  let updateCommand: UpdateCommand;
  let previousCodexHome: string | undefined;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });

    previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(testDir, '.codex-home');
    await fs.mkdir(process.env.CODEX_HOME, { recursive: true });

    await fs.mkdir(path.join(testDir, 'c3spec'), { recursive: true });

    updateCommand = new UpdateCommand();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    if (previousCodexHome === undefined) {
      delete process.env.CODEX_HOME;
    } else {
      process.env.CODEX_HOME = previousCodexHome;
    }

    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('basic validation', () => {
    it('should throw error if c3spec directory does not exist', async () => {
      await fs.rm(path.join(testDir, 'c3spec'), { recursive: true, force: true });

      await expect(updateCommand.execute(testDir)).rejects.toThrow(
        "No C3Spec directory found. Run 'c3spec init' first."
      );
    });

    it('should report no configured hosts when none exist', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured hosts found')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('host artifact updates', () => {
    it('should refresh Claude host skills when canonical content changes', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalSkill = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalSkill, 'utf-8');
      await fs.writeFile(canonicalSkill, `${canonicalContent}\n# stale canonical addition\n`);

      const forceUpdate = new UpdateCommand({ force: true });
      await forceUpdate.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      const updated = await fs.readFile(claudeSkill, 'utf-8');
      expect(updated).toContain('name: c3spec-start');
      expect(updated).not.toContain('stale canonical');
      expect(updated).toContain('c3spec-generated: true');
    });

    it('should refresh all canonical and Claude host skills on update', async () => {
      await initHostProject(testDir, 'claude');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdate = new UpdateCommand({ force: true });
      await forceUpdate.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force updating host artifacts for: claude')
      );

      for (const skillName of CANONICAL_SKILL_NAMES) {
        const canonical = path.join(testDir, '.agents', 'skills', skillName, 'SKILL.md');
        const claude = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await FileSystemUtils.fileExists(canonical)).toBe(true);
        expect(await FileSystemUtils.fileExists(claude)).toBe(true);
      }

      consoleSpy.mockRestore();
    });

    it('should not create slash commands for configured Claude host', async () => {
      await initHostProject(testDir, 'claude');
      await updateCommand.execute(testDir);

      const exploreCmd = path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md');
      expect(await FileSystemUtils.fileExists(exploreCmd)).toBe(false);
    });

    it('should not create Cursor or Codex artifacts for a Claude-only project', async () => {
      await initHostProject(testDir, 'claude');

      await updateCommand.execute(testDir);

      expect(await FileSystemUtils.fileExists(path.join(testDir, '.cursor', 'agents', 'implementer.md'))).toBe(false);
      expect(await FileSystemUtils.fileExists(path.join(testDir, '.codex', 'agents', 'implementer.toml'))).toBe(false);
    });

    it('should overwrite hand-edited generated host skills with --force', async () => {
      await initHostProject(testDir, 'claude');

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      await fs.writeFile(skillFile, '# hand edit\n');

      const forceUpdate = new UpdateCommand({ force: true });
      await forceUpdate.execute(testDir);

      const after = await fs.readFile(skillFile, 'utf-8');
      expect(after).toContain('name: c3spec-start');
      expect(after).not.toBe('# hand edit\n');
    });

    it('should skip unmanaged host files without --force', async () => {
      await initHostProject(testDir, 'claude');

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      await fs.writeFile(skillFile, '# hand edit\n');

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      const after = await fs.readFile(skillFile, 'utf-8');
      expect(after).toBe('# hand edit\n');
      expect(consoleCalls(consoleSpy).some((line) => line.includes('Skipped:'))).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('multi-host support', () => {
    it('should update Claude and Cursor hosts from canonical skills', async () => {
      await initHostProject(testDir, 'claude,cursor');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# stale canonical addition\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating host artifacts for:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/claude.*cursor|cursor.*claude/)
      );

      const claudeSkill = await fs.readFile(
        path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'),
        'utf-8'
      );
      const cursorAgent = path.join(testDir, '.cursor', 'agents', 'implementer.md');
      expect(claudeSkill).toContain('name: c3spec-start');
      expect(await FileSystemUtils.fileExists(cursorAgent)).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should generate Codex agent TOML and config on update', async () => {
      await initHostProject(testDir, 'codex');

      const agentFile = path.join(testDir, '.codex', 'agents', 'implementer.toml');
      const configFile = path.join(testDir, '.codex', 'config.toml');
      expect(await FileSystemUtils.fileExists(agentFile)).toBe(true);
      expect(await FileSystemUtils.fileExists(configFile)).toBe(true);

      await fs.writeFile(agentFile, '# stale\n');

      const forceUpdate = new UpdateCommand({ force: true });
      await forceUpdate.execute(testDir);

      const content = await fs.readFile(agentFile, 'utf-8');
      expect(content).not.toBe('# stale\n');
      expect(content).toContain('c3spec-generated: true');
    });

    it('should generate Cursor agent markdown on update', async () => {
      await initHostProject(testDir, 'cursor');

      const agentFile = path.join(testDir, '.cursor', 'agents', 'implementer.md');
      expect(await FileSystemUtils.fileExists(agentFile)).toBe(true);

      await fs.writeFile(agentFile, '# stale\n');

      const forceUpdate = new UpdateCommand({ force: true });
      await forceUpdate.execute(testDir);

      const content = await fs.readFile(agentFile, 'utf-8');
      expect(content).not.toBe('# stale\n');
      expect(content).toContain('description:');
    });
  });

  describe('host detection', () => {
    it('should treat empty skills directory as unconfigured', async () => {
      await fs.mkdir(path.join(testDir, '.claude', 'skills'), { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured hosts found')
      );

      consoleSpy.mockRestore();
    });

    it('should detect Claude when c3spec-start skill exists', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# stale\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating host artifacts for: claude')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('skill content validation', () => {
    it('should generate valid YAML frontmatter in host skill files', async () => {
      await initHostProject(testDir, 'claude');
      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'),
        'utf-8'
      );

      expect(skillContent).toMatch(/^---\n/);
      expect(skillContent).toContain('name:');
      expect(skillContent).toContain('description:');
      expect(skillContent).toMatch(/---\n\n/);
      expect(skillContent).toContain('c3spec-generated: true');
    });

    it('should include routing instructions in c3spec-start skill', async () => {
      await initHostProject(testDir, 'claude');
      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'),
        'utf-8'
      );

      expect(skillContent.toLowerCase()).toContain('c3spec');
    });
  });

  describe('success output', () => {
    it('should display host update summary', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# stale\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleCalls(consoleSpy).some((line) => line.includes('Hosts: claude'))).toBe(
        true
      );

      consoleSpy.mockRestore();
    });

    it('should suggest IDE restart after update', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# stale\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Restart your IDE')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('smart update detection', () => {
    it('should show up to date message when artifacts match bundled targets', async () => {
      await initHostProject(testDir, 'claude');

      vi.spyOn(hostApply, 'hostGenerationNeedsUpdate').mockResolvedValue(false);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('up to date')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('--force')
      );

      consoleSpy.mockRestore();
    });

    it('should detect update needed when canonical skills differ from bundled targets', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# drifted canonical\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating host artifacts for: claude')
      );

      consoleSpy.mockRestore();
    });

    it('should embed c3spec-generated sentinel in refreshed host skill files', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# drifted\n`);

      await updateCommand.execute(testDir);

      const updatedContent = await fs.readFile(
        path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'),
        'utf-8'
      );
      expect(updatedContent).toContain('c3spec-generated: true');
      expect(updatedContent).toContain('c3spec-hash:');
    });
  });

  describe('--force flag', () => {
    it('should refresh host artifacts when force is true even if up to date', async () => {
      await initHostProject(testDir, 'claude');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force updating host artifacts for: claude')
      );
      expect(consoleCalls(consoleSpy).some((line) => line.includes('Hosts: claude'))).toBe(
        true
      );

      consoleSpy.mockRestore();
    });

    it('should not show --force hint when force is used', async () => {
      await initHostProject(testDir, 'claude');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      const hasForceHint = consoleCalls(consoleSpy).some((line) =>
        line.includes('Use --force to refresh files anyway')
      );
      expect(hasForceHint).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should force update all configured hosts', async () => {
      await initHostProject(testDir, 'claude,cursor');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Force updating host artifacts for:.*claude.*cursor|cursor.*claude/)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('version output', () => {
    it('should show package version in host summary', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# stale\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      const { version } = await import('../../package.json');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`(v${version})`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('legacy cleanup', () => {
    it('should detect and auto-cleanup legacy files with --force flag', async () => {
      await initHostProject(testDir, 'claude');

      const legacyContent = `${C3SPEC_MARKERS.start}
# C3Spec Instructions

These instructions are for AI assistants.
${C3SPEC_MARKERS.end}
`;
      await fs.writeFile(path.join(testDir, 'CLINE.md'), legacyContent);

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Upgrading to the new C3Spec')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed C3Spec markers from CLINE.md')
      );

      const content = await fs.readFile(path.join(testDir, 'CLINE.md'), 'utf-8');
      expect(content).not.toContain(C3SPEC_MARKERS.start);
      expect(content).not.toContain(C3SPEC_MARKERS.end);

      consoleSpy.mockRestore();
    });

    it('should warn but continue with update when legacy files found in non-interactive mode', async () => {
      await initHostProject(testDir, 'claude');

      const legacyContent = `${C3SPEC_MARKERS.start}
# C3Spec Instructions
${C3SPEC_MARKERS.end}
`;
      await fs.writeFile(path.join(testDir, 'CLINE.md'), legacyContent);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Upgrading to the new C3Spec')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run with --force to auto-cleanup')
      );
      expect(consoleCalls(consoleSpy).some((line) => line.includes('Hosts: claude'))).toBe(
        true
      );

      consoleSpy.mockRestore();
    });

    it('should cleanup legacy slash command directories with --force', async () => {
      await initHostProject(testDir, 'claude');

      const legacyCommandDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(legacyCommandDir, { recursive: true });
      await fs.writeFile(path.join(legacyCommandDir, 'old-command.md'), 'old command');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed .claude/commands/opsx/')
      );
      expect(await FileSystemUtils.directoryExists(legacyCommandDir)).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should cleanup legacy c3spec/AGENTS.md with --force', async () => {
      await initHostProject(testDir, 'claude');

      await fs.writeFile(path.join(testDir, 'c3spec', 'AGENTS.md'), '# Old AGENTS.md content');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed c3spec/AGENTS.md')
      );
      expect(await FileSystemUtils.fileExists(path.join(testDir, 'c3spec', 'AGENTS.md'))).toBe(
        false
      );

      consoleSpy.mockRestore();
    });

    it('should not show legacy cleanup messages when no legacy files exist', async () => {
      await initHostProject(testDir, 'claude');

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      const hasLegacyMessage = consoleCalls(consoleSpy).some((line) =>
        line.includes('Upgrading to the new C3Spec')
      );
      expect(hasLegacyMessage).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should remove C3Spec marker block from mixed content files', async () => {
      await initHostProject(testDir, 'claude');

      const mixedContent = `# My Project

Some user-defined instructions here.

${C3SPEC_MARKERS.start}
# C3Spec Instructions

These instructions are for AI assistants.
${C3SPEC_MARKERS.end}

More user content after markers.
`;
      await fs.writeFile(path.join(testDir, 'CLINE.md'), mixedContent);

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      const updatedContent = await fs.readFile(path.join(testDir, 'CLINE.md'), 'utf-8');
      expect(updatedContent).toContain('# My Project');
      expect(updatedContent).toContain('Some user-defined instructions here');
      expect(updatedContent).toContain('More user content after markers');
      expect(updatedContent).not.toContain(C3SPEC_MARKERS.start);
      expect(updatedContent).not.toContain(C3SPEC_MARKERS.end);
    });
  });

  describe('legacy tool upgrade', () => {
    it('should upgrade legacy tools to host artifacts with --force', async () => {
      const legacyCommandDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(legacyCommandDir, { recursive: true });
      await fs.writeFile(path.join(legacyCommandDir, 'proposal.md'), 'old command content');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tools detected from legacy artifacts')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting started')
      );

      const skillFile = path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
      expect(await FileSystemUtils.fileExists(skillFile)).toBe(true);
      expect(await FileSystemUtils.directoryExists(legacyCommandDir)).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should upgrade multiple legacy tools with --force', async () => {
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'), 'content');

      await fs.mkdir(path.join(testDir, '.cursor', 'commands'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.cursor', 'commands', 'c3spec-proposal.md'), 'content');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tools detected from legacy artifacts')
      );

      expect(
        await FileSystemUtils.fileExists(
          path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md')
        )
      ).toBe(true);
      expect(
        await FileSystemUtils.fileExists(
          path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md')
        )
      ).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not upgrade legacy tools already configured with host skills', async () => {
      await initHostProject(testDir, 'claude');

      const legacyCommandDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(legacyCommandDir, { recursive: true });
      await fs.writeFile(path.join(legacyCommandDir, 'proposal.md'), 'old command');

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed .claude/commands/opsx/')
      );

      const hasDetectedMessage = consoleCalls(consoleSpy).some((line) =>
        line.includes('Tools detected from legacy artifacts')
      );
      expect(hasDetectedMessage).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should create canonical host skills when upgrading legacy tools', async () => {
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'), 'content');

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      for (const skillName of CANONICAL_SKILL_NAMES) {
        expect(
          await FileSystemUtils.fileExists(
            path.join(testDir, '.agents', 'skills', skillName, 'SKILL.md')
          )
        ).toBe(true);
        expect(
          await FileSystemUtils.fileExists(
            path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md')
          )
        ).toBe(true);
      }
    });

    it('should not create slash commands when upgrading legacy tools', async () => {
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'), 'content');

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      const exploreCmd = path.join(testDir, '.claude', 'commands', 'c3spec', 'explore.md');
      expect(await FileSystemUtils.fileExists(exploreCmd)).toBe(false);
    });
  });

  describe('JSON sidecar behavior', () => {
    it('should skip hand-edited settings.json without --force', async () => {
      await initHostProject(testDir, 'claude');

      const settingsPath = path.join(testDir, '.claude', 'settings.json');
      await fs.writeFile(settingsPath, '{"hooks": {"custom": true}}\n');

      await updateCommand.execute(testDir);

      const after = await fs.readFile(settingsPath, 'utf-8');
      expect(after).toBe('{"hooks": {"custom": true}}\n');
    });

    it('should overwrite hand-edited settings.json with --force', async () => {
      await initHostProject(testDir, 'claude');

      const settingsPath = path.join(testDir, '.claude', 'settings.json');
      await fs.writeFile(settingsPath, '{"hooks": {"custom": true}}\n');

      const forceUpdate = new UpdateCommand({ force: true });
      await forceUpdate.execute(testDir);

      const after = await fs.readFile(settingsPath, 'utf-8');
      expect(after).not.toBe('{"hooks": {"custom": true}}\n');
      expect(await FileSystemUtils.fileExists(`${settingsPath}.c3spec.json`)).toBe(true);
    });
  });

  describe('new tool detection', () => {
    it('should not flag cursor or codex when canonical .agents is configured', async () => {
      await initHostProject(testDir, 'claude');
      await updateCommand.execute(testDir);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      const hasNewToolMessage = consoleCalls(consoleSpy).some((line) =>
        line.includes('Detected new tool')
      );
      expect(hasNewToolMessage).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('scanInstalledWorkflows', () => {
    it('should detect installed workflows across tools', async () => {
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'c3spec-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'c3spec-explore', 'SKILL.md'), 'content');
      await fs.mkdir(path.join(claudeSkillsDir, 'c3spec-sync-specs'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'c3spec-sync-specs', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('sync');
      expect(workflows).not.toContain('onboard');
    });

    it('should return union of workflows across multiple tools', async () => {
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'c3spec-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'c3spec-explore', 'SKILL.md'), 'content');

      const agentsSkillsDir = path.join(testDir, '.agents', 'skills');
      await fs.mkdir(path.join(agentsSkillsDir, 'c3spec-archive-change'), { recursive: true });
      await fs.writeFile(path.join(agentsSkillsDir, 'c3spec-archive-change', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude', 'cursor']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('archive');
    });

    it('should only match workflows in ALL_WORKFLOWS', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'my-custom-skill'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'my-custom-skill', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toHaveLength(0);
    });

    it('should return empty array when no tools have skills', async () => {
      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toHaveLength(0);
    });

    it('should detect installed workflows from managed command files', async () => {
      const commandsDir = path.join(testDir, '.claude', 'commands', 'c3spec');
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(commandsDir, 'explore.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toContain('explore');
    });
  });

  describe('tools output', () => {
    it('should list affected hosts in output', async () => {
      await initHostProject(testDir, 'claude');

      const canonicalStart = path.join(testDir, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
      const canonicalContent = await fs.readFile(canonicalStart, 'utf-8');
      await fs.writeFile(canonicalStart, `${canonicalContent}\n# stale\n`);

      const consoleSpy = vi.spyOn(console, 'log');
      await updateCommand.execute(testDir);

      const hasHostsList = consoleCalls(consoleSpy).some(
        (line) => line.includes('Hosts:') && line.includes('claude')
      );
      expect(hasHostsList).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});

async function initHostProject(projectRoot: string, tools = 'claude'): Promise<void> {
  const init = new InitCommand({ tools, force: true });
  await init.execute(projectRoot);
}
