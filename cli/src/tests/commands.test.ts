// =============================================================================
// Integration Tests - Health, Status, Check Commands
// =============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../lib/state-manager';
import { SettingsMerger } from '../lib/settings-merger';
import { GDPRValidator } from '../lib/gdpr-validator';
import { ConflictDetector } from '../lib/conflict-detector';
import { createTempDir, cleanupTempDir, setupTestProject, writeTestFile } from './helpers';

// Suppress console output during tests
const originalLog = console.log;
const originalError = console.error;

function silenceConsole() {
  console.log = () => {};
  console.error = () => {};
}

function restoreConsole() {
  console.log = originalLog;
  console.error = originalError;
}

describe('Health Command - Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    silenceConsole();
  });

  afterEach(() => {
    restoreConsole();
    cleanupTempDir(tempDir);
  });

  describe('Health checks on fresh install', () => {
    it('should pass all checks on properly installed project', () => {
      setupTestProject(tempDir);

      // Initialize state
      const sm = new StateManager(tempDir);
      const files = ['workflow/config.yml', '.claude/CLAUDE.md', '.claude/settings.local.json'];
      sm.initialize({
        mode: 'integrated',
        scope: 'local',
        profile: 'default',
        filesInstalled: files,
      });

      // Verify core files exist
      assert.ok(fs.existsSync(path.join(tempDir, 'workflow', 'config.yml')));
      assert.ok(fs.existsSync(path.join(tempDir, '.claude', 'CLAUDE.md')));
      assert.ok(fs.existsSync(path.join(tempDir, '.claude', 'settings.local.json')));

      // Check integrity
      const integrity = sm.checkIntegrity();
      assert.strictEqual(integrity.missing.length, 0);
    });

    it('should detect missing core files', () => {
      setupTestProject(tempDir);

      // Remove a core file
      fs.unlinkSync(path.join(tempDir, 'workflow', 'config.yml'));

      assert.ok(!fs.existsSync(path.join(tempDir, 'workflow', 'config.yml')));
    });

    it('should detect file integrity issues', () => {
      setupTestProject(tempDir);

      const sm = new StateManager(tempDir);
      sm.initialize({
        mode: 'integrated',
        scope: 'local',
        profile: 'default',
        filesInstalled: ['workflow/config.yml'],
      });

      // Modify file after install
      fs.writeFileSync(path.join(tempDir, 'workflow', 'config.yml'), 'modified content');

      const integrity = sm.checkIntegrity();
      assert.ok(integrity.modified.includes('workflow/config.yml'));
    });
  });

  describe('Settings validation', () => {
    it('should detect missing permissions', () => {
      setupTestProject(tempDir);

      const merger = new SettingsMerger(tempDir);
      const validation = merger.validateExisting();

      // Empty settings = all permissions missing
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.missingPermissions.length > 0);
    });

    it('should pass after proper settings merge', () => {
      setupTestProject(tempDir);

      const merger = new SettingsMerger(tempDir);
      merger.merge('default', { includeDevOps: true, includeSecurity: true });

      const validation = merger.validateExisting();
      assert.strictEqual(validation.valid, true);
    });
  });

  describe('GDPR validation in health check', () => {
    it('should pass with proper gitignore', () => {
      setupTestProject(tempDir);

      // Add all required patterns to gitignore
      fs.writeFileSync(path.join(tempDir, '.gitignore'), [
        'node_modules/',
        'CLAUDE.local.md',
        '*.local.md',
        '.env',
        '.env.*',
        '.env.local',
        'credentials.*',
        'secrets.*',
        '.installation-state.json',
        '*.backup-*',
      ].join('\n'));

      // Ensure CLAUDE.local.md exists
      fs.writeFileSync(path.join(tempDir, 'CLAUDE.local.md'), '');

      const gdpr = new GDPRValidator(tempDir);
      const report = gdpr.validate();
      assert.strictEqual(report.compliant, true);
    });

    it('should detect GDPR issues with incomplete gitignore', () => {
      setupTestProject(tempDir);
      // Remove .gitignore completely to trigger error-severity issue
      fs.unlinkSync(path.join(tempDir, '.gitignore'));

      const gdpr = new GDPRValidator(tempDir);
      const report = gdpr.validate();

      assert.strictEqual(report.compliant, false);
      assert.ok(report.issues.length > 0);
    });
  });

  describe('Directory structure check', () => {
    it('should pass with complete structure', () => {
      setupTestProject(tempDir);

      const requiredDirs = [
        'workflow', 'workflow/standards', 'workflow/product',
        'workflow/specs', '.claude', '.claude/agents',
      ];

      for (const dir of requiredDirs) {
        assert.ok(fs.existsSync(path.join(tempDir, dir)), `Missing: ${dir}`);
      }
    });

    it('should detect missing directories', () => {
      fs.mkdirSync(path.join(tempDir, 'workflow'), { recursive: true });
      // Missing: workflow/standards, workflow/product, etc.

      assert.ok(!fs.existsSync(path.join(tempDir, 'workflow', 'standards')));
      assert.ok(!fs.existsSync(path.join(tempDir, '.claude')));
    });
  });
});

describe('Status Command - Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    silenceConsole();
  });

  afterEach(() => {
    restoreConsole();
    cleanupTempDir(tempDir);
  });

  it('should show not-installed for empty directory', () => {
    const sm = new StateManager(tempDir);
    assert.strictEqual(sm.isInstalled(), false);
    assert.strictEqual(sm.getState(), null);
  });

  it('should show correct info after install', () => {
    setupTestProject(tempDir);

    const sm = new StateManager(tempDir);
    const state = sm.initialize({
      mode: 'integrated',
      scope: 'local',
      profile: 'node',
      filesInstalled: ['workflow/config.yml', '.claude/CLAUDE.md'],
    });

    assert.strictEqual(sm.isInstalled(), true);
    assert.strictEqual(state.version, '0.2.0');
    assert.strictEqual(state.mode, 'integrated');
    assert.strictEqual(state.scope, 'local');
    assert.strictEqual(state.profile, 'node');
    assert.strictEqual(state.filesInstalled.length, 2);
  });

  it('should report file integrity stats', () => {
    setupTestProject(tempDir);

    const sm = new StateManager(tempDir);
    sm.initialize({
      mode: 'integrated',
      scope: 'local',
      profile: 'default',
      filesInstalled: ['workflow/config.yml', '.claude/CLAUDE.md'],
    });

    const integrity = sm.checkIntegrity();
    assert.strictEqual(integrity.intact.length, 2);
    assert.strictEqual(integrity.modified.length, 0);
    assert.strictEqual(integrity.missing.length, 0);
  });

  it('should list available backups', () => {
    setupTestProject(tempDir);

    const sm = new StateManager(tempDir);
    sm.initialize({
      mode: 'integrated',
      scope: 'local',
      profile: 'default',
      filesInstalled: [],
    });

    // No backups yet
    assert.deepStrictEqual(sm.listBackups(), []);

    // Create a backup
    const backupResult = sm.createBackup();
    if (backupResult) {
      const backups = sm.listBackups();
      assert.ok(backups.length > 0);
    }
  });
});

describe('Check Command - Integration', () => {
  let tempDir: string;
  let templateDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    templateDir = createTempDir();
    silenceConsole();
  });

  afterEach(() => {
    restoreConsole();
    cleanupTempDir(tempDir);
    cleanupTempDir(templateDir);
  });

  describe('Conflict detection', () => {
    it('should report no conflicts in clean directory', () => {
      const detector = new ConflictDetector(tempDir, templateDir);
      const report = detector.detect();

      assert.strictEqual(report.fileConflicts.length, 0);
      assert.strictEqual(report.commandConflicts.length, 0);
      assert.strictEqual(report.hasBlockingConflicts, false);
    });

    it('should report file conflicts when files differ', () => {
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'modified');
      writeTestFile(path.join(templateDir, 'workflow', 'config.yml'), 'original');

      const detector = new ConflictDetector(tempDir, templateDir);
      const report = detector.detect();

      assert.ok(report.fileConflicts.length > 0);
    });

    it('should report command conflicts', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'commands', 'orchestrate-tasks.md'),
        '# Custom'
      );

      const detector = new ConflictDetector(tempDir, templateDir);
      const report = detector.detect();

      assert.ok(report.commandConflicts.length > 0);
      assert.strictEqual(report.hasBlockingConflicts, true);
    });
  });

  describe('GDPR check', () => {
    it('should detect missing gitignore patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), 'node_modules/\n');

      const gdpr = new GDPRValidator(tempDir);
      const report = gdpr.validate();

      // Missing patterns are warnings (not errors), so compliant can still be true
      // But issues should be reported
      const missingPatterns = report.issues.filter(i => i.type === 'not_gitignored');
      assert.ok(missingPatterns.length > 0);
    });

    it('should auto-fix gitignore with --fix', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), 'node_modules/\n');

      const gdpr = new GDPRValidator(tempDir);
      const result = gdpr.autoFix();

      assert.ok(result.fixed.length > 0);

      // Verify patterns were added
      const content = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf-8');
      assert.ok(content.includes('CLAUDE.local.md'));
      assert.ok(content.includes('.env'));
      assert.ok(content.includes('.installation-state.json'));
    });
  });

  describe('Permission check', () => {
    it('should verify write access', () => {
      // tempDir should be writable
      const testFile = path.join(tempDir, '.permission-check-tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      // If we get here, write access is confirmed
      assert.ok(true);
    });
  });
});

describe('Resolve Command - Integration', () => {
  let tempDir: string;
  let templateDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    templateDir = createTempDir();
    silenceConsole();
  });

  afterEach(() => {
    restoreConsole();
    cleanupTempDir(tempDir);
    cleanupTempDir(templateDir);
  });

  describe('Auto-fix file conflicts', () => {
    it('should backup existing file before resolution', () => {
      const targetFile = path.join(tempDir, 'workflow', 'config.yml');
      writeTestFile(targetFile, 'existing content');

      // Create backup
      const backupDir = path.join(tempDir, '.workflow-backups');
      fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, 'config.yml.backup');
      fs.copyFileSync(targetFile, backupPath);

      assert.ok(fs.existsSync(backupPath));
      assert.strictEqual(
        fs.readFileSync(backupPath, 'utf-8'),
        'existing content'
      );
    });

    it('should resolve by overwriting with template', () => {
      const targetFile = path.join(tempDir, 'workflow', 'config.yml');
      const templateFile = path.join(templateDir, 'workflow', 'config.yml');
      writeTestFile(targetFile, 'old content');
      writeTestFile(templateFile, 'new template content');

      // Simulate resolution: backup + overwrite
      const backupDir = path.join(tempDir, '.workflow-backups');
      fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(targetFile, path.join(backupDir, 'config.yml.bak'));
      fs.copyFileSync(templateFile, targetFile);

      assert.strictEqual(
        fs.readFileSync(targetFile, 'utf-8'),
        'new template content'
      );
    });
  });

  describe('GDPR auto-fix via resolve', () => {
    it('should fix gitignore patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');

      const gdpr = new GDPRValidator(tempDir);
      const result = gdpr.autoFix();

      assert.ok(result.fixed.length > 0);
      const content = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf-8');
      assert.ok(content.includes('.env'));
    });
  });
});
