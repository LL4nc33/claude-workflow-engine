import { PreFlightReport, InstallOptions } from './types';
export declare class PreFlightChecker {
    private options;
    private log;
    constructor(options: InstallOptions);
    /**
     * Run all pre-flight checks
     */
    run(): PreFlightReport;
    /**
     * Check Node.js and runtime environment
     */
    private checkEnvironment;
    /**
     * Check platform-specific requirements
     */
    private checkPlatform;
    /**
     * Check Claude Code availability
     */
    private checkClaudeCode;
    /**
     * Validate target installation path
     */
    private checkTargetPath;
}
//# sourceMappingURL=preflight.d.ts.map