// =============================================================================
// Claude Workflow Engine CLI - Install Command
// Safely installs Claude Workflow Engine into a target project
// =============================================================================

import * as path from 'path';
import * as fs from 'fs';
import {
  InstallOptions,
  InstallMode,
  InstallScope,
  ProfileType,
} from '../lib/types';
import { PreFlightChecker } from '../lib/preflight';
import { StateManager } from '../lib/state-manager';
import { SettingsMerger } from '../lib/settings-merger';
import { GDPRValidator } from '../lib/gdpr-validator';
import { Logger } from '../lib/logger';
import {
  pathExists,
  writeFileSafe,
  copyDirRecursive,
  normalizePath,
  listFilesRecursive,
} from '../lib/fs-utils';

export async function installCommand(args: string[]): Promise<void> {
  const options = parseInstallArgs(args);
  const log = new Logger(options.verbose);

  log.header('Claude Workflow Engine Installation');
  log.table([
    ['Scope', options.scope],
    ['Mode', options.mode],
    ['Profile', options.profile],
    ['Path', options.path],
    ['Dry Run', options.dryRun ? 'Yes' : 'No'],
    ['Force', options.force ? 'Yes' : 'No'],
  ]);
  log.newline();

  // --- Phase 1: Pre-Flight Checks ---
  const preflight = new PreFlightChecker(options);
  const report = preflight.run();

  if (!report.canProceed) {
    log.error(
      'Pre-flight checks failed. Installation cannot proceed.',
      'Fix the errors above or use --force to override warnings.'
    );
    process.exit(1);
  }

  if (report.warnings > 0 && !options.force) {
    log.warn(`${report.warnings} warnings detected. Use --force to proceed anyway.`);
    if (!options.dryRun) {
      log.info('Proceeding with warnings...');
    }
  }

  // --- Phase 2: Backup ---
  let backupPath: string | null = null;
  if (!options.dryRun) {
    log.section('Backup');
    const stateManager = new StateManager(options.path, options.verbose);

    if (stateManager.isInstalled()) {
      log.step('Creating backup of existing installation...');
      backupPath = stateManager.createBackup();
      if (backupPath) {
        log.pass(`Backup created: ${backupPath}`);
      } else {
        log.warn('No existing files to backup');
      }
    }
  }

  // --- Phase 3: Installation ---
  log.section('Installation');

  if (options.dryRun) {
    log.info('DRY RUN - No files will be modified');
    log.newline();
    dryRunInstall(options, log);
    return;
  }

  const installedFiles = performInstallation(options, log);

  // --- Phase 4: Settings Merge ---
  log.section('Settings Configuration');
  const merger = new SettingsMerger(options.path, options.verbose);
  const mergeResult = merger.merge(options.profile, {
    includeDevOps: true,
    includeSecurity: true,
    dryRun: options.dryRun,
  });

  if (mergeResult.addedPermissions.length > 0) {
    log.pass(`Added ${mergeResult.addedPermissions.length} new permissions`);
    if (options.verbose) {
      for (const perm of mergeResult.addedPermissions) {
        log.debug(`  + ${perm}`);
      }
    }
  }
  if (mergeResult.existingPermissions.length > 0) {
    log.info(`${mergeResult.existingPermissions.length} permissions already present`);
  }

  // --- Phase 5: GDPR Auto-Fix ---
  log.section('DSGVO/GDPR Configuration');
  const gdpr = new GDPRValidator(options.path, options.verbose);
  const gdprFix = gdpr.autoFix();

  if (gdprFix.fixed.length > 0) {
    for (const fix of gdprFix.fixed) {
      log.pass(fix);
    }
  }
  if (gdprFix.manual.length > 0) {
    for (const manual of gdprFix.manual) {
      log.warn(`Manual review needed: ${manual}`);
    }
  }

  // --- Phase 6: State Initialization ---
  log.section('Finalizing');
  const finalStateManager = new StateManager(options.path, options.verbose);
  const newState = finalStateManager.initialize({
    mode: options.mode,
    scope: options.scope,
    profile: options.profile,
    filesInstalled: installedFiles,
  });
  // Preserve backup path reference for rollback
  if (backupPath) {
    newState.backupPath = backupPath;
    finalStateManager.updateBackupPath(backupPath);
  }
  log.pass('Installation state saved');

  // --- Summary ---
  log.newline();
  log.done('Claude Workflow Engine installation complete!');
  log.newline();
  log.box([
    'Next steps:',
    '',
    '  1. Review .claude/settings.local.json',
    '  2. Customize workflow/config.yml for your project',
    '  3. Run: workflow health --verbose',
    '  4. Start with: /plan-product',
    '',
    'GDPR Note: Sensitive data stays local-only.',
    'Run "workflow check --gdpr" to verify compliance.',
  ]);
  log.newline();
}

/**
 * Perform the actual installation
 */
function performInstallation(options: InstallOptions, log: Logger): string[] {
  const templateBase = path.join(__dirname, '..', '..', 'templates', 'base');
  const profileDir = path.join(__dirname, '..', '..', 'templates', 'profiles', options.profile);
  const targetPath = path.resolve(options.path);
  const installedFiles: string[] = [];

  // Create core directory structure
  const dirs = [
    'workflow',
    'workflow/standards',
    'workflow/standards/global',
    'workflow/product',
    'workflow/specs',
    '.claude',
    '.claude/agents',
    '.claude/commands/workflow',
    '.claude/skills/workflow',
  ];

  for (const dir of dirs) {
    const fullDir = path.join(targetPath, dir);
    if (!pathExists(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
      log.step(`Created: ${dir}/`);
    }
  }

  // Copy base templates (skip meta-files like .gitignore-add)
  const skipFiles = new Set(['.gitignore-add']);
  if (pathExists(templateBase)) {
    const templateFiles = listFilesRecursive(templateBase, templateBase);
    for (const file of templateFiles) {
      if (skipFiles.has(path.basename(file))) continue;
      const src = path.join(templateBase, file);
      const dest = path.join(targetPath, file);
      const destDir = path.dirname(dest);

      if (!pathExists(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(src, dest);
      installedFiles.push(file);
      log.step(`Installed: ${file}`);
    }
  }

  // Apply profile-specific templates
  if (options.profile !== 'default' && pathExists(profileDir)) {
    const profileFiles = listFilesRecursive(profileDir, profileDir);
    for (const file of profileFiles) {
      const src = path.join(profileDir, file);
      const dest = path.join(targetPath, file);
      const destDir = path.dirname(dest);

      if (!pathExists(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(src, dest);
      installedFiles.push(file);
      log.step(`Profile [${options.profile}]: ${file}`);
    }
  }

  // Generate CLAUDE.md if not exists
  const claudeMdPath = path.join(targetPath, '.claude', 'CLAUDE.md');
  if (!pathExists(claudeMdPath)) {
    const claudeMd = generateClaudeMd(options);
    writeFileSafe(claudeMdPath, claudeMd);
    installedFiles.push('.claude/CLAUDE.md');
    log.step('Generated: .claude/CLAUDE.md');
  }

  // Generate config.yml if not exists
  const configPath = path.join(targetPath, 'workflow', 'config.yml');
  if (!pathExists(configPath)) {
    const config = generateConfig(options);
    writeFileSafe(configPath, config);
    installedFiles.push('workflow/config.yml');
    log.step('Generated: workflow/config.yml');
  }

  // Ensure .gitignore has GDPR patterns
  const gitignorePath = path.join(targetPath, '.gitignore');
  ensureGitignore(gitignorePath);
  if (!installedFiles.includes('.gitignore')) {
    installedFiles.push('.gitignore');
  }

  log.newline();
  log.pass(`${installedFiles.length} files installed`);

  return installedFiles;
}

/**
 * Show what would be installed without making changes
 */
function dryRunInstall(options: InstallOptions, log: Logger): void {
  const targetPath = path.resolve(options.path);

  log.info('The following operations would be performed:');
  log.newline();

  const dirs = [
    'workflow/',
    'workflow/standards/',
    'workflow/product/',
    'workflow/specs/',
    '.claude/',
    '.claude/agents/',
    '.claude/commands/workflow/',
    '.claude/skills/workflow/',
  ];

  log.info('Directories to create:');
  for (const dir of dirs) {
    const exists = pathExists(path.join(targetPath, dir));
    log.info(`  ${exists ? '[exists]' : '[create]'} ${dir}`);
  }

  log.newline();
  log.info('Files to generate:');
  log.info('  .claude/CLAUDE.md');
  log.info('  .claude/settings.local.json');
  log.info('  workflow/config.yml');
  log.info('  .gitignore (update)');

  log.newline();
  log.info('Settings merge:');
  const merger = new SettingsMerger(targetPath, options.verbose);
  const mergeResult = merger.merge(options.profile, {
    includeDevOps: true,
    includeSecurity: true,
    dryRun: true,
  });
  log.info(`  ${mergeResult.addedPermissions.length} permissions to add`);
  log.info(`  ${mergeResult.existingPermissions.length} permissions already present`);

  log.newline();
  log.done('Dry run complete. Use without --dry-run to install.');
}

/**
 * Generate CLAUDE.md content based on options
 */
function generateClaudeMd(options: InstallOptions): string {
  return `# Claude Workflow Engine - Multi-Agent System

## System Overview

This project uses Claude Workflow Engine for AI-assisted development with specialized agents.

## Agent Hierarchy

\`\`\`
                    +------------------+
                    |   orchestrator   |  (Task Delegation)
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |         |         |         |         |
    +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
    |architect| |  debug | |devops  | |security| |researcher|
    +---------+ +--------+ +--------+ +--------+ +----------+
         |
    +----+---+
    |  ask   |  (Explanations)
    +---------+
\`\`\`

## Workflow

\`\`\`
/plan-product --> /shape-spec --> /write-spec --> /create-tasks --> /orchestrate-tasks
\`\`\`

## Context Model (3 Layers)

- **Layer 1 - Standards (HOW):** \`workflow/standards/\`
- **Layer 2 - Product (WHAT/WHY):** \`workflow/product/\`
- **Layer 3 - Specs (WHAT NEXT):** \`workflow/specs/\`

## GDPR/EU Compliance

- All data is LOCAL ONLY (no cloud sync)
- EU data residency (eu-central-1)
- No PII in standards or specs
- Sensitive config in \`.local.md\` files (gitignored)

---
*Installed by Claude Workflow Engine CLI v0.1.0 - Profile: ${options.profile}*
`;
}

/**
 * Generate config.yml content based on options
 */
function generateConfig(options: InstallOptions): string {
  return `# =============================================================================
# Claude Workflow Engine Configuration
# Version: 3.0
# GDPR-compliant setup
# =============================================================================

version: 3.0
default_profile: ${options.profile}

claude_code_commands: true
use_claude_code_subagents: true
standards_as_claude_code_skills: true
workflow_commands: false

context_model:
  standards:
    path: workflow/standards/
    auto_inject: false
    domains:
      - global

  product:
    path: workflow/product/
    files:
      - mission.md
      - roadmap.md
      - architecture.md

  specs:
    path: workflow/specs/
    naming_convention: "{timestamp}-{feature-name}/"

agents:
  directory: .claude/agents/

gdpr:
  enabled: true
  data_residency: eu-central-1
  local_only: true
  sensitive_data:
    pii_in_standards: forbidden
    pii_in_specs: forbidden
    local_files_only: true
    gitignored_patterns:
      - "CLAUDE.local.md"
      - "*.local.md"
      - ".env*"
      - "credentials.*"
      - "secrets.*"
`;
}

/**
 * Ensure .gitignore has required GDPR patterns
 */
function ensureGitignore(gitignorePath: string): void {
  let content = '';
  if (pathExists(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const requiredPatterns = [
    '# Claude Workflow Engine - GDPR/Security',
    'CLAUDE.local.md',
    '*.local.md',
    '.env',
    '.env.*',
    '.env.local',
    'credentials.*',
    'secrets.*',
    '.installation-state.json',
    '.workflow-backups/',
  ];

  const missingPatterns = requiredPatterns.filter(p => !content.includes(p));
  if (missingPatterns.length > 0) {
    if (content && !content.endsWith('\n')) content += '\n';
    content += '\n' + missingPatterns.join('\n') + '\n';
    writeFileSafe(gitignorePath, content);
  }
}

/**
 * Parse command-line arguments for install command
 */
function parseInstallArgs(args: string[]): InstallOptions {
  const options: InstallOptions = {
    scope: 'local',
    mode: 'integrated',
    profile: 'default',
    path: process.cwd(),
    dryRun: false,
    force: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--global':
        options.scope = 'global';
        break;
      case '--local':
        options.scope = 'local';
        break;
      case '--mode':
        options.mode = (args[++i] as InstallMode) || 'integrated';
        break;
      case '--profile':
        options.profile = (args[++i] as ProfileType) || 'default';
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      default:
        // Positional argument = path
        if (!arg.startsWith('-')) {
          options.path = path.resolve(arg);
        }
        break;
    }
  }

  return options;
}
