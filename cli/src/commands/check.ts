// =============================================================================
// Claude Workflow Engine CLI - Check Command
// Runs conflict, permission, and GDPR checks on an installation
// =============================================================================

import * as path from 'path';
import {
  CheckOptions,
} from '../lib/types';
import { ConflictDetector } from '../lib/conflict-detector';
import { GDPRValidator } from '../lib/gdpr-validator';
import { Logger } from '../lib/logger';
import {
  pathExists,
} from '../lib/fs-utils';

export async function checkCommand(args: string[]): Promise<void> {
  const options = parseCheckArgs(args);
  const log = new Logger(options.verbose);
  const targetPath = path.resolve(options.path);

  log.header('Claude Workflow Engine Check');

  if (!pathExists(targetPath)) {
    log.error(`Target path does not exist: ${targetPath}`);
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalPassed = 0;

  // --- Conflict Checks ---
  if (options.conflicts) {
    log.section('Conflict Detection');
    const templatePath = path.join(__dirname, '..', '..', 'templates', 'base');
    const detector = new ConflictDetector(targetPath, templatePath, options.verbose);
    const report = detector.detect();

    if (report.fileConflicts.length === 0 && report.commandConflicts.length === 0) {
      log.pass('No conflicts detected');
      totalPassed++;
    } else {
      // File conflicts
      if (report.fileConflicts.length > 0) {
        log.warn(`${report.fileConflicts.length} file conflict(s):`);
        for (const conflict of report.fileConflicts) {
          const icon = conflict.type === 'permission' ? 'BLOCKED' : conflict.type.toUpperCase();
          log.warn(`  [${icon}] ${conflict.path}`);
          totalWarnings++;
        }
      }

      // Command conflicts
      if (report.commandConflicts.length > 0) {
        log.fail(`${report.commandConflicts.length} command conflict(s):`);
        for (const conflict of report.commandConflicts) {
          log.fail(`  ${conflict.command} (existing: ${conflict.existingSource})`);
          totalErrors++;
        }
      }

      if (report.hasBlockingConflicts) {
        log.newline();
        log.error('Blocking conflicts found. Resolution required before installation.');
        log.info('Run: workflow resolve [path]');
      }
    }
  }

  // --- Permission Checks ---
  if (options.permissions) {
    log.section('Permission Checks');

    // Check file system permissions
    const testDirs = [
      targetPath,
      path.join(targetPath, '.claude'),
      path.join(targetPath, 'workflow'),
    ];

    for (const dir of testDirs) {
      if (!pathExists(dir)) {
        log.info(`Directory will be created: ${path.relative(targetPath, dir) || '.'}`);
        continue;
      }

      try {
        const fs = require('fs');
        const testFile = path.join(dir, '.permission-check-tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        log.pass(`Write access: ${path.relative(targetPath, dir) || '.'}`);
        totalPassed++;
      } catch {
        log.fail(`No write access: ${path.relative(targetPath, dir) || '.'}`);
        totalErrors++;
      }
    }

    // Check settings.local.json permissions
    const settingsPath = path.join(targetPath, '.claude', 'settings.local.json');
    if (pathExists(settingsPath)) {
      try {
        const fs = require('fs');
        fs.accessSync(settingsPath, fs.constants.R_OK | fs.constants.W_OK);
        log.pass('settings.local.json is readable/writable');
        totalPassed++;
      } catch {
        log.fail('settings.local.json is not accessible');
        totalErrors++;
      }
    } else {
      log.info('settings.local.json does not exist yet (will be created)');
    }
  }

  // --- GDPR Checks ---
  if (options.gdpr) {
    log.section('DSGVO/GDPR Compliance');
    const gdpr = new GDPRValidator(targetPath, options.verbose);
    const report = gdpr.validate();

    if (report.compliant) {
      log.pass('DSGVO/GDPR fully compliant');
      totalPassed++;
    } else {
      for (const issue of report.issues) {
        switch (issue.severity) {
          case 'error':
            log.fail(`${issue.file}: ${issue.detail}`);
            totalErrors++;
            break;
          case 'warning':
            log.warn(`${issue.file}: ${issue.detail}`);
            totalWarnings++;
            break;
          case 'info':
            log.info(`${issue.file}: ${issue.detail}`);
            break;
        }
        if (issue.fix && options.verbose) {
          log.debug(`  Fix: ${issue.fix}`);
        }
      }
    }

    // Show recommendations
    if (report.recommendations.length > 0) {
      log.newline();
      log.info('Recommendations:');
      for (const rec of report.recommendations) {
        log.info(`  - ${rec}`);
      }
    }

    // Auto-fix option hint
    if (!report.compliant) {
      log.newline();
      log.info('Run with --fix to auto-resolve gitignore issues:');
      log.info('  workflow check --gdpr --fix [path]');
    }
  }

  // --- Auto-Fix ---
  if (args.includes('--fix') && options.gdpr) {
    log.section('Auto-Fix');
    const gdpr = new GDPRValidator(targetPath, options.verbose);
    const result = gdpr.autoFix();

    if (result.fixed.length > 0) {
      for (const fix of result.fixed) {
        log.pass(fix);
      }
    }
    if (result.manual.length > 0) {
      log.newline();
      log.warn('Manual review required:');
      for (const manual of result.manual) {
        log.warn(`  ${manual}`);
      }
    }
  }

  // --- Summary ---
  log.newline();
  log.summary(totalPassed, totalWarnings, totalErrors);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

function parseCheckArgs(args: string[]): CheckOptions {
  const options: CheckOptions = {
    conflicts: false,
    permissions: false,
    gdpr: false,
    path: process.cwd(),
    verbose: false,
  };

  let anySpecific = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--conflicts':
        options.conflicts = true;
        anySpecific = true;
        break;
      case '--permissions':
        options.permissions = true;
        anySpecific = true;
        break;
      case '--gdpr':
        options.gdpr = true;
        anySpecific = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--fix':
        // Handled in main function
        break;
      default:
        if (!arg.startsWith('-')) {
          options.path = path.resolve(arg);
        }
        break;
    }
  }

  // If no specific check requested, run all
  if (!anySpecific) {
    options.conflicts = true;
    options.permissions = true;
    options.gdpr = true;
  }

  return options;
}
