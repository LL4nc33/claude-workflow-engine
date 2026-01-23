"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Pre-Flight Checks
// Validates environment before installation proceeds
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
exports.PreFlightChecker = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs_utils_1 = require("./fs-utils");
const conflict_detector_1 = require("./conflict-detector");
const gdpr_validator_1 = require("./gdpr-validator");
const logger_1 = require("./logger");
const MIN_NODE_VERSION = 18;
class PreFlightChecker {
    options;
    log;
    constructor(options) {
        this.options = options;
        this.log = new logger_1.Logger(options.verbose);
    }
    /**
     * Run all pre-flight checks
     */
    run() {
        this.log.header('Claude Workflow Engine Pre-Flight Checks');
        const checks = [];
        // Environment checks
        this.log.section('Environment');
        checks.push(...this.checkEnvironment());
        // Platform checks
        this.log.section('Platform');
        checks.push(...this.checkPlatform());
        // Conflict checks
        this.log.section('Conflicts');
        const templatePath = path.join(__dirname, '..', '..', 'templates', 'base');
        const detector = new conflict_detector_1.ConflictDetector(this.options.path, templatePath, this.options.verbose);
        checks.push(...detector.runChecks());
        // GDPR checks (pre-install mode: auto-fixable issues are warnings only)
        this.log.section('DSGVO/GDPR Compliance');
        const gdpr = new gdpr_validator_1.GDPRValidator(this.options.path, this.options.verbose);
        checks.push(...gdpr.runChecks(true));
        // Target path checks
        this.log.section('Target Path');
        checks.push(...this.checkTargetPath());
        // Display results
        for (const check of checks) {
            switch (check.status) {
                case 'pass':
                    this.log.pass(check.message);
                    break;
                case 'fail':
                    this.log.fail(check.message);
                    break;
                case 'warn':
                    this.log.warn(check.message);
                    break;
                case 'skip':
                    this.log.skip(check.message);
                    break;
            }
            if (check.fix && (check.status === 'fail' || check.status === 'warn')) {
                this.log.debug(`  Fix: ${check.fix}`);
            }
        }
        const errors = checks.filter(c => c.status === 'fail').length;
        const warnings = checks.filter(c => c.status === 'warn').length;
        const passed = checks.filter(c => c.status === 'pass').length;
        this.log.summary(passed, warnings, errors);
        return {
            timestamp: new Date().toISOString(),
            platform: process.platform,
            nodeVersion: process.version,
            checks,
            canProceed: errors === 0 || this.options.force,
            warnings,
            errors,
        };
    }
    /**
     * Check Node.js and runtime environment
     */
    checkEnvironment() {
        const results = [];
        // Node version
        const nodeVersion = parseInt(process.version.slice(1));
        if (nodeVersion >= MIN_NODE_VERSION) {
            results.push({
                name: 'node_version',
                status: 'pass',
                severity: 'info',
                message: `Node.js ${process.version} (>= ${MIN_NODE_VERSION} required)`,
            });
        }
        else {
            results.push({
                name: 'node_version',
                status: 'fail',
                severity: 'error',
                message: `Node.js ${process.version} too old (>= ${MIN_NODE_VERSION} required)`,
                fix: 'Update Node.js: https://nodejs.org/',
            });
        }
        // Check for git
        try {
            require('child_process').execSync('git --version', { stdio: 'pipe' });
            results.push({
                name: 'git_available',
                status: 'pass',
                severity: 'info',
                message: 'Git is available',
            });
        }
        catch {
            results.push({
                name: 'git_available',
                status: 'warn',
                severity: 'warning',
                message: 'Git not found - version tracking will be limited',
                fix: 'Install git for full Claude Workflow Engine functionality',
            });
        }
        // Check for Claude Code (optional but recommended)
        results.push(this.checkClaudeCode());
        return results;
    }
    /**
     * Check platform-specific requirements
     */
    checkPlatform() {
        const results = [];
        const platform = process.platform;
        const isWSL = platform === 'linux' && os.release().includes('microsoft');
        results.push({
            name: 'platform',
            status: 'pass',
            severity: 'info',
            message: `Platform: ${platform}${isWSL ? ' (WSL)' : ''} - ${os.arch()}`,
        });
        // WSL-specific checks
        if (isWSL) {
            results.push({
                name: 'wsl_compatibility',
                status: 'pass',
                severity: 'info',
                message: 'WSL detected - using Linux-compatible paths',
            });
            // Check for Windows path issues
            if (this.options.path.includes('\\')) {
                results.push({
                    name: 'path_format',
                    status: 'warn',
                    severity: 'warning',
                    message: 'Windows-style paths detected - normalizing to Unix format',
                    fix: 'Use forward slashes in paths under WSL',
                    autoFixable: true,
                });
            }
        }
        // Check available disk space (basic check)
        try {
            const { execSync } = require('child_process');
            const dfOutput = execSync(`df -BM "${this.options.path}" 2>/dev/null || echo "UNKNOWN"`, {
                encoding: 'utf-8',
            });
            if (!dfOutput.includes('UNKNOWN')) {
                const lines = dfOutput.trim().split('\n');
                if (lines.length > 1) {
                    const parts = lines[1].split(/\s+/);
                    const availMB = parseInt(parts[3]);
                    if (availMB < 50) {
                        results.push({
                            name: 'disk_space',
                            status: 'warn',
                            severity: 'warning',
                            message: `Low disk space: ${availMB}MB available`,
                            fix: 'Free up disk space before installation',
                        });
                    }
                    else {
                        results.push({
                            name: 'disk_space',
                            status: 'pass',
                            severity: 'info',
                            message: `Disk space: ${availMB}MB available`,
                        });
                    }
                }
            }
        }
        catch {
            // Skip disk space check if df is not available
        }
        return results;
    }
    /**
     * Check Claude Code availability
     */
    checkClaudeCode() {
        try {
            const { execSync } = require('child_process');
            execSync('which claude 2>/dev/null || where claude 2>nul', { stdio: 'pipe' });
            return {
                name: 'claude_code',
                status: 'pass',
                severity: 'info',
                message: 'Claude Code CLI detected',
            };
        }
        catch {
            return {
                name: 'claude_code',
                status: 'warn',
                severity: 'warning',
                message: 'Claude Code CLI not found in PATH',
                fix: 'Install Claude Code: https://claude.ai/claude-code',
            };
        }
    }
    /**
     * Validate target installation path
     */
    checkTargetPath() {
        const results = [];
        const targetPath = path.resolve(this.options.path);
        // Check path exists
        if (!(0, fs_utils_1.pathExists)(targetPath)) {
            results.push({
                name: 'target_exists',
                status: this.options.scope === 'local' ? 'fail' : 'warn',
                severity: this.options.scope === 'local' ? 'error' : 'warning',
                message: `Target path does not exist: ${targetPath}`,
                fix: `Create directory: mkdir -p "${targetPath}"`,
                autoFixable: true,
            });
            return results;
        }
        if (!(0, fs_utils_1.isDirectory)(targetPath)) {
            results.push({
                name: 'target_is_dir',
                status: 'fail',
                severity: 'error',
                message: `Target is not a directory: ${targetPath}`,
            });
            return results;
        }
        results.push({
            name: 'target_path',
            status: 'pass',
            severity: 'info',
            message: `Target: ${targetPath}`,
        });
        // Check if it's a git repository
        const gitDir = path.join(targetPath, '.git');
        if ((0, fs_utils_1.pathExists)(gitDir)) {
            results.push({
                name: 'git_repo',
                status: 'pass',
                severity: 'info',
                message: 'Target is a git repository',
            });
        }
        else {
            results.push({
                name: 'git_repo',
                status: 'warn',
                severity: 'warning',
                message: 'Target is not a git repository - version tracking will be limited',
                fix: `Initialize git: cd "${targetPath}" && git init`,
            });
        }
        return results;
    }
}
exports.PreFlightChecker = PreFlightChecker;
//# sourceMappingURL=preflight.js.map