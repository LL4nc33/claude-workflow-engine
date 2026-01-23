// =============================================================================
// Claude Workflow Engine CLI - State Manager
// Tracks installation state, versioning, and rollback support
// =============================================================================

import * as path from 'path';
import {
  InstallationState,
  InstallationEvent,
  InstallMode,
  InstallScope,
  ProfileType,
} from './types';
import {
  pathExists,
  readFileSafe,
  writeFileSafe,
  fileChecksum,
  createBackup,
  listFilesRecursive,
} from './fs-utils';
import { Logger } from './logger';

const STATE_FILE = '.installation-state.json';
const BACKUP_DIR = '.workflow-backups';
const CURRENT_VERSION = '0.1.0';

export class StateManager {
  private targetPath: string;
  private statePath: string;
  private backupDir: string;
  private log: Logger;

  constructor(targetPath: string, verbose = false) {
    this.targetPath = path.resolve(targetPath);
    this.statePath = path.join(this.targetPath, STATE_FILE);
    this.backupDir = path.join(this.targetPath, BACKUP_DIR);
    this.log = new Logger(verbose);
  }

  /**
   * Get current installation state
   */
  getState(): InstallationState | null {
    if (!pathExists(this.statePath)) return null;

    const content = readFileSafe(this.statePath);
    if (!content) return null;

    try {
      return JSON.parse(content) as InstallationState;
    } catch {
      this.log.warn('Corrupted installation state file');
      return null;
    }
  }

  /**
   * Check if Claude Workflow Engine is installed
   */
  isInstalled(): boolean {
    return this.getState() !== null;
  }

  /**
   * Get installed version
   */
  getVersion(): string | null {
    const state = this.getState();
    return state?.version || null;
  }

  /**
   * Initialize installation state after fresh install
   */
  initialize(options: {
    mode: InstallMode;
    scope: InstallScope;
    profile: ProfileType;
    filesInstalled: string[];
  }): InstallationState {
    const now = new Date().toISOString();
    const checksumMap: Record<string, string> = {};

    // Calculate checksums for all installed files
    for (const file of options.filesInstalled) {
      const fullPath = path.join(this.targetPath, file);
      const checksum = fileChecksum(fullPath);
      if (checksum) {
        checksumMap[file] = checksum;
      }
    }

    const state: InstallationState = {
      version: CURRENT_VERSION,
      installedAt: now,
      updatedAt: now,
      mode: options.mode,
      scope: options.scope,
      profile: options.profile,
      path: this.targetPath,
      filesInstalled: options.filesInstalled,
      checksumMap,
      history: [{
        timestamp: now,
        action: 'install',
        version: CURRENT_VERSION,
        filesChanged: options.filesInstalled,
        success: true,
      }],
    };

    this.saveState(state);
    return state;
  }

  /**
   * Update the backup path in state
   */
  updateBackupPath(backupPath: string): void {
    const state = this.getState();
    if (!state) return;
    state.backupPath = backupPath;
    this.saveState(state);
  }

  /**
   * Record an update event
   */
  recordUpdate(filesChanged: string[], success: boolean, error?: string): void {
    const state = this.getState();
    if (!state) return;

    const now = new Date().toISOString();
    state.updatedAt = now;

    // Update checksums for changed files
    for (const file of filesChanged) {
      const fullPath = path.join(this.targetPath, file);
      const checksum = fileChecksum(fullPath);
      if (checksum) {
        state.checksumMap[file] = checksum;
      }
    }

    state.history.push({
      timestamp: now,
      action: 'update',
      version: CURRENT_VERSION,
      filesChanged,
      success,
      error,
    });

    this.saveState(state);
  }

  /**
   * Create a backup before modification
   * Returns backup path or null on failure
   */
  createBackup(): string | null {
    const workflowDir = path.join(this.targetPath, 'workflow');
    const claudeDir = path.join(this.targetPath, '.claude');
    const backups: string[] = [];

    if (pathExists(workflowDir)) {
      const backup = createBackup(workflowDir, this.backupDir);
      if (backup) backups.push(backup);
    }

    if (pathExists(claudeDir)) {
      const backup = createBackup(claudeDir, this.backupDir);
      if (backup) backups.push(backup);
    }

    if (backups.length === 0) return null;

    // Record backup path in state
    const state = this.getState();
    if (state) {
      state.backupPath = this.backupDir;
      this.saveState(state);
    }

    this.log.debug(`Backup created at: ${this.backupDir}`);
    return this.backupDir;
  }

  /**
   * Rollback to last backup
   */
  rollback(): { success: boolean; message: string } {
    const state = this.getState();
    if (!state || !state.backupPath) {
      return { success: false, message: 'No backup available for rollback' };
    }

    if (!pathExists(state.backupPath)) {
      return { success: false, message: `Backup path not found: ${state.backupPath}` };
    }

    try {
      const fs = require('fs');
      const backupEntries = fs.readdirSync(state.backupPath) as string[];

      for (const entry of backupEntries) {
        const backupPath = path.join(state.backupPath, entry);
        // Determine original location from backup name
        const originalName = entry.replace(/\.backup-.*$/, '');
        const targetDir = path.join(this.targetPath, originalName);

        // Remove current version
        if (pathExists(targetDir)) {
          fs.rmSync(targetDir, { recursive: true });
        }

        // Restore backup
        const { copyDirRecursive } = require('./fs-utils');
        const stat = fs.statSync(backupPath);
        if (stat.isDirectory()) {
          copyDirRecursive(backupPath, targetDir);
        } else {
          fs.copyFileSync(backupPath, targetDir);
        }
      }

      // Record rollback in history
      const now = new Date().toISOString();
      state.history.push({
        timestamp: now,
        action: 'rollback',
        version: state.version,
        filesChanged: state.filesInstalled,
        success: true,
      });
      state.updatedAt = now;
      this.saveState(state);

      return { success: true, message: 'Rollback completed successfully' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Rollback failed: ${errorMsg}` };
    }
  }

  /**
   * Check integrity of installed files (detect drift)
   */
  checkIntegrity(): {
    intact: string[];
    modified: string[];
    missing: string[];
  } {
    const state = this.getState();
    if (!state) {
      return { intact: [], modified: [], missing: [] };
    }

    const intact: string[] = [];
    const modified: string[] = [];
    const missing: string[] = [];

    for (const [file, expectedHash] of Object.entries(state.checksumMap)) {
      const fullPath = path.join(this.targetPath, file);
      if (!pathExists(fullPath)) {
        missing.push(file);
        continue;
      }

      const currentHash = fileChecksum(fullPath);
      if (currentHash === expectedHash) {
        intact.push(file);
      } else {
        modified.push(file);
      }
    }

    return { intact, modified, missing };
  }

  /**
   * List available backups
   */
  listBackups(): string[] {
    if (!pathExists(this.backupDir)) return [];

    const fs = require('fs');
    try {
      return (fs.readdirSync(this.backupDir) as string[])
        .filter((entry: string) => entry.includes('.backup-'))
        .sort()
        .reverse();
    } catch {
      return [];
    }
  }

  /**
   * Clean old backups, keep only N most recent
   */
  cleanBackups(keep = 3): number {
    const backups = this.listBackups();
    if (backups.length <= keep) return 0;

    const fs = require('fs');
    const toRemove = backups.slice(keep);
    let removed = 0;

    for (const backup of toRemove) {
      try {
        const fullPath = path.join(this.backupDir, backup);
        fs.rmSync(fullPath, { recursive: true });
        removed++;
      } catch {
        // Skip failed removals
      }
    }

    return removed;
  }

  /**
   * Save state to disk
   */
  private saveState(state: InstallationState): void {
    writeFileSafe(this.statePath, JSON.stringify(state, null, 2) + '\n');
  }
}
