"use strict";
// =============================================================================
// CLI Tests - Shared Test Utilities
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
exports.createTempDir = createTempDir;
exports.cleanupTempDir = cleanupTempDir;
exports.cleanupAllTempDirs = cleanupAllTempDirs;
exports.createMockLogger = createMockLogger;
exports.setupTestProject = setupTestProject;
exports.writeTestFile = writeTestFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const logger_1 = require("../lib/logger");
let tempDirs = [];
/**
 * Create an isolated temp directory for testing
 */
function createTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwe-test-'));
    tempDirs.push(dir);
    return dir;
}
/**
 * Remove a temp directory and all contents
 */
function cleanupTempDir(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
        tempDirs = tempDirs.filter(d => d !== dir);
    }
    catch {
        // Ignore cleanup failures
    }
}
/**
 * Cleanup all temp dirs created during tests
 */
function cleanupAllTempDirs() {
    for (const dir of [...tempDirs]) {
        cleanupTempDir(dir);
    }
}
/**
 * Create a mock logger that suppresses all output
 */
function createMockLogger() {
    const log = new logger_1.Logger(false);
    // Override all output methods to be silent
    const noop = () => { };
    log.header = noop;
    log.section = noop;
    log.pass = noop;
    log.fail = noop;
    log.warn = noop;
    log.info = noop;
    log.skip = noop;
    log.step = noop;
    log.done = noop;
    log.debug = noop;
    log.error = noop;
    log.table = noop;
    log.severity = noop;
    log.newline = noop;
    log.summary = noop;
    log.box = noop;
    return log;
}
/**
 * Create a minimal project structure for testing
 */
function setupTestProject(dir) {
    // Create workflow structure
    fs.mkdirSync(path.join(dir, 'workflow', 'standards', 'global'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'workflow', 'product'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'workflow', 'specs'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.claude', 'agents'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.claude', 'commands', 'workflow'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.claude', 'skills', 'workflow'), { recursive: true });
    // Create config.yml
    fs.writeFileSync(path.join(dir, 'workflow', 'config.yml'), 'version: "0.2.0"\nlocal_only: true\n');
    // Create .claude/CLAUDE.md
    fs.writeFileSync(path.join(dir, '.claude', 'CLAUDE.md'), '# Claude Workflow Engine\n');
    // Create settings.local.json
    fs.writeFileSync(path.join(dir, '.claude', 'settings.local.json'), JSON.stringify({ permissions: { allow: [] } }, null, 2));
    // Create .gitignore
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\ndist/\n');
    // Create .git directory (minimal)
    fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
}
/**
 * Write a file with parent directory creation
 */
function writeTestFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
}
//# sourceMappingURL=helpers.js.map