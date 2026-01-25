# How-To: CLI Installation and Usage

This guide walks you through installing the Claude Workflow Engine CLI and shows the most important commands for daily use.

## Goal

After completing this guide, you will have:

- Built and prepared the CLI for use
- Installed the Workflow Engine into a project
- Successfully run a health check
- Optionally made the CLI globally available

## Prerequisites

- **Node.js >= 18** (check with `node --version`)
- **npm** (included with Node.js)
- A project directory where you want to install the engine
- Terminal access (Bash, Zsh, or PowerShell)

---

## Step 1: Clone the Repository and Build

### Clone the Repository

```bash
git clone https://github.com/your-org/oidanice-agents.git
cd oidanice-agents
```

### Install Dependencies

```bash
cd cli
npm install
```

Expected output:

```
added 42 packages in 3s
```

### Run the Build

```bash
npm run build
```

Expected output:

```
> workflow-cli@0.2.7 build
> tsc

Successfully compiled to cli/dist/
```

After the build, the CLI is available at `cli/dist/index.js`.

### Verification Test

```bash
node cli/dist/index.js --help
```

Expected output:

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

---

## Step 2: Dry Run (Preview)

Before actually installing, preview what would happen:

```bash
node cli/dist/index.js install --dry-run --verbose /path/to/your/project
```

Expected output:

```
[DRY-RUN] Would create: .claude/agents/architect.md
[DRY-RUN] Would create: .claude/agents/builder.md
[DRY-RUN] Would create: .claude/agents/devops.md
[DRY-RUN] Would create: .claude/agents/guide.md
[DRY-RUN] Would create: .claude/agents/innovator.md
[DRY-RUN] Would create: .claude/agents/quality.md
[DRY-RUN] Would create: .claude/agents/researcher.md
[DRY-RUN] Would create: .claude/agents/security.md
[DRY-RUN] Would create: .claude/agents/explainer.md
[DRY-RUN] Would create: workflow/config.yml
[DRY-RUN] Would create: workflow/standards/index.yml
[DRY-RUN] Would create: workflow/standards/global/tech-stack.md
[DRY-RUN] Would create: workflow/standards/global/naming.md
...
[DRY-RUN] 32 files would be created
```

### What the Dry Run Checks

- Which files will be created
- Whether conflicts with existing files exist
- Whether write permissions are available
- Whether GDPR-relevant patterns are considered

---

## Step 3: Install into a Project

### Standard Installation (local)

```bash
node cli/dist/index.js install /path/to/your/project
```

Expected output:

```
Claude Workflow Engine Install

  Mode:    template
  Scope:   local
  Profile: default
  Target:  /path/to/your/project

  Creating directory structure...
  Copying agents, commands, skills...
  Applying standards...
  Merging settings...
  Updating .gitignore...
  Recording installation state...

  [DONE] Installation complete. 32 files created.
  Run "workflow health" to verify.
```

### With Node.js Profile

```bash
node cli/dist/index.js install --profile node /path/to/your/project
```

Profiles adapt standards to the tech stack:

| Profile | Optimized for |
|---------|---------------|
| `default` | General projects |
| `node` | Node.js / TypeScript |
| `python` | Python projects |
| `rust` | Rust projects |

### Force Installation (on warnings)

```bash
node cli/dist/index.js install --force /path/to/your/project
```

The `--force` flag skips warnings (e.g., for existing files). Backups are still created.

---

## Step 4: Health Check After Installation

Verify the installation is correct:

```bash
node cli/dist/index.js health /path/to/your/project
```

Expected output on successful installation:

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [PASS] .gitignore

Installation State
  [PASS] Installed: v0.2.7 (2026-01-23T14:30:00Z)

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
  Passed: 9 | Warnings: 0 | Errors: 0
```

### On Issues: Auto-Fix

```bash
node cli/dist/index.js health --fix /path/to/your/project
```

Auto-fixes include:

- Creating missing directories
- Adding missing permissions to settings
- Adding GDPR patterns to `.gitignore`

### Save Health Report

```bash
node cli/dist/index.js health --report /path/to/your/project
```

Saves `.workflow-health-report.json` in the project directory.

---

## Step 5: Check Installation Status

```bash
node cli/dist/index.js status /path/to/your/project
```

Expected output:

```
Claude Workflow Engine Status

  Version:   0.2.7
  Mode:      template
  Scope:     local
  Profile:   default
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
  History events: 1
```

For detailed information:

```bash
node cli/dist/index.js status --verbose /path/to/your/project
```

---

## Step 6: Global Installation with npm link

To use `workflow` anywhere in the terminal without specifying the full path:

```bash
cd cli
npm link
```

Expected output:

```
/usr/local/lib/node_modules/workflow-cli -> /path/to/oidanice-agents/cli
/usr/local/bin/workflow -> /usr/local/lib/node_modules/workflow-cli/dist/index.js
```

After that, you can call from anywhere:

```bash
workflow --help
workflow install /path/to/project
workflow health /path/to/project
workflow status
```

### Remove the Link

```bash
cd cli
npm unlink
```

---

## Step 7: Additional Useful Commands

### Check for Conflicts

```bash
workflow check /path/to/project
```

Checks for file conflicts, permission issues, and GDPR compliance.

### Resolve Conflicts

```bash
workflow resolve --auto-fix /path/to/project
```

Creates backups and resolves conflicts automatically.

### Rollback

```bash
workflow rollback /path/to/project
```

Restores the last backup (e.g., after a failed installation).

### Check Version

```bash
workflow version
```

Output:

```
workflow v0.2.7
```

---

## Troubleshooting

### Problem: "command not found: workflow"

**Cause:** `npm link` was not run or the PATH is incorrect.

**Solution:**

```bash
# Check if npm global bin directory is in PATH
npm config get prefix
# Output e.g.: /usr/local

# Check if /usr/local/bin is in PATH
echo $PATH | tr ':' '\n' | grep -q "/usr/local/bin" && echo "OK" || echo "MISSING"

# Alternative: Run directly
node /path/to/oidanice-agents/cli/dist/index.js --help
```

### Problem: "Cannot find module" During Build

**Cause:** Dependencies not installed.

**Solution:**

```bash
cd cli
rm -rf node_modules
npm install
npm run build
```

### Problem: "Permission denied" During Installation

**Cause:** No write permissions in the target directory.

**Solution:**

```bash
# Check permissions
workflow check --permissions /path/to/project

# Set permissions (Linux/macOS)
chmod -R u+w /path/to/project/.claude /path/to/project/workflow
```

### Problem: "ENOENT: no such file or directory"

**Cause:** The target directory does not exist.

**Solution:**

```bash
# Create directory
mkdir -p /path/to/project

# Then install
workflow install /path/to/project
```

### Problem: Health Check Shows Errors

**Cause:** Installation is incomplete or files were manually deleted.

**Solution:**

```bash
# Try auto-fix
workflow health --fix /path/to/project

# If that does not help: reinstall
workflow install --force /path/to/project
```

### Problem: Conflicts During Re-Installation

**Cause:** Existing files that differ from the engine files.

**Solution:**

```bash
# Show conflicts
workflow check --conflicts /path/to/project

# Resolve automatically (creates backups)
workflow resolve --auto-fix /path/to/project

# Or: Rollback and reinstall
workflow rollback /path/to/project
workflow install --force /path/to/project
```

### Problem: Node.js Version Too Old

**Cause:** Node.js < 18.

**Solution:**

```bash
# Check version
node --version

# Update via nvm (recommended)
nvm install 18
nvm use 18

# Or via package manager
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (Homebrew):
brew install node@18
```

---

## Result

You now have:

- Successfully built the CLI
- Installed the Workflow Engine into a project
- Run a health check without errors
- (Optional) Made the CLI globally available

## Next Steps

- **Develop your first feature:** See [Develop a New Feature](develop-new-feature.md)
- **Adjust standards:** See [Extend Standards](extend-standards.md)
- **Custom agents:** See [Create a Custom Agent](create-custom-agent.md)
- **Start the workflow:** Run `/workflow/plan-product` in Claude Code

## Command Summary

| Command | Purpose |
|---------|---------|
| `workflow install [path]` | Install engine into project |
| `workflow install --dry-run [path]` | Preview without changes |
| `workflow status [path]` | Show installation status |
| `workflow health [path]` | Run health checks |
| `workflow health --fix [path]` | Auto-fix issues |
| `workflow check [path]` | Check conflicts/permissions/GDPR |
| `workflow resolve --auto-fix [path]` | Resolve conflicts |
| `workflow rollback [path]` | Restore backup |
| `workflow version` | Show version |

## See Also

- [CLI Reference](../cli.md) -- Complete command documentation
- [Configuration](../configuration.md) -- Files the CLI creates
- [Getting Started](../getting-started.md) -- Initial project setup
- [Workflow Guide](../workflow.md) -- After installation: the 5-phase workflow
