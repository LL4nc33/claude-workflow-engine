// =============================================================================
// Unit Tests - PreFlightChecker
// =============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { PreFlightChecker } from '../lib/preflight';
import { InstallOptions } from '../lib/types';
import { createTempDir, cleanupTempDir, setupTestProject } from './helpers';

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

function createOptions(overrides: Partial<InstallOptions> = {}): InstallOptions {
  return {
    scope: 'local',
    mode: 'integrated',
    profile: 'default',
    path: '/tmp',
    dryRun: false,
    force: false,
    verbose: false,
    ...overrides,
  };
}

describe('PreFlightChecker', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    silenceConsole();
  });

  afterEach(() => {
    restoreConsole();
    cleanupTempDir(tempDir);
  });

  describe('run', () => {
    it('should return a PreFlightReport', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      assert.ok(report.timestamp);
      assert.ok(report.platform);
      assert.ok(report.nodeVersion);
      assert.ok(Array.isArray(report.checks));
      assert.ok(typeof report.canProceed === 'boolean');
      assert.ok(typeof report.warnings === 'number');
      assert.ok(typeof report.errors === 'number');
    });

    it('should pass node version check (running node >= 18)', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const nodeCheck = report.checks.find(c => c.name === 'node_version');
      assert.ok(nodeCheck);
      assert.strictEqual(nodeCheck!.status, 'pass');
    });

    it('should detect git availability', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const gitCheck = report.checks.find(c => c.name === 'git_available');
      assert.ok(gitCheck);
      // Git should be available in CI/dev environments
      assert.ok(gitCheck!.status === 'pass' || gitCheck!.status === 'warn');
    });

    it('should report platform information', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const platformCheck = report.checks.find(c => c.name === 'platform');
      assert.ok(platformCheck);
      assert.strictEqual(platformCheck!.status, 'pass');
    });

    it('should check target path exists', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const pathCheck = report.checks.find(c => c.name === 'target_path');
      assert.ok(pathCheck);
      assert.strictEqual(pathCheck!.status, 'pass');
    });

    it('should fail for non-existing target path in local scope', () => {
      const options = createOptions({ path: path.join(tempDir, 'nonexist'), scope: 'local' });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const pathCheck = report.checks.find(c => c.name === 'target_exists');
      assert.ok(pathCheck);
      assert.strictEqual(pathCheck!.status, 'fail');
    });

    it('should report non-git-repo as warning', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const gitRepoCheck = report.checks.find(c => c.name === 'git_repo');
      assert.ok(gitRepoCheck);
      assert.strictEqual(gitRepoCheck!.status, 'warn');
    });

    it('should detect git repo when .git exists', () => {
      fs.mkdirSync(path.join(tempDir, '.git'), { recursive: true });
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const gitRepoCheck = report.checks.find(c => c.name === 'git_repo');
      assert.ok(gitRepoCheck);
      assert.strictEqual(gitRepoCheck!.status, 'pass');
    });

    it('should allow proceed when force is true despite errors', () => {
      const options = createOptions({
        path: path.join(tempDir, 'nonexist'),
        scope: 'local',
        force: true,
      });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      assert.strictEqual(report.canProceed, true);
    });

    it('should prevent proceed when errors exist without force', () => {
      const options = createOptions({
        path: path.join(tempDir, 'nonexist'),
        scope: 'local',
        force: false,
      });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      assert.strictEqual(report.canProceed, false);
    });
  });

  describe('checkEnvironment (via run)', () => {
    it('should include node version in report', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      assert.ok(report.nodeVersion.startsWith('v'));
    });

    it('should include platform in report', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      assert.ok(['linux', 'darwin', 'win32'].includes(report.platform));
    });
  });

  describe('checkPlatform (via run)', () => {
    it('should report disk space when available', () => {
      const options = createOptions({ path: tempDir });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const diskCheck = report.checks.find(c => c.name === 'disk_space');
      // Disk check might not be available in all environments
      if (diskCheck) {
        assert.ok(diskCheck.status === 'pass' || diskCheck.status === 'warn');
      }
    });
  });

  describe('checkTargetPath (via run)', () => {
    it('should fail when target is a file not directory', () => {
      const filePath = path.join(tempDir, 'not-a-dir');
      fs.writeFileSync(filePath, 'file content');

      const options = createOptions({ path: filePath });
      const checker = new PreFlightChecker(options);
      const report = checker.run();

      const dirCheck = report.checks.find(c => c.name === 'target_is_dir');
      assert.ok(dirCheck);
      assert.strictEqual(dirCheck!.status, 'fail');
    });
  });
});
