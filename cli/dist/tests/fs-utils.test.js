"use strict";
// =============================================================================
// Unit Tests - fs-utils
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fs_utils_1 = require("../lib/fs-utils");
const helpers_1 = require("./helpers");
(0, node_test_1.describe)('fs-utils', () => {
    let tempDir;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.describe)('pathExists', () => {
        (0, node_test_1.it)('should return true for existing file', () => {
            const file = path.join(tempDir, 'test.txt');
            fs.writeFileSync(file, 'hello');
            assert.strictEqual((0, fs_utils_1.pathExists)(file), true);
        });
        (0, node_test_1.it)('should return true for existing directory', () => {
            assert.strictEqual((0, fs_utils_1.pathExists)(tempDir), true);
        });
        (0, node_test_1.it)('should return false for non-existing path', () => {
            assert.strictEqual((0, fs_utils_1.pathExists)(path.join(tempDir, 'nope')), false);
        });
    });
    (0, node_test_1.describe)('isDirectory', () => {
        (0, node_test_1.it)('should return true for directory', () => {
            assert.strictEqual((0, fs_utils_1.isDirectory)(tempDir), true);
        });
        (0, node_test_1.it)('should return false for file', () => {
            const file = path.join(tempDir, 'test.txt');
            fs.writeFileSync(file, 'hello');
            assert.strictEqual((0, fs_utils_1.isDirectory)(file), false);
        });
        (0, node_test_1.it)('should return false for non-existing path', () => {
            assert.strictEqual((0, fs_utils_1.isDirectory)(path.join(tempDir, 'nope')), false);
        });
    });
    (0, node_test_1.describe)('isFile', () => {
        (0, node_test_1.it)('should return true for file', () => {
            const file = path.join(tempDir, 'test.txt');
            fs.writeFileSync(file, 'hello');
            assert.strictEqual((0, fs_utils_1.isFile)(file), true);
        });
        (0, node_test_1.it)('should return false for directory', () => {
            assert.strictEqual((0, fs_utils_1.isFile)(tempDir), false);
        });
        (0, node_test_1.it)('should return false for non-existing path', () => {
            assert.strictEqual((0, fs_utils_1.isFile)(path.join(tempDir, 'nope')), false);
        });
    });
    (0, node_test_1.describe)('readFileSafe', () => {
        (0, node_test_1.it)('should read existing file content', () => {
            const file = path.join(tempDir, 'test.txt');
            fs.writeFileSync(file, 'hello world');
            assert.strictEqual((0, fs_utils_1.readFileSafe)(file), 'hello world');
        });
        (0, node_test_1.it)('should return null for non-existing file', () => {
            assert.strictEqual((0, fs_utils_1.readFileSafe)(path.join(tempDir, 'nope.txt')), null);
        });
        (0, node_test_1.it)('should handle empty files', () => {
            const file = path.join(tempDir, 'empty.txt');
            fs.writeFileSync(file, '');
            assert.strictEqual((0, fs_utils_1.readFileSafe)(file), '');
        });
    });
    (0, node_test_1.describe)('writeFileSafe', () => {
        (0, node_test_1.it)('should write content to file', () => {
            const file = path.join(tempDir, 'output.txt');
            const result = (0, fs_utils_1.writeFileSafe)(file, 'test content');
            assert.strictEqual(result, true);
            assert.strictEqual(fs.readFileSync(file, 'utf-8'), 'test content');
        });
        (0, node_test_1.it)('should create parent directories', () => {
            const file = path.join(tempDir, 'sub', 'dir', 'output.txt');
            const result = (0, fs_utils_1.writeFileSafe)(file, 'nested');
            assert.strictEqual(result, true);
            assert.strictEqual(fs.readFileSync(file, 'utf-8'), 'nested');
        });
        (0, node_test_1.it)('should overwrite existing file', () => {
            const file = path.join(tempDir, 'overwrite.txt');
            fs.writeFileSync(file, 'old');
            (0, fs_utils_1.writeFileSafe)(file, 'new');
            assert.strictEqual(fs.readFileSync(file, 'utf-8'), 'new');
        });
    });
    (0, node_test_1.describe)('fileChecksum', () => {
        (0, node_test_1.it)('should return consistent hash for same content', () => {
            const file = path.join(tempDir, 'hash.txt');
            fs.writeFileSync(file, 'consistent content');
            const hash1 = (0, fs_utils_1.fileChecksum)(file);
            const hash2 = (0, fs_utils_1.fileChecksum)(file);
            assert.strictEqual(hash1, hash2);
            assert.ok(hash1.length === 64); // SHA256 hex length
        });
        (0, node_test_1.it)('should return different hash for different content', () => {
            const file1 = path.join(tempDir, 'a.txt');
            const file2 = path.join(tempDir, 'b.txt');
            fs.writeFileSync(file1, 'content A');
            fs.writeFileSync(file2, 'content B');
            assert.notStrictEqual((0, fs_utils_1.fileChecksum)(file1), (0, fs_utils_1.fileChecksum)(file2));
        });
        (0, node_test_1.it)('should return null for non-existing file', () => {
            assert.strictEqual((0, fs_utils_1.fileChecksum)(path.join(tempDir, 'nope')), null);
        });
    });
    (0, node_test_1.describe)('stringChecksum', () => {
        (0, node_test_1.it)('should return deterministic hash', () => {
            const hash1 = (0, fs_utils_1.stringChecksum)('hello');
            const hash2 = (0, fs_utils_1.stringChecksum)('hello');
            assert.strictEqual(hash1, hash2);
        });
        (0, node_test_1.it)('should produce 64-char hex string', () => {
            const hash = (0, fs_utils_1.stringChecksum)('test');
            assert.strictEqual(hash.length, 64);
            assert.ok(/^[a-f0-9]+$/.test(hash));
        });
        (0, node_test_1.it)('should differ for different inputs', () => {
            assert.notStrictEqual((0, fs_utils_1.stringChecksum)('a'), (0, fs_utils_1.stringChecksum)('b'));
        });
    });
    (0, node_test_1.describe)('createBackup', () => {
        (0, node_test_1.it)('should backup a file with timestamp', () => {
            const file = path.join(tempDir, 'source.txt');
            const backupDir = path.join(tempDir, 'backups');
            fs.writeFileSync(file, 'backup me');
            const result = (0, fs_utils_1.createBackup)(file, backupDir);
            assert.ok(result !== null);
            assert.ok(result.includes('source.txt.backup-'));
            assert.ok(fs.existsSync(result));
            assert.strictEqual(fs.readFileSync(result, 'utf-8'), 'backup me');
        });
        (0, node_test_1.it)('should backup a directory', () => {
            const srcDir = path.join(tempDir, 'srcdir');
            const backupDir = path.join(tempDir, 'backups');
            fs.mkdirSync(srcDir);
            fs.writeFileSync(path.join(srcDir, 'file.txt'), 'in dir');
            const result = (0, fs_utils_1.createBackup)(srcDir, backupDir);
            assert.ok(result !== null);
            assert.ok(fs.existsSync(path.join(result, 'file.txt')));
        });
        (0, node_test_1.it)('should create backup directory if needed', () => {
            const file = path.join(tempDir, 'src.txt');
            const backupDir = path.join(tempDir, 'new-backup-dir');
            fs.writeFileSync(file, 'data');
            (0, fs_utils_1.createBackup)(file, backupDir);
            assert.ok(fs.existsSync(backupDir));
        });
        (0, node_test_1.it)('should return null for non-existing source', () => {
            const result = (0, fs_utils_1.createBackup)(path.join(tempDir, 'nope'), path.join(tempDir, 'bak'));
            assert.strictEqual(result, null);
        });
    });
    (0, node_test_1.describe)('copyDirRecursive', () => {
        (0, node_test_1.it)('should copy flat directory', () => {
            const src = path.join(tempDir, 'src');
            const dest = path.join(tempDir, 'dest');
            fs.mkdirSync(src);
            fs.writeFileSync(path.join(src, 'a.txt'), 'AAA');
            fs.writeFileSync(path.join(src, 'b.txt'), 'BBB');
            (0, fs_utils_1.copyDirRecursive)(src, dest);
            assert.strictEqual(fs.readFileSync(path.join(dest, 'a.txt'), 'utf-8'), 'AAA');
            assert.strictEqual(fs.readFileSync(path.join(dest, 'b.txt'), 'utf-8'), 'BBB');
        });
        (0, node_test_1.it)('should copy nested directories', () => {
            const src = path.join(tempDir, 'nested-src');
            fs.mkdirSync(path.join(src, 'sub', 'deep'), { recursive: true });
            fs.writeFileSync(path.join(src, 'sub', 'deep', 'file.txt'), 'deep content');
            const dest = path.join(tempDir, 'nested-dest');
            (0, fs_utils_1.copyDirRecursive)(src, dest);
            assert.strictEqual(fs.readFileSync(path.join(dest, 'sub', 'deep', 'file.txt'), 'utf-8'), 'deep content');
        });
    });
    (0, node_test_1.describe)('listFilesRecursive', () => {
        (0, node_test_1.it)('should list all files with relative paths', () => {
            const dir = path.join(tempDir, 'list-test');
            fs.mkdirSync(path.join(dir, 'sub'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'root.txt'), '');
            fs.writeFileSync(path.join(dir, 'sub', 'child.txt'), '');
            const files = (0, fs_utils_1.listFilesRecursive)(dir);
            assert.ok(files.includes('root.txt'));
            assert.ok(files.some(f => f.includes('child.txt')));
        });
        (0, node_test_1.it)('should return empty array for non-existing dir', () => {
            const files = (0, fs_utils_1.listFilesRecursive)(path.join(tempDir, 'nope'));
            assert.deepStrictEqual(files, []);
        });
        (0, node_test_1.it)('should use relativeTo parameter', () => {
            const dir = path.join(tempDir, 'rel-test');
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, 'file.txt'), '');
            const files = (0, fs_utils_1.listFilesRecursive)(dir, tempDir);
            assert.ok(files[0].startsWith('rel-test'));
        });
    });
    (0, node_test_1.describe)('normalizePath', () => {
        (0, node_test_1.it)('should resolve relative paths', () => {
            const result = (0, fs_utils_1.normalizePath)('./test');
            assert.ok(path.isAbsolute(result));
        });
        (0, node_test_1.it)('should convert backslashes to forward slashes', () => {
            const result = (0, fs_utils_1.normalizePath)('/some/path');
            assert.ok(!result.includes('\\'));
        });
        (0, node_test_1.it)('should handle absolute paths', () => {
            const result = (0, fs_utils_1.normalizePath)('/tmp/test');
            assert.ok(result.includes('/tmp/test'));
        });
    });
    (0, node_test_1.describe)('findWorkflowRoot', () => {
        (0, node_test_1.it)('should find root when workflow/config.yml exists', () => {
            const projectDir = path.join(tempDir, 'project');
            fs.mkdirSync(path.join(projectDir, 'workflow'), { recursive: true });
            fs.writeFileSync(path.join(projectDir, 'workflow', 'config.yml'), 'version: 1');
            const subDir = path.join(projectDir, 'src', 'deep');
            fs.mkdirSync(subDir, { recursive: true });
            const result = (0, fs_utils_1.findWorkflowRoot)(subDir);
            assert.strictEqual(result, projectDir);
        });
        (0, node_test_1.it)('should return null when no workflow root found', () => {
            const result = (0, fs_utils_1.findWorkflowRoot)(tempDir);
            assert.strictEqual(result, null);
        });
    });
    (0, node_test_1.describe)('matchesGitignorePattern', () => {
        (0, node_test_1.it)('should match wildcard prefix patterns', () => {
            assert.strictEqual((0, fs_utils_1.matchesGitignorePattern)('file.log', ['*.log']), true);
        });
        (0, node_test_1.it)('should match wildcard suffix patterns', () => {
            assert.strictEqual((0, fs_utils_1.matchesGitignorePattern)('.env.local', ['.env*']), true);
        });
        (0, node_test_1.it)('should match exact filename', () => {
            assert.strictEqual((0, fs_utils_1.matchesGitignorePattern)('node_modules', ['node_modules']), true);
        });
        (0, node_test_1.it)('should not match unrelated patterns', () => {
            assert.strictEqual((0, fs_utils_1.matchesGitignorePattern)('file.txt', ['*.log']), false);
        });
        (0, node_test_1.it)('should match patterns with middle wildcard via regex', () => {
            // 'credentials.*' has * but not at start/end position only → regex branch
            // Actually 'credentials.*' ends with *, so it goes to endsWith('*') branch
            // and checks if filename starts with 'credentials.'
            assert.strictEqual((0, fs_utils_1.matchesGitignorePattern)('credentials.json', ['credentials.*']), true);
        });
        (0, node_test_1.it)('should not match when pattern suffix does not match', () => {
            // *.log checks endsWith('.log')
            assert.strictEqual((0, fs_utils_1.matchesGitignorePattern)('test.txt', ['*.log']), false);
        });
    });
    (0, node_test_1.describe)('parseGitignore', () => {
        (0, node_test_1.it)('should parse patterns from gitignore file', () => {
            const file = path.join(tempDir, '.gitignore');
            fs.writeFileSync(file, 'node_modules/\ndist/\n*.log\n');
            const patterns = (0, fs_utils_1.parseGitignore)(file);
            assert.deepStrictEqual(patterns, ['node_modules/', 'dist/', '*.log']);
        });
        (0, node_test_1.it)('should skip comments and empty lines', () => {
            const file = path.join(tempDir, '.gitignore');
            fs.writeFileSync(file, '# comment\n\nnode_modules/\n  \n');
            const patterns = (0, fs_utils_1.parseGitignore)(file);
            assert.deepStrictEqual(patterns, ['node_modules/']);
        });
        (0, node_test_1.it)('should return empty array for non-existing file', () => {
            const patterns = (0, fs_utils_1.parseGitignore)(path.join(tempDir, 'nope'));
            assert.deepStrictEqual(patterns, []);
        });
    });
    (0, node_test_1.describe)('ensureGitignorePatterns', () => {
        (0, node_test_1.it)('should add missing patterns', () => {
            const file = path.join(tempDir, '.gitignore');
            fs.writeFileSync(file, 'node_modules/\n');
            const result = (0, fs_utils_1.ensureGitignorePatterns)(file, ['*.log', '.env']);
            assert.deepStrictEqual(result.added, ['*.log', '.env']);
            assert.deepStrictEqual(result.alreadyPresent, []);
            const content = fs.readFileSync(file, 'utf-8');
            assert.ok(content.includes('*.log'));
            assert.ok(content.includes('.env'));
        });
        (0, node_test_1.it)('should not duplicate existing patterns', () => {
            const file = path.join(tempDir, '.gitignore');
            fs.writeFileSync(file, 'node_modules/\n*.log\n');
            const result = (0, fs_utils_1.ensureGitignorePatterns)(file, ['*.log', '.env']);
            assert.deepStrictEqual(result.added, ['.env']);
            assert.deepStrictEqual(result.alreadyPresent, ['*.log']);
        });
        (0, node_test_1.it)('should create file if it does not exist', () => {
            const file = path.join(tempDir, '.gitignore-new');
            const result = (0, fs_utils_1.ensureGitignorePatterns)(file, ['.env']);
            assert.deepStrictEqual(result.added, ['.env']);
            assert.ok(fs.existsSync(file));
        });
    });
});
//# sourceMappingURL=fs-utils.test.js.map