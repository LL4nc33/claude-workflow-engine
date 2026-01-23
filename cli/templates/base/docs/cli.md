# CLI Reference

The Claude Workflow Engine CLI (`workflow`) provides safety tools for installation, health monitoring, conflict detection, and GDPR compliance checking. It runs as a Node.js application and operates entirely locally.

## Installation

```bash
cd cli
npm install
npm run build
```

After building, the CLI is available at `cli/dist/index.js`:

```bash
node cli/dist/index.js --help
```

Or link it globally:

```bash
npm link   # From the cli/ directory
workflow --help
```

**Requirements:** Node.js >= 18

## Commands

```
workflow <command> [options] [path]
```

| Command | Purpose |
|---------|---------|
| `install` | Install the engine into a project |
| `status` | Show installation status |
| `health` | Run health checks |
| `check` | Run conflict/permission/GDPR checks |
| `resolve` | Resolve detected conflicts |
| `rollback` | Rollback to previous backup |
| `version` | Show version |
| `help` | Show help |

If `[path]` is omitted, commands operate on the current working directory.

---

## workflow install

Install Claude Workflow Engine into a target project.

```bash
workflow install [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--global` | Install globally (shared config) |
| `--local` | Install locally (project-specific, default) |
| `--mode <mode>` | `template` or `integrated` |
| `--profile <profile>` | `default`, `node`, `python`, or `rust` |
| `--dry-run` | Preview changes without writing anything |
| `--force`, `-f` | Proceed despite warnings |
| `--verbose`, `-v` | Detailed output |

**Examples:**

```bash
# Preview what would be installed
workflow install --dry-run --verbose /path/to/project

# Install with Node.js profile
workflow install --profile node .

# Install globally with force
workflow install --global --force /path/to/project
```

**What it does:**

1. Runs preflight checks (conflicts, permissions, GDPR)
2. Creates the directory structure (`.claude/`, `workflow/`)
3. Copies agents, commands, skills, standards, and configuration
4. Merges settings into `.claude/settings.local.json`
5. Updates `.gitignore` for sensitive files
6. Records installation state for future health checks and rollback

---

## workflow status

Show the current installation status.

```bash
workflow status [--verbose] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--verbose`, `-v` | Show detailed file list and history |

**Example output:**

```
Claude Workflow Engine Status

  Version:   0.1.0
  Mode:      template
  Scope:     local
  Profile:   node
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
  History events: 3
```

---

## workflow health

Run health checks on an existing installation.

```bash
workflow health [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--fix` | Auto-fix detected issues where possible |
| `--report` | Save health report as JSON file |
| `--verbose`, `-v` | Detailed output |

**Checks performed:**

| Category | What it checks |
|----------|---------------|
| Core Files | `config.yml`, `CLAUDE.md`, `settings.local.json`, `.gitignore` |
| Installation State | State file exists, no failed events in history |
| File Integrity | All tracked files still exist and match checksums |
| Settings | Required permissions present in settings.local.json |
| GDPR | Gitignore patterns, no PII in standards/specs |
| Directory Structure | `workflow/`, `workflow/standards/`, `.claude/agents/`, etc. |

**Example output:**

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [WARN] Missing: .gitignore

Installation State
  [PASS] Installed: v0.1.0 (2026-01-23T14:30:00Z)

File Integrity
  [PASS] 32 files intact

Settings
  [PASS] All required permissions present

DSGVO/GDPR
  [PASS] DSGVO/GDPR compliant

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

Auto-fixes include:
- Creating missing directories
- Adding missing permissions to settings
- Running GDPR auto-fix (gitignore patterns)

**With `--report`:**

```bash
workflow health --report
```

Saves `.workflow-health-report.json` in the target directory.

---

## workflow check

Run specific checks without the full health suite.

```bash
workflow check [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--conflicts` | Check for file/command conflicts |
| `--permissions` | Check filesystem permissions |
| `--gdpr` | Check GDPR compliance |
| `--fix` | Auto-fix where possible |
| `--verbose`, `-v` | Detailed output |

If no specific check is requested, all three are run.

### Conflict detection (`--conflicts`)

Checks for:
- **File conflicts:** Engine files that already exist in the target (with different content)
- **Command conflicts:** Slash commands that collide with existing commands
- **Permission conflicts:** Files/directories that can't be written

```bash
workflow check --conflicts /path/to/project
```

Example output:

```
Conflict Detection
  [WARN] 2 file conflict(s):
    [MODIFIED] .claude/settings.local.json
    [EXISTING] workflow/config.yml
  [FAIL] 1 command conflict(s):
    /plan-product (existing: .claude/commands/plan-product.md)
```

### Permission check (`--permissions`)

Verifies write access to target directories and settings files:

```bash
workflow check --permissions
```

### GDPR check (`--gdpr`)

Checks for:
- Sensitive file patterns in `.gitignore` (`.env`, `*.local.md`, credentials)
- PII in standards or spec files
- Proper data residency configuration

```bash
workflow check --gdpr --fix
```

The `--fix` flag auto-adds missing gitignore patterns.

---

## workflow resolve

Resolve conflicts detected by `workflow check --conflicts`.

```bash
workflow resolve [options] [path]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--auto-fix` | Automatically resolve conflicts (creates backups) |
| `--verbose`, `-v` | Detailed output |

**Resolution strategies:**

- Creates backups of conflicting files before overwriting
- Merges settings rather than replacing them
- Reports command conflicts that need manual resolution

---

## workflow rollback

Revert to the most recent backup created during install/update operations.

```bash
workflow rollback [path]
```

**Example:**

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

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success (or healthy) |
| 1 | Error (or broken health) |

## Data privacy

The CLI operates entirely locally. It:
- Makes no network requests
- Stores no data outside the project directory
- Creates no telemetry or analytics
- Writes only to the target path (plus `.workflow-health-report.json` if `--report` is used)

## See also

- [Getting Started](getting-started.md) - Initial setup
- [Integration](integration.md) - Using the CLI to integrate with existing projects
- [Configuration](configuration.md) - Files the CLI creates and manages
