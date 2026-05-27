/**
 * Legacy re-export surface for command templates.
 * Canonical skills live under `.agents/skills/` and are installed via host generation.
 */

export {
  getCommandTemplates,
  getCommandContents,
  type CommandTemplateEntry,
} from './command-generation.js';
