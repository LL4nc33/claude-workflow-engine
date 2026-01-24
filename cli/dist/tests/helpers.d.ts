import { Logger } from '../lib/logger';
/**
 * Create an isolated temp directory for testing
 */
export declare function createTempDir(): string;
/**
 * Remove a temp directory and all contents
 */
export declare function cleanupTempDir(dir: string): void;
/**
 * Cleanup all temp dirs created during tests
 */
export declare function cleanupAllTempDirs(): void;
/**
 * Create a mock logger that suppresses all output
 */
export declare function createMockLogger(): Logger;
/**
 * Create a minimal project structure for testing
 */
export declare function setupTestProject(dir: string): void;
/**
 * Write a file with parent directory creation
 */
export declare function writeTestFile(filePath: string, content: string): void;
//# sourceMappingURL=helpers.d.ts.map