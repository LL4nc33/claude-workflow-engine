"use strict";
// =============================================================================
// Unit Tests - StateManager
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
const state_manager_1 = require("../lib/state-manager");
const helpers_1 = require("./helpers");
(0, node_test_1.describe)('StateManager', () => {
    let tempDir;
    let stateManager;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        stateManager = new state_manager_1.StateManager(tempDir);
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.describe)('isInstalled', () => {
        (0, node_test_1.it)('should return false when no state file exists', () => {
            assert.strictEqual(stateManager.isInstalled(), false);
        });
        (0, node_test_1.it)('should return true when state file exists', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            assert.strictEqual(stateManager.isInstalled(), true);
        });
    });
    (0, node_test_1.describe)('initialize', () => {
        (0, node_test_1.it)('should create state file with correct structure', () => {
            const state = stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'node',
                filesInstalled: ['workflow/config.yml'],
            });
            assert.strictEqual(state.version, '0.2.0');
            assert.strictEqual(state.mode, 'integrated');
            assert.strictEqual(state.scope, 'local');
            assert.strictEqual(state.profile, 'node');
            assert.deepStrictEqual(state.filesInstalled, ['workflow/config.yml']);
            assert.ok(state.installedAt);
            assert.ok(state.updatedAt);
            assert.strictEqual(state.history.length, 1);
            assert.strictEqual(state.history[0].action, 'install');
            assert.strictEqual(state.history[0].success, true);
        });
        (0, node_test_1.it)('should persist state to disk', () => {
            stateManager.initialize({
                mode: 'template',
                scope: 'global',
                profile: 'python',
                filesInstalled: [],
            });
            const statePath = path.join(tempDir, '.installation-state.json');
            assert.ok(fs.existsSync(statePath));
            const content = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
            assert.strictEqual(content.mode, 'template');
            assert.strictEqual(content.profile, 'python');
        });
        (0, node_test_1.it)('should calculate checksums for installed files', () => {
            const file = path.join(tempDir, 'test.txt');
            fs.writeFileSync(file, 'checksum content');
            const state = stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: ['test.txt'],
            });
            assert.ok(state.checksumMap['test.txt']);
            assert.strictEqual(state.checksumMap['test.txt'].length, 64);
        });
    });
    (0, node_test_1.describe)('getState', () => {
        (0, node_test_1.it)('should return null when no state exists', () => {
            assert.strictEqual(stateManager.getState(), null);
        });
        (0, node_test_1.it)('should return saved state', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            const state = stateManager.getState();
            assert.ok(state !== null);
            assert.strictEqual(state.version, '0.2.0');
        });
        (0, node_test_1.it)('should return null for corrupted state file', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.installation-state.json'), 'not json');
            assert.strictEqual(stateManager.getState(), null);
        });
    });
    (0, node_test_1.describe)('getVersion', () => {
        (0, node_test_1.it)('should return null when not installed', () => {
            assert.strictEqual(stateManager.getVersion(), null);
        });
        (0, node_test_1.it)('should return version string when installed', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            assert.strictEqual(stateManager.getVersion(), '0.2.0');
        });
    });
    (0, node_test_1.describe)('recordUpdate', () => {
        (0, node_test_1.it)('should append to history', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            stateManager.recordUpdate(['file1.txt', 'file2.txt'], true);
            const state = stateManager.getState();
            assert.strictEqual(state.history.length, 2);
            assert.strictEqual(state.history[1].action, 'update');
            assert.deepStrictEqual(state.history[1].filesChanged, ['file1.txt', 'file2.txt']);
            assert.strictEqual(state.history[1].success, true);
        });
        (0, node_test_1.it)('should record errors', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            stateManager.recordUpdate([], false, 'Something failed');
            const state = stateManager.getState();
            assert.strictEqual(state.history[1].success, false);
            assert.strictEqual(state.history[1].error, 'Something failed');
        });
        (0, node_test_1.it)('should update updatedAt timestamp', () => {
            const state = stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            const originalUpdated = state.updatedAt;
            // Small delay to ensure timestamp differs
            stateManager.recordUpdate(['x.txt'], true);
            const newState = stateManager.getState();
            assert.ok(newState.updatedAt >= originalUpdated);
        });
    });
    (0, node_test_1.describe)('createBackup', () => {
        (0, node_test_1.it)('should backup workflow directory', () => {
            fs.mkdirSync(path.join(tempDir, 'workflow'), { recursive: true });
            fs.writeFileSync(path.join(tempDir, 'workflow', 'config.yml'), 'test');
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: ['workflow/config.yml'],
            });
            const result = stateManager.createBackup();
            assert.ok(result !== null);
            assert.ok(fs.existsSync(result));
        });
        (0, node_test_1.it)('should return null when no directories to backup', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            const result = stateManager.createBackup();
            assert.strictEqual(result, null);
        });
    });
    (0, node_test_1.describe)('checkIntegrity', () => {
        (0, node_test_1.it)('should detect intact files', () => {
            const file = path.join(tempDir, 'intact.txt');
            fs.writeFileSync(file, 'original');
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: ['intact.txt'],
            });
            const result = stateManager.checkIntegrity();
            assert.ok(result.intact.includes('intact.txt'));
            assert.strictEqual(result.modified.length, 0);
            assert.strictEqual(result.missing.length, 0);
        });
        (0, node_test_1.it)('should detect modified files', () => {
            const file = path.join(tempDir, 'mod.txt');
            fs.writeFileSync(file, 'original');
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: ['mod.txt'],
            });
            // Modify the file
            fs.writeFileSync(file, 'changed');
            const result = stateManager.checkIntegrity();
            assert.ok(result.modified.includes('mod.txt'));
        });
        (0, node_test_1.it)('should detect missing files', () => {
            const file = path.join(tempDir, 'temp.txt');
            fs.writeFileSync(file, 'will delete');
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: ['temp.txt'],
            });
            // Delete the file
            fs.unlinkSync(file);
            const result = stateManager.checkIntegrity();
            assert.ok(result.missing.includes('temp.txt'));
        });
        (0, node_test_1.it)('should return empty arrays when not installed', () => {
            const result = stateManager.checkIntegrity();
            assert.deepStrictEqual(result, { intact: [], modified: [], missing: [] });
        });
    });
    (0, node_test_1.describe)('listBackups', () => {
        (0, node_test_1.it)('should return empty array when no backups exist', () => {
            assert.deepStrictEqual(stateManager.listBackups(), []);
        });
        (0, node_test_1.it)('should list backup entries', () => {
            const backupDir = path.join(tempDir, '.workflow-backups');
            fs.mkdirSync(backupDir, { recursive: true });
            fs.writeFileSync(path.join(backupDir, 'file.backup-2024-01-01'), 'backup1');
            fs.writeFileSync(path.join(backupDir, 'file.backup-2024-01-02'), 'backup2');
            const backups = stateManager.listBackups();
            assert.strictEqual(backups.length, 2);
        });
    });
    (0, node_test_1.describe)('cleanBackups', () => {
        (0, node_test_1.it)('should remove old backups keeping N most recent', () => {
            const backupDir = path.join(tempDir, '.workflow-backups');
            fs.mkdirSync(backupDir, { recursive: true });
            fs.writeFileSync(path.join(backupDir, 'a.backup-2024-01-01'), '');
            fs.writeFileSync(path.join(backupDir, 'b.backup-2024-01-02'), '');
            fs.writeFileSync(path.join(backupDir, 'c.backup-2024-01-03'), '');
            fs.writeFileSync(path.join(backupDir, 'd.backup-2024-01-04'), '');
            const removed = stateManager.cleanBackups(2);
            assert.strictEqual(removed, 2);
        });
        (0, node_test_1.it)('should not remove when backups <= keep count', () => {
            const backupDir = path.join(tempDir, '.workflow-backups');
            fs.mkdirSync(backupDir, { recursive: true });
            fs.writeFileSync(path.join(backupDir, 'a.backup-2024-01-01'), '');
            const removed = stateManager.cleanBackups(3);
            assert.strictEqual(removed, 0);
        });
    });
    (0, node_test_1.describe)('rollback', () => {
        (0, node_test_1.it)('should fail when no backup available', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            const result = stateManager.rollback();
            assert.strictEqual(result.success, false);
            assert.ok(result.message.includes('No backup available'));
        });
        (0, node_test_1.it)('should fail when backup path does not exist', () => {
            stateManager.initialize({
                mode: 'integrated',
                scope: 'local',
                profile: 'default',
                filesInstalled: [],
            });
            stateManager.updateBackupPath('/nonexistent/path');
            const result = stateManager.rollback();
            assert.strictEqual(result.success, false);
            assert.ok(result.message.includes('not found'));
        });
    });
});
//# sourceMappingURL=state-manager.test.js.map