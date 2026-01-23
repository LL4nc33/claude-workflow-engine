/**
 * Safely check if a path exists
 */
export declare function pathExists(filePath: string): boolean;
/**
 * Safely check if a path is a directory
 */
export declare function isDirectory(filePath: string): boolean;
/**
 * Safely check if a path is a file
 */
export declare function isFile(filePath: string): boolean;
/**
 * Read file safely, returns null on failure
 */
export declare function readFileSafe(filePath: string): string | null;
/**
 * Write file with automatic parent directory creation
 */
export declare function writeFileSafe(filePath: string, content: string): boolean;
/**
 * Calculate SHA256 hash of file content
 */
export declare function fileChecksum(filePath: string): string | null;
/**
 * Calculate SHA256 hash of a string
 */
export declare function stringChecksum(content: string): string;
/**
 * Create a timestamped backup of a file or directory
 */
export declare function createBackup(sourcePath: string, backupDir: string): string | null;
/**
 * Copy directory recursively
 */
export declare function copyDirRecursive(src: string, dest: string): void;
/**
 * List all files in a directory recursively
 */
export declare function listFilesRecursive(dir: string, relativeTo?: string): string[];
/**
 * Normalize path for cross-platform compatibility
 */
export declare function normalizePath(inputPath: string): string;
/**
 * Get the Claude Workflow Engine root directory from a given path
 * Walks up the tree looking for workflow/ directory
 */
export declare function findWorkflowRoot(startPath: string): string | null;
/**
 * Check if a file matches gitignore patterns
 */
export declare function matchesGitignorePattern(filePath: string, patterns: string[]): boolean;
/**
 * Parse .gitignore file and return patterns
 */
export declare function parseGitignore(gitignorePath: string): string[];
/**
 * Ensure patterns exist in .gitignore
 */
export declare function ensureGitignorePatterns(gitignorePath: string, patterns: string[]): {
    added: string[];
    alreadyPresent: string[];
};
//# sourceMappingURL=fs-utils.d.ts.map