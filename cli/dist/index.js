#!/usr/bin/env node
"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Entry Point
// Safety-first installation and management for Claude Workflow Engine
//
// Usage:
//   workflow install [--global|--local] [--mode template|integrated] [--profile default|node|python|rust] [path]
//   workflow status [--verbose] [path]
//   workflow health [--fix] [--report] [path]
//   workflow check [--conflicts] [--permissions] [--gdpr] [--fix] [path]
//   workflow resolve [--auto-fix] [path]
//   workflow rollback [path]
//   workflow version
//   workflow help
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
const install_1 = require("./commands/install");
const health_1 = require("./commands/health");
const status_1 = require("./commands/status");
const check_1 = require("./commands/check");
const resolve_1 = require("./commands/resolve");
const state_manager_1 = require("./lib/state-manager");
const logger_1 = require("./lib/logger");
const path = __importStar(require("path"));
const VERSION = '0.1.0';
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const commandArgs = args.slice(1);
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }
    if (command === 'version' || command === '--version' || command === '-V') {
        console.log(`workflow v${VERSION}`);
        return;
    }
    try {
        switch (command) {
            case 'install':
                await (0, install_1.installCommand)(commandArgs);
                break;
            case 'health':
                await (0, health_1.healthCommand)(commandArgs);
                break;
            case 'status':
                await (0, status_1.statusCommand)(commandArgs);
                break;
            case 'check':
                await (0, check_1.checkCommand)(commandArgs);
                break;
            case 'resolve':
                await (0, resolve_1.resolveCommand)(commandArgs);
                break;
            case 'rollback':
                await rollbackCommand(commandArgs);
                break;
            default:
                console.error(`Unknown command: ${command}`);
                console.error('Run "workflow help" for available commands.');
                process.exit(1);
        }
    }
    catch (err) {
        const log = new logger_1.Logger();
        if (err instanceof Error) {
            log.error(err.message, err.stack);
        }
        else {
            log.error(String(err));
        }
        process.exit(1);
    }
}
async function rollbackCommand(args) {
    const log = new logger_1.Logger(args.includes('--verbose') || args.includes('-v'));
    const targetPath = args.find(a => !a.startsWith('-')) || process.cwd();
    log.header('Claude Workflow Engine Rollback');
    const stateManager = new state_manager_1.StateManager(path.resolve(targetPath), true);
    if (!stateManager.isInstalled()) {
        log.error('No Claude Workflow Engine installation found at this location.');
        process.exit(1);
    }
    const backups = stateManager.listBackups();
    if (backups.length === 0) {
        log.error('No backups available for rollback.');
        log.info('Backups are created automatically during install/update operations.');
        process.exit(1);
    }
    log.info(`Available backups: ${backups.length}`);
    for (const backup of backups.slice(0, 5)) {
        log.info(`  ${backup}`);
    }
    log.newline();
    log.step('Rolling back to most recent backup...');
    const result = stateManager.rollback();
    if (result.success) {
        log.done(result.message);
        log.info('Run "workflow health" to verify the rollback.');
    }
    else {
        log.error(result.message);
        process.exit(1);
    }
}
function showHelp() {
    const help = `
\x1b[1m\x1b[36mworkflow\x1b[0m v${VERSION} - Claude Workflow Engine CLI

\x1b[1mUSAGE:\x1b[0m
  workflow <command> [options] [path]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[32minstall\x1b[0m     Install Claude Workflow Engine into a project
  \x1b[32mstatus\x1b[0m      Show current installation status
  \x1b[32mhealth\x1b[0m      Run health checks on installation
  \x1b[32mcheck\x1b[0m       Run conflict/permission/GDPR checks
  \x1b[32mresolve\x1b[0m     Resolve detected conflicts
  \x1b[32mrollback\x1b[0m    Rollback to previous backup
  \x1b[32mversion\x1b[0m     Show version
  \x1b[32mhelp\x1b[0m        Show this help

\x1b[1mINSTALL OPTIONS:\x1b[0m
  --global              Install globally (shared config)
  --local               Install locally (project-specific, default)
  --mode <mode>         Installation mode: template|integrated
  --profile <profile>   Tech profile: default|node|python|rust
  --dry-run             Preview changes without installing
  --force, -f           Proceed despite warnings
  --verbose, -v         Detailed output

\x1b[1mHEALTH OPTIONS:\x1b[0m
  --fix                 Auto-fix detected issues
  --report              Save health report as JSON

\x1b[1mCHECK OPTIONS:\x1b[0m
  --conflicts           Check for file/command conflicts
  --permissions         Check filesystem permissions
  --gdpr                Check DSGVO/GDPR compliance
  --fix                 Auto-fix where possible

\x1b[1mRESOLVE OPTIONS:\x1b[0m
  --auto-fix            Automatically resolve conflicts (backup first)

\x1b[1mEXAMPLES:\x1b[0m
  workflow install --profile node .
  workflow install --dry-run --verbose /path/to/project
  workflow health --fix
  workflow check --gdpr --fix
  workflow resolve --auto-fix
  workflow rollback

\x1b[1mGDPR/DSGVO:\x1b[0m
  All data stays local. Sensitive files are auto-gitignored.
  Run "workflow check --gdpr" to verify compliance.

\x1b[2m---
Maintained by oidanice - "Zweimal messen, einmal schneiden."
\x1b[0m`;
    console.log(help);
}
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map