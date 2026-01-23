import { ProfileType } from './types';
interface ClaudeSettings {
    permissions?: {
        allow?: string[];
        deny?: string[];
    };
    [key: string]: unknown;
}
export declare class SettingsMerger {
    private targetPath;
    private log;
    constructor(targetPath: string, verbose?: boolean);
    /**
     * Merge Claude Workflow Engine settings into existing settings.local.json
     * Non-destructive: preserves existing permissions
     */
    merge(profile: ProfileType, options?: {
        includeDevOps?: boolean;
        includeSecurity?: boolean;
        dryRun?: boolean;
    }): {
        merged: ClaudeSettings;
        addedPermissions: string[];
        existingPermissions: string[];
        filePath: string;
    };
    /**
     * Generate a fresh settings.local.json for a given profile
     */
    generate(profile: ProfileType, options?: {
        includeDevOps?: boolean;
        includeSecurity?: boolean;
    }): ClaudeSettings;
    /**
     * Validate existing settings for Claude Workflow Engine compatibility
     */
    validateExisting(): {
        valid: boolean;
        missingPermissions: string[];
        extraPermissions: string[];
    };
    /**
     * Load existing settings or return empty structure
     */
    private loadExistingSettings;
}
export {};
//# sourceMappingURL=settings-merger.d.ts.map