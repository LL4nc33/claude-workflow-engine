import { InstallationState, InstallMode, InstallScope, ProfileType } from './types';
export declare class StateManager {
    private targetPath;
    private statePath;
    private backupDir;
    private log;
    constructor(targetPath: string, verbose?: boolean);
    /**
     * Get current installation state
     */
    getState(): InstallationState | null;
    /**
     * Check if Claude Workflow Engine is installed
     */
    isInstalled(): boolean;
    /**
     * Get installed version
     */
    getVersion(): string | null;
    /**
     * Initialize installation state after fresh install
     */
    initialize(options: {
        mode: InstallMode;
        scope: InstallScope;
        profile: ProfileType;
        filesInstalled: string[];
    }): InstallationState;
    /**
     * Update the backup path in state
     */
    updateBackupPath(backupPath: string): void;
    /**
     * Record an update event
     */
    recordUpdate(filesChanged: string[], success: boolean, error?: string): void;
    /**
     * Create a backup before modification
     * Returns backup path or null on failure
     */
    createBackup(): string | null;
    /**
     * Rollback to last backup
     */
    rollback(): {
        success: boolean;
        message: string;
    };
    /**
     * Check integrity of installed files (detect drift)
     */
    checkIntegrity(): {
        intact: string[];
        modified: string[];
        missing: string[];
    };
    /**
     * List available backups
     */
    listBackups(): string[];
    /**
     * Clean old backups, keep only N most recent
     */
    cleanBackups(keep?: number): number;
    /**
     * Save state to disk
     */
    private saveState;
}
//# sourceMappingURL=state-manager.d.ts.map