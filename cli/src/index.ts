#!/usr/bin/env node
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
//   workflow release [patch|minor|major] [--dry-run] [--no-commit] [--no-tag]
//   workflow version
//   workflow help
// =============================================================================

import { installCommand } from './commands/install';
import { healthCommand } from './commands/health';
import { statusCommand } from './commands/status';
import { checkCommand } from './commands/check';
import { resolveCommand } from './commands/resolve';
import { releaseCommand } from './commands/release';
import { StateManager } from './lib/state-manager';
import { Logger } from './lib/logger';
import * as path from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const VERSION = pkg.version;

async function main(): Promise<void> {
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
        await installCommand(commandArgs);
        break;

      case 'health':
        await healthCommand(commandArgs);
        break;

      case 'status':
        await statusCommand(commandArgs);
        break;

      case 'check':
        await checkCommand(commandArgs);
        break;

      case 'resolve':
        await resolveCommand(commandArgs);
        break;

      case 'rollback':
        await rollbackCommand(commandArgs);
        break;

      case 'release':
        await releaseCommand(commandArgs);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "workflow help" for available commands.');
        process.exit(1);
    }
  } catch (err) {
    const log = new Logger();
    if (err instanceof Error) {
      log.error(err.message, err.stack);
    } else {
      log.error(String(err));
    }
    process.exit(1);
  }
}

async function rollbackCommand(args: string[]): Promise<void> {
  const log = new Logger(args.includes('--verbose') || args.includes('-v'));
  const targetPath = args.find(a => !a.startsWith('-')) || process.cwd();

  log.header('Claude Workflow Engine Rollback');

  const stateManager = new StateManager(path.resolve(targetPath), true);

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
  } else {
    log.error(result.message);
    process.exit(1);
  }
}

function showHelp(): void {
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
  \x1b[32mrelease\x1b[0m     Bump version and create release
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
