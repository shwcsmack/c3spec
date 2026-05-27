/**
 * Tool Detection Utilities
 *
 * Shared utilities for detecting tool configurations and version status.
 */

import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS } from '../config.js';
import {
  CANONICAL_SKILL_NAMES,
  type CanonicalSkillName,
} from './canonical-skills.js';
import { REQUIRED_CANONICAL_SKILL_NAMES } from '../host-generation/types.js';

export type { CanonicalSkillName };
export { CANONICAL_SKILL_NAMES, CANONICAL_SKILL_NAMES as SKILL_NAMES };
export type SkillName = CanonicalSkillName;

/**
 * IDs of command templates used for legacy slash-command drift detection.
 */
export const COMMAND_IDS = [
  'explore',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];

export interface ToolSkillStatus {
  configured: boolean;
  fullyConfigured: boolean;
  skillCount: number;
}

export interface ToolVersionStatus {
  toolId: string;
  toolName: string;
  configured: boolean;
  generatedByVersion: string | null;
  needsUpdate: boolean;
}

export function getToolsWithSkillsDir(): string[] {
  return AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value);
}

export function getToolSkillStatus(projectRoot: string, toolId: string): ToolSkillStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) {
    return { configured: false, fullyConfigured: false, skillCount: 0 };
  }

  const hostMarker = path.join(projectRoot, '.agents', 'skills', 'c3spec-start', 'SKILL.md');
  if (toolId === 'cursor' || toolId === 'codex') {
    if (fs.existsSync(hostMarker)) {
      return {
        configured: true,
        fullyConfigured: true,
        skillCount: REQUIRED_CANONICAL_SKILL_NAMES.length,
      };
    }
  }

  if (toolId === 'claude') {
    const claudeMarker = path.join(projectRoot, '.claude', 'skills', 'c3spec-start', 'SKILL.md');
    if (fs.existsSync(claudeMarker)) {
      return {
        configured: true,
        fullyConfigured: true,
        skillCount: REQUIRED_CANONICAL_SKILL_NAMES.length,
      };
    }
  }

  const skillsDir = path.join(projectRoot, tool.skillsDir, 'skills');
  let skillCount = 0;

  for (const skillName of REQUIRED_CANONICAL_SKILL_NAMES) {
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      skillCount++;
    }
  }

  const expectedCount = REQUIRED_CANONICAL_SKILL_NAMES.length;

  return {
    configured: skillCount > 0,
    fullyConfigured: skillCount >= expectedCount,
    skillCount,
  };
}

export function getToolStates(projectRoot: string): Map<string, ToolSkillStatus> {
  const states = new Map<string, ToolSkillStatus>();
  const toolIds = AI_TOOLS.filter((t) => t.skillsDir).map((t) => t.value);

  for (const toolId of toolIds) {
    states.set(toolId, getToolSkillStatus(projectRoot, toolId));
  }

  return states;
}

export function extractGeneratedByVersion(skillFilePath: string): string | null {
  try {
    if (!fs.existsSync(skillFilePath)) {
      return null;
    }

    const content = fs.readFileSync(skillFilePath, 'utf-8');
    const generatedByMatch = content.match(/^\s*generatedBy:\s*["']?([^"'\n]+)["']?\s*$/m);

    if (generatedByMatch && generatedByMatch[1]) {
      return generatedByMatch[1].trim();
    }

    return null;
  } catch {
    return null;
  }
}

export function getToolVersionStatus(
  projectRoot: string,
  toolId: string,
  currentVersion: string
): ToolVersionStatus {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) {
    return {
      toolId,
      toolName: toolId,
      configured: false,
      generatedByVersion: null,
      needsUpdate: false,
    };
  }

  const skillsDir = path.join(projectRoot, tool.skillsDir, 'skills');
  let generatedByVersion: string | null = null;

  for (const skillName of REQUIRED_CANONICAL_SKILL_NAMES) {
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      generatedByVersion = extractGeneratedByVersion(skillFile);
      break;
    }
  }

  const configured = getToolSkillStatus(projectRoot, toolId).configured;
  const needsUpdate =
    configured && (generatedByVersion === null || generatedByVersion !== currentVersion);

  return {
    toolId,
    toolName: tool.name,
    configured,
    generatedByVersion,
    needsUpdate,
  };
}

export function getConfiguredTools(projectRoot: string): string[] {
  return AI_TOOLS.filter((t) => t.skillsDir && getToolSkillStatus(projectRoot, t.value).configured).map(
    (t) => t.value
  );
}

export function getAllToolVersionStatus(
  projectRoot: string,
  currentVersion: string
): ToolVersionStatus[] {
  const configuredTools = getConfiguredTools(projectRoot);
  return configuredTools.map((toolId) => getToolVersionStatus(projectRoot, toolId, currentVersion));
}
