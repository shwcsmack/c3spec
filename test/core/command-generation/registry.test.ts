import { describe, it, expect } from 'vitest';
import { CommandAdapterRegistry } from '../../../src/core/command-generation/registry.js';

describe('command-generation/registry', () => {
  describe('get', () => {
    it('should return Claude adapter for "claude"', () => {
      const adapter = CommandAdapterRegistry.get('claude');
      expect(adapter).toBeDefined();
      expect(adapter?.toolId).toBe('claude');
    });

    it('should return Cursor adapter for "cursor"', () => {
      const adapter = CommandAdapterRegistry.get('cursor');
      expect(adapter).toBeDefined();
      expect(adapter?.toolId).toBe('cursor');
    });

    it('should return Codex adapter for "codex"', () => {
      const adapter = CommandAdapterRegistry.get('codex');
      expect(adapter).toBeDefined();
      expect(adapter?.toolId).toBe('codex');
    });

    it('should return undefined for removed hosts', () => {
      expect(CommandAdapterRegistry.get('windsurf')).toBeUndefined();
      expect(CommandAdapterRegistry.get('gemini')).toBeUndefined();
    });

    it('should return undefined for unregistered tool', () => {
      const adapter = CommandAdapterRegistry.get('unknown-tool');
      expect(adapter).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const adapter = CommandAdapterRegistry.get('');
      expect(adapter).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return exactly three registered adapters', () => {
      const adapters = CommandAdapterRegistry.getAll();
      expect(adapters).toHaveLength(3);
    });

    it('should include Claude, Cursor, and Codex adapters', () => {
      const toolIds = CommandAdapterRegistry.getAll().map((a) => a.toolId);

      expect(toolIds).toEqual(['claude', 'codex', 'cursor']);
    });
  });

  describe('has', () => {
    it('should return true for supported hosts', () => {
      expect(CommandAdapterRegistry.has('claude')).toBe(true);
      expect(CommandAdapterRegistry.has('cursor')).toBe(true);
      expect(CommandAdapterRegistry.has('codex')).toBe(true);
    });

    it('should return false for removed and unknown tools', () => {
      expect(CommandAdapterRegistry.has('windsurf')).toBe(false);
      expect(CommandAdapterRegistry.has('unknown')).toBe(false);
      expect(CommandAdapterRegistry.has('')).toBe(false);
    });
  });

  describe('adapter functionality', () => {
    it('registered adapters should have working getFilePath', () => {
      const claudeAdapter = CommandAdapterRegistry.get('claude');
      const cursorAdapter = CommandAdapterRegistry.get('cursor');
      const codexAdapter = CommandAdapterRegistry.get('codex');

      expect(claudeAdapter?.getFilePath('test')).toContain('.claude');
      expect(cursorAdapter?.getFilePath('test')).toContain('.cursor');
      expect(codexAdapter?.getFilePath('test')).toContain('prompts');
    });

    it('registered adapters should have working formatFile', () => {
      const content = {
        id: 'test',
        name: 'Test',
        description: 'Test desc',
        category: 'Test',
        tags: ['tag1'],
        body: 'Body content',
      };

      for (const adapter of CommandAdapterRegistry.getAll()) {
        const output = adapter.formatFile(content);
        expect(output).toContain('Body content');
        expect(output).toContain('---');
      }
    });
  });
});
