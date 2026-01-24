"use strict";
// =============================================================================
// Unit Tests - GDPRValidator
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
const gdpr_validator_1 = require("../lib/gdpr-validator");
const helpers_1 = require("./helpers");
(0, node_test_1.describe)('GDPRValidator', () => {
    let tempDir;
    let validator;
    (0, node_test_1.beforeEach)(() => {
        tempDir = (0, helpers_1.createTempDir)();
        validator = new gdpr_validator_1.GDPRValidator(tempDir);
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_1.cleanupTempDir)(tempDir);
    });
    (0, node_test_1.describe)('validate', () => {
        (0, node_test_1.it)('should report compliant when gitignore has all patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), [
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
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'CLAUDE.local.md'), '');
            const report = validator.validate();
            assert.strictEqual(report.compliant, true);
        });
        (0, node_test_1.it)('should report non-compliant when no gitignore exists', () => {
            // No .gitignore at all → error severity → non-compliant
            const report = validator.validate();
            assert.strictEqual(report.compliant, false);
            assert.ok(report.issues.length > 0);
        });
        (0, node_test_1.it)('should report issues for missing patterns even when compliant', () => {
            // .gitignore exists but has gaps → warnings only → still compliant
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), 'node_modules/\n');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
            const report = validator.validate();
            assert.ok(report.issues.length > 0);
            const missingPatterns = report.issues.filter(i => i.type === 'not_gitignored');
            assert.ok(missingPatterns.length > 0);
        });
        (0, node_test_1.it)('should include recommendations', () => {
            // No gitignore at all
            const report = validator.validate();
            assert.ok(report.recommendations.length > 0);
        });
    });
    (0, node_test_1.describe)('checkGitignore (via validate)', () => {
        (0, node_test_1.it)('should detect missing gitignore file', () => {
            const report = validator.validate();
            const gitignoreIssues = report.issues.filter(i => i.type === 'not_gitignored');
            assert.ok(gitignoreIssues.length > 0);
            assert.ok(gitignoreIssues.some(i => i.detail.includes('No .gitignore')));
        });
        (0, node_test_1.it)('should detect individual missing patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), 'node_modules/\n.env\n');
            const report = validator.validate();
            const missing = report.issues.filter(i => i.type === 'not_gitignored' && i.detail.includes('Pattern'));
            assert.ok(missing.length > 0);
        });
        (0, node_test_1.it)('should pass when all required patterns present', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), [
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
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'CLAUDE.local.md'), '');
            const report = validator.validate();
            const gitignoreIssues = report.issues.filter(i => i.type === 'not_gitignored');
            assert.strictEqual(gitignoreIssues.length, 0);
        });
    });
    (0, node_test_1.describe)('scanForPII (via validate)', () => {
        (0, node_test_1.it)('should detect email addresses in workflow files', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            // Note: lines containing 'example' or 'placeholder' are skipped
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'standards', 'test.md'), 'Contact john.doe@company.org for help\n');
            const report = validator.validate();
            const piiIssues = report.issues.filter(i => i.type === 'pii_detected');
            assert.ok(piiIssues.some(i => i.detail.includes('email')));
        });
        (0, node_test_1.it)('should detect financial number patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'product', 'billing.md'), 'Card: 4111 2222 3333 4444\n');
            const report = validator.validate();
            const piiIssues = report.issues.filter(i => i.type === 'pii_detected');
            // Credit card pattern matches 16-digit numbers
            assert.ok(piiIssues.some(i => i.detail.includes('credit_card')));
        });
        (0, node_test_1.it)('should detect credential patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'standards', 'config.yml'), 'api_key = "sk-1234567890abcdef"\n');
            const report = validator.validate();
            const piiIssues = report.issues.filter(i => i.type === 'pii_detected');
            assert.ok(piiIssues.some(i => i.detail.includes('credential')));
        });
        (0, node_test_1.it)('should skip example/placeholder content', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'standards', 'example.md'), 'Use user@example.com as placeholder\n');
            const report = validator.validate();
            const piiIssues = report.issues.filter(i => i.type === 'pii_detected' && i.file.includes('example.md'));
            assert.strictEqual(piiIssues.length, 0);
        });
        (0, node_test_1.it)('should skip comments', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'standards', 'commented.md'), '# email: real@person.com\n');
            const report = validator.validate();
            const piiIssues = report.issues.filter(i => i.type === 'pii_detected' && i.file.includes('commented.md'));
            assert.strictEqual(piiIssues.length, 0);
        });
        (0, node_test_1.it)('should only scan md and yml files', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'standards', 'data.json'), '{"email": "private@mail.com"}\n');
            const report = validator.validate();
            const piiIssues = report.issues.filter(i => i.type === 'pii_detected' && i.file.includes('data.json'));
            assert.strictEqual(piiIssues.length, 0);
        });
    });
    (0, node_test_1.describe)('checkLocalOnlyConfig (via validate)', () => {
        (0, node_test_1.it)('should detect missing local_only setting', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'version: "0.1.0"\n');
            const report = validator.validate();
            const configIssues = report.issues.filter(i => i.type === 'missing_local_config');
            assert.ok(configIssues.some(i => i.detail.includes('local_only')));
        });
        (0, node_test_1.it)('should pass when local_only is set', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
            const report = validator.validate();
            const configIssues = report.issues.filter(i => i.type === 'missing_local_config' && i.detail.includes('local_only'));
            assert.strictEqual(configIssues.length, 0);
        });
    });
    (0, node_test_1.describe)('autoFix', () => {
        (0, node_test_1.it)('should add missing gitignore patterns', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), 'node_modules/\n');
            const result = validator.autoFix();
            assert.ok(result.fixed.length > 0);
            assert.ok(result.fixed[0].includes('patterns'));
            const content = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf-8');
            assert.ok(content.includes('.env'));
            assert.ok(content.includes('CLAUDE.local.md'));
        });
        (0, node_test_1.it)('should report manual fixes needed for PII', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'standards', 'has-pii.md'), 'Contact: admin@company.org\n');
            const result = validator.autoFix();
            assert.ok(result.manual.length > 0);
        });
        (0, node_test_1.it)('should not add patterns already present', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), [
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
    (0, node_test_1.describe)('patternCovers (via validate)', () => {
        (0, node_test_1.it)('should recognize *.ext covers specific.ext', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '*.local.md\n.env.*\n');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'workflow', 'config.yml'), 'local_only: true\n');
            (0, helpers_1.writeTestFile)(path.join(tempDir, 'CLAUDE.local.md'), '');
            const report = validator.validate();
            // *.local.md should cover CLAUDE.local.md
            const localMdIssues = report.issues.filter(i => i.type === 'not_gitignored' && i.detail.includes('CLAUDE.local.md'));
            assert.strictEqual(localMdIssues.length, 0);
        });
        (0, node_test_1.it)('should recognize prefix* covers prefix.suffix', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '.env*\n');
            const report = validator.validate();
            // .env* should cover .env, .env.local, .env.*
            const envIssues = report.issues.filter(i => i.type === 'not_gitignored' &&
                (i.detail.includes('".env"') || i.detail.includes('".env.local"') || i.detail.includes('".env.*"')));
            assert.strictEqual(envIssues.length, 0);
        });
    });
    (0, node_test_1.describe)('runChecks', () => {
        (0, node_test_1.it)('should return CheckResult array', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), '');
            const results = validator.runChecks();
            assert.ok(Array.isArray(results));
            assert.ok(results.length > 0);
            assert.ok(results[0].name);
            assert.ok(results[0].status);
        });
        (0, node_test_1.it)('should mark auto-fixable issues as warnings in pre-install mode', () => {
            (0, helpers_1.writeTestFile)(path.join(tempDir, '.gitignore'), 'node_modules/\n');
            const results = validator.runChecks(true);
            const gitignoreChecks = results.filter(r => r.name === 'gdpr_not_gitignored');
            for (const check of gitignoreChecks) {
                assert.strictEqual(check.status, 'warn');
                assert.strictEqual(check.autoFixable, true);
            }
        });
    });
});
//# sourceMappingURL=gdpr-validator.test.js.map