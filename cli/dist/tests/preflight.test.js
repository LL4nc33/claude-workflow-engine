"use strict";
// =============================================================================
// Unit Tests - PreFlightChecker
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
const preflight_1 = require("../lib/preflight");
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
function createOptions(overrides = {}) {
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
(0, node_test_1.describe)('PreFlightChecker', () => {
    let tempDir;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        silenceConsole();
    });
    (0, node_test_1.afterEach)(() => {
        restoreConsole();
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.describe)('run', () => {
        (0, node_test_1.it)('should return a PreFlightReport', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            assert.ok(report.timestamp);
            assert.ok(report.platform);
            assert.ok(report.nodeVersion);
            assert.ok(Array.isArray(report.checks));
            assert.ok(typeof report.canProceed === 'boolean');
            assert.ok(typeof report.warnings === 'number');
            assert.ok(typeof report.errors === 'number');
        });
        (0, node_test_1.it)('should pass node version check (running node >= 18)', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const nodeCheck = report.checks.find(c => c.name === 'node_version');
            assert.ok(nodeCheck);
            assert.strictEqual(nodeCheck.status, 'pass');
        });
        (0, node_test_1.it)('should detect git availability', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const gitCheck = report.checks.find(c => c.name === 'git_available');
            assert.ok(gitCheck);
            // Git should be available in CI/dev environments
            assert.ok(gitCheck.status === 'pass' || gitCheck.status === 'warn');
        });
        (0, node_test_1.it)('should report platform information', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const platformCheck = report.checks.find(c => c.name === 'platform');
            assert.ok(platformCheck);
            assert.strictEqual(platformCheck.status, 'pass');
        });
        (0, node_test_1.it)('should check target path exists', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const pathCheck = report.checks.find(c => c.name === 'target_path');
            assert.ok(pathCheck);
            assert.strictEqual(pathCheck.status, 'pass');
        });
        (0, node_test_1.it)('should fail for non-existing target path in local scope', () => {
            const options = createOptions({ path: path.join(tempDir, 'nonexist'), scope: 'local' });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const pathCheck = report.checks.find(c => c.name === 'target_exists');
            assert.ok(pathCheck);
            assert.strictEqual(pathCheck.status, 'fail');
        });
        (0, node_test_1.it)('should report non-git-repo as warning', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const gitRepoCheck = report.checks.find(c => c.name === 'git_repo');
            assert.ok(gitRepoCheck);
            assert.strictEqual(gitRepoCheck.status, 'warn');
        });
        (0, node_test_1.it)('should detect git repo when .git exists', () => {
            fs.mkdirSync(path.join(tempDir, '.git'), { recursive: true });
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const gitRepoCheck = report.checks.find(c => c.name === 'git_repo');
            assert.ok(gitRepoCheck);
            assert.strictEqual(gitRepoCheck.status, 'pass');
        });
        (0, node_test_1.it)('should allow proceed when force is true despite errors', () => {
            const options = createOptions({
                path: path.join(tempDir, 'nonexist'),
                scope: 'local',
                force: true,
            });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            assert.strictEqual(report.canProceed, true);
        });
        (0, node_test_1.it)('should prevent proceed when errors exist without force', () => {
            const options = createOptions({
                path: path.join(tempDir, 'nonexist'),
                scope: 'local',
                force: false,
            });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            assert.strictEqual(report.canProceed, false);
        });
    });
    (0, node_test_1.describe)('checkEnvironment (via run)', () => {
        (0, node_test_1.it)('should include node version in report', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            assert.ok(report.nodeVersion.startsWith('v'));
        });
        (0, node_test_1.it)('should include platform in report', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            assert.ok(['linux', 'darwin', 'win32'].includes(report.platform));
        });
    });
    (0, node_test_1.describe)('checkPlatform (via run)', () => {
        (0, node_test_1.it)('should report disk space when available', () => {
            const options = createOptions({ path: tempDir });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const diskCheck = report.checks.find(c => c.name === 'disk_space');
            // Disk check might not be available in all environments
            if (diskCheck) {
                assert.ok(diskCheck.status === 'pass' || diskCheck.status === 'warn');
            }
        });
    });
    (0, node_test_1.describe)('checkTargetPath (via run)', () => {
        (0, node_test_1.it)('should fail when target is a file not directory', () => {
            const filePath = path.join(tempDir, 'not-a-dir');
            fs.writeFileSync(filePath, 'file content');
            const options = createOptions({ path: filePath });
            const checker = new preflight_1.PreFlightChecker(options);
            const report = checker.run();
            const dirCheck = report.checks.find(c => c.name === 'target_is_dir');
            assert.ok(dirCheck);
            assert.strictEqual(dirCheck.status, 'fail');
        });
    });
});
//# sourceMappingURL=preflight.test.js.map