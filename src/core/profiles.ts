/**
 * Profile System
 *
 * Defines workflow profiles that control which utility skills workspace setup installs.
 * Tier routing skills are always installed via host generation.
 */

import type { Profile } from './global-config.js';

/**
 * Core utility workflows for workspace skill installation.
 */
export const CORE_WORKFLOWS = ['explore', 'sync', 'archive'] as const;

/**
 * All utility workflows available for custom profiles and migration scanning.
 */
export const ALL_WORKFLOWS = [
  'explore',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;

export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];

/**
 * Resolves which workflows should be active for a given profile configuration.
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: string[]
): readonly string[] {
  if (profile === 'custom') {
    return customWorkflows ?? [];
  }
  return CORE_WORKFLOWS;
}
