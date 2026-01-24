// =============================================================================
// Claude Workflow Engine CLI - Health Command
// Monitors and reports on Claude Workflow Engine installation health
// =============================================================================

import * as path from 'path';
import {
  HealthOptions,
  HealthStatus,
  HealthCheck,
} from '../lib/types';
import { StateManager } from '../lib/state-manager';
import { GDPRValidator } from '../lib/gdpr-validator';
import { SettingsMerger } from '../lib/settings-merger';
import { Logger } from '../lib/logger';
import {
  pathExists,
  isDirectory,
  readFileSafe,
} from '../lib/fs-utils';

export async function healthCommand(args: string[]): Promise<void> {
  const options = parseHealthArgs(args);
  const log = new Logger(options.verbose);
  const targetPath = path.resolve(options.path);

  log.header('Claude Workflow Engine Health Check');

  const checks: HealthCheck[] = [];

  // --- Core Files ---
  log.section('Core Files');
  checks.push(...checkCoreFiles(targetPath, log));

  // --- Installation State ---
  log.section('Installation State');
  checks.push(...checkInstallationState(targetPath, log, options.verbose));

  // --- File Integrity ---
  log.section('File Integrity');
  checks.push(...checkFileIntegrity(targetPath, log, options.verbose));

  // --- Settings Validity ---
  log.section('Settings');
  checks.push(...checkSettings(targetPath, log, options.verbose));

  // --- GDPR Status ---
  log.section('DSGVO/GDPR');
  checks.push(...checkGDPR(targetPath, log, options.verbose));

  // --- Hooks & Scripts ---
  log.section('Hooks & Scripts');
  checks.push(...checkHookScripts(targetPath, log, options.fix));

  // --- Skills ---
  log.section('Skills');
  checks.push(...checkSkillsCount(targetPath, log));

  // --- Directory Structure ---
  log.section('Directory Structure');
  checks.push(...checkDirectoryStructure(targetPath, log));

  // --- Determine Overall Status ---
  const errors = checks.filter(c => c.status === 'error');
  const warnings = checks.filter(c => c.status === 'warning');
  const ok = checks.filter(c => c.status === 'ok');

  let overall: 'healthy' | 'degraded' | 'broken';
  if (errors.length > 0) {
    overall = 'broken';
  } else if (warnings.length > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }

  const status: HealthStatus = {
    overall,
    checks,
    lastChecked: new Date().toISOString(),
  };

  // --- Display Summary ---
  log.newline();
  log.section('Summary');

  const statusLabel = {
    healthy: '\x1b[32mHEALTHY\x1b[0m',
    degraded: '\x1b[33mDEGRADED\x1b[0m',
    broken: '\x1b[31mBROKEN\x1b[0m',
  };

  log.info(`Overall Status: ${statusLabel[overall]}`);
  log.summary(ok.length, warnings.length, errors.length);

  // --- Auto-Fix ---
  if (options.fix && (errors.length > 0 || warnings.length > 0)) {
    log.section('Auto-Fix');
    const fixable = checks.filter(c => c.fixable && c.status !== 'ok');

    if (fixable.length === 0) {
      log.info('No auto-fixable issues found. Manual intervention required.');
    } else {
      for (const check of fixable) {
        log.step(`Fixing: ${check.component} - ${check.fixAction || 'auto-repair'}`);
        // Execute fixes
        await executeHealthFix(check, targetPath, log);
      }
      log.newline();
      log.done('Auto-fix completed. Run health check again to verify.');
    }
  }

  // --- Report Output ---
  if (options.report) {
    const reportPath = path.join(targetPath, '.workflow-health-report.json');
    const reportContent = JSON.stringify(status, null, 2);
    require('fs').writeFileSync(reportPath, reportContent);
    log.info(`Health report saved: ${reportPath}`);
  }

  // Exit with appropriate code
  if (overall === 'broken') {
    process.exit(1);
  }
}

function checkCoreFiles(targetPath: string, log: Logger): HealthCheck[] {
  const checks: HealthCheck[] = [];

  const coreFiles = [
    { path: 'workflow/config.yml', critical: true },
    { path: '.claude/CLAUDE.md', critical: true },
    { path: '.claude/settings.local.json', critical: true },
    { path: '.claude-plugin/plugin.json', critical: true },
    { path: 'hooks/hooks.json', critical: true },
    { path: '.gitignore', critical: false },
  ];

  for (const file of coreFiles) {
    const fullPath = path.join(targetPath, file.path);
    if (pathExists(fullPath)) {
      log.pass(file.path);
      checks.push({
        component: file.path,
        status: 'ok',
        message: 'File exists',
        fixable: false,
      });
    } else {
      if (file.critical) {
        log.fail(`Missing: ${file.path}`);
        checks.push({
          component: file.path,
          status: 'error',
          message: `Critical file missing: ${file.path}`,
          fixable: true,
          fixAction: `Regenerate ${file.path}`,
        });
      } else {
        log.warn(`Missing: ${file.path}`);
        checks.push({
          component: file.path,
          status: 'warning',
          message: `Optional file missing: ${file.path}`,
          fixable: true,
          fixAction: `Create ${file.path}`,
        });
      }
    }
  }

  return checks;
}

function checkInstallationState(targetPath: string, log: Logger, verbose: boolean): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const stateManager = new StateManager(targetPath, verbose);
  const state = stateManager.getState();

  if (state) {
    log.pass(`Installed: v${state.version} (${state.installedAt})`);
    log.info(`Mode: ${state.mode}, Scope: ${state.scope}, Profile: ${state.profile}`);
    log.info(`Files tracked: ${state.filesInstalled.length}`);
    log.info(`History events: ${state.history.length}`);

    checks.push({
      component: 'installation_state',
      status: 'ok',
      message: `Claude Workflow Engine v${state.version} installed`,
      fixable: false,
    });

    // Check for failed events
    const failedEvents = state.history.filter(e => !e.success);
    if (failedEvents.length > 0) {
      log.warn(`${failedEvents.length} failed operations in history`);
      checks.push({
        component: 'installation_history',
        status: 'warning',
        message: `${failedEvents.length} failed operations detected`,
        fixable: false,
      });
    }
  } else {
    log.warn('No installation state found');
    checks.push({
      component: 'installation_state',
      status: 'warning',
      message: 'Installation state file missing - run "workflow install" to initialize',
      fixable: true,
      fixAction: 'Initialize installation state',
    });
  }

  return checks;
}

function checkFileIntegrity(targetPath: string, log: Logger, verbose: boolean): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const stateManager = new StateManager(targetPath, verbose);
  const integrity = stateManager.checkIntegrity();

  if (integrity.intact.length > 0) {
    log.pass(`${integrity.intact.length} files intact`);
  }

  if (integrity.modified.length > 0) {
    log.warn(`${integrity.modified.length} files modified since installation`);
    if (verbose) {
      for (const file of integrity.modified) {
        log.debug(`  Modified: ${file}`);
      }
    }
    checks.push({
      component: 'file_integrity',
      status: 'warning',
      message: `${integrity.modified.length} files differ from installation`,
      fixable: false,
    });
  }

  if (integrity.missing.length > 0) {
    log.fail(`${integrity.missing.length} files missing`);
    if (verbose) {
      for (const file of integrity.missing) {
        log.debug(`  Missing: ${file}`);
      }
    }
    checks.push({
      component: 'file_integrity_missing',
      status: 'error',
      message: `${integrity.missing.length} tracked files are missing`,
      fixable: true,
      fixAction: 'Reinstall missing files',
    });
  }

  if (integrity.modified.length === 0 && integrity.missing.length === 0 && integrity.intact.length > 0) {
    checks.push({
      component: 'file_integrity',
      status: 'ok',
      message: 'All tracked files intact',
      fixable: false,
    });
  }

  return checks;
}

function checkSettings(targetPath: string, log: Logger, verbose: boolean): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const merger = new SettingsMerger(targetPath, verbose);
  const validation = merger.validateExisting();

  if (validation.valid) {
    log.pass('All required permissions present');
    checks.push({
      component: 'settings_permissions',
      status: 'ok',
      message: 'Settings are valid',
      fixable: false,
    });
  } else {
    log.warn(`${validation.missingPermissions.length} required permissions missing`);
    if (verbose) {
      for (const perm of validation.missingPermissions) {
        log.debug(`  Missing: ${perm}`);
      }
    }
    checks.push({
      component: 'settings_permissions',
      status: 'warning',
      message: `${validation.missingPermissions.length} permissions need to be added`,
      fixable: true,
      fixAction: 'Add missing permissions to settings.local.json',
    });
  }

  if (validation.extraPermissions.length > 0 && verbose) {
    log.info(`${validation.extraPermissions.length} custom permissions detected`);
  }

  return checks;
}

function checkGDPR(targetPath: string, log: Logger, verbose: boolean): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const gdpr = new GDPRValidator(targetPath, verbose);
  const report = gdpr.validate();

  if (report.compliant) {
    log.pass('DSGVO/GDPR compliant');
    checks.push({
      component: 'gdpr_compliance',
      status: 'ok',
      message: 'GDPR configuration is compliant',
      fixable: false,
    });
  } else {
    const errorIssues = report.issues.filter(i => i.severity === 'error');
    const warnIssues = report.issues.filter(i => i.severity === 'warning');

    if (errorIssues.length > 0) {
      log.fail(`${errorIssues.length} GDPR errors`);
      checks.push({
        component: 'gdpr_compliance',
        status: 'error',
        message: `${errorIssues.length} GDPR compliance errors`,
        fixable: true,
        fixAction: 'Run GDPR auto-fix',
      });
    }
    if (warnIssues.length > 0) {
      log.warn(`${warnIssues.length} GDPR warnings`);
      checks.push({
        component: 'gdpr_warnings',
        status: 'warning',
        message: `${warnIssues.length} GDPR warnings`,
        fixable: true,
        fixAction: 'Review GDPR recommendations',
      });
    }
  }

  return checks;
}

function checkHookScripts(targetPath: string, log: Logger, autoFix: boolean): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const fs = require('fs');
  const scriptsDir = path.join(targetPath, 'hooks', 'scripts');

  if (!pathExists(scriptsDir)) {
    log.fail('hooks/scripts/ directory missing');
    checks.push({
      component: 'hook_scripts',
      status: 'error',
      message: 'Hook scripts directory missing',
      fixable: false,
    });
    return checks;
  }

  const expectedScripts = ['common.sh', 'session-start.sh', 'pre-write-validate.sh', 'post-write-log.sh'];
  let allExecutable = true;

  for (const script of expectedScripts) {
    const scriptPath = path.join(scriptsDir, script);
    if (!pathExists(scriptPath)) {
      log.fail(`Missing: hooks/scripts/${script}`);
      checks.push({
        component: `hook_script_${script}`,
        status: 'error',
        message: `Hook script missing: ${script}`,
        fixable: false,
      });
      allExecutable = false;
      continue;
    }

    try {
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      if (isExecutable) {
        log.pass(`hooks/scripts/${script} (executable)`);
      } else {
        allExecutable = false;
        if (autoFix) {
          fs.chmodSync(scriptPath, 0o755);
          log.pass(`hooks/scripts/${script} (fixed: chmod +x)`);
        } else {
          log.warn(`hooks/scripts/${script} is not executable`);
          checks.push({
            component: `hook_script_${script}`,
            status: 'warning',
            message: `${script} is not executable`,
            fixable: true,
            fixAction: `chmod +x hooks/scripts/${script}`,
          });
        }
      }
    } catch {
      log.fail(`Cannot stat: hooks/scripts/${script}`);
      allExecutable = false;
    }
  }

  if (allExecutable && checks.filter(c => c.component.startsWith('hook_script_')).length === 0) {
    checks.push({
      component: 'hook_scripts',
      status: 'ok',
      message: 'All hook scripts present and executable',
      fixable: false,
    });
  }

  return checks;
}

function checkSkillsCount(targetPath: string, log: Logger): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const fs = require('fs');
  const skillsDir = path.join(targetPath, '.claude', 'skills', 'workflow');

  if (!pathExists(skillsDir)) {
    log.fail('.claude/skills/workflow/ directory missing');
    checks.push({
      component: 'skills_count',
      status: 'error',
      message: 'Skills directory missing',
      fixable: false,
    });
    return checks;
  }

  // Count skill directories (each should have a SKILL.md)
  let skillCount = 0;
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
        if (pathExists(skillFile)) {
          skillCount++;
        }
      }
    }
  } catch {
    // ignore read errors
  }

  const expectedMin = 10;
  if (skillCount >= expectedMin) {
    log.pass(`${skillCount} skills found (minimum: ${expectedMin})`);
    checks.push({
      component: 'skills_count',
      status: 'ok',
      message: `${skillCount} skills present`,
      fixable: false,
    });
  } else {
    log.warn(`Only ${skillCount} skills found (expected at least ${expectedMin})`);
    checks.push({
      component: 'skills_count',
      status: 'warning',
      message: `Only ${skillCount}/${expectedMin} skills found`,
      fixable: false,
    });
  }

  return checks;
}

function checkDirectoryStructure(targetPath: string, log: Logger): HealthCheck[] {
  const checks: HealthCheck[] = [];

  const requiredDirs = [
    'workflow',
    'workflow/standards',
    'workflow/product',
    'workflow/specs',
    '.claude',
    '.claude/agents',
    '.claude-plugin',
    'hooks',
    'hooks/scripts',
  ];

  let allPresent = true;
  for (const dir of requiredDirs) {
    const fullPath = path.join(targetPath, dir);
    if (isDirectory(fullPath)) {
      if (log) log.pass(dir + '/');
    } else {
      log.fail(`Missing directory: ${dir}/`);
      allPresent = false;
    }
  }

  checks.push({
    component: 'directory_structure',
    status: allPresent ? 'ok' : 'error',
    message: allPresent ? 'Directory structure complete' : 'Missing required directories',
    fixable: true,
    fixAction: 'Create missing directories',
  });

  return checks;
}

async function executeHealthFix(check: HealthCheck, targetPath: string, log: Logger): Promise<void> {
  const fs = require('fs');

  switch (check.component) {
    case 'settings_permissions': {
      const merger = new SettingsMerger(targetPath);
      merger.merge('default', { includeDevOps: true, includeSecurity: true });
      log.pass('Permissions updated');
      break;
    }
    case 'gdpr_compliance':
    case 'gdpr_warnings': {
      const gdpr = new GDPRValidator(targetPath);
      const result = gdpr.autoFix();
      for (const fix of result.fixed) {
        log.pass(fix);
      }
      break;
    }
    case 'directory_structure': {
      const dirs = [
        'workflow', 'workflow/standards', 'workflow/product',
        'workflow/specs', '.claude', '.claude/agents',
        '.claude-plugin', 'hooks', 'hooks/scripts',
      ];
      for (const dir of dirs) {
        const fullPath = path.join(targetPath, dir);
        if (!pathExists(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          log.pass(`Created: ${dir}/`);
        }
      }
      break;
    }
    default:
      log.info(`Manual fix required for: ${check.component}`);
      break;
  }
}

function parseHealthArgs(args: string[]): HealthOptions {
  const options: HealthOptions = {
    fix: false,
    report: false,
    path: process.cwd(),
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--fix':
        options.fix = true;
        break;
      case '--report':
        options.report = true;
        break;
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
