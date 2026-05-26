/**
 * Legacy cleanup module for detecting and removing c3spec artifacts
 * from previous init versions during the migration to the skill-based workflow.
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { FileSystemUtils, removeMarkerBlock as removeMarkerBlockUtil } from '../utils/file-system.js';
import { C3SPEC_MARKERS } from './config.js';
import { isGeneratedByC3spec } from './host-generation/sentinel.js';

/**
 * Legacy config file names from the old ToolRegistry.
 * These were config files created at project root with C3Spec markers.
 */
export const LEGACY_CONFIG_FILES = [
  'CLAUDE.md',
  'CLINE.md',
  'CODEBUDDY.md',
  'COSTRICT.md',
  'QODER.md',
  'IFLOW.md',
  'AGENTS.md', // root AGENTS.md (not c3spec/AGENTS.md)
  'QWEN.md',
] as const;

/**
 * Legacy slash command patterns from the old SlashCommandRegistry.
 * These map toolId to the path pattern where legacy commands were created.
 * Some tools used a directory structure, others used individual files.
 */
export const LEGACY_SLASH_COMMAND_PATHS: Record<string, LegacySlashCommandPattern> = {
  // Directory-based: .tooldir/commands/c3spec/ or .tooldir/commands/c3spec/*.md
  'claude': { type: 'directory', path: '.claude/commands/opsx' },
  'codebuddy': { type: 'directory', path: '.codebuddy/commands/c3spec' },
  'qoder': { type: 'directory', path: '.qoder/commands/c3spec' },
  'lingma': { type: 'directory', path: '.lingma/commands/c3spec' },
  'crush': { type: 'directory', path: '.crush/commands/c3spec' },
  'gemini': { type: 'directory', path: '.gemini/commands/c3spec' },
  'costrict': { type: 'directory', path: '.cospec/c3spec/commands' },

  // File-based: individual c3spec-*.md files in a commands/workflows/prompts folder
  'cursor': { type: 'files', pattern: '.cursor/commands/c3spec-*.md' },
  'windsurf': { type: 'files', pattern: '.windsurf/workflows/c3spec-*.md' },
  'kilocode': { type: 'files', pattern: '.kilocode/workflows/c3spec-*.md' },
  'kiro': { type: 'files', pattern: '.kiro/prompts/c3spec-*.prompt.md' },
  'github-copilot': { type: 'files', pattern: '.github/prompts/c3spec-*.prompt.md' },
  'amazon-q': { type: 'files', pattern: '.amazonq/prompts/c3spec-*.md' },
  'cline': { type: 'files', pattern: '.clinerules/workflows/c3spec-*.md' },
  'roocode': { type: 'files', pattern: '.roo/commands/c3spec-*.md' },
  'auggie': { type: 'files', pattern: '.augment/commands/c3spec-*.md' },
  'factory': { type: 'files', pattern: '.factory/commands/c3spec-*.md' },
  'opencode': { type: 'files', pattern: ['.opencode/command/opsx-*.md', '.opencode/command/c3spec-*.md'] },
  'continue': { type: 'files', pattern: '.continue/prompts/c3spec-*.prompt' },
  'antigravity': { type: 'files', pattern: '.agent/workflows/c3spec-*.md' },
  'iflow': { type: 'files', pattern: '.iflow/commands/c3spec-*.md' },
  'junie': { type: 'files', pattern: ['.junie/commands/opsx-*.md', '.junie/commands/c3spec-*.md'] },
  'qwen': { type: 'files', pattern: '.qwen/commands/c3spec-*.toml' },
  'codex': { type: 'files', pattern: '.codex/prompts/c3spec-*.md' },
};

/**
 * Pattern types for legacy slash commands
 */
export interface LegacySlashCommandPattern {
  type: 'directory' | 'files';
  path?: string; // For directory type
  pattern?: string | string[]; // For files type (glob pattern or array of patterns)
}

/**
 * Result of legacy artifact detection
 */
export interface LegacyDetectionResult {
  /** Config files with c3spec markers detected */
  configFiles: string[];
  /** Config files to update (remove markers only, never delete) */
  configFilesToUpdate: string[];
  /** Legacy slash command directories found */
  slashCommandDirs: string[];
  /** Legacy slash command files found (for file-based tools) */
  slashCommandFiles: string[];
  /** Whether c3spec/AGENTS.md exists */
  hasOpenspecAgents: boolean;
  /** Whether c3spec/project.md exists (preserved, migration hint only) */
  hasProjectMd: boolean;
  /** Whether root AGENTS.md has c3spec markers */
  hasRootAgentsWithMarkers: boolean;
  /** Whether any legacy artifacts were found */
  hasLegacyArtifacts: boolean;
}

/**
 * Detects all legacy c3spec artifacts in a project.
 *
 * @param projectPath - The root path of the project
 * @returns Detection result with all found legacy artifacts
 */
export async function detectLegacyArtifacts(
  projectPath: string
): Promise<LegacyDetectionResult> {
  const result: LegacyDetectionResult = {
    configFiles: [],
    configFilesToUpdate: [],
    slashCommandDirs: [],
    slashCommandFiles: [],
    hasOpenspecAgents: false,
    hasProjectMd: false,
    hasRootAgentsWithMarkers: false,
    hasLegacyArtifacts: false,
  };

  // Detect legacy config files
  const configResult = await detectLegacyConfigFiles(projectPath);
  result.configFiles = configResult.allFiles;
  result.configFilesToUpdate = configResult.filesToUpdate;

  // Detect legacy slash commands
  const slashResult = await detectLegacySlashCommands(projectPath);
  result.slashCommandDirs = slashResult.directories;
  result.slashCommandFiles = slashResult.files;

  // Detect legacy structure files
  const structureResult = await detectLegacyStructureFiles(projectPath);
  result.hasOpenspecAgents = structureResult.hasOpenspecAgents;
  result.hasProjectMd = structureResult.hasProjectMd;
  result.hasRootAgentsWithMarkers = structureResult.hasRootAgentsWithMarkers;

  // Determine if any legacy artifacts exist
  result.hasLegacyArtifacts =
    result.configFiles.length > 0 ||
    result.slashCommandDirs.length > 0 ||
    result.slashCommandFiles.length > 0 ||
    result.hasOpenspecAgents ||
    result.hasRootAgentsWithMarkers ||
    result.hasProjectMd;

  return result;
}

/**
 * Detects legacy config files with c3spec markers.
 * All config files with markers are candidates for update (marker removal only).
 * Config files are NEVER deleted - they belong to the user's project root.
 *
 * @param projectPath - The root path of the project
 * @returns Object with all files found and files to update
 */
export async function detectLegacyConfigFiles(
  projectPath: string
): Promise<{
  allFiles: string[];
  filesToUpdate: string[];
}> {
  const allFiles: string[] = [];
  const filesToUpdate: string[] = [];

  for (const fileName of LEGACY_CONFIG_FILES) {
    const filePath = FileSystemUtils.joinPath(projectPath, fileName);

    if (await FileSystemUtils.fileExists(filePath)) {
      const content = await FileSystemUtils.readFile(filePath);

      if (hasC3SpecMarkers(content) && !isGeneratedByC3spec(content, 'markdown')) {
        allFiles.push(fileName);
        filesToUpdate.push(fileName); // Always update, never delete config files
      }
    }
  }

  return { allFiles, filesToUpdate };
}

/**
 * Detects legacy slash command directories and files.
 *
 * @param projectPath - The root path of the project
 * @returns Object with directories and individual files found
 */
export async function detectLegacySlashCommands(
  projectPath: string
): Promise<{
  directories: string[];
  files: string[];
}> {
  const directories: string[] = [];
  const files: string[] = [];

  for (const [toolId, pattern] of Object.entries(LEGACY_SLASH_COMMAND_PATHS)) {
    if (pattern.type === 'directory' && pattern.path) {
      const dirPath = FileSystemUtils.joinPath(projectPath, pattern.path);
      if (await FileSystemUtils.directoryExists(dirPath)) {
        directories.push(pattern.path);
      }
    } else if (pattern.type === 'files' && pattern.pattern) {
      // For file-based patterns, check for individual files
      const patterns = Array.isArray(pattern.pattern) ? pattern.pattern : [pattern.pattern];
      for (const p of patterns) {
        const foundFiles = await findLegacySlashCommandFiles(projectPath, p);
        files.push(...foundFiles);
      }
    }
  }

  return { directories, files };
}

/**
 * Finds legacy slash command files matching a glob pattern.
 *
 * @param projectPath - The root path of the project
 * @param pattern - Glob pattern like '.cursor/commands/c3spec-*.md'
 * @returns Array of matching file paths relative to projectPath
 */
async function findLegacySlashCommandFiles(
  projectPath: string,
  pattern: string
): Promise<string[]> {
  const foundFiles: string[] = [];

  // Extract directory and file pattern from glob
  // Handle both forward and backward slashes for Windows compatibility
  const lastForwardSlash = pattern.lastIndexOf('/');
  const lastBackSlash = pattern.lastIndexOf('\\');
  const lastSeparator = Math.max(lastForwardSlash, lastBackSlash);
  const dirPart = pattern.substring(0, lastSeparator);
  const filePart = pattern.substring(lastSeparator + 1);

  const dirPath = FileSystemUtils.joinPath(projectPath, dirPart);

  if (!(await FileSystemUtils.directoryExists(dirPath))) {
    return foundFiles;
  }

  try {
    const entries = await fs.readdir(dirPath);

    // Convert glob pattern to regex
    // c3spec-*.md -> /^c3spec-.*\.md$/
    // c3spec-*.prompt.md -> /^c3spec-.*\.prompt\.md$/
    // c3spec-*.toml -> /^c3spec-.*\.toml$/
    const regexPattern = filePart
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except *
      .replace(/\*/g, '.*'); // Replace * with .*
    const regex = new RegExp(`^${regexPattern}$`);

    for (const entry of entries) {
      if (regex.test(entry)) {
        // Use forward slashes for consistency in relative paths (cross-platform)
        const normalizedDir = dirPart.replace(/\\/g, '/');
        foundFiles.push(`${normalizedDir}/${entry}`);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return foundFiles;
}

/**
 * Detects legacy c3spec structure files (AGENTS.md and project.md).
 *
 * @param projectPath - The root path of the project
 * @returns Object with detection results for structure files
 */
export async function detectLegacyStructureFiles(
  projectPath: string
): Promise<{
  hasOpenspecAgents: boolean;
  hasProjectMd: boolean;
  hasRootAgentsWithMarkers: boolean;
}> {
  let hasOpenspecAgents = false;
  let hasProjectMd = false;
  let hasRootAgentsWithMarkers = false;

  // Check for c3spec/AGENTS.md
  const c3specAgentsPath = FileSystemUtils.joinPath(projectPath, 'c3spec', 'AGENTS.md');
  hasOpenspecAgents = await FileSystemUtils.fileExists(c3specAgentsPath);

  // Check for c3spec/project.md (for migration messaging, not deleted)
  const projectMdPath = FileSystemUtils.joinPath(projectPath, 'c3spec', 'project.md');
  hasProjectMd = await FileSystemUtils.fileExists(projectMdPath);

  // Check for root AGENTS.md with c3spec markers
  const rootAgentsPath = FileSystemUtils.joinPath(projectPath, 'AGENTS.md');
  if (await FileSystemUtils.fileExists(rootAgentsPath)) {
    const content = await FileSystemUtils.readFile(rootAgentsPath);
    hasRootAgentsWithMarkers =
      hasC3SpecMarkers(content) && !isGeneratedByC3spec(content, 'markdown');
  }

  return { hasOpenspecAgents, hasProjectMd, hasRootAgentsWithMarkers };
}

/**
 * Checks if content contains c3spec markers.
 *
 * @param content - File content to check
 * @returns True if both start and end markers are present
 */
export function hasC3SpecMarkers(content: string): boolean {
  return (
    content.includes(C3SPEC_MARKERS.start) && content.includes(C3SPEC_MARKERS.end)
  );
}

/**
 * Checks if file content is 100% c3spec content (only markers and whitespace outside).
 *
 * @param content - File content to check
 * @returns True if content outside markers is only whitespace
 */
export function isOnlyC3SpecContent(content: string): boolean {
  const startIndex = content.indexOf(C3SPEC_MARKERS.start);
  const endIndex = content.indexOf(C3SPEC_MARKERS.end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return false;
  }

  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + C3SPEC_MARKERS.end.length);

  return before.trim() === '' && after.trim() === '';
}

/**
 * Removes the c3spec marker block from file content.
 * Only removes markers that are on their own lines (ignores inline mentions).
 * Cleans up double blank lines that may result from removal.
 *
 * @param content - File content with c3spec markers
 * @returns Content with marker block removed
 */
export function removeMarkerBlock(content: string): string {
  return removeMarkerBlockUtil(content, C3SPEC_MARKERS.start, C3SPEC_MARKERS.end);
}

/**
 * Result of cleanup operation
 */
export interface CleanupResult {
  /** Files that were deleted entirely */
  deletedFiles: string[];
  /** Files that had marker blocks removed */
  modifiedFiles: string[];
  /** Directories that were deleted */
  deletedDirs: string[];
  /** Whether project.md exists and needs manual migration */
  projectMdNeedsMigration: boolean;
  /** Error messages if any operations failed */
  errors: string[];
}

/**
 * Cleans up legacy c3spec artifacts from a project.
 * Preserves c3spec/project.md (shows migration hint instead of deleting).
 *
 * @param projectPath - The root path of the project
 * @param detection - Detection result from detectLegacyArtifacts
 * @returns Cleanup result with summary of actions taken
 */
export async function cleanupLegacyArtifacts(
  projectPath: string,
  detection: LegacyDetectionResult
): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedFiles: [],
    modifiedFiles: [],
    deletedDirs: [],
    projectMdNeedsMigration: detection.hasProjectMd,
    errors: [],
  };

  // Remove marker blocks from config files (NEVER delete config files)
  // Config files like CLAUDE.md, AGENTS.md belong to the user's project root
  for (const fileName of detection.configFilesToUpdate) {
    const filePath = FileSystemUtils.joinPath(projectPath, fileName);
    try {
      const content = await FileSystemUtils.readFile(filePath);
      const newContent = removeMarkerBlock(content);
      // Always write the file, even if empty - never delete user config files
      await FileSystemUtils.writeFile(filePath, newContent);
      result.modifiedFiles.push(fileName);
    } catch (error: any) {
      result.errors.push(`Failed to modify ${fileName}: ${error.message}`);
    }
  }

  // Delete legacy slash command directories (these are 100% c3spec-managed)
  for (const dirPath of detection.slashCommandDirs) {
    const fullPath = FileSystemUtils.joinPath(projectPath, dirPath);
    try {
      await fs.rm(fullPath, { recursive: true, force: true });
      result.deletedDirs.push(dirPath);
    } catch (error: any) {
      result.errors.push(`Failed to delete directory ${dirPath}: ${error.message}`);
    }
  }

  // Delete legacy slash command files (these are 100% c3spec-managed)
  for (const filePath of detection.slashCommandFiles) {
    const fullPath = FileSystemUtils.joinPath(projectPath, filePath);
    try {
      await fs.unlink(fullPath);
      result.deletedFiles.push(filePath);
    } catch (error: any) {
      result.errors.push(`Failed to delete ${filePath}: ${error.message}`);
    }
  }

  // Delete c3spec/AGENTS.md (this is inside c3spec/, it's c3spec-managed)
  if (detection.hasOpenspecAgents) {
    const agentsPath = FileSystemUtils.joinPath(projectPath, 'c3spec', 'AGENTS.md');
    if (await FileSystemUtils.fileExists(agentsPath)) {
      try {
        await fs.unlink(agentsPath);
        result.deletedFiles.push('c3spec/AGENTS.md');
      } catch (error: any) {
        result.errors.push(`Failed to delete c3spec/AGENTS.md: ${error.message}`);
      }
    }
  }

  // Handle root AGENTS.md with c3spec markers - remove markers only, NEVER delete
  // Note: Root AGENTS.md is handled via configFilesToUpdate above (it's in LEGACY_CONFIG_FILES)
  // This hasRootAgentsWithMarkers flag is just for detection, cleanup happens via configFilesToUpdate

  return result;
}

/**
 * Generates a cleanup summary message for display.
 *
 * @param result - Cleanup result from cleanupLegacyArtifacts
 * @returns Formatted summary string for console output
 */
export function formatCleanupSummary(result: CleanupResult): string {
  const lines: string[] = [];

  if (result.deletedFiles.length > 0 || result.deletedDirs.length > 0 || result.modifiedFiles.length > 0) {
    lines.push('Cleaned up legacy files:');

    for (const file of result.deletedFiles) {
      lines.push(`  ✓ Removed ${file}`);
    }

    for (const dir of result.deletedDirs) {
      lines.push(`  ✓ Removed ${dir}/ (replaced by /c3spec:*)`);
    }

    for (const file of result.modifiedFiles) {
      lines.push(`  ✓ Removed C3Spec markers from ${file}`);
    }
  }

  if (result.projectMdNeedsMigration) {
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push(formatProjectMdMigrationHint());
  }

  if (result.errors.length > 0) {
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push('Errors during cleanup:');
    for (const error of result.errors) {
      lines.push(`  ⚠ ${error}`);
    }
  }

  return lines.join('\n');
}

/**
 * Build list of files to be removed with explanations.
 * Only includes c3spec-managed files (slash commands, c3spec/AGENTS.md).
 * Config files like CLAUDE.md, AGENTS.md are NEVER deleted.
 *
 * @param detection - Detection result from detectLegacyArtifacts
 * @returns Array of objects with path and explanation
 */
function buildRemovalsList(detection: LegacyDetectionResult): Array<{ path: string; explanation: string }> {
  const removals: Array<{ path: string; explanation: string }> = [];

  // Slash command directories (these are 100% c3spec-managed)
  for (const dir of detection.slashCommandDirs) {
    // Split on both forward and backward slashes for Windows compatibility
    const toolDir = dir.split(/[\/\\]/)[0];
    removals.push({ path: dir + '/', explanation: `replaced by ${toolDir}/skills/` });
  }

  // Slash command files (these are 100% c3spec-managed)
  for (const file of detection.slashCommandFiles) {
    removals.push({ path: file, explanation: 'replaced by skills/' });
  }

  // c3spec/AGENTS.md (inside c3spec/, it's c3spec-managed)
  if (detection.hasOpenspecAgents) {
    removals.push({ path: 'c3spec/AGENTS.md', explanation: 'obsolete workflow file' });
  }

  // Note: Config files (CLAUDE.md, AGENTS.md, etc.) are NEVER in the removals list
  // They always go to the updates list where only markers are removed

  return removals;
}

/**
 * Build list of files to be updated with explanations.
 * Includes ALL config files with markers - markers are removed, file is never deleted.
 *
 * @param detection - Detection result from detectLegacyArtifacts
 * @returns Array of objects with path and explanation
 */
function buildUpdatesList(detection: LegacyDetectionResult): Array<{ path: string; explanation: string }> {
  const updates: Array<{ path: string; explanation: string }> = [];

  // All config files with markers get updated (markers removed, file preserved)
  for (const file of detection.configFilesToUpdate) {
    updates.push({ path: file, explanation: 'removing c3spec markers' });
  }

  return updates;
}

/**
 * Generates a detection summary message for display before cleanup.
 * Groups files by action type: removals, updates, and manual migration.
 *
 * @param detection - Detection result from detectLegacyArtifacts
 * @returns Formatted summary string showing what was found
 */
export function formatDetectionSummary(detection: LegacyDetectionResult): string {
  const lines: string[] = [];

  const removals = buildRemovalsList(detection);
  const updates = buildUpdatesList(detection);

  // If nothing to show, return empty
  if (removals.length === 0 && updates.length === 0 && !detection.hasProjectMd) {
    return '';
  }

  // Header - welcoming upgrade message
  lines.push(chalk.bold('Upgrading to the new C3Spec'));
  lines.push('');
  lines.push('c3spec now uses agent skills, the emerging standard across coding');
  lines.push('agents. This simplifies your setup while keeping everything working');
  lines.push('as before.');
  lines.push('');

  // Section 1: Files to remove (no user content to preserve)
  if (removals.length > 0) {
    lines.push(chalk.bold('Files to remove'));
    lines.push(chalk.dim('No user content to preserve:'));
    for (const { path } of removals) {
      lines.push(`  • ${path}`);
    }
  }

  // Section 2: Files to update (markers removed, content preserved)
  if (updates.length > 0) {
    if (removals.length > 0) lines.push('');
    lines.push(chalk.bold('Files to update'));
    lines.push(chalk.dim('c3spec markers will be removed, your content preserved:'));
    for (const { path } of updates) {
      lines.push(`  • ${path}`);
    }
  }

  // Section 3: Manual migration (project.md)
  if (detection.hasProjectMd) {
    if (removals.length > 0 || updates.length > 0) lines.push('');
    lines.push(formatProjectMdMigrationHint());
  }

  return lines.join('\n');
}

/**
 * Extract tool IDs from detected legacy artifacts.
 * Uses LEGACY_SLASH_COMMAND_PATHS to map paths back to tool IDs.
 *
 * @param detection - Detection result from detectLegacyArtifacts
 * @returns Array of tool IDs that had legacy artifacts
 */
export function getToolsFromLegacyArtifacts(detection: LegacyDetectionResult): string[] {
  const tools = new Set<string>();

  // Match directories to tool IDs
  for (const dir of detection.slashCommandDirs) {
    for (const [toolId, pattern] of Object.entries(LEGACY_SLASH_COMMAND_PATHS)) {
      if (pattern.type === 'directory' && pattern.path === dir) {
        tools.add(toolId);
        break;
      }
    }
  }

  // Match files to tool IDs using glob patterns
  for (const file of detection.slashCommandFiles) {
    // Normalize file path to use forward slashes for consistent matching (Windows compatibility)
    const normalizedFile = file.replace(/\\/g, '/');
    for (const [toolId, pattern] of Object.entries(LEGACY_SLASH_COMMAND_PATHS)) {
      if (pattern.type === 'files' && pattern.pattern) {
        // Convert glob pattern to regex for matching
        // e.g., '.cursor/commands/c3spec-*.md' -> /^\.cursor\/commands\/c3spec-.*\.md$/
        const patterns = Array.isArray(pattern.pattern) ? pattern.pattern : [pattern.pattern];
        let matched = false;
        for (const p of patterns) {
          const regexPattern = p
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except *
            .replace(/\*/g, '.*'); // Replace * with .*
          const regex = new RegExp(`^${regexPattern}$`);
          if (regex.test(normalizedFile)) {
            tools.add(toolId);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
  }

  return Array.from(tools);
}

/**
 * Generates a migration hint message for project.md.
 * This is shown when project.md exists and needs manual migration to config.yaml.
 *
 * @returns Formatted migration hint string for console output
 */
export function formatProjectMdMigrationHint(): string {
  const lines: string[] = [];
  lines.push(chalk.yellow.bold('Needs your attention'));
  lines.push('  • c3spec/project.md');
  lines.push(chalk.dim('    We won\'t delete this file. It may contain useful project context.'));
  lines.push('');
  lines.push(chalk.dim('    The new c3spec/config.yaml has a "context:" section for planning'));
  lines.push(chalk.dim('    context. This is included in every C3Spec request and works more'));
  lines.push(chalk.dim('    reliably than the old project.md approach.'));
  lines.push('');
  lines.push(chalk.dim('    Review project.md, move any useful content to config.yaml\'s context'));
  lines.push(chalk.dim('    section, then delete the file when ready.'));
  return lines.join('\n');
}
