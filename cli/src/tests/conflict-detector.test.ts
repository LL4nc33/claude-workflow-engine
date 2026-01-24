// =============================================================================
// Unit Tests - ConflictDetector
// =============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { ConflictDetector } from '../lib/conflict-detector';
import { createTempDir, cleanupTempDir, writeTestFile } from './helpers';

describe('ConflictDetector', () => {
  let targetDir: string;
  let templateDir: string;

  beforeEach(() => {
    targetDir = createTempDir();
    templateDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(targetDir);
    cleanupTempDir(templateDir);
  });

  describe('detect', () => {
    it('should return empty report when no conflicts', () => {
      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      assert.strictEqual(report.fileConflicts.length, 0);
      assert.strictEqual(report.commandConflicts.length, 0);
      assert.strictEqual(report.hasBlockingConflicts, false);
    });

    it('should detect file conflicts when files exist in target', () => {
      // Create same file in both target and template with different content
      writeTestFile(path.join(targetDir, 'workflow', 'config.yml'), 'target content');
      writeTestFile(path.join(templateDir, 'workflow', 'config.yml'), 'template content');

      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      assert.ok(report.fileConflicts.length > 0);
      const conflict = report.fileConflicts.find(c => c.path === 'workflow/config.yml');
      assert.ok(conflict);
      assert.strictEqual(conflict!.type, 'modified');
    });

    it('should not report conflicts when target file matches template', () => {
      writeTestFile(path.join(targetDir, 'workflow', 'config.yml'), 'same content');
      writeTestFile(path.join(templateDir, 'workflow', 'config.yml'), 'same content');

      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      const conflict = report.fileConflicts.find(c => c.path === 'workflow/config.yml');
      assert.strictEqual(conflict, undefined);
    });

    it('should detect command namespace conflicts', () => {
      // Create an existing command that conflicts with workflow commands
      writeTestFile(
        path.join(targetDir, '.claude', 'commands', 'plan-product.md'),
        '# Custom plan-product'
      );

      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      assert.ok(report.commandConflicts.length > 0);
      assert.ok(report.hasBlockingConflicts);
    });
  });

  describe('runChecks', () => {
    it('should return pass for clean target', () => {
      const detector = new ConflictDetector(targetDir, templateDir);
      const results = detector.runChecks();

      assert.ok(results.length > 0);
      const installCheck = results.find(r => r.name === 'existing_installation');
      assert.ok(installCheck);
      assert.strictEqual(installCheck!.status, 'pass');
    });

    it('should detect existing installation', () => {
      writeTestFile(path.join(targetDir, 'workflow', 'config.yml'), 'version: 0.1.0\n');

      const detector = new ConflictDetector(targetDir, templateDir);
      const results = detector.runChecks();

      const installCheck = results.find(r => r.name === 'existing_installation');
      assert.ok(installCheck);
      assert.strictEqual(installCheck!.status, 'warn');
      assert.ok(installCheck!.message.includes('0.1.0'));
    });

    it('should check write permissions', () => {
      const detector = new ConflictDetector(targetDir, templateDir);
      const results = detector.runChecks();

      const permCheck = results.find(r => r.name === 'write_permission');
      assert.ok(permCheck);
      assert.strictEqual(permCheck!.status, 'pass');
    });

    it('should report file conflicts as check results', () => {
      writeTestFile(path.join(targetDir, 'workflow', 'config.yml'), 'different');
      writeTestFile(path.join(templateDir, 'workflow', 'config.yml'), 'original');

      const detector = new ConflictDetector(targetDir, templateDir);
      const results = detector.runChecks();

      const conflictChecks = results.filter(r => r.name.startsWith('file_conflict_'));
      assert.ok(conflictChecks.length > 0);
    });

    it('should report command conflicts as errors', () => {
      writeTestFile(
        path.join(targetDir, '.claude', 'commands', 'create-tasks.md'),
        '# Existing'
      );

      const detector = new ConflictDetector(targetDir, templateDir);
      const results = detector.runChecks();

      const cmdConflicts = results.filter(r => r.name.startsWith('cmd_conflict_'));
      assert.ok(cmdConflicts.length > 0);
      assert.ok(cmdConflicts.some(c => c.status === 'fail'));
    });
  });

  describe('detectFileConflicts (via detect)', () => {
    it('should detect modified files in workflow directories', () => {
      // Create files in both target and template dirs under a workflow dir
      writeTestFile(path.join(targetDir, '.claude', 'agents', 'test.md'), 'modified agent');
      writeTestFile(path.join(templateDir, '.claude', 'agents', 'test.md'), 'original agent');

      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      const agentConflict = report.fileConflicts.find(c => c.path.includes('agents'));
      assert.ok(agentConflict);
    });

    it('should handle file existing only in target (no template)', () => {
      writeTestFile(path.join(targetDir, '.claude', 'CLAUDE.md'), 'existing');
      // No corresponding template file

      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      const conflict = report.fileConflicts.find(c => c.path === '.claude/CLAUDE.md');
      assert.ok(conflict);
      assert.strictEqual(conflict!.type, 'exists');
    });
  });

  describe('detectCommandConflicts (via detect)', () => {
    it('should not report conflicts when no commands exist', () => {
      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();
      assert.strictEqual(report.commandConflicts.length, 0);
    });

    it('should detect multiple command conflicts', () => {
      const commands = ['plan-product', 'shape-spec', 'write-spec'];
      for (const cmd of commands) {
        writeTestFile(
          path.join(targetDir, '.claude', 'commands', `${cmd}.md`),
          `# ${cmd}`
        );
      }

      const detector = new ConflictDetector(targetDir, templateDir);
      const report = detector.detect();

      assert.strictEqual(report.commandConflicts.length, 3);
    });
  });
});
