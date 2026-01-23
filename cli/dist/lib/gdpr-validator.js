"use strict";
// =============================================================================
// Claude Workflow Engine CLI - GDPR Validator
// Ensures DSGVO/GDPR compliance for Claude Workflow Engine installations
// - PII detection in standards/specs
// - Gitignore verification for sensitive files
// - Local-only configuration validation
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
exports.GDPRValidator = void 0;
const path = __importStar(require("path"));
const fs_utils_1 = require("./fs-utils");
const logger_1 = require("./logger");
// Patterns that indicate PII (Personally Identifiable Information)
const PII_PATTERNS = [
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: 'email' },
    { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: 'credit_card' },
    { regex: /\b\d{10,12}\b/, type: 'svnr_or_phone' }, // Austrian SVNr or phone
    { regex: /\b(?:AT)?\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, type: 'iban' },
    { regex: /(?:password|passwd|pwd|secret|api[_-]?key|token|bearer)\s*[=:]\s*['"]?[^\s'"]+/i, type: 'credential' },
    { regex: /\b\d{1,2}\.\d{1,2}\.\d{4}\b/, type: 'date_of_birth' }, // DD.MM.YYYY format
    { regex: /(?:name|vorname|nachname|firstname|lastname)\s*[=:]\s*['"]?[A-Z][a-z]+/i, type: 'person_name' },
];
// Files that MUST be gitignored for GDPR compliance
const REQUIRED_GITIGNORE_PATTERNS = [
    'CLAUDE.local.md',
    '*.local.md',
    '.env',
    '.env.*',
    '.env.local',
    'credentials.*',
    'secrets.*',
    '.installation-state.json',
    '*.backup-*',
];
// Directories to scan for PII
const SCAN_DIRS = [
    'workflow/standards/',
    'workflow/product/',
    'workflow/specs/',
    '.claude/agents/',
    '.claude/commands/',
];
// Files to skip during PII scanning
const SKIP_PATTERNS = [
    /node_modules/,
    /\.git\//,
    /dist\//,
    /\.backup-/,
    /\.installation-state\.json/,
];
class GDPRValidator {
    targetPath;
    log;
    constructor(targetPath, verbose = false) {
        this.targetPath = path.resolve(targetPath);
        this.log = new logger_1.Logger(verbose);
    }
    /**
     * Run full GDPR validation
     */
    validate() {
        const issues = [];
        // Check gitignore
        issues.push(...this.checkGitignore());
        // Scan for PII
        issues.push(...this.scanForPII());
        // Check local-only config
        issues.push(...this.checkLocalOnlyConfig());
        // Check cloud sync indicators
        issues.push(...this.checkCloudSync());
        const compliant = !issues.some(i => i.severity === 'error');
        const recommendations = this.generateRecommendations(issues);
        return {
            compliant,
            issues,
            recommendations,
        };
    }
    /**
     * Run GDPR checks and return as CheckResults for pre-flight
     */
    runChecks(isPreInstall = false) {
        const results = [];
        const report = this.validate();
        // During pre-install, auto-fixable issues are warnings, not errors
        const effectiveIssues = isPreInstall
            ? report.issues.filter(i => i.type !== 'not_gitignored' && i.type !== 'missing_local_config')
            : report.issues;
        const effectiveCompliant = isPreInstall
            ? !effectiveIssues.some(i => i.severity === 'error')
            : report.compliant;
        // Overall compliance status
        results.push({
            name: 'gdpr_compliance',
            status: effectiveCompliant ? 'pass' : 'fail',
            severity: effectiveCompliant ? 'info' : 'error',
            message: effectiveCompliant
                ? 'DSGVO/GDPR compliance checks passed'
                : `DSGVO/GDPR compliance issues found: ${report.issues.length}`,
        });
        // Individual issues as checks
        for (const issue of report.issues) {
            // Auto-fixable issues during install are just warnings
            const isAutoFixable = issue.type === 'not_gitignored' || issue.type === 'missing_local_config';
            const effectiveStatus = (isPreInstall && isAutoFixable) ? 'warn' : (issue.severity === 'error' ? 'fail' : 'warn');
            results.push({
                name: `gdpr_${issue.type}`,
                status: effectiveStatus,
                severity: (isPreInstall && isAutoFixable) ? 'warning' : issue.severity,
                message: `${issue.file}: ${issue.detail}`,
                fix: issue.fix,
                autoFixable: isAutoFixable,
            });
        }
        return results;
    }
    /**
     * Auto-fix GDPR issues where possible
     */
    autoFix() {
        const fixed = [];
        const manual = [];
        // Fix gitignore
        const gitignorePath = path.join(this.targetPath, '.gitignore');
        const result = (0, fs_utils_1.ensureGitignorePatterns)(gitignorePath, REQUIRED_GITIGNORE_PATTERNS);
        if (result.added.length > 0) {
            fixed.push(`Added ${result.added.length} patterns to .gitignore`);
        }
        // Check for PII that needs manual review
        const piiIssues = this.scanForPII();
        for (const issue of piiIssues) {
            manual.push(`Review ${issue.file}:${issue.line} - ${issue.detail}`);
        }
        return { fixed, manual };
    }
    /**
     * Check .gitignore for required patterns
     */
    checkGitignore() {
        const issues = [];
        const gitignorePath = path.join(this.targetPath, '.gitignore');
        if (!(0, fs_utils_1.pathExists)(gitignorePath)) {
            issues.push({
                file: '.gitignore',
                type: 'not_gitignored',
                detail: 'No .gitignore file found - sensitive files may be committed',
                severity: 'error',
                fix: 'Create .gitignore with required patterns',
            });
            return issues;
        }
        const patterns = (0, fs_utils_1.parseGitignore)(gitignorePath);
        for (const required of REQUIRED_GITIGNORE_PATTERNS) {
            if (!patterns.some(p => p === required || this.patternCovers(p, required))) {
                issues.push({
                    file: '.gitignore',
                    type: 'not_gitignored',
                    detail: `Pattern "${required}" not found in .gitignore`,
                    severity: 'warning',
                    fix: `Add "${required}" to .gitignore`,
                });
            }
        }
        return issues;
    }
    /**
     * Scan standards, specs, and product files for PII
     */
    scanForPII() {
        const issues = [];
        for (const dir of SCAN_DIRS) {
            const fullDir = path.join(this.targetPath, dir);
            if (!(0, fs_utils_1.isDirectory)(fullDir))
                continue;
            const files = (0, fs_utils_1.listFilesRecursive)(fullDir, this.targetPath);
            for (const file of files) {
                // Skip non-text files and excluded paths
                if (!file.endsWith('.md') && !file.endsWith('.yml') && !file.endsWith('.yaml'))
                    continue;
                if (SKIP_PATTERNS.some(p => p.test(file)))
                    continue;
                const fullPath = path.join(this.targetPath, file);
                const content = (0, fs_utils_1.readFileSafe)(fullPath);
                if (!content)
                    continue;
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // Skip comments and code examples
                    if (line.trim().startsWith('//') || line.trim().startsWith('#'))
                        continue;
                    if (line.includes('example') || line.includes('placeholder'))
                        continue;
                    if (line.includes('user@example') || line.includes('test@'))
                        continue;
                    for (const pattern of PII_PATTERNS) {
                        if (pattern.regex.test(line)) {
                            issues.push({
                                file,
                                line: i + 1,
                                type: 'pii_detected',
                                detail: `Potential ${pattern.type} detected`,
                                severity: 'warning',
                                fix: `Review line ${i + 1} in ${file} - remove or anonymize PII`,
                            });
                            break; // One issue per line is enough
                        }
                    }
                }
            }
        }
        return issues;
    }
    /**
     * Check that configuration is local-only
     */
    checkLocalOnlyConfig() {
        const issues = [];
        // Check config.yml for local_only setting
        const configPath = path.join(this.targetPath, 'workflow', 'config.yml');
        if ((0, fs_utils_1.pathExists)(configPath)) {
            const config = (0, fs_utils_1.readFileSafe)(configPath);
            if (config && !config.includes('local_only: true')) {
                issues.push({
                    file: 'workflow/config.yml',
                    type: 'missing_local_config',
                    detail: 'local_only: true not set in GDPR config section',
                    severity: 'error',
                    fix: 'Add "local_only: true" under the gdpr section in config.yml',
                });
            }
        }
        // Check for .local.md files that should exist for sensitive project data
        const claudeLocalPath = path.join(this.targetPath, 'CLAUDE.local.md');
        if (!(0, fs_utils_1.pathExists)(claudeLocalPath)) {
            issues.push({
                file: 'CLAUDE.local.md',
                type: 'missing_local_config',
                detail: 'No CLAUDE.local.md found for project-specific sensitive data',
                severity: 'info',
                fix: 'Create CLAUDE.local.md for any project-specific personal settings (auto-gitignored)',
            });
        }
        return issues;
    }
    /**
     * Check for indicators of cloud sync that would violate GDPR
     */
    checkCloudSync() {
        const issues = [];
        // Check for cloud sync config files
        const cloudIndicators = [
            { file: '.cursor/sync.json', service: 'Cursor Cloud Sync' },
            { file: '.vscode/settings.json', check: 'sync.enable', service: 'VS Code Settings Sync' },
        ];
        for (const indicator of cloudIndicators) {
            const filePath = path.join(this.targetPath, indicator.file);
            if ((0, fs_utils_1.pathExists)(filePath)) {
                const content = (0, fs_utils_1.readFileSafe)(filePath);
                if (content && indicator.check && content.includes(indicator.check)) {
                    issues.push({
                        file: indicator.file,
                        type: 'cloud_sync',
                        detail: `${indicator.service} may sync sensitive Claude Workflow Engine data`,
                        severity: 'warning',
                        fix: `Verify ${indicator.service} excludes workflow/ and .claude/ directories`,
                    });
                }
            }
        }
        return issues;
    }
    /**
     * Check if one gitignore pattern covers another
     */
    patternCovers(existing, required) {
        // Simple heuristic: *.ext covers specific.ext
        if (existing.startsWith('*.') && required.includes('.')) {
            const ext = existing.slice(1);
            if (required.endsWith(ext))
                return true;
        }
        // .env* covers .env, .env.local etc
        if (existing.endsWith('*') && required.startsWith(existing.slice(0, -1))) {
            return true;
        }
        return false;
    }
    /**
     * Generate human-readable recommendations
     */
    generateRecommendations(issues) {
        const recs = [];
        if (issues.some(i => i.type === 'not_gitignored')) {
            recs.push('Run "workflow check --gdpr --fix" to auto-update .gitignore');
        }
        if (issues.some(i => i.type === 'pii_detected')) {
            recs.push('Review flagged files and remove/anonymize any real personal data');
        }
        if (issues.some(i => i.type === 'cloud_sync')) {
            recs.push('Configure cloud sync exclusions for workflow/ and .claude/ directories');
        }
        if (issues.some(i => i.type === 'missing_local_config')) {
            recs.push('Create CLAUDE.local.md for project-specific settings (auto-gitignored)');
        }
        if (issues.length === 0) {
            recs.push('DSGVO/GDPR configuration is compliant - no action needed');
        }
        return recs;
    }
}
exports.GDPRValidator = GDPRValidator;
//# sourceMappingURL=gdpr-validator.js.map