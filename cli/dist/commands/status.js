"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Status Command
// Shows current installation status and configuration
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
exports.statusCommand = statusCommand;
const path = __importStar(require("path"));
const state_manager_1 = require("../lib/state-manager");
const settings_merger_1 = require("../lib/settings-merger");
const logger_1 = require("../lib/logger");
const fs_utils_1 = require("../lib/fs-utils");
async function statusCommand(args) {
    const options = parseStatusArgs(args);
    const log = new logger_1.Logger(options.verbose);
    const targetPath = path.resolve(options.path);
    log.header('Claude Workflow Engine Status');
    // --- Installation State ---
    const stateManager = new state_manager_1.StateManager(targetPath, options.verbose);
    const state = stateManager.getState();
    if (!state) {
        log.warn('Claude Workflow Engine is NOT installed at this location.');
        log.info(`Path: ${targetPath}`);
        log.newline();
        log.box([
            'To install Claude Workflow Engine:',
            '',
            '  workflow install [--profile node|python|rust]',
            '  workflow install --dry-run  (preview only)',
        ]);
        return;
    }
    // --- Basic Info ---
    log.section('Installation');
    log.table([
        ['Version', state.version],
        ['Installed', state.installedAt],
        ['Updated', state.updatedAt],
        ['Mode', state.mode],
        ['Scope', state.scope],
        ['Profile', state.profile],
        ['Path', state.path],
    ]);
    // --- File Stats ---
    log.section('Files');
    const integrity = stateManager.checkIntegrity();
    log.table([
        ['Tracked', String(state.filesInstalled.length)],
        ['Intact', String(integrity.intact.length)],
        ['Modified', String(integrity.modified.length)],
        ['Missing', String(integrity.missing.length)],
    ]);
    if (options.verbose && integrity.modified.length > 0) {
        log.newline();
        log.info('Modified files:');
        for (const file of integrity.modified) {
            log.warn(`  ${file}`);
        }
    }
    if (options.verbose && integrity.missing.length > 0) {
        log.newline();
        log.info('Missing files:');
        for (const file of integrity.missing) {
            log.fail(`  ${file}`);
        }
    }
    // --- Standards ---
    log.section('Standards');
    const standardsDir = path.join(targetPath, 'workflow', 'standards');
    if ((0, fs_utils_1.isDirectory)(standardsDir)) {
        const fs = require('fs');
        const domains = fs.readdirSync(standardsDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
        if (domains.length > 0) {
            log.info(`Domains: ${domains.join(', ')}`);
            if (options.verbose) {
                for (const domain of domains) {
                    const domainPath = path.join(standardsDir, domain);
                    const files = (0, fs_utils_1.listFilesRecursive)(domainPath, domainPath);
                    log.debug(`  ${domain}/: ${files.length} files`);
                }
            }
        }
        else {
            log.warn('No standards domains configured');
        }
    }
    else {
        log.warn('Standards directory not found');
    }
    // --- Agents ---
    log.section('Agents');
    const agentsDir = path.join(targetPath, '.claude', 'agents');
    if ((0, fs_utils_1.isDirectory)(agentsDir)) {
        const fs = require('fs');
        const agents = fs.readdirSync(agentsDir)
            .filter((f) => f.endsWith('.md'))
            .map((f) => f.replace('.md', ''));
        if (agents.length > 0) {
            log.info(`Active agents: ${agents.join(', ')}`);
        }
        else {
            log.warn('No agents configured');
        }
    }
    else {
        log.warn('Agents directory not found');
    }
    // --- Commands ---
    log.section('Commands');
    const commandsDir = path.join(targetPath, '.claude', 'commands', 'workflow');
    if ((0, fs_utils_1.isDirectory)(commandsDir)) {
        const fs = require('fs');
        const commands = fs.readdirSync(commandsDir)
            .filter((f) => f.endsWith('.md'))
            .map((f) => '/' + f.replace('.md', ''));
        if (commands.length > 0) {
            log.info(`Available: ${commands.join(', ')}`);
        }
        else {
            log.warn('No commands installed');
        }
    }
    else {
        log.warn('Commands directory not found');
    }
    // --- Skills ---
    log.section('Skills');
    const skillsDir = path.join(targetPath, '.claude', 'skills', 'workflow');
    if ((0, fs_utils_1.isDirectory)(skillsDir)) {
        const fs = require('fs');
        const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
        if (skills.length > 0) {
            log.info(`Registered: ${skills.join(', ')}`);
        }
        else {
            log.warn('No skills registered');
        }
    }
    else {
        log.warn('Skills directory not found');
    }
    // --- Settings ---
    log.section('Permissions');
    const merger = new settings_merger_1.SettingsMerger(targetPath, options.verbose);
    const validation = merger.validateExisting();
    if (validation.valid) {
        log.pass('All required Claude Workflow Engine permissions present');
    }
    else {
        log.warn(`Missing ${validation.missingPermissions.length} required permissions`);
    }
    if (options.verbose && validation.extraPermissions.length > 0) {
        log.info(`Custom permissions: ${validation.extraPermissions.length}`);
    }
    // --- Backups ---
    log.section('Backups');
    const backups = stateManager.listBackups();
    if (backups.length > 0) {
        log.info(`${backups.length} backup(s) available`);
        if (options.verbose) {
            for (const backup of backups.slice(0, 5)) {
                log.debug(`  ${backup}`);
            }
        }
    }
    else {
        log.info('No backups available');
    }
    // --- History (verbose) ---
    if (options.verbose && state.history.length > 0) {
        log.section('Recent History');
        const recent = state.history.slice(-5);
        for (const event of recent) {
            const icon = event.success ? '\x1b[32m+\x1b[0m' : '\x1b[31mx\x1b[0m';
            log.info(`  ${icon} ${event.timestamp} - ${event.action} (${event.filesChanged.length} files)`);
        }
    }
    log.newline();
}
function parseStatusArgs(args) {
    const options = {
        verbose: false,
        path: process.cwd(),
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--verbose':
            case '-v':
                options.verbose = true;
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
//# sourceMappingURL=status.js.map