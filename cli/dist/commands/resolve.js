"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Resolve Command
// Resolves conflicts detected by the check command
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
exports.resolveCommand = resolveCommand;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const conflict_detector_1 = require("../lib/conflict-detector");
const logger_1 = require("../lib/logger");
const fs_utils_1 = require("../lib/fs-utils");
async function resolveCommand(args) {
    const options = parseResolveArgs(args);
    const log = new logger_1.Logger(true); // Always verbose for resolve
    const targetPath = path.resolve(options.path);
    log.header('Claude Workflow Engine Conflict Resolution');
    if (!(0, fs_utils_1.pathExists)(targetPath)) {
        log.error(`Target path does not exist: ${targetPath}`);
        process.exit(1);
    }
    // Detect conflicts
    const templatePath = path.join(__dirname, '..', '..', 'templates', 'base');
    const detector = new conflict_detector_1.ConflictDetector(targetPath, templatePath, true);
    const report = detector.detect();
    if (report.fileConflicts.length === 0 && report.commandConflicts.length === 0) {
        log.pass('No conflicts to resolve!');
        return;
    }
    log.info(`Found ${report.fileConflicts.length} file conflict(s) and ${report.commandConflicts.length} command conflict(s)`);
    log.newline();
    // --- Resolve File Conflicts ---
    if (report.fileConflicts.length > 0) {
        log.section('File Conflicts');
        for (const conflict of report.fileConflicts) {
            log.info(`Conflict: ${conflict.path} (${conflict.type})`);
            if (options.autoFix) {
                await resolveFileConflict(conflict, targetPath, templatePath, log);
            }
            else {
                showFileConflictOptions(conflict, log);
            }
        }
    }
    // --- Resolve Command Conflicts ---
    if (report.commandConflicts.length > 0) {
        log.section('Command Conflicts');
        for (const conflict of report.commandConflicts) {
            log.info(`Command: ${conflict.command}`);
            log.info(`  Existing: ${conflict.existingSource}`);
            log.info(`  Proposed: ${conflict.proposedSource}`);
            if (options.autoFix) {
                await resolveCommandConflict(conflict, targetPath, log);
            }
            else {
                showCommandConflictOptions(conflict, log);
            }
        }
    }
    // --- Summary ---
    log.newline();
    if (options.autoFix) {
        log.done('Conflict resolution complete.');
        log.info('Run "workflow check" to verify all conflicts resolved.');
    }
    else {
        log.box([
            'To auto-resolve conflicts:',
            '',
            '  workflow resolve --auto-fix [path]',
            '',
            'Strategy: backup -> merge/overwrite',
            'Backups are stored in .workflow-backups/',
        ]);
    }
}
/**
 * Resolve a file conflict automatically
 */
async function resolveFileConflict(conflict, targetPath, templatePath, log) {
    const targetFile = path.join(targetPath, conflict.path);
    const templateFile = path.join(templatePath, conflict.path);
    const backupDir = path.join(targetPath, '.workflow-backups');
    switch (conflict.type) {
        case 'modified': {
            // Backup existing, then decide merge strategy
            log.step(`Backing up: ${conflict.path}`);
            const backup = (0, fs_utils_1.createBackup)(targetFile, backupDir);
            if (backup) {
                log.pass(`Backup: ${path.basename(backup)}`);
            }
            // For YAML/JSON files, attempt smart merge
            if (conflict.path.endsWith('.yml') || conflict.path.endsWith('.yaml')) {
                log.step('Merging YAML configuration...');
                const merged = mergeYamlFiles(targetFile, templateFile);
                if (merged) {
                    (0, fs_utils_1.writeFileSafe)(targetFile, merged);
                    log.pass(`Merged: ${conflict.path}`);
                }
                else {
                    // Fallback: keep existing, log difference
                    log.warn(`Could not auto-merge ${conflict.path} - keeping existing version`);
                }
            }
            else if (conflict.path.endsWith('.json')) {
                log.step('Merging JSON configuration...');
                const merged = mergeJsonFiles(targetFile, templateFile);
                if (merged) {
                    (0, fs_utils_1.writeFileSafe)(targetFile, merged);
                    log.pass(`Merged: ${conflict.path}`);
                }
                else {
                    log.warn(`Could not auto-merge ${conflict.path} - keeping existing version`);
                }
            }
            else {
                // For other files, keep existing and save template as .proposed
                const proposedPath = targetFile + '.proposed';
                if ((0, fs_utils_1.pathExists)(templateFile)) {
                    fs.copyFileSync(templateFile, proposedPath);
                    log.info(`Saved proposed version: ${conflict.path}.proposed`);
                    log.warn('Manual merge required');
                }
            }
            break;
        }
        case 'exists': {
            // File exists but no template to compare - just backup
            log.step(`Backing up existing: ${conflict.path}`);
            const backup = (0, fs_utils_1.createBackup)(targetFile, backupDir);
            if (backup) {
                log.pass(`Backed up: ${path.basename(backup)}`);
            }
            log.info('Existing file preserved (no template conflict)');
            break;
        }
        case 'permission': {
            log.fail(`Permission conflict on ${conflict.path} - manual fix required`);
            log.info('  Check file ownership and permissions');
            break;
        }
    }
}
/**
 * Resolve a command conflict automatically
 */
async function resolveCommandConflict(conflict, targetPath, log) {
    const backupDir = path.join(targetPath, '.workflow-backups');
    // Strategy: namespace the existing command
    log.step(`Resolving command: ${conflict.command}`);
    if ((0, fs_utils_1.pathExists)(conflict.existingSource)) {
        // Backup existing command
        const backup = (0, fs_utils_1.createBackup)(conflict.existingSource, backupDir);
        if (backup) {
            log.pass(`Backed up existing: ${path.basename(backup)}`);
        }
        // Rename to avoid conflict (add 'custom-' prefix)
        const dir = path.dirname(conflict.existingSource);
        const base = path.basename(conflict.existingSource);
        const renamedPath = path.join(dir, 'custom-' + base);
        fs.renameSync(conflict.existingSource, renamedPath);
        log.pass(`Renamed: ${base} -> custom-${base}`);
        log.info(`  Access via: /custom-${base.replace('.md', '')}`);
    }
    else {
        log.warn(`Source file not found: ${conflict.existingSource}`);
    }
}
/**
 * Show resolution options for a file conflict (non-auto mode)
 */
function showFileConflictOptions(conflict, log) {
    log.info(`  Type: ${conflict.type}`);
    log.info('  Options:');
    log.info('    --auto-fix   : Backup existing, merge/overwrite with template');
    log.info('    Manual       : Edit the file to resolve differences');
    if (conflict.type === 'modified') {
        log.info(`    Compare      : diff "${conflict.path}" with template version`);
    }
}
/**
 * Show resolution options for a command conflict (non-auto mode)
 */
function showCommandConflictOptions(conflict, log) {
    log.info('  Options:');
    log.info('    --auto-fix   : Rename existing command with "custom-" prefix');
    log.info(`    Manual       : Remove or rename ${conflict.existingSource}`);
}
/**
 * Merge two YAML files (simple strategy: keep existing, add missing keys)
 */
function mergeYamlFiles(existingPath, templatePath) {
    try {
        const existing = (0, fs_utils_1.readFileSafe)(existingPath);
        const template = (0, fs_utils_1.readFileSafe)(templatePath);
        if (!existing || !template)
            return null;
        // Simple merge: keep existing content, append any template sections
        // that don't exist in the existing file
        // This is a basic strategy - for complex merges, a YAML parser would be better
        const existingLines = existing.split('\n');
        const templateLines = template.split('\n');
        // Find top-level keys in existing
        const existingKeys = new Set();
        for (const line of existingLines) {
            const match = line.match(/^(\w[\w_-]*)\s*:/);
            if (match)
                existingKeys.add(match[1]);
        }
        // Find top-level sections in template that are missing
        const missingBlocks = [];
        let currentBlock = [];
        let currentKey = '';
        for (const line of templateLines) {
            const match = line.match(/^(\w[\w_-]*)\s*:/);
            if (match) {
                if (currentKey && !existingKeys.has(currentKey)) {
                    missingBlocks.push(currentBlock.join('\n'));
                }
                currentKey = match[1];
                currentBlock = [line];
            }
            else {
                currentBlock.push(line);
            }
        }
        if (currentKey && !existingKeys.has(currentKey)) {
            missingBlocks.push(currentBlock.join('\n'));
        }
        if (missingBlocks.length === 0)
            return existing;
        return existing + '\n\n# --- Added by Claude Workflow Engine merge ---\n' + missingBlocks.join('\n\n') + '\n';
    }
    catch {
        return null;
    }
}
/**
 * Merge two JSON files (deep merge strategy)
 */
function mergeJsonFiles(existingPath, templatePath) {
    try {
        const existingContent = (0, fs_utils_1.readFileSafe)(existingPath);
        const templateContent = (0, fs_utils_1.readFileSafe)(templatePath);
        if (!existingContent || !templateContent)
            return null;
        const existing = JSON.parse(existingContent);
        const template = JSON.parse(templateContent);
        const merged = deepMerge(existing, template);
        return JSON.stringify(merged, null, 2) + '\n';
    }
    catch {
        return null;
    }
}
/**
 * Deep merge two objects (existing takes precedence, template fills gaps)
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (!(key in result)) {
            result[key] = source[key];
        }
        else if (typeof result[key] === 'object' &&
            typeof source[key] === 'object' &&
            !Array.isArray(result[key]) &&
            !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key], source[key]);
        }
        else if (Array.isArray(result[key]) && Array.isArray(source[key])) {
            // Merge arrays: deduplicate
            const combined = [...result[key]];
            for (const item of source[key]) {
                if (!combined.includes(item)) {
                    combined.push(item);
                }
            }
            result[key] = combined;
        }
        // If key exists and is not object/array, keep existing value
    }
    return result;
}
function parseResolveArgs(args) {
    const options = {
        interactive: false,
        path: process.cwd(),
        autoFix: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--interactive':
            case '-i':
                options.interactive = true;
                break;
            case '--auto-fix':
            case '--autofix':
                options.autoFix = true;
                break;
            default:
                if (!arg.startsWith('-')) {
                    options.path = path.resolve(arg);
                }
                break;
        }
    }
    return options;
}
//# sourceMappingURL=resolve.js.map