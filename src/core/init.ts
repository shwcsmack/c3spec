/**
 * Init Command
 *
 * Sets up C3Spec with canonical `.agents/` artifacts and generated host-native outputs.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { FileSystemUtils } from '../utils/file-system.js';
import {
  AI_TOOLS,
  C3SPEC_DIR_NAME,
  AIToolOption,
} from './config.js';
import { scaffoldC3specStructure } from './c3spec-scaffold.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDetectionSummary,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import {
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  type ToolSkillStatus,
} from './shared/index.js';
import { getGlobalConfig, type Profile } from './global-config.js';
import {
  applyHostGenerationPipeline,
  formatHostGenerationSummary,
  resolveHostIdsFromToolSelection,
} from './host-generation/apply.js';
import type { SupportedHostId } from './host-generation/types.js';
import { getAvailableTools } from './available-tools.js';
import { migrateIfNeeded } from './migration.js';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_SCHEMA = 'superpowers-bridge';

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type InitCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  profile?: string;
};

// -----------------------------------------------------------------------------
// Init Command Class
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly profileOverride?: string;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.profileOverride = options.profile;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const c3specDir = C3SPEC_DIR_NAME;
    const c3specPath = path.join(projectPath, c3specDir);

    // Validation happens silently in the background
    const extendMode = await this.validate(projectPath, c3specPath);

    // Check for legacy artifacts and handle cleanup
    await this.handleLegacyCleanup(projectPath, extendMode);

    // Detect available tools in the project (task 7.1)
    const detectedTools = getAvailableTools(projectPath);

    // Migration check: migrate existing projects to profile system (task 7.3)
    if (extendMode) {
      migrateIfNeeded(projectPath, detectedTools);
    }

    // Show animated welcome screen (interactive mode only)
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // Validate profile override early so invalid values fail before tool setup.
    // The resolved value is consumed later when generation reads effective config.
    this.resolveProfileOverride();

    // Get tool states before processing
    const toolStates = getToolStates(projectPath);

    // Get tool selection (pass detected tools for pre-selection)
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

    // Validate selected tools
    const validatedTools = this.validateTools(selectedToolIds, toolStates);

    // Create directory structure and config
    await this.createDirectoryStructure(c3specPath, extendMode);

    const hostIds = resolveHostIdsFromToolSelection(validatedTools.map((t) => t.value));
    const results = await this.generateHostArtifacts(projectPath, hostIds, validatedTools);

    // Create config.yaml if needed
    const configStatus = await this.createConfig(c3specPath, extendMode);

    // Scaffold c3spec workflow structure (memory dirs, CLAUDE.md fragment, skills)
    await scaffoldC3specStructure(path.join(projectPath, C3SPEC_DIR_NAME), projectPath);
    console.log(chalk.green('✓') + ' c3spec workflow structure scaffolded');

    // Display success message
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus);
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDATION & SETUP
  // ═══════════════════════════════════════════════════════════

  private async validate(
    projectPath: string,
    c3specPath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(c3specPath);

    // Check write permissions
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
    return extendMode;
  }

  private canPromptInteractively(): boolean {
    if (this.interactiveOption === false) return false;
    if (this.toolsArg !== undefined) return false;
    return isInteractive({ interactive: this.interactiveOption });
  }

  private resolveProfileOverride(): Profile | undefined {
    if (this.profileOverride === undefined) {
      return undefined;
    }

    if (this.profileOverride === 'core' || this.profileOverride === 'custom') {
      return this.profileOverride;
    }

    throw new Error(`Invalid profile "${this.profileOverride}". Available profiles: core, custom`);
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY CLEANUP
  // ═══════════════════════════════════════════════════════════

  private async handleLegacyCleanup(projectPath: string, extendMode: boolean): Promise<void> {
    // Detect legacy artifacts
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return; // No legacy artifacts found
    }

    // Show what was detected
    console.log();
    console.log(formatDetectionSummary(detection));
    console.log();

    const canPrompt = this.canPromptInteractively();

    if (this.force || !canPrompt) {
      // --force flag or non-interactive mode: proceed with cleanup automatically.
      // Legacy slash commands are 100% C3Spec-managed, and config file cleanup
      // only removes markers (never deletes files), so auto-cleanup is safe.
      await this.performLegacyCleanup(projectPath, detection);
      return;
    }

    // Interactive mode: prompt for confirmation
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: 'Upgrade and clean up legacy files?',
      default: true,
    });

    if (!shouldCleanup) {
      console.log(chalk.dim('Initialization cancelled.'));
      console.log(chalk.dim('Run with --force to skip this prompt, or manually remove legacy files.'));
      process.exit(0);
    }

    await this.performLegacyCleanup(projectPath, detection);
  }

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

  // ═══════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    toolStates: Map<string, ToolSkillStatus>,
    extendMode: boolean,
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    // Check for --tools flag first
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()]
        .filter(([, status]) => status.configured)
        .map(([toolId]) => toolId)
    );
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
    const canPrompt = this.canPromptInteractively();

    // Non-interactive mode: use detected tools as fallback (task 7.8)
    if (!canPrompt) {
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      throw new Error(
        `No tools detected and no --tools flag provided. Valid tools:\n  ${validTools.join('\n  ')}\n\nUse --tools all, --tools none, or --tools claude,cursor,...`
      );
    }

    if (validTools.length === 0) {
      throw new Error(
        `No tools available for skill generation.`
      );
    }

    // Interactive mode: show searchable multi-select
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // Build choices: pre-select configured tools; keep detected tools visible but unselected.
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;
        const detected = detectedToolIds.has(toolId);

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          detected: detected && !configured,
          preSelected: configured || (shouldPreselectDetected && detected && !configured),
        };
      })
      .sort((a, b) => {
        // Configured tools first, then detected (not configured), then everything else.
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        if (a.detected && !b.detected) return -1;
        if (!a.detected && b.detected) return 1;
        return 0;
      });

    const configuredNames = validTools
      .filter((toolId) => configuredToolIds.has(toolId))
      .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);

    if (configuredNames.length > 0) {
      console.log(`C3Spec configured: ${configuredNames.join(', ')} (pre-selected)`);
    }

    const detectedOnlyNames = detectedTools
      .filter((tool) => !configuredToolIds.has(tool.value))
      .map((tool) => tool.name);

    if (detectedOnlyNames.length > 0) {
      const detectionLabel = shouldPreselectDetected
        ? 'pre-selected for first-time setup'
        : 'not pre-selected';
      console.log(`Detected tool directories: ${detectedOnlyNames.join(', ')} (${detectionLabel})`);
    }

    const selectedTools = await searchableMultiSelect({
      message: `Select tools to set up (${validTools.length} available)`,
      pageSize: 15,
      choices: sortedChoices,
      validate: (selected: string[]) => selected.length > 0 || 'Select at least one tool',
    });

    if (selectedTools.length === 0) {
      throw new Error('At least one tool must be selected');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
      );
    }

    const availableTools = getToolsWithSkillsDir();
    const availableSet = new Set(availableTools);
    const availableList = ['all', 'none', ...availableTools].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableTools;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".'
      );
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`
      );
    }

    // Deduplicate while preserving order
    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  private validateTools(
    toolIds: string[],
    toolStates: Map<string, ToolSkillStatus>
  ): Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> {
    const validatedTools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `Unknown tool '${toolId}'. Valid tools:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!tool.skillsDir) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      const preState = toolStates.get(tool.value);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        wasConfigured: preState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(c3specPath: string, extendMode: boolean): Promise<void> {
    if (extendMode) {
      // In extend mode, just ensure directories exist without spinner
      const directories = [
        c3specPath,
        path.join(c3specPath, 'specs'),
        path.join(c3specPath, 'changes'),
        path.join(c3specPath, 'changes', 'archive'),
      ];

      for (const dir of directories) {
        await FileSystemUtils.createDirectory(dir);
      }
      return;
    }

    const spinner = this.startSpinner('Creating C3Spec structure...');

    const directories = [
      c3specPath,
      path.join(c3specPath, 'specs'),
      path.join(c3specPath, 'changes'),
      path.join(c3specPath, 'changes', 'archive'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('C3Spec structure created'),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HOST GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generateHostArtifacts(
    projectPath: string,
    hostIds: SupportedHostId[],
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    generationSummary: string[];
    driftWarnings: string[];
    validationErrors: Array<{ path: string; message: string }>;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];

    if (hostIds.length === 0) {
      return {
        createdTools,
        refreshedTools,
        failedTools,
        generationSummary: [],
        driftWarnings: [],
        validationErrors: [],
      };
    }

    const spinner = ora('Generating canonical and host artifacts...').start();

    try {
      const summary = await applyHostGenerationPipeline(projectPath, hostIds, {
        force: this.force,
        ensureCanonical: true,
        refreshCanonical: false,
        fetchRemoteCanonicalSkills: false,
      });

      if (summary.validationErrors.length > 0) {
        spinner.fail('Host generation failed');
        return {
          createdTools,
          refreshedTools,
          failedTools: [
            {
              name: 'host-generation',
              error: new Error(
                summary.validationErrors.map((e) => `${e.path}: ${e.message}`).join('; ')
              ),
            },
          ],
          generationSummary: [],
          driftWarnings: [],
          validationErrors: summary.validationErrors,
        };
      }

      spinner.succeed('Host artifacts generated');

      for (const tool of tools) {
        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      }

      const driftWarnings = [
        ...summary.canonical.driftWarnings,
        ...summary.hosts.driftWarnings,
      ];

      return {
        createdTools,
        refreshedTools,
        failedTools,
        generationSummary: formatHostGenerationSummary(hostIds, summary),
        driftWarnings,
        validationErrors: [],
      };
    } catch (error) {
      spinner.fail('Host generation failed');
      failedTools.push({
        name: 'host-generation',
        error: error as Error,
      });
      return {
        createdTools,
        refreshedTools,
        failedTools,
        generationSummary: [],
        driftWarnings: [],
        validationErrors: [],
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIG FILE
  // ═══════════════════════════════════════════════════════════

  private async createConfig(c3specPath: string, extendMode: boolean): Promise<'created' | 'exists' | 'skipped'> {
    const configPath = path.join(c3specPath, 'config.yaml');
    const configYmlPath = path.join(c3specPath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);

    if (configYamlExists || configYmlExists) {
      return 'exists';
    }

    // In non-interactive mode without --force, skip config creation
    if (!this.canPromptInteractively() && !this.force) {
      return 'skipped';
    }

    try {
      const yamlContent = serializeConfig({ schema: DEFAULT_SCHEMA });
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI & OUTPUT
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      generationSummary: string[];
      driftWarnings: string[];
      validationErrors: Array<{ path: string; message: string }>;
    },
    configStatus: 'created' | 'exists' | 'skipped'
  ): void {
    console.log();
    console.log(chalk.bold('C3Spec Setup Complete'));
    console.log();

    // Show created vs refreshed tools
    if (results.createdTools.length > 0) {
      console.log(`Created: ${results.createdTools.map((t) => t.name).join(', ')}`);
    }
    if (results.refreshedTools.length > 0) {
      console.log(`Refreshed: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
    }

    if (results.generationSummary.length > 0) {
      for (const line of results.generationSummary) {
        console.log(line);
      }
    }

    // Show failures
    if (results.failedTools.length > 0) {
      console.log(chalk.red(`Failed: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    if (results.driftWarnings.length > 0) {
      console.log(
        chalk.yellow(
          `${results.driftWarnings.length} file(s) skipped due to local edits (use --force to overwrite)`
        )
      );
    }

    // Config status
    if (configStatus === 'created') {
      console.log(`Config: c3spec/config.yaml (schema: ${DEFAULT_SCHEMA})`);
    } else if (configStatus === 'exists') {
      // Show actual filename (config.yaml or config.yml)
      const configYaml = path.join(projectPath, C3SPEC_DIR_NAME, 'config.yaml');
      const configYml = path.join(projectPath, C3SPEC_DIR_NAME, 'config.yml');
      const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
      console.log(`Config: c3spec/${configName} (exists)`);
    } else {
      console.log(chalk.dim(`Config: skipped (non-interactive mode)`));
    }

    console.log();
    console.log(chalk.bold('Getting started:'));
    console.log('  Ask your agent to use c3spec to plan and implement your next change.');
    console.log(chalk.dim('  Example: "Use c3spec to propose a change for …"'));

    // Links
    console.log();
    console.log(`Learn more: ${chalk.cyan('https://github.com/shwcsmack/c3spec')}`);
    console.log(`Feedback:   ${chalk.cyan('https://github.com/shwcsmack/c3spec/issues')}`);

    if (results.createdTools.length > 0 || results.refreshedTools.length > 0) {
      console.log();
      console.log(chalk.white('Restart your IDE so host skills and agents reload.'));
    }

    console.log();
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }

}
