// =============================================================================
// Unit Tests - SettingsMerger
// =============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { SettingsMerger } from '../lib/settings-merger';
import { createTempDir, cleanupTempDir, writeTestFile } from './helpers';

describe('SettingsMerger', () => {
  let tempDir: string;
  let merger: SettingsMerger;

  beforeEach(() => {
    tempDir = createTempDir();
    merger = new SettingsMerger(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('generate', () => {
    it('should generate settings with base permissions for default profile', () => {
      const settings = merger.generate('default');

      assert.ok(settings.permissions);
      assert.ok(settings.permissions!.allow);
      assert.ok(settings.permissions!.allow!.includes('WebSearch'));
      assert.ok(settings.permissions!.allow!.includes('WebFetch'));
      assert.ok(settings.permissions!.allow!.some(p => p.startsWith('Skill(')));
      assert.ok(settings.permissions!.allow!.some(p => p.startsWith('Agent(')));
    });

    it('should include node-specific permissions for node profile', () => {
      const settings = merger.generate('node');

      assert.ok(settings.permissions!.allow!.includes('Bash(npm:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(npx:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(node:*)'));
    });

    it('should include python-specific permissions for python profile', () => {
      const settings = merger.generate('python');

      assert.ok(settings.permissions!.allow!.includes('Bash(python3:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(pip:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(pytest:*)'));
    });

    it('should include rust-specific permissions for rust profile', () => {
      const settings = merger.generate('rust');

      assert.ok(settings.permissions!.allow!.includes('Bash(cargo:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(rustc:*)'));
    });

    it('should include devops permissions when requested', () => {
      const settings = merger.generate('default', { includeDevOps: true });

      assert.ok(settings.permissions!.allow!.includes('Bash(docker:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(terraform:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(kubectl:*)'));
    });

    it('should include security permissions when requested', () => {
      const settings = merger.generate('default', { includeSecurity: true });

      assert.ok(settings.permissions!.allow!.includes('Bash(trivy:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(semgrep:*)'));
    });

    it('should not include devops/security by default', () => {
      const settings = merger.generate('default');

      assert.ok(!settings.permissions!.allow!.includes('Bash(docker:*)'));
      assert.ok(!settings.permissions!.allow!.includes('Bash(trivy:*)'));
    });

    it('should deduplicate permissions', () => {
      const settings = merger.generate('node', { includeDevOps: true, includeSecurity: true });
      const perms = settings.permissions!.allow!;
      const unique = [...new Set(perms)];
      assert.strictEqual(perms.length, unique.length);
    });

    it('should include default bash permissions in all profiles', () => {
      const settings = merger.generate('node');

      assert.ok(settings.permissions!.allow!.includes('Bash(git clone:*)'));
      assert.ok(settings.permissions!.allow!.includes('Bash(mkdir:*)'));
    });
  });

  describe('merge', () => {
    it('should create settings file if it does not exist', () => {
      const result = merger.merge('default');
      const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');

      assert.ok(fs.existsSync(settingsPath));
      assert.ok(result.addedPermissions.length > 0);
    });

    it('should preserve existing permissions', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        JSON.stringify({
          permissions: { allow: ['CustomPermission'] }
        })
      );

      const result = merger.merge('default');
      assert.ok(result.merged.permissions!.allow!.includes('CustomPermission'));
    });

    it('should not duplicate already-present permissions', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        JSON.stringify({
          permissions: { allow: ['WebSearch', 'WebFetch'] }
        })
      );

      const result = merger.merge('default');
      assert.ok(result.existingPermissions.includes('WebSearch'));
      assert.ok(result.existingPermissions.includes('WebFetch'));

      // Check no duplicates
      const perms = result.merged.permissions!.allow!;
      const webSearchCount = perms.filter(p => p === 'WebSearch').length;
      assert.strictEqual(webSearchCount, 1);
    });

    it('should not write file in dry-run mode', () => {
      const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
      merger.merge('default', { dryRun: true });
      assert.ok(!fs.existsSync(settingsPath));
    });

    it('should return correct filePath', () => {
      const result = merger.merge('default', { dryRun: true });
      assert.ok(result.filePath.includes('settings.local.json'));
    });

    it('should preserve non-permission fields', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        JSON.stringify({
          customField: 'preserved',
          permissions: { allow: [] }
        })
      );

      const result = merger.merge('default');
      assert.strictEqual((result.merged as any).customField, 'preserved');
    });
  });

  describe('validateExisting', () => {
    it('should report valid when all base permissions present', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        JSON.stringify(merger.generate('default', { includeDevOps: true, includeSecurity: true }))
      );

      const validation = merger.validateExisting();
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.missingPermissions.length, 0);
    });

    it('should identify missing permissions', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        JSON.stringify({ permissions: { allow: ['WebSearch'] } })
      );

      const validation = merger.validateExisting();
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.missingPermissions.length > 0);
      assert.ok(validation.missingPermissions.includes('WebFetch'));
    });

    it('should identify extra (unknown) permissions', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        JSON.stringify({
          permissions: { allow: ['WebSearch', 'WebFetch', 'UnknownCustom'] }
        })
      );

      const validation = merger.validateExisting();
      assert.ok(validation.extraPermissions.includes('UnknownCustom'));
    });

    it('should handle missing settings file', () => {
      const validation = merger.validateExisting();
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.missingPermissions.length > 0);
    });

    it('should handle corrupted settings file', () => {
      writeTestFile(
        path.join(tempDir, '.claude', 'settings.local.json'),
        'not valid json'
      );

      const validation = merger.validateExisting();
      assert.strictEqual(validation.valid, false);
    });
  });
});
