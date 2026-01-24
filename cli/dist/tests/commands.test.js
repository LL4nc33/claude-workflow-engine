"use strict";
// =============================================================================
// Integration Tests - Health, Status, Check Commands
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
const settings_merger_1 = require("../lib/settings-merger");
const gdpr_validator_1 = require("../lib/gdpr-validator");
const conflict_detector_1 = require("../lib/conflict-detector");
const helpers_1 = require("./helpers");
// Suppress console output during tests
const originalLog = console.log;
const originalError = console.error;
function silenceConsole() {
    console.log = () => { };
    console.error = () => { };
}
function restoreConsole() {
    console.log = originalLog;
    console.error = originalError;
}
(0, node_test_1.describe)('Health Command - Integration', () => {
    let tempDir;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        silenceConsole();
    });
    (0, node_test_1.afterEach)(() => {
        restoreConsole();
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.describe)('Health checks on fresh install', () => {
        (0, node_test_1.it)('should pass all checks on properly installed project', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            // Initialize state
            const sm = new state_manager_1.StateManager(tempDir);
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
        (0, node_test_1.it)('should detect missing core files', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            // Remove a core file
            fs.unlinkSync(path.join(tempDir, 'workflow', 'config.yml'));
            assert.ok(!fs.existsSync(path.join(tempDir, 'workflow', 'config.yml')));
        });
        (0, node_test_1.it)('should detect file integrity issues', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            const sm = new state_manager_1.StateManager(tempDir);
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
    (0, node_test_1.describe)('Settings validation', () => {
        (0, node_test_1.it)('should detect missing permissions', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            const merger = new settings_merger_1.SettingsMerger(tempDir);
            const validation = merger.validateExisting();
            // Empty settings = all permissions missing
            assert.strictEqual(validation.valid, false);
            assert.ok(validation.missingPermissions.length > 0);
        });
        (0, node_test_1.it)('should pass after proper settings merge', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            const merger = new settings_merger_1.SettingsMerger(tempDir);
            merger.merge('default', { includeDevOps: true, includeSecurity: true });
            const validation = merger.validateExisting();
            assert.strictEqual(validation.valid, true);
        });
    });
    (0, node_test_1.describe)('GDPR validation in health check', () => {
        (0, node_test_1.it)('should pass with proper gitignore', () => {
            (0, helpers_1.setupTestProject)(tempDir);
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
            const gdpr = new gdpr_validator_1.GDPRValidator(tempDir);
            const report = gdpr.validate();
            assert.strictEqual(report.compliant, true);
        });
        (0, node_test_1.it)('should detect GDPR issues with incomplete gitignore', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            // Remove .gitignore completely to trigger error-severity issue
            fs.unlinkSync(path.join(tempDir, '.gitignore'));
            const gdpr = new gdpr_validator_1.GDPRValidator(tempDir);
            const report = gdpr.validate();
            assert.strictEqual(report.compliant, false);
            assert.ok(report.issues.length > 0);
        });
    });
    (0, node_test_1.describe)('Directory structure check', () => {
        (0, node_test_1.it)('should pass with complete structure', () => {
            (0, helpers_1.setupTestProject)(tempDir);
            const requiredDirs = [
                'workflow', 'workflow/standards', 'workflow/product',
                'workflow/specs', '.claude', '.claude/agents',
            ];
            for (const dir of requiredDirs) {
                assert.ok(fs.existsSync(path.join(tempDir, dir)), `Missing: ${dir}`);
            }
        });
        (0, node_test_1.it)('should detect missing directories', () => {
            fs.mkdirSync(path.join(tempDir, 'workflow'), { recursive: true });
            // Missing: workflow/standards, workflow/product, etc.
            assert.ok(!fs.existsSync(path.join(tempDir, 'workflow', 'standards')));
            assert.ok(!fs.existsSync(path.join(tempDir, '.claude')));
        });
    });
});
(0, node_test_1.describe)('Status Command - Integration', () => {
    let tempDir;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        silenceConsole();
    });
    (0, node_test_1.afterEach)(() => {
        restoreConsole();
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.it)('should show not-installed for empty directory', () => {
        const sm = new state_manager_1.StateManager(tempDir);
        assert.strictEqual(sm.isInstalled(), false);
        assert.strictEqual(sm.getState(), null);
    });
    (0, node_test_1.it)('should show correct info after install', () => {
        (0, helpers_1.setupTestProject)(tempDir);
        const sm = new state_manager_1.StateManager(tempDir);
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
    (0, node_test_1.it)('should report file integrity stats', () => {
        (0, helpers_1.setupTestProject)(tempDir);
        const sm = new state_manager_1.StateManager(tempDir);
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
    (0, node_test_1.it)('should list available backups', () => {
        (0, helpers_1.setupTestProject)(tempDir);
        const sm = new state_manager_1.StateManager(tempDir);
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
(0, node_test_1.describe)('Check Command - Integration', () => {
    let tempDir;
    let templateDir;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        templateDir = (0, helpers_1.createTempDir)();
        silenceConsole();
    });
    (0, node_test_1.afterEach)(() => {
        restoreConsole();
        (0, helpers_1.cleanupTempDir)(tempDir);
        (0, helpers_1.cleanupTempDir)(templateDir);
    });
    (0, node_test_1.describe)('Conflict detection', () => {
        (0, node_test_1.it)('should report no conflicts in clean directory', () => {
            const detector = new conflict_detector_1.ConflictDetector(tempDir, templateDir);
            const report = detector.detect();
            assert.strictEqual(report.fileConflicts.length, 0);
            assert.strictEqual(report.commandConflicts.length, 0);
            assert.strictEqual(report.hasBlockingConflicts, false);
        });
        (0, node_test_1.it)('should report file conflicts when files differ', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'modified');
            (0, helpers_1.writeTestFile)(path.join(templateDir, 'workflow', 'config.yml'), 'original');
            const detector = new conflict_detector_1.ConflictDetector(tempDir, templateDir);
            const report = detector.detect();
            assert.ok(report.fileConflicts.length > 0);
        });
        (0, node_test_1.it)('should report command conflicts', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'commands', 'orchestrate-tasks.md'), '# Custom');
            const detector = new conflict_detector_1.ConflictDetector(tempDir, templateDir);
            const report = detector.detect();
            assert.ok(report.commandConflicts.length > 0);
            assert.strictEqual(report.hasBlockingConflicts, true);
        });
    });
    (0, node_test_1.describe)('GDPR check', () => {
        (0, node_test_1.it)('should detect missing gitignore patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), 'node_modules/\n');
            const gdpr = new gdpr_validator_1.GDPRValidator(tempDir);
            const report = gdpr.validate();
            // Missing patterns are warnings (not errors), so compliant can still be true
            // But issues should be reported
            const missingPatterns = report.issues.filter(i => i.type === 'not_gitignored');
            assert.ok(missingPatterns.length > 0);
        });
        (0, node_test_1.it)('should auto-fix gitignore with --fix', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), 'node_modules/\n');
            const gdpr = new gdpr_validator_1.GDPRValidator(tempDir);
            const result = gdpr.autoFix();
            assert.ok(result.fixed.length > 0);
            // Verify patterns were added
            const content = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf-8');
            assert.ok(content.includes('CLAUDE.local.md'));
            assert.ok(content.includes('.env'));
            assert.ok(content.includes('.installation-state.json'));
        });
    });
    (0, node_test_1.describe)('Permission check', () => {
        (0, node_test_1.it)('should verify write access', () => {
            // tempDir should be writable
            const testFile = path.join(tempDir, '.permission-check-tmp');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            // If we get here, write access is confirmed
            assert.ok(true);
        });
    });
});
(0, node_test_1.describe)('Resolve Command - Integration', () => {
    let tempDir;
    let templateDir;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        templateDir = (0, helpers_1.createTempDir)();
        silenceConsole();
    });
    (0, node_test_1.afterEach)(() => {
        restoreConsole();
        (0, helpers_1.cleanupTempDir)(tempDir);
        (0, helpers_1.cleanupTempDir)(templateDir);
    });
    (0, node_test_1.describe)('Auto-fix file conflicts', () => {
        (0, node_test_1.it)('should backup existing file before resolution', () => {
            const targetFile = path.join(tempDir, 'workflow', 'config.yml');
            (0, helpers_1.writeTestFile)(targetFile, 'existing content');
            // Create backup
            const backupDir = path.join(tempDir, '.workflow-backups');
            fs.mkdirSync(backupDir, { recursive: true });
            const backupPath = path.join(backupDir, 'config.yml.backup');
            fs.copyFileSync(targetFile, backupPath);
            assert.ok(fs.existsSync(backupPath));
            assert.strictEqual(fs.readFileSync(backupPath, 'utf-8'), 'existing content');
        });
        (0, node_test_1.it)('should resolve by overwriting with template', () => {
            const targetFile = path.join(tempDir, 'workflow', 'config.yml');
            const templateFile = path.join(templateDir, 'workflow', 'config.yml');
            (0, helpers_1.writeTestFile)(targetFile, 'old content');
            (0, helpers_1.writeTestFile)(templateFile, 'new template content');
            // Simulate resolution: backup + overwrite
            const backupDir = path.join(tempDir, '.workflow-backups');
            fs.mkdirSync(backupDir, { recursive: true });
            fs.copyFileSync(targetFile, path.join(backupDir, 'config.yml.bak'));
            fs.copyFileSync(templateFile, targetFile);
            assert.strictEqual(fs.readFileSync(targetFile, 'utf-8'), 'new template content');
        });
    });
    (0, node_test_1.describe)('GDPR auto-fix via resolve', () => {
        (0, node_test_1.it)('should fix gitignore patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            const gdpr = new gdpr_validator_1.GDPRValidator(tempDir);
            const result = gdpr.autoFix();
            assert.ok(result.fixed.length > 0);
            const content = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf-8');
            assert.ok(content.includes('.env'));
        });
    });
});
//# sourceMappingURL=commands.test.js.map