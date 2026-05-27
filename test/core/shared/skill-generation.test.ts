import { describe, it, expect } from 'vitest';
import {
  getCommandTemplates,
  getCommandContents,
} from '../../../src/core/shared/skill-generation.js';

describe('command-generation (legacy skill-generation module)', () => {
  describe('getCommandTemplates', () => {
    it('should return all command templates', () => {
      const templates = getCommandTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(6);
    });

    it('should include utility workflow commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('explore');
      expect(ids).toContain('sync');
      expect(ids).toContain('archive');
      expect(ids).toContain('onboard');
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandTemplates(['explore', 'archive']);
      expect(filtered).toHaveLength(2);
      const ids = filtered.map((t) => t.id);
      expect(ids).toContain('explore');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('onboard');
    });
  });

  describe('getCommandContents', () => {
    it('should return contents matching command templates', () => {
      const templates = getCommandTemplates();
      const contents = getCommandContents();
      const templateIds = templates.map((t) => t.id).sort();
      const contentIds = contents.map((c) => c.id).sort();
      expect(contentIds).toEqual(templateIds);
    });

    it('should have valid content structure', () => {
      const contents = getCommandContents();
      for (const content of contents) {
        expect(content.id).toBeTruthy();
        expect(content.name).toBeTruthy();
        expect(content.description).toBeTruthy();
        expect(content.body).toBeTruthy();
      }
    });
  });
});
