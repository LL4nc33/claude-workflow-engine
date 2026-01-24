# CLI Reference

The Claude Workflow Engine CLI (`workflow`) provides safety tools for installation, health monitoring, conflict detection, and GDPR compliance. It runs as a Node.js application and operates entirely locally.

## Installation

```bash
cd cli
npm install
npm run build
```

After the build, the CLI is available at `cli/dist/index.js`:

```bash
node cli/dist/index.js --help
```

Output:

```
Usage: workflow <command> [options] [path]

Commands:
  install     Install the engine into a project
  status      Show installation status
  health      Run health checks
  check       Run conflict/permission/GDPR checks
  resolve     Resolve detected conflicts
  rollback    Rollback to previous backup
  release     Bump version and create release
  version     Show version
  help        Show help

Options:
  --help, -h     Show help
  --version      Show version number
```

Alternatively, you can link the CLI globally:

```bash
npm link   # From the cli/ directory
workflow --help
```

**Prerequisite:** Node.js >= 18

## Commands

```
workflow <command> [options] [path]
```

| Command | Purpose |
|---------|---------|
| `install` | Install the engine into a project |
| `status` | Show installation status |
| `health` | Run health checks |
| `check` | Check for conflicts, permissions, and GDPR |
| `resolve` | Resolve detected conflicts |
| `rollback` | Restore from backup |
| `release` | Bump version and create release |
| `version` | Show version |
| `help` | Show help |

When `[path]` is omitted, all commands operate in the current directory.

---

## workflow install

Installs Claude Workflow Engine into a target project.

```bash
workflow install [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--global` | Install globally (shared configuration) |
| `--local` | Install locally (project-specific, default) |
| `--mode <mode>` | `template` or `integrated` |
| `--profile <profile>` | `default`, `node`, `python`, or `rust` |
| `--dry-run` | Show changes only, write nothing |
| `--force`, `-f` | Proceed despite warnings |
| `--verbose`, `-v` | Detailed output |

**Examples:**

```bash
# Preview what would be installed
workflow install --dry-run --verbose /path/to/project
```

Output:

```
[DRY-RUN] Would create: .claude/agents/architect.md
[DRY-RUN] Would create: .claude/agents/debug.md
[DRY-RUN] Would create: workflow/config.yml
[DRY-RUN] Would create: workflow/standards/index.yml
...
[DRY-RUN] 32 files would be created
```

```bash
# Install with Node.js profile
workflow install --profile node .
```

Output:

```
Claude Workflow Engine Install

  Mode:    template
  Scope:   local
  Profile: node
  Target:  /path/to/project

  Creating directory structure...
  Copying agents, commands, skills...
  Applying standards...
  Merging settings...
  Updating .gitignore...
  Recording installation state...

  [DONE] Installation complete. 32 files created.
  Run "workflow health" to verify.
```

```bash
# Install globally with force
workflow install --global --force /path/to/project
```

**What the command does:**

1. Runs preflight checks (conflicts, permissions, GDPR)
2. Creates the directory structure (`.claude/`, `workflow/`)
3. Copies agents, commands, skills, standards, and configuration
4. Merges settings into `.claude/settings.local.json`
5. Updates `.gitignore` for sensitive files
6. Saves installation state for health checks and rollback

---

## workflow status

Shows the current installation status.

```bash
workflow status [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--verbose`, `-v` | Show detailed file list and history |

**Example:**

```bash
workflow status
```

Output:

```
Claude Workflow Engine Status

  Version:   0.2.7
  Mode:      template
  Scope:     local
  Profile:   node
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
  History events: 3
```

```bash
workflow status --verbose
```

Output:

```
Claude Workflow Engine Status

  Version:   0.2.7
  Mode:      template
  Scope:     local
  Profile:   node
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
    .claude/CLAUDE.md
    .claude/agents/architect.md
    .claude/agents/debug.md
    ...

  History events: 3
    2026-01-23T14:30:00Z  install  success
    2026-01-22T10:15:00Z  health   fix-applied
    2026-01-20T09:00:00Z  install  success
```

---

## workflow health

Runs health checks on an existing installation.

```bash
workflow health [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--fix` | Automatically fix detected issues |
| `--report` | Save health report as a JSON file |
| `--verbose`, `-v` | Detailed output |

**Checks performed:**

| Category | What is checked |
|----------|-----------------|
| Core Files | `config.yml`, `CLAUDE.md`, `settings.local.json`, `.gitignore` |
| Installation State | State file exists, no failed events |
| File Integrity | All tracked files exist and checksums match |
| Settings | Required permissions present in `settings.local.json` |
| GDPR | Gitignore patterns, no PII in standards/specs |
| Directory Structure | `workflow/`, `workflow/standards/`, `.claude/agents/`, etc. |

**Example:**

```bash
workflow health
```

Output:

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [WARN] Missing: .gitignore

Installation State
  [PASS] Installed: v0.2.7 (2026-01-23T14:30:00Z)

File Integrity
  [PASS] 32 files intact

Settings
  [PASS] All required permissions present

GDPR
  [PASS] GDPR compliant

Directory Structure
  [PASS] workflow/
  [PASS] workflow/standards/
  [PASS] .claude/agents/

Summary
  Overall Status: HEALTHY
  Passed: 8 | Warnings: 1 | Errors: 0
```

**With `--fix`:**

```bash
workflow health --fix
```

Output:

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [FIXED] Created: .gitignore

Summary
  Overall Status: HEALTHY
  Passed: 8 | Fixed: 1 | Errors: 0
```

Auto-fixes include:
- Creating missing directories
- Adding missing permissions to settings
- GDPR auto-fix (adding gitignore patterns)

**With `--report`:**

```bash
workflow health --report
```

Saves `.workflow-health-report.json` in the target directory.

---

## workflow check

Runs specific checks without the full health suite.

```bash
workflow check [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--conflicts` | Check for file and command conflicts |
| `--permissions` | Check file system permissions |
| `--gdpr` | Check GDPR compliance |
| `--fix` | Automatically fix where possible |
| `--verbose`, `-v` | Detailed output |

When no specific check is specified, all three are run.

### Conflict Detection (`--conflicts`)

Checks for:
- **File conflicts:** Engine files that already exist in the target (with different content)
- **Command conflicts:** Slash commands that collide with existing commands
- **Permission conflicts:** Files/directories that are not writable

```bash
workflow check --conflicts /path/to/project
```

Output:

```
Conflict Detection
  [WARN] 2 file conflict(s):
    [MODIFIED] .claude/settings.local.json
    [EXISTING] workflow/config.yml
  [FAIL] 1 command conflict(s):
    /plan-product (existing: .claude/commands/plan-product.md)
```

### Permission Check (`--permissions`)

Checks write access to target directories and settings files:

```bash
workflow check --permissions
```

Output:

```
Permission Check
  [PASS] /path/to/project/.claude/ (writable)
  [PASS] /path/to/project/workflow/ (writable)
  [PASS] /path/to/project/.gitignore (writable)
```

### GDPR Check (`--gdpr`)

Checks for:
- Sensitive file patterns in `.gitignore` (`.env`, `*.local.md`, credentials)
- PII in standards or spec files
- Correct data residency configuration

```bash
workflow check --gdpr --fix
```

Output:

```
GDPR Check
  [FIXED] Added .gitignore patterns: .env, *.local.md, credentials.*
  [PASS] No PII detected in standards/specs
  [PASS] Data residency: eu-central-1
```

The `--fix` flag automatically adds missing gitignore patterns.

---

## workflow resolve

Resolves conflicts detected by `workflow check --conflicts`.

```bash
workflow resolve [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--auto-fix` | Automatically resolve conflicts (creates backups) |
| `--verbose`, `-v` | Detailed output |

**Example:**

```bash
workflow resolve --auto-fix /path/to/project
```

Output:

```
Claude Workflow Engine Resolve

  Resolving 2 file conflict(s)...
    [BACKUP] .claude/settings.local.json -> .claude/settings.local.json.bak
    [MERGED] .claude/settings.local.json
    [BACKUP] workflow/config.yml -> workflow/config.yml.bak
    [REPLACED] workflow/config.yml

  [DONE] 2 conflicts resolved.
  Run "workflow health" to verify.
```

**Resolution strategies:**

- Creates backups of conflicting files before overwriting
- Merges settings instead of replacing them
- Reports command conflicts that must be resolved manually

---

## workflow rollback

Restores the most recent backup created during install or update operations.

```bash
workflow rollback [path]
```

**Example:**

```bash
workflow rollback /path/to/project
```

Output:

```
Claude Workflow Engine Rollback

  Available backups: 3
    2026-01-23T14:30:00Z
    2026-01-22T10:15:00Z
    2026-01-20T09:00:00Z

  Rolling back to most recent backup...
  [DONE] Rollback complete.
  Run "workflow health" to verify the rollback.
```

---

## workflow version

Shows the current CLI version.

```bash
workflow version
```

Output:

```
workflow v0.2.7
```

---

## workflow help

Shows the help overview.

```bash
workflow help
```

Output:

```
Usage: workflow <command> [options] [path]

Commands:
  install     Install the engine into a project
  status      Show installation status
  health      Run health checks
  check       Run conflict/permission/GDPR checks
  resolve     Resolve detected conflicts
  rollback    Rollback to previous backup
  release     Bump version and create release
  version     Show version
  help        Show help

Options:
  --help, -h     Show help
  --version      Show version number

Run "workflow <command> --help" for details on a specific command.
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (or installation healthy) |
| 1 | Error (or health check failed) |

## Privacy

The CLI operates entirely locally. It:

- Makes no network requests
- Stores no data outside the project directory
- Produces no telemetry or analytics
- Writes exclusively to the target path (plus `.workflow-health-report.json` with `--report`)

## See Also

- [Getting Started](getting-started.md) -- Initial setup
- [Integration](integration.md) -- CLI integration into existing projects
- [Configuration](configuration.md) -- Files that the CLI creates and manages
