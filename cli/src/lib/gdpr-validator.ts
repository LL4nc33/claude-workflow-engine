// =============================================================================
// Claude Workflow Engine CLI - GDPR Validator
// Ensures DSGVO/GDPR compliance for Claude Workflow Engine installations
// - PII detection in standards/specs
// - Gitignore verification for sensitive files
// - Local-only configuration validation
// =============================================================================

import * as path from 'path';
import {
  GDPRReport,
  GDPRIssue,
  CheckResult,
} from './types';
import {
  pathExists,
  readFileSafe,
  isDirectory,
  listFilesRecursive,
  parseGitignore,
  matchesGitignorePattern,
  ensureGitignorePatterns,
} from './fs-utils';
import { Logger } from './logger';

// Patterns that indicate PII (Personally Identifiable Information)
const PII_PATTERNS: Array<{ regex: RegExp; type: string }> = [
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, type: 'email' },
  { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: 'credit_card' },
  { regex: /\b\d{10,12}\b/, type: 'svnr_or_phone' },  // Austrian SVNr or phone
  { regex: /\b(?:AT)?\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, type: 'iban' },
  { regex: /(?:password|passwd|pwd|secret|api[_-]?key|token|bearer)\s*[=:]\s*['"]?[^\s'"]+/i, type: 'credential' },
  { regex: /\b\d{1,2}\.\d{1,2}\.\d{4}\b/, type: 'date_of_birth' },  // DD.MM.YYYY format
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

export class GDPRValidator {
  private targetPath: string;
  private log: Logger;

  constructor(targetPath: string, verbose = false) {
    this.targetPath = path.resolve(targetPath);
    this.log = new Logger(verbose);
  }

  /**
   * Run full GDPR validation
   */
  validate(): GDPRReport {
    const issues: GDPRIssue[] = [];

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
  runChecks(isPreInstall = false): CheckResult[] {
    const results: CheckResult[] = [];
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
  autoFix(): { fixed: string[]; manual: string[] } {
    const fixed: string[] = [];
    const manual: string[] = [];

    // Fix gitignore
    const gitignorePath = path.join(this.targetPath, '.gitignore');
    const result = ensureGitignorePatterns(gitignorePath, REQUIRED_GITIGNORE_PATTERNS);
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
  private checkGitignore(): GDPRIssue[] {
    const issues: GDPRIssue[] = [];
    const gitignorePath = path.join(this.targetPath, '.gitignore');

    if (!pathExists(gitignorePath)) {
      issues.push({
        file: '.gitignore',
        type: 'not_gitignored',
        detail: 'No .gitignore file found - sensitive files may be committed',
        severity: 'error',
        fix: 'Create .gitignore with required patterns',
      });
      return issues;
    }

    const patterns = parseGitignore(gitignorePath);

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
  private scanForPII(): GDPRIssue[] {
    const issues: GDPRIssue[] = [];

    for (const dir of SCAN_DIRS) {
      const fullDir = path.join(this.targetPath, dir);
      if (!isDirectory(fullDir)) continue;

      const files = listFilesRecursive(fullDir, this.targetPath);
      for (const file of files) {
        // Skip non-text files and excluded paths
        if (!file.endsWith('.md') && !file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
        if (SKIP_PATTERNS.some(p => p.test(file))) continue;

        const fullPath = path.join(this.targetPath, file);
        const content = readFileSafe(fullPath);
        if (!content) continue;

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Skip comments and code examples
          if (line.trim().startsWith('//') || line.trim().startsWith('#')) continue;
          if (line.includes('example') || line.includes('placeholder')) continue;
          if (line.includes('user@example') || line.includes('test@')) continue;

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
  private checkLocalOnlyConfig(): GDPRIssue[] {
    const issues: GDPRIssue[] = [];

    // Check config.yml for local_only setting
    const configPath = path.join(this.targetPath, 'workflow', 'config.yml');
    if (pathExists(configPath)) {
      const config = readFileSafe(configPath);
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
    if (!pathExists(claudeLocalPath)) {
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
  private checkCloudSync(): GDPRIssue[] {
    const issues: GDPRIssue[] = [];

    // Check for cloud sync config files
    const cloudIndicators = [
      { file: '.cursor/sync.json', service: 'Cursor Cloud Sync' },
      { file: '.vscode/settings.json', check: 'sync.enable', service: 'VS Code Settings Sync' },
    ];

    for (const indicator of cloudIndicators) {
      const filePath = path.join(this.targetPath, indicator.file);
      if (pathExists(filePath)) {
        const content = readFileSafe(filePath);
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
  private patternCovers(existing: string, required: string): boolean {
    // Simple heuristic: *.ext covers specific.ext
    if (existing.startsWith('*.') && required.includes('.')) {
      const ext = existing.slice(1);
      if (required.endsWith(ext)) return true;
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
  private generateRecommendations(issues: GDPRIssue[]): string[] {
    const recs: string[] = [];

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
