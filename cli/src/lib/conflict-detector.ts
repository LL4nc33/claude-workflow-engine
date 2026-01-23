// =============================================================================
// Claude Workflow Engine CLI - Conflict Detector
// Detects file, command, and permission conflicts before installation
// =============================================================================

import * as path from 'path';
import {
  ConflictReport,
  FileConflict,
  CommandConflict,
  CheckResult,
} from './types';
import {
  pathExists,
  isFile,
  isDirectory,
  readFileSafe,
  fileChecksum,
  listFilesRecursive,
} from './fs-utils';
import { Logger } from './logger';

// Files that Claude Workflow Engine installation will create or modify
const WORKFLOW_FILES = [
  'workflow/config.yml',
  'workflow/orchestration.yml',
  'workflow/standards/index.yml',
  '.claude/CLAUDE.md',
  '.claude/settings.local.json',
];

// Command namespaces that Claude Workflow Engine uses
const WORKFLOW_COMMANDS = [
  '/plan-product',
  '/shape-spec',
  '/write-spec',
  '/create-tasks',
  '/orchestrate-tasks',
  '/discover-standards',
  '/index-standards',
  '/inject-standards',
];

// Directories that should not have conflicting content
const WORKFLOW_DIRS = [
  '.claude/agents/',
  '.claude/commands/workflow/',
  '.claude/skills/workflow/',
  'workflow/standards/',
  'workflow/product/',
  'workflow/specs/',
];

export class ConflictDetector {
  private targetPath: string;
  private templatePath: string;
  private log: Logger;

  constructor(targetPath: string, templatePath: string, verbose = false) {
    this.targetPath = path.resolve(targetPath);
    this.templatePath = path.resolve(templatePath);
    this.log = new Logger(verbose);
  }

  /**
   * Run full conflict detection
   */
  detect(): ConflictReport {
    const fileConflicts = this.detectFileConflicts();
    const commandConflicts = this.detectCommandConflicts();

    const hasBlockingConflicts =
      fileConflicts.some(c => c.type === 'permission') ||
      commandConflicts.length > 0;

    return {
      fileConflicts,
      commandConflicts,
      hasBlockingConflicts,
    };
  }

  /**
   * Run conflict checks and return as CheckResults for pre-flight
   */
  runChecks(): CheckResult[] {
    const results: CheckResult[] = [];

    // Check for existing Claude Workflow Engine installation
    results.push(this.checkExistingInstallation());

    // Check for file conflicts
    results.push(...this.checkFileConflicts());

    // Check for command namespace conflicts
    results.push(...this.checkCommandConflicts());

    // Check directory permissions
    results.push(...this.checkPermissions());

    return results;
  }

  /**
   * Check if Claude Workflow Engine is already installed
   */
  private checkExistingInstallation(): CheckResult {
    const configPath = path.join(this.targetPath, 'workflow', 'config.yml');

    if (pathExists(configPath)) {
      const content = readFileSafe(configPath);
      const versionMatch = content?.match(/^version:\s*(.+)$/m);
      const version = versionMatch ? versionMatch[1] : 'unknown';

      return {
        name: 'existing_installation',
        status: 'warn',
        severity: 'warning',
        message: `Claude Workflow Engine v${version} already installed at ${this.targetPath}`,
        fix: 'Use --force to overwrite or workflow resolve to merge',
        autoFixable: false,
      };
    }

    return {
      name: 'existing_installation',
      status: 'pass',
      severity: 'info',
      message: 'No existing Claude Workflow Engine installation found',
    };
  }

  /**
   * Detect file-level conflicts
   */
  private detectFileConflicts(): FileConflict[] {
    const conflicts: FileConflict[] = [];

    for (const relPath of WORKFLOW_FILES) {
      const targetFile = path.join(this.targetPath, relPath);
      const templateFile = path.join(this.templatePath, relPath);

      if (!pathExists(targetFile)) continue;

      // File exists - check if it's different from template
      if (pathExists(templateFile)) {
        const targetHash = fileChecksum(targetFile);
        const templateHash = fileChecksum(templateFile);

        if (targetHash !== templateHash) {
          conflicts.push({
            path: relPath,
            type: 'modified',
            currentContent: readFileSafe(targetFile) || undefined,
            proposedContent: readFileSafe(templateFile) || undefined,
          });
        }
      } else {
        conflicts.push({
          path: relPath,
          type: 'exists',
          currentContent: readFileSafe(targetFile) || undefined,
        });
      }
    }

    // Check directory conflicts
    for (const dir of WORKFLOW_DIRS) {
      const targetDir = path.join(this.targetPath, dir);
      if (isDirectory(targetDir)) {
        const existingFiles = listFilesRecursive(targetDir, this.targetPath);
        for (const file of existingFiles) {
          const templateFile = path.join(this.templatePath, file);
          if (pathExists(templateFile)) {
            const targetHash = fileChecksum(path.join(this.targetPath, file));
            const templateHash = fileChecksum(templateFile);
            if (targetHash !== templateHash) {
              conflicts.push({
                path: file,
                type: 'modified',
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect command namespace conflicts
   */
  private detectCommandConflicts(): CommandConflict[] {
    const conflicts: CommandConflict[] = [];
    const commandsDir = path.join(this.targetPath, '.claude', 'commands');

    if (!isDirectory(commandsDir)) return conflicts;

    // Check for commands that might conflict with workflow commands
    const existingCommands = listFilesRecursive(commandsDir, commandsDir);

    for (const cmdFile of existingCommands) {
      const cmdName = '/' + cmdFile.replace(/\.md$/, '').replace(/\\/g, '/');

      // Check against workflow command namespace
      for (const agentCmd of WORKFLOW_COMMANDS) {
        if (cmdName === agentCmd) {
          conflicts.push({
            command: agentCmd,
            existingSource: path.join(commandsDir, cmdFile),
            proposedSource: `workflow command: ${agentCmd}`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate CheckResults for file conflicts
   */
  private checkFileConflicts(): CheckResult[] {
    const results: CheckResult[] = [];
    const conflicts = this.detectFileConflicts();

    if (conflicts.length === 0) {
      results.push({
        name: 'file_conflicts',
        status: 'pass',
        severity: 'info',
        message: 'No file conflicts detected',
      });
    } else {
      for (const conflict of conflicts) {
        results.push({
          name: `file_conflict_${conflict.path}`,
          status: conflict.type === 'permission' ? 'fail' : 'warn',
          severity: conflict.type === 'permission' ? 'error' : 'warning',
          message: `${conflict.type}: ${conflict.path}`,
          fix: conflict.type === 'modified'
            ? `Backup and merge: ${conflict.path}`
            : `Review existing file: ${conflict.path}`,
          autoFixable: conflict.type === 'modified',
        });
      }
    }

    return results;
  }

  /**
   * Generate CheckResults for command conflicts
   */
  private checkCommandConflicts(): CheckResult[] {
    const results: CheckResult[] = [];
    const conflicts = this.detectCommandConflicts();

    if (conflicts.length === 0) {
      results.push({
        name: 'command_conflicts',
        status: 'pass',
        severity: 'info',
        message: 'No command namespace conflicts',
      });
    } else {
      for (const conflict of conflicts) {
        results.push({
          name: `cmd_conflict_${conflict.command}`,
          status: 'fail',
          severity: 'error',
          message: `Command ${conflict.command} already exists at ${conflict.existingSource}`,
          fix: `Rename or remove existing command: ${conflict.existingSource}`,
          autoFixable: false,
        });
      }
    }

    return results;
  }

  /**
   * Check write permissions on target directories
   */
  private checkPermissions(): CheckResult[] {
    const results: CheckResult[] = [];

    // Check target path writability
    try {
      const testFile = path.join(this.targetPath, '.workflow-permission-test');
      const fs = require('fs');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      results.push({
        name: 'write_permission',
        status: 'pass',
        severity: 'info',
        message: `Write access confirmed: ${this.targetPath}`,
      });
    } catch {
      results.push({
        name: 'write_permission',
        status: 'fail',
        severity: 'error',
        message: `No write access to: ${this.targetPath}`,
        fix: 'Check directory permissions or run with appropriate privileges',
        autoFixable: false,
      });
    }

    return results;
  }
}
