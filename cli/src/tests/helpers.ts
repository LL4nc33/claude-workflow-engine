// =============================================================================
// CLI Tests - Shared Test Utilities
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '../lib/logger';

let tempDirs: string[] = [];

/**
 * Create an isolated temp directory for testing
 */
export function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwe-test-'));
  tempDirs.push(dir);
  return dir;
}

/**
 * Remove a temp directory and all contents
 */
export function cleanupTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    tempDirs = tempDirs.filter(d => d !== dir);
  } catch {
    // Ignore cleanup failures
  }
}

/**
 * Cleanup all temp dirs created during tests
 */
export function cleanupAllTempDirs(): void {
  for (const dir of [...tempDirs]) {
    cleanupTempDir(dir);
  }
}

/**
 * Create a mock logger that suppresses all output
 */
export function createMockLogger(): Logger {
  const log = new Logger(false);
  // Override all output methods to be silent
  const noop = () => {};
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
export function setupTestProject(dir: string): void {
  // Create workflow structure
  fs.mkdirSync(path.join(dir, 'workflow', 'standards', 'global'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'workflow', 'product'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'workflow', 'specs'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'commands', 'workflow'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'workflow'), { recursive: true });

  // Create config.yml
  fs.writeFileSync(path.join(dir, 'workflow', 'config.yml'),
    'version: "0.2.0"\nlocal_only: true\n');

  // Create .claude/CLAUDE.md
  fs.writeFileSync(path.join(dir, '.claude', 'CLAUDE.md'),
    '# Claude Workflow Engine\n');

  // Create settings.local.json
  fs.writeFileSync(path.join(dir, '.claude', 'settings.local.json'),
    JSON.stringify({ permissions: { allow: [] } }, null, 2));

  // Create .gitignore
  fs.writeFileSync(path.join(dir, '.gitignore'),
    'node_modules/\ndist/\n');

  // Create .git directory (minimal)
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
}

/**
 * Write a file with parent directory creation
 */
export function writeTestFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}
