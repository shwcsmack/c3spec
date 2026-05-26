import { describe, it, expect } from 'vitest';
import os from 'os';
import path from 'path';
import { claudeAdapter } from '../../../src/core/command-generation/adapters/claude.js';
import { codexAdapter } from '../../../src/core/command-generation/adapters/codex.js';
import { cursorAdapter } from '../../../src/core/command-generation/adapters/cursor.js';
import type { CommandContent } from '../../../src/core/command-generation/types.js';

describe('command-generation/adapters', () => {
  const sampleContent: CommandContent = {
    id: 'explore',
    name: 'C3Spec Explore',
    description: 'Enter explore mode for thinking',
    category: 'Workflow',
    tags: ['workflow', 'explore', 'experimental'],
    body: 'This is the command body.\n\nWith multiple lines.',
  };

  describe('claudeAdapter', () => {
    it('should have correct toolId', () => {
      expect(claudeAdapter.toolId).toBe('claude');
    });

    it('should generate correct file path', () => {
      const filePath = claudeAdapter.getFilePath('explore');
      expect(filePath).toBe(path.join('.claude', 'commands', 'c3spec', 'explore.md'));
    });

    it('should format file with correct YAML frontmatter', () => {
      const output = claudeAdapter.formatFile(sampleContent);

      expect(output).toContain('---\n');
      expect(output).toContain('name: C3Spec Explore');
      expect(output).toContain('description: Enter explore mode for thinking');
      expect(output).toContain('This is the command body.\n\nWith multiple lines.');
    });
  });

  describe('cursorAdapter', () => {
    it('should have correct toolId', () => {
      expect(cursorAdapter.toolId).toBe('cursor');
    });

    it('should generate correct file path with opsx- prefix', () => {
      const filePath = cursorAdapter.getFilePath('explore');
      expect(filePath).toBe(path.join('.cursor', 'commands', 'opsx-explore.md'));
    });

    it('should format file with Cursor-specific frontmatter', () => {
      const output = cursorAdapter.formatFile(sampleContent);

      expect(output).toContain('---\n');
      expect(output).toContain('name: /opsx-explore');
      expect(output).toContain('id: opsx-explore');
      expect(output).toContain('This is the command body.');
    });
  });

  describe('codexAdapter', () => {
    it('should have correct toolId', () => {
      expect(codexAdapter.toolId).toBe('codex');
    });

    it('should generate correct global file path', () => {
      const codexHome = path.join(os.tmpdir(), 'codex-test-home');
      const previousHome = process.env.CODEX_HOME;
      process.env.CODEX_HOME = codexHome;

      try {
        const filePath = codexAdapter.getFilePath('explore');
        expect(filePath).toBe(path.join(codexHome, 'prompts', 'opsx-explore.md'));
      } finally {
        if (previousHome === undefined) {
          delete process.env.CODEX_HOME;
        } else {
          process.env.CODEX_HOME = previousHome;
        }
      }
    });

    it('should format file with Codex frontmatter', () => {
      const output = codexAdapter.formatFile(sampleContent);

      expect(output).toContain('---\n');
      expect(output).toContain('description: Enter explore mode for thinking');
      expect(output).toContain('This is the command body.');
    });
  });

  describe('cross-platform path handling', () => {
    it('Claude adapter uses path.join for paths', () => {
      const filePath = claudeAdapter.getFilePath('test');
      expect(filePath.split(path.sep)).toEqual(['.claude', 'commands', 'c3spec', 'test.md']);
    });

    it('Cursor adapter uses path.join for paths', () => {
      const filePath = cursorAdapter.getFilePath('test');
      expect(filePath.split(path.sep)).toEqual(['.cursor', 'commands', 'opsx-test.md']);
    });

    it('All adapters use path.join for paths', () => {
      for (const adapter of [claudeAdapter, codexAdapter, cursorAdapter]) {
        const filePath = adapter.getFilePath('test');
        expect(filePath.length).toBeGreaterThan(0);
        expect(filePath.includes(path.sep) || filePath.includes('.')).toBe(true);
      }
    });
  });
});
