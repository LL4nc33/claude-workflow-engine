"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Install Command
// Safely installs Claude Workflow Engine into a target project
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
exports.installCommand = installCommand;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const preflight_1 = require("../lib/preflight");
const state_manager_1 = require("../lib/state-manager");
const settings_merger_1 = require("../lib/settings-merger");
const gdpr_validator_1 = require("../lib/gdpr-validator");
const logger_1 = require("../lib/logger");
const fs_utils_1 = require("../lib/fs-utils");
async function installCommand(args) {
    const options = parseInstallArgs(args);
    const log = new logger_1.Logger(options.verbose);
    log.header('Claude Workflow Engine Installation');
    log.table([
        ['Scope', options.scope],
        ['Mode', options.mode],
        ['Profile', options.profile],
        ['Path', options.path],
        ['Dry Run', options.dryRun ? 'Yes' : 'No'],
        ['Force', options.force ? 'Yes' : 'No'],
    ]);
    log.newline();
    // --- Phase 1: Pre-Flight Checks ---
    const preflight = new preflight_1.PreFlightChecker(options);
    const report = preflight.run();
    if (!report.canProceed) {
        log.error('Pre-flight checks failed. Installation cannot proceed.', 'Fix the errors above or use --force to override warnings.');
        process.exit(1);
    }
    if (report.warnings > 0 && !options.force) {
        log.warn(`${report.warnings} warnings detected. Use --force to proceed anyway.`);
        if (!options.dryRun) {
            log.info('Proceeding with warnings...');
        }
    }
    // --- Phase 2: Backup ---
    let backupPath = null;
    if (!options.dryRun) {
        log.section('Backup');
        const stateManager = new state_manager_1.StateManager(options.path, options.verbose);
        if (stateManager.isInstalled()) {
            log.step('Creating backup of existing installation...');
            backupPath = stateManager.createBackup();
            if (backupPath) {
                log.pass(`Backup created: ${backupPath}`);
            }
            else {
                log.warn('No existing files to backup');
            }
        }
    }
    // --- Phase 3: Installation ---
    log.section('Installation');
    if (options.dryRun) {
        log.info('DRY RUN - No files will be modified');
        log.newline();
        dryRunInstall(options, log);
        return;
    }
    const installedFiles = performInstallation(options, log);
    // --- Phase 4: Settings Merge ---
    log.section('Settings Configuration');
    const merger = new settings_merger_1.SettingsMerger(options.path, options.verbose);
    const mergeResult = merger.merge(options.profile, {
        includeDevOps: true,
        includeSecurity: true,
        dryRun: options.dryRun,
    });
    if (mergeResult.addedPermissions.length > 0) {
        log.pass(`Added ${mergeResult.addedPermissions.length} new permissions`);
        if (options.verbose) {
            for (const perm of mergeResult.addedPermissions) {
                log.debug(`  + ${perm}`);
            }
        }
    }
    if (mergeResult.existingPermissions.length > 0) {
        log.info(`${mergeResult.existingPermissions.length} permissions already present`);
    }
    // --- Phase 5: GDPR Auto-Fix ---
    log.section('DSGVO/GDPR Configuration');
    const gdpr = new gdpr_validator_1.GDPRValidator(options.path, options.verbose);
    const gdprFix = gdpr.autoFix();
    if (gdprFix.fixed.length > 0) {
        for (const fix of gdprFix.fixed) {
            log.pass(fix);
        }
    }
    if (gdprFix.manual.length > 0) {
        for (const manual of gdprFix.manual) {
            log.warn(`Manual review needed: ${manual}`);
        }
    }
    // --- Phase 6: State Initialization ---
    log.section('Finalizing');
    const finalStateManager = new state_manager_1.StateManager(options.path, options.verbose);
    const newState = finalStateManager.initialize({
        mode: options.mode,
        scope: options.scope,
        profile: options.profile,
        filesInstalled: installedFiles,
    });
    // Preserve backup path reference for rollback
    if (backupPath) {
        newState.backupPath = backupPath;
        finalStateManager.updateBackupPath(backupPath);
    }
    log.pass('Installation state saved');
    // --- Summary ---
    log.newline();
    log.done('Claude Workflow Engine installation complete!');
    log.newline();
    log.box([
        'Next steps:',
        '',
        '  1. Review .claude/settings.local.json',
        '  2. Customize workflow/config.yml for your project',
        '  3. Run: workflow health --verbose',
        '  4. Start with: /plan-product',
        '',
        'GDPR Note: Sensitive data stays local-only.',
        'Run "workflow check --gdpr" to verify compliance.',
    ]);
    log.newline();
}
/**
 * Perform the actual installation
 */
function performInstallation(options, log) {
    const templateBase = path.join(__dirname, '..', '..', 'templates', 'base');
    const profileDir = path.join(__dirname, '..', '..', 'templates', 'profiles', options.profile);
    const targetPath = path.resolve(options.path);
    const installedFiles = [];
    // Create core directory structure
    const dirs = [
        'workflow',
        'workflow/standards',
        'workflow/standards/global',
        'workflow/standards/api',
        'workflow/standards/database',
        'workflow/standards/devops',
        'workflow/standards/frontend',
        'workflow/standards/testing',
        'workflow/standards/agents',
        'workflow/product',
        'workflow/specs',
        '.claude',
        '.claude/agents',
        '.claude/commands/workflow',
        '.claude/skills/workflow',
        'docs',
    ];
    for (const dir of dirs) {
        const fullDir = path.join(targetPath, dir);
        if (!(0, fs_utils_1.pathExists)(fullDir)) {
            fs.mkdirSync(fullDir, { recursive: true });
            log.step(`Created: ${dir}/`);
        }
    }
    // Mapping: template source paths → target paths
    // Templates use flat names to avoid npm issues with dotfiles
    const pathMappings = {
        '.claude-agents': '.claude/agents',
        '.claude-commands': '.claude/commands',
        '.claude-skills': '.claude/skills',
        '.claude-CLAUDE.md': '.claude/CLAUDE.md',
        'workflow/standards-full': 'workflow/standards',
    };
    const skipFiles = new Set(['.gitignore-add']);
    if ((0, fs_utils_1.pathExists)(templateBase)) {
        const templateFiles = (0, fs_utils_1.listFilesRecursive)(templateBase, templateBase);
        for (const file of templateFiles) {
            if (skipFiles.has(path.basename(file)))
                continue;
            // Apply path mappings
            let destFile = file;
            for (const [from, to] of Object.entries(pathMappings)) {
                if (destFile.startsWith(from)) {
                    destFile = destFile.replace(from, to);
                    break;
                }
            }
            const src = path.join(templateBase, file);
            const dest = path.join(targetPath, destFile);
            const destDir = path.dirname(dest);
            if (!(0, fs_utils_1.pathExists)(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            // Don't overwrite existing files unless --force
            if ((0, fs_utils_1.pathExists)(dest) && !options.force) {
                log.info(`Skipped (exists): ${destFile}`);
                continue;
            }
            fs.copyFileSync(src, dest);
            installedFiles.push(destFile);
            log.step(`Installed: ${destFile}`);
        }
    }
    // Apply profile-specific templates (override defaults)
    if (options.profile !== 'default' && (0, fs_utils_1.pathExists)(profileDir)) {
        const profileFiles = (0, fs_utils_1.listFilesRecursive)(profileDir, profileDir);
        for (const file of profileFiles) {
            const src = path.join(profileDir, file);
            const dest = path.join(targetPath, file);
            const destDir = path.dirname(dest);
            if (!(0, fs_utils_1.pathExists)(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(src, dest);
            installedFiles.push(file);
            log.step(`Profile [${options.profile}]: ${file}`);
        }
    }
    // Create specs/.gitkeep
    const specsKeep = path.join(targetPath, 'workflow', 'specs', '.gitkeep');
    if (!(0, fs_utils_1.pathExists)(specsKeep)) {
        (0, fs_utils_1.writeFileSafe)(specsKeep, '');
        installedFiles.push('workflow/specs/.gitkeep');
    }
    // Ensure .gitignore has required patterns
    const gitignorePath = path.join(targetPath, '.gitignore');
    ensureGitignore(gitignorePath);
    if (!installedFiles.includes('.gitignore')) {
        installedFiles.push('.gitignore');
    }
    log.newline();
    log.pass(`${installedFiles.length} files installed`);
    return installedFiles;
}
/**
 * Show what would be installed without making changes
 */
function dryRunInstall(options, log) {
    const targetPath = path.resolve(options.path);
    log.info('The following operations would be performed:');
    log.newline();
    const dirs = [
        'workflow/',
        'workflow/standards/',
        'workflow/product/',
        'workflow/specs/',
        '.claude/',
        '.claude/agents/',
        '.claude/commands/workflow/',
        '.claude/skills/workflow/',
    ];
    log.info('Directories to create:');
    for (const dir of dirs) {
        const exists = (0, fs_utils_1.pathExists)(path.join(targetPath, dir));
        log.info(`  ${exists ? '[exists]' : '[create]'} ${dir}`);
    }
    log.newline();
    log.info('Files to generate:');
    log.info('  .claude/CLAUDE.md');
    log.info('  .claude/settings.local.json');
    log.info('  workflow/config.yml');
    log.info('  .gitignore (update)');
    log.newline();
    log.info('Settings merge:');
    const merger = new settings_merger_1.SettingsMerger(targetPath, options.verbose);
    const mergeResult = merger.merge(options.profile, {
        includeDevOps: true,
        includeSecurity: true,
        dryRun: true,
    });
    log.info(`  ${mergeResult.addedPermissions.length} permissions to add`);
    log.info(`  ${mergeResult.existingPermissions.length} permissions already present`);
    log.newline();
    log.done('Dry run complete. Use without --dry-run to install.');
}
/**
 * Ensure .gitignore has required GDPR patterns
 */
function ensureGitignore(gitignorePath) {
    let content = '';
    if ((0, fs_utils_1.pathExists)(gitignorePath)) {
        content = fs.readFileSync(gitignorePath, 'utf-8');
    }
    const requiredPatterns = [
        '# Claude Workflow Engine - GDPR/Security',
        'CLAUDE.local.md',
        '*.local.md',
        '.env',
        '.env.*',
        '.env.local',
        'credentials.*',
        'secrets.*',
        '.installation-state.json',
        '.workflow-backups/',
    ];
    const missingPatterns = requiredPatterns.filter(p => !content.includes(p));
    if (missingPatterns.length > 0) {
        if (content && !content.endsWith('\n'))
            content += '\n';
        content += '\n' + missingPatterns.join('\n') + '\n';
        (0, fs_utils_1.writeFileSafe)(gitignorePath, content);
    }
}
/**
 * Parse command-line arguments for install command
 */
function parseInstallArgs(args) {
    const options = {
        scope: 'local',
        mode: 'integrated',
        profile: 'default',
        path: process.cwd(),
        dryRun: false,
        force: false,
        verbose: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--global':
                options.scope = 'global';
                break;
            case '--local':
                options.scope = 'local';
                break;
            case '--mode':
                options.mode = args[++i] || 'integrated';
                break;
            case '--profile':
                options.profile = args[++i] || 'default';
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--force':
            case '-f':
                options.force = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            default:
                // Positional argument = path
                if (!arg.startsWith('-')) {
                    options.path = path.resolve(arg);
                }
                break;
        }
    }
    return options;
}
//# sourceMappingURL=install.js.map