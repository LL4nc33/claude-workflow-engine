// =============================================================================
// Unit Tests - GDPRValidator
// =============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { GDPRValidator } from '../lib/gdpr-validator';
import { createTempDir, cleanupTempDir, writeTestFile } from './helpers';

describe('GDPRValidator', () => {
  let tempDir: string;
  let validator: GDPRValidator;

  beforeEach(() => {
    tempDir = createTempDir();
    validator = new GDPRValidator(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('validate', () => {
    it('should report compliant when gitignore has all patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), [
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
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
      writeTestFile(path.join(tempDir, 'CLAUDE.local.md'), '');

      const report = validator.validate();
      assert.strictEqual(report.compliant, true);
    });

    it('should report non-compliant when no gitignore exists', () => {
      // No .gitignore at all → error severity → non-compliant
      const report = validator.validate();
      assert.strictEqual(report.compliant, false);
      assert.ok(report.issues.length > 0);
    });

    it('should report issues for missing patterns even when compliant', () => {
      // .gitignore exists but has gaps → warnings only → still compliant
      writeTestFile(path.join(tempDir, '.gitignore'), 'node_modules/\n');
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');

      const report = validator.validate();
      assert.ok(report.issues.length > 0);
      const missingPatterns = report.issues.filter(i => i.type === 'not_gitignored');
      assert.ok(missingPatterns.length > 0);
    });

    it('should include recommendations', () => {
      // No gitignore at all
      const report = validator.validate();
      assert.ok(report.recommendations.length > 0);
    });
  });

  describe('checkGitignore (via validate)', () => {
    it('should detect missing gitignore file', () => {
      const report = validator.validate();
      const gitignoreIssues = report.issues.filter(i => i.type === 'not_gitignored');
      assert.ok(gitignoreIssues.length > 0);
      assert.ok(gitignoreIssues.some(i => i.detail.includes('No .gitignore')));
    });

    it('should detect individual missing patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), 'node_modules/\n.env\n');

      const report = validator.validate();
      const missing = report.issues.filter(i =>
        i.type === 'not_gitignored' && i.detail.includes('Pattern')
      );
      assert.ok(missing.length > 0);
    });

    it('should pass when all required patterns present', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), [
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
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
      writeTestFile(path.join(tempDir, 'CLAUDE.local.md'), '');

      const report = validator.validate();
      const gitignoreIssues = report.issues.filter(i => i.type === 'not_gitignored');
      assert.strictEqual(gitignoreIssues.length, 0);
    });
  });

  describe('scanForPII (via validate)', () => {
    it('should detect email addresses in workflow files', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      // Note: lines containing 'example' or 'placeholder' are skipped
      writeTestFile(
        path.join(tempDir, 'workflow', 'standards', 'test.md'),
        'Contact john.doe@company.org for help\n'
      );

      const report = validator.validate();
      const piiIssues = report.issues.filter(i => i.type === 'pii_detected');
      assert.ok(piiIssues.some(i => i.detail.includes('email')));
    });

    it('should detect financial number patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(
        path.join(tempDir, 'workflow', 'product', 'billing.md'),
        'Card: 4111 2222 3333 4444\n'
      );

      const report = validator.validate();
      const piiIssues = report.issues.filter(i => i.type === 'pii_detected');
      // Credit card pattern matches 16-digit numbers
      assert.ok(piiIssues.some(i => i.detail.includes('credit_card')));
    });

    it('should detect credential patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(
        path.join(tempDir, 'workflow', 'standards', 'config.yml'),
        'api_key = "sk-1234567890abcdef"\n'
      );

      const report = validator.validate();
      const piiIssues = report.issues.filter(i => i.type === 'pii_detected');
      assert.ok(piiIssues.some(i => i.detail.includes('credential')));
    });

    it('should skip example/placeholder content', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(
        path.join(tempDir, 'workflow', 'standards', 'example.md'),
        'Use user@example.com as placeholder\n'
      );

      const report = validator.validate();
      const piiIssues = report.issues.filter(i =>
        i.type === 'pii_detected' && i.file.includes('example.md')
      );
      assert.strictEqual(piiIssues.length, 0);
    });

    it('should skip comments', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(
        path.join(tempDir, 'workflow', 'standards', 'commented.md'),
        '# email: real@person.com\n'
      );

      const report = validator.validate();
      const piiIssues = report.issues.filter(i =>
        i.type === 'pii_detected' && i.file.includes('commented.md')
      );
      assert.strictEqual(piiIssues.length, 0);
    });

    it('should only scan md and yml files', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(
        path.join(tempDir, 'workflow', 'standards', 'data.json'),
        '{"email": "private@mail.com"}\n'
      );

      const report = validator.validate();
      const piiIssues = report.issues.filter(i =>
        i.type === 'pii_detected' && i.file.includes('data.json')
      );
      assert.strictEqual(piiIssues.length, 0);
    });
  });

  describe('checkLocalOnlyConfig (via validate)', () => {
    it('should detect missing local_only setting', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'version: "0.1.0"\n');

      const report = validator.validate();
      const configIssues = report.issues.filter(i => i.type === 'missing_local_config');
      assert.ok(configIssues.some(i => i.detail.includes('local_only')));
    });

    it('should pass when local_only is set', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');

      const report = validator.validate();
      const configIssues = report.issues.filter(i =>
        i.type === 'missing_local_config' && i.detail.includes('local_only')
      );
      assert.strictEqual(configIssues.length, 0);
    });
  });

  describe('autoFix', () => {
    it('should add missing gitignore patterns', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), 'node_modules/\n');

      const result = validator.autoFix();
      assert.ok(result.fixed.length > 0);
      assert.ok(result.fixed[0].includes('patterns'));

      const content = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf-8');
      assert.ok(content.includes('.env'));
      assert.ok(content.includes('CLAUDE.local.md'));
    });

    it('should report manual fixes needed for PII', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      writeTestFile(
        path.join(tempDir, 'workflow', 'standards', 'has-pii.md'),
        'Contact: admin@company.org\n'
      );

      const result = validator.autoFix();
      assert.ok(result.manual.length > 0);
    });

    it('should not add patterns already present', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), [
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

      const result = validator.autoFix();
      // No new patterns to add
      assert.strictEqual(result.fixed.length, 0);
    });
  });

  describe('patternCovers (via validate)', () => {
    it('should recognize *.ext covers specific.ext', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '*.local.md\n.env.*\n');
      writeTestFile(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
      writeTestFile(path.join(tempDir, 'CLAUDE.local.md'), '');

      const report = validator.validate();
      // *.local.md should cover CLAUDE.local.md
      const localMdIssues = report.issues.filter(i =>
        i.type === 'not_gitignored' && i.detail.includes('CLAUDE.local.md')
      );
      assert.strictEqual(localMdIssues.length, 0);
    });

    it('should recognize prefix* covers prefix.suffix', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '.env*\n');

      const report = validator.validate();
      // .env* should cover .env, .env.local, .env.*
      const envIssues = report.issues.filter(i =>
        i.type === 'not_gitignored' &&
        (i.detail.includes('".env"') || i.detail.includes('".env.local"') || i.detail.includes('".env.*"'))
      );
      assert.strictEqual(envIssues.length, 0);
    });
  });

  describe('runChecks', () => {
    it('should return CheckResult array', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), '');
      const results = validator.runChecks();
      assert.ok(Array.isArray(results));
      assert.ok(results.length > 0);
      assert.ok(results[0].name);
      assert.ok(results[0].status);
    });

    it('should mark auto-fixable issues as warnings in pre-install mode', () => {
      writeTestFile(path.join(tempDir, '.gitignore'), 'node_modules/\n');
      const results = validator.runChecks(true);
      const gitignoreChecks = results.filter(r => r.name === 'gdpr_not_gitignored');
      for (const check of gitignoreChecks) {
        assert.strictEqual(check.status, 'warn');
        assert.strictEqual(check.autoFixable, true);
      }
    });
  });
});
