import { ConflictReport, CheckResult } from './types';
export declare class ConflictDetector {
    private targetPath;
    private templatePath;
    private log;
    constructor(targetPath: string, templatePath: string, verbose?: boolean);
    /**
     * Run full conflict detection
     */
    detect(): ConflictReport;
    /**
     * Run conflict checks and return as CheckResults for pre-flight
     */
    runChecks(): CheckResult[];
    /**
     * Check if Claude Workflow Engine is already installed
     */
    private checkExistingInstallation;
    /**
     * Detect file-level conflicts
     */
    private detectFileConflicts;
    /**
     * Detect command namespace conflicts
     */
    private detectCommandConflicts;
    /**
     * Generate CheckResults for file conflicts
     */
    private checkFileConflicts;
    /**
     * Generate CheckResults for command conflicts
     */
    private checkCommandConflicts;
    /**
     * Check write permissions on target directories
     */
    private checkPermissions;
}
//# sourceMappingURL=conflict-detector.d.ts.map