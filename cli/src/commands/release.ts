// =============================================================================
// Claude Workflow Engine CLI - Release Command
// Bumps version, updates files, generates changelog, creates git tag
// =============================================================================

import { execSync } from 'child_process';
import * as path from 'path';
import { Logger } from '../lib/logger';
import { pathExists } from '../lib/fs-utils';

interface ReleaseOptions {
  bumpType: 'patch' | 'minor' | 'major';
  dryRun: boolean;
  noCommit: boolean;
  noTag: boolean;
  verbose: boolean;
}

function parseReleaseArgs(args: string[]): ReleaseOptions {
  const options: ReleaseOptions = {
    bumpType: 'patch',
    dryRun: false,
    noCommit: false,
    noTag: false,
    verbose: false,
  };

  for (const arg of args) {
    switch (arg) {
      case 'patch':
      case 'minor':
      case 'major':
        options.bumpType = arg;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-commit':
        options.noCommit = true;
        break;
      case '--no-tag':
        options.noTag = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        showReleaseHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

function findProjectRoot(): string {
  // Walk up from CLI dir to find VERSION file
  let dir = path.resolve(__dirname, '..', '..');
  for (let i = 0; i < 5; i++) {
    if (pathExists(path.join(dir, 'VERSION'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // Fallback: two levels up from cli/dist/ or cli/src/
  return path.resolve(__dirname, '..', '..');
}

export async function releaseCommand(args: string[]): Promise<void> {
  const options = parseReleaseArgs(args);
  const log = new Logger(options.verbose);
  const projectRoot = findProjectRoot();
  const scriptPath = path.join(projectRoot, 'scripts', 'release.sh');

  if (!pathExists(scriptPath)) {
    log.error(`Release script not found: ${scriptPath}`);
    process.exit(1);
  }

  // Build shell command
  const shellArgs: string[] = [options.bumpType];
  if (options.dryRun) shellArgs.push('--dry-run');
  if (options.noCommit) shellArgs.push('--no-commit');
  if (options.noTag) shellArgs.push('--no-tag');
  if (options.verbose) shellArgs.push('--verbose');

  const command = `bash "${scriptPath}" ${shellArgs.join(' ')}`;

  try {
    const output = execSync(command, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'inherit',
    });
  } catch (err: any) {
    if (err.status) {
      process.exit(err.status);
    }
    throw err;
  }
}

function showReleaseHelp(): void {
  const help = `
\x1b[1m\x1b[36mworkflow release\x1b[0m - Version bump and release

\x1b[1mUSAGE:\x1b[0m
  workflow release [patch|minor|major] [options]

\x1b[1mBUMP TYPES:\x1b[0m
  \x1b[32mpatch\x1b[0m    Increment patch version (0.2.7 -> 0.2.8) [default]
  \x1b[32mminor\x1b[0m    Increment minor version (0.2.7 -> 0.3.0)
  \x1b[32mmajor\x1b[0m    Increment major version (0.2.7 -> 1.0.0)

\x1b[1mOPTIONS:\x1b[0m
  --dry-run     Show what would be done without making changes
  --no-commit   Skip git commit
  --no-tag      Skip git tag creation
  --verbose     Show detailed output
  --help, -h    Show this help

\x1b[1mEXAMPLES:\x1b[0m
  workflow release patch --dry-run    Preview patch bump
  workflow release minor              Release minor version
  workflow release patch --no-tag     Bump without tagging
`;
  console.log(help);
}
