/**
 * Shared utilities index
 */

export {
  CANONICAL_SKILL_NAMES,
  SKILL_NAMES,
  type CanonicalSkillName,
  type SkillName,
  COMMAND_IDS,
  type CommandId,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  extractGeneratedByVersion,
  getToolVersionStatus,
  getConfiguredTools,
  getAllToolVersionStatus,
  type ToolSkillStatus,
  type ToolVersionStatus,
} from './tool-detection.js';

export {
  getCommandTemplates,
  getCommandContents,
  type CommandTemplateEntry,
} from './command-generation.js';

export {
  WORKFLOW_TO_CANONICAL_SKILL,
  readBundledCanonicalSkill,
  readBundledSkillsForWorkflows,
  workflowIdToCanonicalSkill,
  resolveBundledAgentsDir,
} from './canonical-skills.js';
