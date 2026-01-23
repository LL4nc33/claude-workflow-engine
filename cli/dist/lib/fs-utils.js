"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Filesystem Utilities
// Cross-platform safe file operations with backup support
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
exports.pathExists = pathExists;
exports.isDirectory = isDirectory;
exports.isFile = isFile;
exports.readFileSafe = readFileSafe;
exports.writeFileSafe = writeFileSafe;
exports.fileChecksum = fileChecksum;
exports.stringChecksum = stringChecksum;
exports.createBackup = createBackup;
exports.copyDirRecursive = copyDirRecursive;
exports.listFilesRecursive = listFilesRecursive;
exports.normalizePath = normalizePath;
exports.findWorkflowRoot = findWorkflowRoot;
exports.matchesGitignorePattern = matchesGitignorePattern;
exports.parseGitignore = parseGitignore;
exports.ensureGitignorePatterns = ensureGitignorePatterns;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
/**
 * Safely check if a path exists
 */
function pathExists(filePath) {
    try {
        fs.accessSync(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Safely check if a path is a directory
 */
function isDirectory(filePath) {
    try {
        return fs.statSync(filePath).isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Safely check if a path is a file
 */
function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch {
        return false;
    }
}
/**
 * Read file safely, returns null on failure
 */
function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
/**
 * Write file with automatic parent directory creation
 */
function writeFileSafe(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        if (!pathExists(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Calculate SHA256 hash of file content
 */
function fileChecksum(filePath) {
    const content = readFileSafe(filePath);
    if (content === null)
        return null;
    return crypto.createHash('sha256').update(content).digest('hex');
}
/**
 * Calculate SHA256 hash of a string
 */
function stringChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}
/**
 * Create a timestamped backup of a file or directory
 */
function createBackup(sourcePath, backupDir) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseName = path.basename(sourcePath);
        const backupPath = path.join(backupDir, `${baseName}.backup-${timestamp}`);
        if (!pathExists(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        if (isDirectory(sourcePath)) {
            copyDirRecursive(sourcePath, backupPath);
        }
        else if (isFile(sourcePath)) {
            fs.copyFileSync(sourcePath, backupPath);
        }
        else {
            return null;
        }
        return backupPath;
    }
    catch {
        return null;
    }
}
/**
 * Copy directory recursively
 */
function copyDirRecursive(src, dest) {
    if (!pathExists(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * List all files in a directory recursively
 */
function listFilesRecursive(dir, relativeTo) {
    const files = [];
    const base = relativeTo || dir;
    if (!isDirectory(dir))
        return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursive(fullPath, base));
        }
        else {
            files.push(path.relative(base, fullPath));
        }
    }
    return files;
}
/**
 * Normalize path for cross-platform compatibility
 */
function normalizePath(inputPath) {
    return path.resolve(inputPath).replace(/\\/g, '/');
}
/**
 * Get the Claude Workflow Engine root directory from a given path
 * Walks up the tree looking for workflow/ directory
 */
function findWorkflowRoot(startPath) {
    let current = path.resolve(startPath);
    const root = path.parse(current).root;
    while (current !== root) {
        if (pathExists(path.join(current, 'workflow', 'config.yml'))) {
            return current;
        }
        current = path.dirname(current);
    }
    return null;
}
/**
 * Check if a file matches gitignore patterns
 */
function matchesGitignorePattern(filePath, patterns) {
    const fileName = path.basename(filePath);
    const relativePath = filePath;
    for (const pattern of patterns) {
        // Simple glob matching (covers common cases)
        if (pattern.startsWith('*')) {
            const suffix = pattern.slice(1);
            if (fileName.endsWith(suffix))
                return true;
        }
        else if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            if (fileName.startsWith(prefix))
                return true;
        }
        else if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
            if (regex.test(fileName) || regex.test(relativePath))
                return true;
        }
        else {
            if (fileName === pattern || relativePath.endsWith(pattern))
                return true;
        }
    }
    return false;
}
/**
 * Parse .gitignore file and return patterns
 */
function parseGitignore(gitignorePath) {
    const content = readFileSafe(gitignorePath);
    if (!content)
        return [];
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
}
/**
 * Ensure patterns exist in .gitignore
 */
function ensureGitignorePatterns(gitignorePath, patterns) {
    const existing = parseGitignore(gitignorePath);
    const added = [];
    const alreadyPresent = [];
    for (const pattern of patterns) {
        if (existing.includes(pattern)) {
            alreadyPresent.push(pattern);
        }
        else {
            added.push(pattern);
        }
    }
    if (added.length > 0) {
        let content = readFileSafe(gitignorePath) || '';
        if (content && !content.endsWith('\n')) {
            content += '\n';
        }
        content += '\n# Claude Workflow Engine - GDPR/Security (auto-added)\n';
        content += added.join('\n') + '\n';
        writeFileSafe(gitignorePath, content);
    }
    return { added, alreadyPresent };
}
//# sourceMappingURL=fs-utils.js.map