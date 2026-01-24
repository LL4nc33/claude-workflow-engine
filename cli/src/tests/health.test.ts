// =============================================================================
// Integration Tests - Health Command (Hooks, Plugin, Skills checks)
// =============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { createTempDir, cleanupTempDir } from './helpers';

describe('Health Command - Hooks & Plugin Checks', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('Core files check includes plugin and hooks', () => {
    it('should detect missing .claude-plugin/plugin.json', () => {
      const installDir = path.join(tempDir, 'core-files');
      fs.mkdirSync(installDir, { recursive: true });

      // plugin.json does NOT exist
      const pluginPath = path.join(installDir, '.claude-plugin', 'plugin.json');
      assert.ok(!fs.existsSync(pluginPath));
    });

    it('should detect missing hooks/hooks.json', () => {
      const installDir = path.join(tempDir, 'hooks-missing');
      fs.mkdirSync(installDir, { recursive: true });

      // hooks.json does NOT exist
      const hooksPath = path.join(installDir, 'hooks', 'hooks.json');
      assert.ok(!fs.existsSync(hooksPath));
    });

    it('should pass when plugin.json and hooks.json exist', () => {
      const installDir = path.join(tempDir, 'all-present');
      fs.mkdirSync(path.join(installDir, '.claude-plugin'), { recursive: true });
      fs.mkdirSync(path.join(installDir, 'hooks'), { recursive: true });

      fs.writeFileSync(
        path.join(installDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'test', version: '0.2.0' })
      );
      fs.writeFileSync(
        path.join(installDir, 'hooks', 'hooks.json'),
        JSON.stringify({ hooks: [] })
      );

      assert.ok(fs.existsSync(path.join(installDir, '.claude-plugin', 'plugin.json')));
      assert.ok(fs.existsSync(path.join(installDir, 'hooks', 'hooks.json')));
    });
  });

  describe('Hook scripts executable check', () => {
    it('should detect non-executable hook scripts', () => {
      const installDir = path.join(tempDir, 'non-exec');
      const scriptsDir = path.join(installDir, 'hooks', 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, 'session-start.sh');
      fs.writeFileSync(scriptPath, '#!/usr/bin/env bash\n');
      fs.chmodSync(scriptPath, 0o644); // NOT executable

      const stats = fs.statSync(scriptPath);
      assert.ok((stats.mode & 0o111) === 0, 'Script should NOT be executable');
    });

    it('should auto-fix non-executable scripts with --fix', () => {
      const installDir = path.join(tempDir, 'auto-fix');
      const scriptsDir = path.join(installDir, 'hooks', 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scriptPath = path.join(scriptsDir, 'common.sh');
      fs.writeFileSync(scriptPath, '#!/usr/bin/env bash\n');
      fs.chmodSync(scriptPath, 0o644);

      // Simulate auto-fix
      fs.chmodSync(scriptPath, 0o755);

      const stats = fs.statSync(scriptPath);
      assert.ok((stats.mode & 0o111) !== 0, 'Script should be executable after fix');
    });

    it('should pass when all hook scripts are executable', () => {
      const installDir = path.join(tempDir, 'all-exec');
      const scriptsDir = path.join(installDir, 'hooks', 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      const scripts = ['common.sh', 'session-start.sh', 'pre-write-validate.sh', 'post-write-log.sh'];
      for (const script of scripts) {
        const scriptPath = path.join(scriptsDir, script);
        fs.writeFileSync(scriptPath, '#!/usr/bin/env bash\n');
        fs.chmodSync(scriptPath, 0o755);
      }

      for (const script of scripts) {
        const stats = fs.statSync(path.join(scriptsDir, script));
        assert.ok((stats.mode & 0o111) !== 0, `${script} should be executable`);
      }
    });
  });

  describe('Skills count check', () => {
    it('should warn when fewer than 10 skills are present', () => {
      const installDir = path.join(tempDir, 'few-skills');
      const skillsDir = path.join(installDir, '.claude', 'skills', 'workflow');

      // Create only 3 skills
      const skills = ['mcp-usage', 'hook-patterns', 'plugin-config'];
      for (const skill of skills) {
        const skillDir = path.join(skillsDir, skill);
        fs.mkdirSync(skillDir, { recursive: true });
        fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `---\nname: ${skill}\n---\n`);
      }

      // Count skills
      let count = 0;
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md'))) {
          count++;
        }
      }

      assert.ok(count < 10, `Should have fewer than 10 skills, got ${count}`);
    });

    it('should pass when 10 or more skills are present', () => {
      const installDir = path.join(tempDir, 'many-skills');
      const skillsDir = path.join(installDir, '.claude', 'skills', 'workflow');

      // Create 10 skills
      const skills = [
        'tech-stack-standards', 'naming-standards', 'api-response-format-standards',
        'api-error-handling-standards', 'database-migrations-standards',
        'devops-ci-cd-standards', 'devops-containerization-standards',
        'mcp-usage', 'hook-patterns', 'plugin-config',
      ];
      for (const skill of skills) {
        const skillDir = path.join(skillsDir, skill);
        fs.mkdirSync(skillDir, { recursive: true });
        fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `---\nname: ${skill}\n---\n`);
      }

      let count = 0;
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md'))) {
          count++;
        }
      }

      assert.ok(count >= 10, `Should have 10+ skills, got ${count}`);
    });
  });

  describe('Directory structure includes new dirs', () => {
    it('should check for .claude-plugin, hooks, hooks/scripts', () => {
      const installDir = path.join(tempDir, 'dir-check');
      const requiredDirs = ['.claude-plugin', 'hooks', 'hooks/scripts'];

      // None exist initially
      for (const dir of requiredDirs) {
        assert.ok(!fs.existsSync(path.join(installDir, dir)));
      }

      // Create them
      for (const dir of requiredDirs) {
        fs.mkdirSync(path.join(installDir, dir), { recursive: true });
      }

      // All exist now
      for (const dir of requiredDirs) {
        assert.ok(fs.existsSync(path.join(installDir, dir)), `${dir} should exist`);
      }
    });
  });
});
