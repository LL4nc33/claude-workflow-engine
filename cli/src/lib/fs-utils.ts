// =============================================================================
// Claude Workflow Engine CLI - Filesystem Utilities
// Cross-platform safe file operations with backup support
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Safely check if a path exists
 */
export function pathExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely check if a path is a directory
 */
export function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Safely check if a path is a file
 */
export function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Read file safely, returns null on failure
 */
export function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write file with automatic parent directory creation
 */
export function writeFileSafe(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!pathExists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate SHA256 hash of file content
 */
export function fileChecksum(filePath: string): string | null {
  const content = readFileSafe(filePath);
  if (content === null) return null;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Calculate SHA256 hash of a string
 */
export function stringChecksum(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Create a timestamped backup of a file or directory
 */
export function createBackup(sourcePath: string, backupDir: string): string | null {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = path.basename(sourcePath);
    const backupPath = path.join(backupDir, `${baseName}.backup-${timestamp}`);

    if (!pathExists(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (isDirectory(sourcePath)) {
      copyDirRecursive(sourcePath, backupPath);
    } else if (isFile(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
    } else {
      return null;
    }

    return backupPath;
  } catch {
    return null;
  }
}

/**
 * Copy directory recursively
 */
export function copyDirRecursive(src: string, dest: string): void {
  if (!pathExists(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * List all files in a directory recursively
 */
export function listFilesRecursive(dir: string, relativeTo?: string): string[] {
  const files: string[] = [];
  const base = relativeTo || dir;

  if (!isDirectory(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, base));
    } else {
      files.push(path.relative(base, fullPath));
    }
  }

  return files;
}

/**
 * Normalize path for cross-platform compatibility
 */
export function normalizePath(inputPath: string): string {
  return path.resolve(inputPath).replace(/\\/g, '/');
}

/**
 * Get the Claude Workflow Engine root directory from a given path
 * Walks up the tree looking for workflow/ directory
 */
export function findWorkflowRoot(startPath: string): string | null {
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
export function matchesGitignorePattern(filePath: string, patterns: string[]): boolean {
  const fileName = path.basename(filePath);
  const relativePath = filePath;

  for (const pattern of patterns) {
    // Simple glob matching (covers common cases)
    if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1);
      if (fileName.endsWith(suffix)) return true;
    } else if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (fileName.startsWith(prefix)) return true;
    } else if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      if (regex.test(fileName) || regex.test(relativePath)) return true;
    } else {
      if (fileName === pattern || relativePath.endsWith(pattern)) return true;
    }
  }

  return false;
}

/**
 * Parse .gitignore file and return patterns
 */
export function parseGitignore(gitignorePath: string): string[] {
  const content = readFileSafe(gitignorePath);
  if (!content) return [];

  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

/**
 * Ensure patterns exist in .gitignore
 */
export function ensureGitignorePatterns(gitignorePath: string, patterns: string[]): {
  added: string[];
  alreadyPresent: string[];
} {
  const existing = parseGitignore(gitignorePath);
  const added: string[] = [];
  const alreadyPresent: string[] = [];

  for (const pattern of patterns) {
    if (existing.includes(pattern)) {
      alreadyPresent.push(pattern);
    } else {
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
