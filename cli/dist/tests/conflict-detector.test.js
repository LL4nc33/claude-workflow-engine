"use strict";
// =============================================================================
// Unit Tests - ConflictDetector
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
const path = __importStar(require("path"));
const conflict_detector_1 = require("../lib/conflict-detector");
const helpers_1 = require("./helpers");
(0, node_test_1.describe)('ConflictDetector', () => {
    let targetDir;
    let templateDir;
    (0, node_test_1.beforeEach)(() => {
        targetDir = (0, helpers_1.createTempDir)();
        templateDir = (0, helpers_1.createTempDir)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_1.cleanupTempDir)(targetDir);
        (0, helpers_1.cleanupTempDir)(templateDir);
    });
    (0, node_test_1.describe)('detect', () => {
        (0, node_test_1.it)('should return empty report when no conflicts', () => {
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            assert.strictEqual(report.fileConflicts.length, 0);
            assert.strictEqual(report.commandConflicts.length, 0);
            assert.strictEqual(report.hasBlockingConflicts, false);
        });
        (0, node_test_1.it)('should detect file conflicts when files exist in target', () => {
            // Create same file in both target and template with different content
            (0, helpers_1.writeTestFile)(path.join(targetDir, 'workflow', 'config.yml'), 'target content');
            (0, helpers_1.writeTestFile)(path.join(templateDir, 'workflow', 'config.yml'), 'template content');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            assert.ok(report.fileConflicts.length > 0);
            const conflict = report.fileConflicts.find(c => c.path === 'workflow/config.yml');
            assert.ok(conflict);
            assert.strictEqual(conflict.type, 'modified');
        });
        (0, node_test_1.it)('should not report conflicts when target file matches template', () => {
            (0, helpers_1.writeTestFile)(path.join(targetDir, 'workflow', 'config.yml'), 'same content');
            (0, helpers_1.writeTestFile)(path.join(templateDir, 'workflow', 'config.yml'), 'same content');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            const conflict = report.fileConflicts.find(c => c.path === 'workflow/config.yml');
            assert.strictEqual(conflict, undefined);
        });
        (0, node_test_1.it)('should detect command namespace conflicts', () => {
            // Create an existing command that conflicts with workflow commands
            (0, helpers_1.writeTestFile)(path.join(targetDir, '.claude', 'commands', 'plan-product.md'), '# Custom plan-product');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            assert.ok(report.commandConflicts.length > 0);
            assert.ok(report.hasBlockingConflicts);
        });
    });
    (0, node_test_1.describe)('runChecks', () => {
        (0, node_test_1.it)('should return pass for clean target', () => {
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const results = detector.runChecks();
            assert.ok(results.length > 0);
            const installCheck = results.find(r => r.name === 'existing_installation');
            assert.ok(installCheck);
            assert.strictEqual(installCheck.status, 'pass');
        });
        (0, node_test_1.it)('should detect existing installation', () => {
            (0, helpers_1.writeTestFile)(path.join(targetDir, 'workflow', 'config.yml'), 'version: 0.1.0\n');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const results = detector.runChecks();
            const installCheck = results.find(r => r.name === 'existing_installation');
            assert.ok(installCheck);
            assert.strictEqual(installCheck.status, 'warn');
            assert.ok(installCheck.message.includes('0.1.0'));
        });
        (0, node_test_1.it)('should check write permissions', () => {
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const results = detector.runChecks();
            const permCheck = results.find(r => r.name === 'write_permission');
            assert.ok(permCheck);
            assert.strictEqual(permCheck.status, 'pass');
        });
        (0, node_test_1.it)('should report file conflicts as check results', () => {
            (0, helpers_1.writeTestFile)(path.join(targetDir, 'workflow', 'config.yml'), 'different');
            (0, helpers_1.writeTestFile)(path.join(templateDir, 'workflow', 'config.yml'), 'original');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const results = detector.runChecks();
            const conflictChecks = results.filter(r => r.name.startsWith('file_conflict_'));
            assert.ok(conflictChecks.length > 0);
        });
        (0, node_test_1.it)('should report command conflicts as errors', () => {
            (0, helpers_1.writeTestFile)(path.join(targetDir, '.claude', 'commands', 'create-tasks.md'), '# Existing');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const results = detector.runChecks();
            const cmdConflicts = results.filter(r => r.name.startsWith('cmd_conflict_'));
            assert.ok(cmdConflicts.length > 0);
            assert.ok(cmdConflicts.some(c => c.status === 'fail'));
        });
    });
    (0, node_test_1.describe)('detectFileConflicts (via detect)', () => {
        (0, node_test_1.it)('should detect modified files in workflow directories', () => {
            // Create files in both target and template dirs under a workflow dir
            (0, helpers_1.writeTestFile)(path.join(targetDir, '.claude', 'agents', 'test.md'), 'modified agent');
            (0, helpers_1.writeTestFile)(path.join(templateDir, '.claude', 'agents', 'test.md'), 'original agent');
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            const agentConflict = report.fileConflicts.find(c => c.path.includes('agents'));
            assert.ok(agentConflict);
        });
        (0, node_test_1.it)('should handle file existing only in target (no template)', () => {
            (0, helpers_1.writeTestFile)(path.join(targetDir, '.claude', 'CLAUDE.md'), 'existing');
            // No corresponding template file
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            const conflict = report.fileConflicts.find(c => c.path === '.claude/CLAUDE.md');
            assert.ok(conflict);
            assert.strictEqual(conflict.type, 'exists');
        });
    });
    (0, node_test_1.describe)('detectCommandConflicts (via detect)', () => {
        (0, node_test_1.it)('should not report conflicts when no commands exist', () => {
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            assert.strictEqual(report.commandConflicts.length, 0);
        });
        (0, node_test_1.it)('should detect multiple command conflicts', () => {
            const commands = ['plan-product', 'shape-spec', 'write-spec'];
            for (const cmd of commands) {
                (0, helpers_1.writeTestFile)(path.join(targetDir, '.claude', 'commands', `${cmd}.md`), `# ${cmd}`);
            }
            const detector = new conflict_detector_1.ConflictDetector(targetDir, templateDir);
            const report = detector.detect();
            assert.strictEqual(report.commandConflicts.length, 3);
        });
    });
});
//# sourceMappingURL=conflict-detector.test.js.map