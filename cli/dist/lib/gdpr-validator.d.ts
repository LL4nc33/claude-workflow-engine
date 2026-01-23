import { GDPRReport, CheckResult } from './types';
export declare class GDPRValidator {
    private targetPath;
    private log;
    constructor(targetPath: string, verbose?: boolean);
    /**
     * Run full GDPR validation
     */
    validate(): GDPRReport;
    /**
     * Run GDPR checks and return as CheckResults for pre-flight
     */
    runChecks(isPreInstall?: boolean): CheckResult[];
    /**
     * Auto-fix GDPR issues where possible
     */
    autoFix(): {
        fixed: string[];
        manual: string[];
    };
    /**
     * Check .gitignore for required patterns
     */
    private checkGitignore;
    /**
     * Scan standards, specs, and product files for PII
     */
    private scanForPII;
    /**
     * Check that configuration is local-only
     */
    private checkLocalOnlyConfig;
    /**
     * Check for indicators of cloud sync that would violate GDPR
     */
    private checkCloudSync;
    /**
     * Check if one gitignore pattern covers another
     */
    private patternCovers;
    /**
     * Generate human-readable recommendations
     */
    private generateRecommendations;
}
//# sourceMappingURL=gdpr-validator.d.ts.map