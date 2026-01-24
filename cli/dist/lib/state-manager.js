"use strict";
// =============================================================================
// Claude Workflow Engine CLI - State Manager
// Tracks installation state, versioning, and rollback support
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const path = __importStar(require("path"));
const fs_utils_1 = require("./fs-utils");
const logger_1 = require("./logger");
const STATE_FILE = '.installation-state.json';
const BACKUP_DIR = '.workflow-backups';
const CURRENT_VERSION = '0.2.0';
class StateManager {
    targetPath;
    statePath;
    backupDir;
    log;
    constructor(targetPath, verbose = false) {
        this.targetPath = path.resolve(targetPath);
        this.statePath = path.join(this.targetPath, STATE_FILE);
        this.backupDir = path.join(this.targetPath, BACKUP_DIR);
        this.log = new logger_1.Logger(verbose);
    }
    /**
     * Get current installation state
     */
    getState() {
        if (!(0, fs_utils_1.pathExists)(this.statePath))
            return null;
        const content = (0, fs_utils_1.readFileSafe)(this.statePath);
        if (!content)
            return null;
        try {
            return JSON.parse(content);
        }
        catch {
            this.log.warn('Corrupted installation state file');
            return null;
        }
    }
    /**
     * Check if Claude Workflow Engine is installed
     */
    isInstalled() {
        return this.getState() !== null;
    }
    /**
     * Get installed version
     */
    getVersion() {
        const state = this.getState();
        return state?.version || null;
    }
    /**
     * Initialize installation state after fresh install
     */
    initialize(options) {
        const now = new Date().toISOString();
        const checksumMap = {};
        // Calculate checksums for all installed files
        for (const file of options.filesInstalled) {
            const fullPath = path.join(this.targetPath, file);
            const checksum = (0, fs_utils_1.fileChecksum)(fullPath);
            if (checksum) {
                checksumMap[file] = checksum;
            }
        }
        const state = {
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
    updateBackupPath(backupPath) {
        const state = this.getState();
        if (!state)
            return;
        state.backupPath = backupPath;
        this.saveState(state);
    }
    /**
     * Record an update event
     */
    recordUpdate(filesChanged, success, error) {
        const state = this.getState();
        if (!state)
            return;
        const now = new Date().toISOString();
        state.updatedAt = now;
        // Update checksums for changed files
        for (const file of filesChanged) {
            const fullPath = path.join(this.targetPath, file);
            const checksum = (0, fs_utils_1.fileChecksum)(fullPath);
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
    createBackup() {
        const workflowDir = path.join(this.targetPath, 'workflow');
        const claudeDir = path.join(this.targetPath, '.claude');
        const backups = [];
        if ((0, fs_utils_1.pathExists)(workflowDir)) {
            const backup = (0, fs_utils_1.createBackup)(workflowDir, this.backupDir);
            if (backup)
                backups.push(backup);
        }
        if ((0, fs_utils_1.pathExists)(claudeDir)) {
            const backup = (0, fs_utils_1.createBackup)(claudeDir, this.backupDir);
            if (backup)
                backups.push(backup);
        }
        if (backups.length === 0)
            return null;
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
    rollback() {
        const state = this.getState();
        if (!state || !state.backupPath) {
            return { success: false, message: 'No backup available for rollback' };
        }
        if (!(0, fs_utils_1.pathExists)(state.backupPath)) {
            return { success: false, message: `Backup path not found: ${state.backupPath}` };
        }
        try {
            const fs = require('fs');
            const backupEntries = fs.readdirSync(state.backupPath);
            for (const entry of backupEntries) {
                const backupPath = path.join(state.backupPath, entry);
                // Determine original location from backup name
                const originalName = entry.replace(/\.backup-.*$/, '');
                const targetDir = path.join(this.targetPath, originalName);
                // Remove current version
                if ((0, fs_utils_1.pathExists)(targetDir)) {
                    fs.rmSync(targetDir, { recursive: true });
                }
                // Restore backup
                const { copyDirRecursive } = require('./fs-utils');
                const stat = fs.statSync(backupPath);
                if (stat.isDirectory()) {
                    copyDirRecursive(backupPath, targetDir);
                }
                else {
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
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            return { success: false, message: `Rollback failed: ${errorMsg}` };
        }
    }
    /**
     * Check integrity of installed files (detect drift)
     */
    checkIntegrity() {
        const state = this.getState();
        if (!state) {
            return { intact: [], modified: [], missing: [] };
        }
        const intact = [];
        const modified = [];
        const missing = [];
        for (const [file, expectedHash] of Object.entries(state.checksumMap)) {
            const fullPath = path.join(this.targetPath, file);
            if (!(0, fs_utils_1.pathExists)(fullPath)) {
                missing.push(file);
                continue;
            }
            const currentHash = (0, fs_utils_1.fileChecksum)(fullPath);
            if (currentHash === expectedHash) {
                intact.push(file);
            }
            else {
                modified.push(file);
            }
        }
        return { intact, modified, missing };
    }
    /**
     * List available backups
     */
    listBackups() {
        if (!(0, fs_utils_1.pathExists)(this.backupDir))
            return [];
        const fs = require('fs');
        try {
            return fs.readdirSync(this.backupDir)
                .filter((entry) => entry.includes('.backup-'))
                .sort()
                .reverse();
        }
        catch {
            return [];
        }
    }
    /**
     * Clean old backups, keep only N most recent
     */
    cleanBackups(keep = 3) {
        const backups = this.listBackups();
        if (backups.length <= keep)
            return 0;
        const fs = require('fs');
        const toRemove = backups.slice(keep);
        let removed = 0;
        for (const backup of toRemove) {
            try {
                const fullPath = path.join(this.backupDir, backup);
                fs.rmSync(fullPath, { recursive: true });
                removed++;
            }
            catch {
                // Skip failed removals
            }
        }
        return removed;
    }
    /**
     * Save state to disk
     */
    saveState(state) {
        (0, fs_utils_1.writeFileSafe)(this.statePath, JSON.stringify(state, null, 2) + '\n');
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=state-manager.js.map