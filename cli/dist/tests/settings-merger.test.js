"use strict";
// =============================================================================
// Unit Tests - SettingsMerger
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
const settings_merger_1 = require("../lib/settings-merger");
const helpers_1 = require("./helpers");
(0, node_test_1.describe)('SettingsMerger', () => {
    let tempDir;
    let merger;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        merger = new settings_merger_1.SettingsMerger(tempDir);
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.describe)('generate', () => {
        (0, node_test_1.it)('should generate settings with base permissions for default profile', () => {
            const settings = merger.generate('default');
            assert.ok(settings.permissions);
            assert.ok(settings.permissions.allow);
            assert.ok(settings.permissions.allow.includes('WebSearch'));
            assert.ok(settings.permissions.allow.includes('WebFetch'));
            assert.ok(settings.permissions.allow.some(p => p.startsWith('Skill(')));
            assert.ok(settings.permissions.allow.some(p => p.startsWith('Agent(')));
        });
        (0, node_test_1.it)('should include node-specific permissions for node profile', () => {
            const settings = merger.generate('node');
            assert.ok(settings.permissions.allow.includes('Bash(npm:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(npx:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(node:*)'));
        });
        (0, node_test_1.it)('should include python-specific permissions for python profile', () => {
            const settings = merger.generate('python');
            assert.ok(settings.permissions.allow.includes('Bash(python3:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(pip:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(pytest:*)'));
        });
        (0, node_test_1.it)('should include rust-specific permissions for rust profile', () => {
            const settings = merger.generate('rust');
            assert.ok(settings.permissions.allow.includes('Bash(cargo:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(rustc:*)'));
        });
        (0, node_test_1.it)('should include devops permissions when requested', () => {
            const settings = merger.generate('default', { includeDevOps: true });
            assert.ok(settings.permissions.allow.includes('Bash(docker:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(terraform:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(kubectl:*)'));
        });
        (0, node_test_1.it)('should include security permissions when requested', () => {
            const settings = merger.generate('default', { includeSecurity: true });
            assert.ok(settings.permissions.allow.includes('Bash(trivy:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(semgrep:*)'));
        });
        (0, node_test_1.it)('should not include devops/security by default', () => {
            const settings = merger.generate('default');
            assert.ok(!settings.permissions.allow.includes('Bash(docker:*)'));
            assert.ok(!settings.permissions.allow.includes('Bash(trivy:*)'));
        });
        (0, node_test_1.it)('should deduplicate permissions', () => {
            const settings = merger.generate('node', { includeDevOps: true, includeSecurity: true });
            const perms = settings.permissions.allow;
            const unique = [...new Set(perms)];
            assert.strictEqual(perms.length, unique.length);
        });
        (0, node_test_1.it)('should include default bash permissions in all profiles', () => {
            const settings = merger.generate('node');
            assert.ok(settings.permissions.allow.includes('Bash(git clone:*)'));
            assert.ok(settings.permissions.allow.includes('Bash(mkdir:*)'));
        });
    });
    (0, node_test_1.describe)('merge', () => {
        (0, node_test_1.it)('should create settings file if it does not exist', () => {
            const result = merger.merge('default');
            const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
            assert.ok(fs.existsSync(settingsPath));
            assert.ok(result.addedPermissions.length > 0);
        });
        (0, node_test_1.it)('should preserve existing permissions', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), JSON.stringify({
                permissions: { allow: ['CustomPermission'] }
            }));
            const result = merger.merge('default');
            assert.ok(result.merged.permissions.allow.includes('CustomPermission'));
        });
        (0, node_test_1.it)('should not duplicate already-present permissions', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), JSON.stringify({
                permissions: { allow: ['WebSearch', 'WebFetch'] }
            }));
            const result = merger.merge('default');
            assert.ok(result.existingPermissions.includes('WebSearch'));
            assert.ok(result.existingPermissions.includes('WebFetch'));
            // Check no duplicates
            const perms = result.merged.permissions.allow;
            const webSearchCount = perms.filter(p => p === 'WebSearch').length;
            assert.strictEqual(webSearchCount, 1);
        });
        (0, node_test_1.it)('should not write file in dry-run mode', () => {
            const settingsPath = path.join(tempDir, '.claude', 'settings.local.json');
            merger.merge('default', { dryRun: true });
            assert.ok(!fs.existsSync(settingsPath));
        });
        (0, node_test_1.it)('should return correct filePath', () => {
            const result = merger.merge('default', { dryRun: true });
            assert.ok(result.filePath.includes('settings.local.json'));
        });
        (0, node_test_1.it)('should preserve non-permission fields', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), JSON.stringify({
                customField: 'preserved',
                permissions: { allow: [] }
            }));
            const result = merger.merge('default');
            assert.strictEqual(result.merged.customField, 'preserved');
        });
    });
    (0, node_test_1.describe)('validateExisting', () => {
        (0, node_test_1.it)('should report valid when all base permissions present', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), JSON.stringify(merger.generate('default', { includeDevOps: true, includeSecurity: true })));
            const validation = merger.validateExisting();
            assert.strictEqual(validation.valid, true);
            assert.strictEqual(validation.missingPermissions.length, 0);
        });
        (0, node_test_1.it)('should identify missing permissions', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), JSON.stringify({ permissions: { allow: ['WebSearch'] } }));
            const validation = merger.validateExisting();
            assert.strictEqual(validation.valid, false);
            assert.ok(validation.missingPermissions.length > 0);
            assert.ok(validation.missingPermissions.includes('WebFetch'));
        });
        (0, node_test_1.it)('should identify extra (unknown) permissions', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), JSON.stringify({
                permissions: { allow: ['WebSearch', 'WebFetch', 'UnknownCustom'] }
            }));
            const validation = merger.validateExisting();
            assert.ok(validation.extraPermissions.includes('UnknownCustom'));
        });
        (0, node_test_1.it)('should handle missing settings file', () => {
            const validation = merger.validateExisting();
            assert.strictEqual(validation.valid, false);
            assert.ok(validation.missingPermissions.length > 0);
        });
        (0, node_test_1.it)('should handle corrupted settings file', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.claude', 'settings.local.json'), 'not valid json');
            const validation = merger.validateExisting();
            assert.strictEqual(validation.valid, false);
        });
    });
});
//# sourceMappingURL=settings-merger.test.js.map