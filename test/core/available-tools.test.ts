import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { getAvailableTools } from '../../src/core/available-tools.js';

describe('available-tools', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `c3spec-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('getAvailableTools', () => {
    it('should return empty array when no tool directories exist', () => {
      const tools = getAvailableTools(testDir);
      expect(tools).toEqual([]);
    });

    it('should detect a single tool directory', async () => {
      await fs.mkdir(path.join(testDir, '.claude', 'skills', 'c3spec-start'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'), '');

      const tools = getAvailableTools(testDir);
      expect(tools).toHaveLength(1);
      expect(tools[0].value).toBe('claude');
      expect(tools[0].name).toBe('Claude Code');
      expect(tools[0].skillsDir).toBe('.claude');
    });

    it('should detect multiple tool directories', async () => {
      await fs.mkdir(path.join(testDir, '.claude', 'skills', 'c3spec-start'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'), '');
      await fs.mkdir(path.join(testDir, '.cursor', 'agents'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.cursor', 'agents', 'implementer.md'), '');
      await fs.mkdir(path.join(testDir, '.codex', 'agents'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.codex', 'agents', 'implementer.toml'), '');

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).toContain('claude');
      expect(toolValues).toContain('cursor');
      expect(toolValues).toContain('codex');
      expect(tools).toHaveLength(3);
    });

    it('should ignore files that are not directories', async () => {
      await fs.writeFile(path.join(testDir, '.claude'), 'not a directory');

      const tools = getAvailableTools(testDir);
      expect(tools).toEqual([]);
    });

    it('should return full AIToolOption objects', async () => {
      await fs.mkdir(path.join(testDir, '.cursor', 'agents'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.cursor', 'agents', 'implementer.md'), '');
      await fs.mkdir(path.join(testDir, '.codex', 'agents'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.codex', 'agents', 'implementer.toml'), '');

      const tools = getAvailableTools(testDir);
      expect(tools).toHaveLength(2);
      expect(tools.find((tool) => tool.value === 'cursor')).toMatchObject({
        name: 'Cursor',
        value: 'cursor',
        available: true,
        skillsDir: '.agents',
      });
      expect(tools.find((tool) => tool.value === 'codex')).toMatchObject({
        name: 'Codex',
        value: 'codex',
        available: true,
        skillsDir: '.agents',
      });
    });

    it('should handle paths with spaces', async () => {
      const spacedDir = path.join(testDir, 'path with spaces');
      await fs.mkdir(spacedDir, { recursive: true });
      await fs.mkdir(path.join(spacedDir, '.claude', 'skills', 'c3spec-start'), { recursive: true });
      await fs.writeFile(path.join(spacedDir, '.claude', 'skills', 'c3spec-start', 'SKILL.md'), '');

      const tools = getAvailableTools(spacedDir);
      expect(tools).toHaveLength(1);
      expect(tools[0].value).toBe('claude');
    });

    it('should not detect removed hosts from unrelated directories', async () => {
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

      const tools = getAvailableTools(testDir);
      const toolValues = tools.map((t) => t.value);
      expect(toolValues).not.toContain('github-copilot');
      expect(toolValues).not.toContain('windsurf');
    });
  });
});
