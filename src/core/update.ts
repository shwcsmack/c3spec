/**
 * Update Command
 *
 * Refreshes canonical `.agents/` artifacts and regenerates host-native outputs.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { AI_TOOLS, C3SPEC_DIR_NAME } from './config.js';
import { getToolsWithSkillsDir } from './shared/index.js';
import {
  applyHostGenerationPipeline,
  formatHostGenerationSummary,
  getHostConfiguredTools,
  hostGenerationNeedsUpdate,
  loadCanonicalTargetsWithRemote,
  resolveHostIdsFromToolSelection,
} from './host-generation/apply.js';
import type { SupportedHostId } from './host-generation/types.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDetectionSummary,
  getToolsFromLegacyArtifacts,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import { isInteractive } from '../utils/interactive.js';
import { getAvailableTools } from './available-tools.js';
import { getConfiguredToolsForProfileSync } from './profile-sync-drift.js';
import {
  scanInstalledWorkflows as scanInstalledWorkflowsShared,
  migrateIfNeeded as migrateIfNeededShared,
} from './migration.js';

const require = createRequire(import.meta.url);
const { version: C3SPEC_VERSION } = require('../../package.json');
/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Force update even when tools are up to date */
  force?: boolean;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 *
 * Wrapper around the shared migration module's scanInstalledWorkflows that accepts tool IDs.
 */
export function scanInstalledWorkflows(projectPath: string, toolIds: string[]): string[] {
  const tools = toolIds
    .map((id) => AI_TOOLS.find((t) => t.value === id))
    .filter((t): t is NonNullable<typeof t> => t != null);
  return scanInstalledWorkflowsShared(projectPath, tools);
}

export class UpdateCommand {
  private readonly force: boolean;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const c3specPath = path.join(resolvedProjectPath, C3SPEC_DIR_NAME);

    // 1. Check c3spec directory exists
    if (!await FileSystemUtils.directoryExists(c3specPath)) {
      throw new Error(`No C3Spec directory found. Run 'c3spec init' first.`);
    }

    // 2. Perform one-time migration if needed before any legacy upgrade generation.
    // Use detected tool directories to preserve existing opsx skills/commands.
    const detectedTools = getAvailableTools(resolvedProjectPath);
    migrateIfNeededShared(resolvedProjectPath, detectedTools);

    // 3. Detect and handle legacy artifacts
    const newlyConfiguredHosts = await this.handleLegacyCleanup(resolvedProjectPath);

    // 4. Resolve configured hosts
    const configuredHosts = this.resolveConfiguredHosts(resolvedProjectPath);
    const hostIds = [...new Set([...configuredHosts, ...newlyConfiguredHosts])];

    if (hostIds.length === 0) {
      console.log(chalk.yellow('No configured hosts found.'));
      console.log(chalk.dim('Run "c3spec init" to set up tools.'));
      return;
    }

    const { files: canonicalTargets, remoteFallbackCount } =
      await loadCanonicalTargetsWithRemote(true);

    const needsUpdate =
      this.force ||
      (await hostGenerationNeedsUpdate(resolvedProjectPath, hostIds, canonicalTargets));

    if (!needsUpdate) {
      this.displayUpToDateMessage(hostIds);
      this.detectNewTools(resolvedProjectPath, hostIds);
      return;
    }

    if (this.force) {
      console.log(`Force updating host artifacts for: ${hostIds.join(', ')}`);
    } else {
      console.log(`Updating host artifacts for: ${hostIds.join(', ')}`);
    }
    console.log();

    if (remoteFallbackCount > 0) {
      console.log(
        chalk.dim(
          `Note: ${remoteFallbackCount} canonical skill(s) used bundled fallback (remote fetch unavailable)`
        )
      );
    }

    const spinner = ora('Refreshing canonical and host artifacts...').start();

    const summary = await applyHostGenerationPipeline(resolvedProjectPath, hostIds, {
      force: this.force,
      refreshCanonical: true,
      fetchRemoteCanonicalSkills: true,
    });

    if (summary.validationErrors.length > 0) {
      spinner.fail('Update failed');
      for (const error of summary.validationErrors) {
        console.log(chalk.red(`  ${error.path}: ${error.message}`));
      }
      throw new Error('Fix canonical `.agents/` artifacts before updating.');
    }

    spinner.succeed('Host artifacts updated');

    console.log();
    for (const line of formatHostGenerationSummary(hostIds, summary)) {
      console.log(line);
    }

    if (summary.canonical.driftWarnings.length > 0) {
      console.log();
      console.log(
        chalk.yellow(
          `${summary.canonical.driftWarnings.length} canonical file(s) have local edits and were not replaced.`
        )
      );
      console.log(chalk.dim('Use --force to overwrite canonical `.agents/` content.'));
    }

    if (summary.hosts.driftWarnings.length > 0) {
      console.log();
      console.log(
        chalk.yellow(
          `${summary.hosts.driftWarnings.length} generated host file(s) appear hand-edited and were skipped.`
        )
      );
      console.log(chalk.dim('Use --force to overwrite generated host artifacts.'));
    }

    if (newlyConfiguredHosts.length > 0) {
      console.log();
      console.log(chalk.bold('Getting started:'));
      console.log('  Ask your agent to use c3spec to plan and implement your next change.');
    }

    this.detectNewTools(resolvedProjectPath, hostIds);

    console.log();
    console.log(chalk.dim(`Hosts: ${hostIds.join(', ')} (v${C3SPEC_VERSION})`));
    console.log(chalk.dim('Restart your IDE for changes to take effect.'));
  }

  private resolveConfiguredHosts(projectPath: string): SupportedHostId[] {
    const hosts = getHostConfiguredTools(projectPath);
    if (hosts.length > 0) {
      return hosts;
    }

    const legacyTools = getConfiguredToolsForProfileSync(projectPath);
    return resolveHostIdsFromToolSelection(legacyTools);
  }

  /**
   * Display message when all hosts are up to date.
   */
  private displayUpToDateMessage(hostIds: SupportedHostId[]): void {
    console.log(chalk.green(`✓ All ${hostIds.length} host(s) up to date (v${C3SPEC_VERSION})`));
    console.log(chalk.dim(`  Hosts: ${hostIds.join(', ')}`));
    console.log();
    console.log(chalk.dim('Use --force to refresh files anyway.'));
  }

  /**
   * Detects new tool directories that aren't currently configured and displays a hint.
   */
  private detectNewTools(projectPath: string, configuredHosts: SupportedHostId[]): void {
    const availableTools = getAvailableTools(projectPath);
    const configuredSet = new Set(configuredHosts);

    const newTools = availableTools.filter((t) => !configuredSet.has(t.value as SupportedHostId));

    if (newTools.length > 0) {
      const newToolNames = newTools.map((tool) => tool.name);
      const isSingleTool = newToolNames.length === 1;
      const toolNoun = isSingleTool ? 'tool' : 'tools';
      const pronoun = isSingleTool ? 'it' : 'them';
      console.log();
      console.log(
        chalk.yellow(
          `Detected new ${toolNoun}: ${newToolNames.join(', ')}. Run 'c3spec init' to add ${pronoun}.`
        )
      );
    }
  }

  /**
   * Detect and handle legacy C3Spec artifacts.
   * Unlike init, update warns but continues if legacy files found in non-interactive mode.
   * Returns host IDs that were newly configured during legacy upgrade.
   */
  private async handleLegacyCleanup(projectPath: string): Promise<SupportedHostId[]> {
    // Detect legacy artifacts
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return []; // No legacy artifacts found
    }

    // Show what was detected
    console.log();
    console.log(formatDetectionSummary(detection));
    console.log();

    const canPrompt = isInteractive();

    if (this.force) {
      // --force flag: proceed with cleanup automatically
      await this.performLegacyCleanup(projectPath, detection);
      // Then upgrade legacy tools to new skills
      return this.upgradeLegacyTools(projectPath, detection, canPrompt);
    }

    if (!canPrompt) {
      // Non-interactive mode without --force: warn and continue
      // (Unlike init, update doesn't abort - user may just want to update skills)
      console.log(chalk.yellow('⚠ Run with --force to auto-cleanup legacy files, or run interactively.'));
      console.log();
      return [];
    }

    // Interactive mode: prompt for confirmation
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: 'Upgrade and clean up legacy files?',
      default: true,
    });

    if (shouldCleanup) {
      await this.performLegacyCleanup(projectPath, detection);
      // Then upgrade legacy tools to new skills
      return this.upgradeLegacyTools(projectPath, detection, canPrompt);
    } else {
      console.log(chalk.dim('Skipping legacy cleanup. Continuing with host update...'));
      console.log();
      return [];
    }
  }

  /**
   * Perform cleanup of legacy artifacts.
   */
  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = ora('Cleaning up legacy files...').start();

    const result = await cleanupLegacyArtifacts(projectPath, detection);

    spinner.succeed('Legacy files cleaned up');

    const summary = formatCleanupSummary(result);
    if (summary) {
      console.log();
      console.log(summary);
    }

    console.log();
  }

  /**
   * Upgrade legacy tools to new skills system.
   * Returns array of tool IDs that were newly configured.
   */
  private async upgradeLegacyTools(
    projectPath: string,
    detection: LegacyDetectionResult,
    canPrompt: boolean
  ): Promise<SupportedHostId[]> {
    // Get tools that had legacy artifacts
    const legacyTools = getToolsFromLegacyArtifacts(detection);

    if (legacyTools.length === 0) {
      return [];
    }

    // Get currently configured tools
    const configuredTools = getConfiguredToolsForProfileSync(projectPath);
    const configuredSet = new Set(configuredTools);

    // Filter to tools that aren't already configured
    const unconfiguredLegacyTools = legacyTools.filter((t) => !configuredSet.has(t));

    if (unconfiguredLegacyTools.length === 0) {
      return [];
    }

    // Get valid tools (those with skillsDir)
    const validToolIds = new Set(getToolsWithSkillsDir());
    const validUnconfiguredTools = unconfiguredLegacyTools.filter((t) => validToolIds.has(t));

    if (validUnconfiguredTools.length === 0) {
      return [];
    }

    // Show what tools were detected from legacy artifacts
    console.log(chalk.bold('Tools detected from legacy artifacts:'));
    for (const toolId of validUnconfiguredTools) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      console.log(`  • ${tool?.name || toolId}`);
    }
    console.log();

    let selectedTools: string[];

    if (this.force || !canPrompt) {
      // Non-interactive with --force: auto-select detected tools
      selectedTools = validUnconfiguredTools;
      console.log(`Setting up skills for: ${selectedTools.join(', ')}`);
    } else {
      // Interactive mode: prompt for tool selection with detected tools pre-selected
      const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

      const sortedChoices = validUnconfiguredTools.map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        return {
          name: tool?.name || toolId,
          value: toolId,
          configured: false,
          preSelected: true, // Pre-select all detected legacy tools
        };
      });

      selectedTools = await searchableMultiSelect({
        message: 'Select tools to set up with the new skill system:',
        pageSize: 15,
        choices: sortedChoices,
        validate: (_selected: string[]) => true, // Allow empty selection (user can skip)
      });

      if (selectedTools.length === 0) {
        console.log(chalk.dim('Skipping tool setup.'));
        console.log();
        return [];
      }
    }

    const hostIds = resolveHostIdsFromToolSelection(selectedTools);
    if (hostIds.length === 0) {
      return [];
    }

    const spinner = ora('Setting up host artifacts...').start();

    try {
      const summary = await applyHostGenerationPipeline(projectPath, hostIds, {
        force: this.force,
        refreshCanonical: true,
        fetchRemoteCanonicalSkills: false,
      });

      if (summary.validationErrors.length > 0) {
        spinner.fail('Host setup failed');
        return [];
      }

      spinner.succeed('Host artifacts set up');
      console.log();
      return hostIds;
    } catch (error) {
      spinner.fail('Host setup failed');
      console.log(chalk.red(`  ${error instanceof Error ? error.message : String(error)}`));
      return [];
    }
  }
}
