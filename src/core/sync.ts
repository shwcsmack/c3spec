/**
 * Sync Command
 *
 * Regenerates runtime artifacts from local canonical `.agents/` content.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { FileSystemUtils } from '../utils/file-system.js';
import { C3SPEC_DIR_NAME } from './config.js';
import {
  applyHostGenerationPipeline,
  formatHostGenerationSummary,
  getHostConfiguredTools,
} from './host-generation/apply.js';
import type { SupportedHostId } from './host-generation/types.js';

export interface SyncCommandOptions {
  force?: boolean;
}

export class SyncCommand {
  private readonly force: boolean;

  constructor(options: SyncCommandOptions = {}) {
    this.force = options.force ?? false;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const c3specPath = path.join(resolvedProjectPath, C3SPEC_DIR_NAME);

    if (!(await FileSystemUtils.directoryExists(c3specPath))) {
      throw new Error(`No C3Spec directory found. Ensure c3spec package scaffolding exists in this project.`);
    }

    const hostIds = getHostConfiguredTools(resolvedProjectPath);
    if (hostIds.length === 0) {
      console.log(chalk.yellow('No configured runtime found.'));
      console.log(chalk.dim('Ensure pi has c3spec package resources loaded for this project.'));
      return;
    }

    console.log(
      `Syncing runtime artifacts from ${chalk.cyan('.agents/')} for: ${hostIds.join(', ')}`
    );
    console.log(chalk.dim('Canonical content is sourced from installed package resources.'));
    console.log();

    const spinner = ora('Regenerating runtime artifacts...').start();

    const summary = await applyHostGenerationPipeline(resolvedProjectPath, hostIds, {
      force: this.force,
      refreshCanonical: false,
    });

    if (summary.validationErrors.length > 0) {
      spinner.fail('Canonical validation failed');
      for (const error of summary.validationErrors) {
        console.log(chalk.red(`  ${error.path}: ${error.message}`));
      }
      throw new Error('Fix canonical `.agents/` artifacts before syncing.');
    }

    spinner.succeed('Runtime artifacts synced');

    console.log();
    for (const line of formatHostGenerationSummary(hostIds, summary)) {
      console.log(line);
    }

    if (summary.canonical.driftWarnings.length > 0) {
      console.log();
      console.log(chalk.yellow('Canonical files with local edits were left unchanged.'));
    }

    if (summary.hosts.driftWarnings.length > 0) {
      console.log();
      console.log(
        chalk.yellow(
          `${summary.hosts.driftWarnings.length} generated file(s) appear hand-edited and were skipped.`
        )
      );
      console.log(chalk.dim('Use --force to overwrite generated runtime artifacts.'));
    }

    console.log();
    console.log(chalk.dim('Restart pi/your IDE if runtime artifacts changed.'));
  }
}
