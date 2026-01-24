"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Release Command
// Bumps version, updates files, generates changelog, creates git tag
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
exports.releaseCommand = releaseCommand;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const logger_1 = require("../lib/logger");
const fs_utils_1 = require("../lib/fs-utils");
function parseReleaseArgs(args) {
    const options = {
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
function findProjectRoot() {
    // Walk up from CLI dir to find VERSION file
    let dir = path.resolve(__dirname, '..', '..');
    for (let i = 0; i < 5; i++) {
        if ((0, fs_utils_1.pathExists)(path.join(dir, 'VERSION'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    // Fallback: two levels up from cli/dist/ or cli/src/
    return path.resolve(__dirname, '..', '..');
}
async function releaseCommand(args) {
    const options = parseReleaseArgs(args);
    const log = new logger_1.Logger(options.verbose);
    const projectRoot = findProjectRoot();
    const scriptPath = path.join(projectRoot, 'scripts', 'release.sh');
    if (!(0, fs_utils_1.pathExists)(scriptPath)) {
        log.error(`Release script not found: ${scriptPath}`);
        process.exit(1);
    }
    // Build shell command
    const shellArgs = [options.bumpType];
    if (options.dryRun)
        shellArgs.push('--dry-run');
    if (options.noCommit)
        shellArgs.push('--no-commit');
    if (options.noTag)
        shellArgs.push('--no-tag');
    if (options.verbose)
        shellArgs.push('--verbose');
    const command = `bash "${scriptPath}" ${shellArgs.join(' ')}`;
    try {
        const output = (0, child_process_1.execSync)(command, {
            cwd: projectRoot,
            encoding: 'utf8',
            stdio: 'inherit',
        });
    }
    catch (err) {
        if (err.status) {
            process.exit(err.status);
        }
        throw err;
    }
}
function showReleaseHelp() {
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
//# sourceMappingURL=release.js.map