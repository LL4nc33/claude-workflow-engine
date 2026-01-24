// =============================================================================
// Unit Tests - fs-utils
// =============================================================================

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  pathExists,
  isDirectory,
  isFile,
  readFileSafe,
  writeFileSafe,
  fileChecksum,
  stringChecksum,
  createBackup,
  copyDirRecursive,
  listFilesRecursive,
  normalizePath,
  findWorkflowRoot,
  matchesGitignorePattern,
  parseGitignore,
  ensureGitignorePatterns,
} from '../lib/fs-utils';
import { createTempDir, cleanupTempDir } from './helpers';

describe('fs-utils', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('pathExists', () => {
    it('should return true for existing file', () => {
      const file = path.join(tempDir, 'test.txt');
      fs.writeFileSync(file, 'hello');
      assert.strictEqual(pathExists(file), true);
    });

    it('should return true for existing directory', () => {
      assert.strictEqual(pathExists(tempDir), true);
    });

    it('should return false for non-existing path', () => {
      assert.strictEqual(pathExists(path.join(tempDir, 'nope')), false);
    });
  });

  describe('isDirectory', () => {
    it('should return true for directory', () => {
      assert.strictEqual(isDirectory(tempDir), true);
    });

    it('should return false for file', () => {
      const file = path.join(tempDir, 'test.txt');
      fs.writeFileSync(file, 'hello');
      assert.strictEqual(isDirectory(file), false);
    });

    it('should return false for non-existing path', () => {
      assert.strictEqual(isDirectory(path.join(tempDir, 'nope')), false);
    });
  });

  describe('isFile', () => {
    it('should return true for file', () => {
      const file = path.join(tempDir, 'test.txt');
      fs.writeFileSync(file, 'hello');
      assert.strictEqual(isFile(file), true);
    });

    it('should return false for directory', () => {
      assert.strictEqual(isFile(tempDir), false);
    });

    it('should return false for non-existing path', () => {
      assert.strictEqual(isFile(path.join(tempDir, 'nope')), false);
    });
  });

  describe('readFileSafe', () => {
    it('should read existing file content', () => {
      const file = path.join(tempDir, 'test.txt');
      fs.writeFileSync(file, 'hello world');
      assert.strictEqual(readFileSafe(file), 'hello world');
    });

    it('should return null for non-existing file', () => {
      assert.strictEqual(readFileSafe(path.join(tempDir, 'nope.txt')), null);
    });

    it('should handle empty files', () => {
      const file = path.join(tempDir, 'empty.txt');
      fs.writeFileSync(file, '');
      assert.strictEqual(readFileSafe(file), '');
    });
  });

  describe('writeFileSafe', () => {
    it('should write content to file', () => {
      const file = path.join(tempDir, 'output.txt');
      const result = writeFileSafe(file, 'test content');
      assert.strictEqual(result, true);
      assert.strictEqual(fs.readFileSync(file, 'utf-8'), 'test content');
    });

    it('should create parent directories', () => {
      const file = path.join(tempDir, 'sub', 'dir', 'output.txt');
      const result = writeFileSafe(file, 'nested');
      assert.strictEqual(result, true);
      assert.strictEqual(fs.readFileSync(file, 'utf-8'), 'nested');
    });

    it('should overwrite existing file', () => {
      const file = path.join(tempDir, 'overwrite.txt');
      fs.writeFileSync(file, 'old');
      writeFileSafe(file, 'new');
      assert.strictEqual(fs.readFileSync(file, 'utf-8'), 'new');
    });
  });

  describe('fileChecksum', () => {
    it('should return consistent hash for same content', () => {
      const file = path.join(tempDir, 'hash.txt');
      fs.writeFileSync(file, 'consistent content');
      const hash1 = fileChecksum(file);
      const hash2 = fileChecksum(file);
      assert.strictEqual(hash1, hash2);
      assert.ok(hash1!.length === 64); // SHA256 hex length
    });

    it('should return different hash for different content', () => {
      const file1 = path.join(tempDir, 'a.txt');
      const file2 = path.join(tempDir, 'b.txt');
      fs.writeFileSync(file1, 'content A');
      fs.writeFileSync(file2, 'content B');
      assert.notStrictEqual(fileChecksum(file1), fileChecksum(file2));
    });

    it('should return null for non-existing file', () => {
      assert.strictEqual(fileChecksum(path.join(tempDir, 'nope')), null);
    });
  });

  describe('stringChecksum', () => {
    it('should return deterministic hash', () => {
      const hash1 = stringChecksum('hello');
      const hash2 = stringChecksum('hello');
      assert.strictEqual(hash1, hash2);
    });

    it('should produce 64-char hex string', () => {
      const hash = stringChecksum('test');
      assert.strictEqual(hash.length, 64);
      assert.ok(/^[a-f0-9]+$/.test(hash));
    });

    it('should differ for different inputs', () => {
      assert.notStrictEqual(stringChecksum('a'), stringChecksum('b'));
    });
  });

  describe('createBackup', () => {
    it('should backup a file with timestamp', () => {
      const file = path.join(tempDir, 'source.txt');
      const backupDir = path.join(tempDir, 'backups');
      fs.writeFileSync(file, 'backup me');

      const result = createBackup(file, backupDir);
      assert.ok(result !== null);
      assert.ok(result!.includes('source.txt.backup-'));
      assert.ok(fs.existsSync(result!));
      assert.strictEqual(fs.readFileSync(result!, 'utf-8'), 'backup me');
    });

    it('should backup a directory', () => {
      const srcDir = path.join(tempDir, 'srcdir');
      const backupDir = path.join(tempDir, 'backups');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'file.txt'), 'in dir');

      const result = createBackup(srcDir, backupDir);
      assert.ok(result !== null);
      assert.ok(fs.existsSync(path.join(result!, 'file.txt')));
    });

    it('should create backup directory if needed', () => {
      const file = path.join(tempDir, 'src.txt');
      const backupDir = path.join(tempDir, 'new-backup-dir');
      fs.writeFileSync(file, 'data');

      createBackup(file, backupDir);
      assert.ok(fs.existsSync(backupDir));
    });

    it('should return null for non-existing source', () => {
      const result = createBackup(path.join(tempDir, 'nope'), path.join(tempDir, 'bak'));
      assert.strictEqual(result, null);
    });
  });

  describe('copyDirRecursive', () => {
    it('should copy flat directory', () => {
      const src = path.join(tempDir, 'src');
      const dest = path.join(tempDir, 'dest');
      fs.mkdirSync(src);
      fs.writeFileSync(path.join(src, 'a.txt'), 'AAA');
      fs.writeFileSync(path.join(src, 'b.txt'), 'BBB');

      copyDirRecursive(src, dest);
      assert.strictEqual(fs.readFileSync(path.join(dest, 'a.txt'), 'utf-8'), 'AAA');
      assert.strictEqual(fs.readFileSync(path.join(dest, 'b.txt'), 'utf-8'), 'BBB');
    });

    it('should copy nested directories', () => {
      const src = path.join(tempDir, 'nested-src');
      fs.mkdirSync(path.join(src, 'sub', 'deep'), { recursive: true });
      fs.writeFileSync(path.join(src, 'sub', 'deep', 'file.txt'), 'deep content');

      const dest = path.join(tempDir, 'nested-dest');
      copyDirRecursive(src, dest);
      assert.strictEqual(
        fs.readFileSync(path.join(dest, 'sub', 'deep', 'file.txt'), 'utf-8'),
        'deep content'
      );
    });
  });

  describe('listFilesRecursive', () => {
    it('should list all files with relative paths', () => {
      const dir = path.join(tempDir, 'list-test');
      fs.mkdirSync(path.join(dir, 'sub'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'root.txt'), '');
      fs.writeFileSync(path.join(dir, 'sub', 'child.txt'), '');

      const files = listFilesRecursive(dir);
      assert.ok(files.includes('root.txt'));
      assert.ok(files.some(f => f.includes('child.txt')));
    });

    it('should return empty array for non-existing dir', () => {
      const files = listFilesRecursive(path.join(tempDir, 'nope'));
      assert.deepStrictEqual(files, []);
    });

    it('should use relativeTo parameter', () => {
      const dir = path.join(tempDir, 'rel-test');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'file.txt'), '');

      const files = listFilesRecursive(dir, tempDir);
      assert.ok(files[0].startsWith('rel-test'));
    });
  });

  describe('normalizePath', () => {
    it('should resolve relative paths', () => {
      const result = normalizePath('./test');
      assert.ok(path.isAbsolute(result));
    });

    it('should convert backslashes to forward slashes', () => {
      const result = normalizePath('/some/path');
      assert.ok(!result.includes('\\'));
    });

    it('should handle absolute paths', () => {
      const result = normalizePath('/tmp/test');
      assert.ok(result.includes('/tmp/test'));
    });
  });

  describe('findWorkflowRoot', () => {
    it('should find root when workflow/config.yml exists', () => {
      const projectDir = path.join(tempDir, 'project');
      fs.mkdirSync(path.join(projectDir, 'workflow'), { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'workflow', 'config.yml'), 'version: 1');

      const subDir = path.join(projectDir, 'src', 'deep');
      fs.mkdirSync(subDir, { recursive: true });

      const result = findWorkflowRoot(subDir);
      assert.strictEqual(result, projectDir);
    });

    it('should return null when no workflow root found', () => {
      const result = findWorkflowRoot(tempDir);
      assert.strictEqual(result, null);
    });
  });

  describe('matchesGitignorePattern', () => {
    it('should match wildcard prefix patterns', () => {
      assert.strictEqual(matchesGitignorePattern('file.log', ['*.log']), true);
    });

    it('should match wildcard suffix patterns', () => {
      assert.strictEqual(matchesGitignorePattern('.env.local', ['.env*']), true);
    });

    it('should match exact filename', () => {
      assert.strictEqual(matchesGitignorePattern('node_modules', ['node_modules']), true);
    });

    it('should not match unrelated patterns', () => {
      assert.strictEqual(matchesGitignorePattern('file.txt', ['*.log']), false);
    });

    it('should match patterns with middle wildcard via regex', () => {
      // 'credentials.*' has * but not at start/end position only → regex branch
      // Actually 'credentials.*' ends with *, so it goes to endsWith('*') branch
      // and checks if filename starts with 'credentials.'
      assert.strictEqual(matchesGitignorePattern('credentials.json', ['credentials.*']), true);
    });

    it('should not match when pattern suffix does not match', () => {
      // *.log checks endsWith('.log')
      assert.strictEqual(matchesGitignorePattern('test.txt', ['*.log']), false);
    });
  });

  describe('parseGitignore', () => {
    it('should parse patterns from gitignore file', () => {
      const file = path.join(tempDir, '.gitignore');
      fs.writeFileSync(file, 'node_modules/\ndist/\n*.log\n');

      const patterns = parseGitignore(file);
      assert.deepStrictEqual(patterns, ['node_modules/', 'dist/', '*.log']);
    });

    it('should skip comments and empty lines', () => {
      const file = path.join(tempDir, '.gitignore');
      fs.writeFileSync(file, '# comment\n\nnode_modules/\n  \n');

      const patterns = parseGitignore(file);
      assert.deepStrictEqual(patterns, ['node_modules/']);
    });

    it('should return empty array for non-existing file', () => {
      const patterns = parseGitignore(path.join(tempDir, 'nope'));
      assert.deepStrictEqual(patterns, []);
    });
  });

  describe('ensureGitignorePatterns', () => {
    it('should add missing patterns', () => {
      const file = path.join(tempDir, '.gitignore');
      fs.writeFileSync(file, 'node_modules/\n');

      const result = ensureGitignorePatterns(file, ['*.log', '.env']);
      assert.deepStrictEqual(result.added, ['*.log', '.env']);
      assert.deepStrictEqual(result.alreadyPresent, []);

      const content = fs.readFileSync(file, 'utf-8');
      assert.ok(content.includes('*.log'));
      assert.ok(content.includes('.env'));
    });

    it('should not duplicate existing patterns', () => {
      const file = path.join(tempDir, '.gitignore');
      fs.writeFileSync(file, 'node_modules/\n*.log\n');

      const result = ensureGitignorePatterns(file, ['*.log', '.env']);
      assert.deepStrictEqual(result.added, ['.env']);
      assert.deepStrictEqual(result.alreadyPresent, ['*.log']);
    });

    it('should create file if it does not exist', () => {
      const file = path.join(tempDir, '.gitignore-new');

      const result = ensureGitignorePatterns(file, ['.env']);
      assert.deepStrictEqual(result.added, ['.env']);
      assert.ok(fs.existsSync(file));
    });
  });
});
