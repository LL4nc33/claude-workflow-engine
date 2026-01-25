# Integration Guide

How to integrate Claude Workflow Engine into an existing project. This guide covers CLI-based and manual installation, conflict resolution, and uninstallation.

## Before You Start

Check whether the following already exist in your project:

- `.claude/` directory (Claude Code configuration)
- `.claude/settings.local.json` (Claude Code permissions)
- `.claude/agents/` (existing agents)
- `.claude/commands/` (existing slash commands)
- `CLAUDE.md` (existing project context)
- `workflow/` directory (same-named directory used for other purposes)

The CLI detects conflicts automatically and never overwrites anything without confirmation.

## Method 1: CLI Installation (recommended)

The CLI handles conflict detection, backups, and permissions.

### Step 1: Build the CLI

```bash
# From the claude-workflow-engine repository
cd cli
npm install
npm run build
```

### Step 2: Preview Changes (Dry Run)

Always run a dry run first:

```bash
node dist/index.js install --dry-run --verbose /path/to/your/project
```

The output shows you exactly which files will be created, modified, or skipped.

### Step 3: Check for Conflicts

```bash
node dist/index.js check --conflicts /path/to/your/project
```

Possible conflict types:

- **File Conflicts:** Your project already has files that the engine wants to create
- **Command Conflicts:** Existing slash commands with the same names
- **Permission Issues:** Directories that the CLI cannot write to

### Step 4: Install

```bash
# Standard installation (local)
node dist/index.js install /path/to/your/project

# With a specific tech profile
node dist/index.js install --profile node /path/to/your/project

# Force installation (skips non-blocking warnings)
node dist/index.js install --force /path/to/your/project
```

### Step 5: Verify

```bash
node dist/index.js health /path/to/your/project
```

A successful health check shows you the status of all installed components.

## Method 2: Manual Installation

If you prefer full control, copy the files manually.

### Step 1: Create Directory Structure

```bash
cd /path/to/your/project
mkdir -p .claude/agents
mkdir -p .claude/commands/workflow
mkdir -p .claude/skills/workflow
mkdir -p .claude-plugin
mkdir -p hooks/scripts
mkdir -p workflow/standards/global
mkdir -p workflow/standards/api
mkdir -p workflow/standards/database
mkdir -p workflow/standards/devops
mkdir -p workflow/standards/frontend
mkdir -p workflow/standards/testing
mkdir -p workflow/standards/agents
mkdir -p workflow/product
mkdir -p workflow/specs
```

### Step 2: Copy Core Files

From the claude-workflow-engine repository:

```bash
# Agents
cp .claude/agents/*.md /path/to/your/project/.claude/agents/

# Commands
cp .claude/commands/workflow/*.md /path/to/your/project/.claude/commands/workflow/

# Skills
cp -r .claude/skills/workflow/* /path/to/your/project/.claude/skills/workflow/

# Plugin manifest
cp .claude-plugin/plugin.json /path/to/your/project/.claude-plugin/

# Hooks
cp hooks/hooks.json /path/to/your/project/hooks/
cp hooks/scripts/*.sh /path/to/your/project/hooks/scripts/
chmod +x /path/to/your/project/hooks/scripts/*.sh

# Standards
cp -r workflow/standards/* /path/to/your/project/workflow/standards/

# Configuration
cp workflow/config.yml /path/to/your/project/workflow/
cp workflow/orchestration.yml /path/to/your/project/workflow/
```

### Step 3: Create or Merge CLAUDE.md

If your project does not have a `CLAUDE.md`:

```bash
cp .claude/CLAUDE.md /path/to/your/project/.claude/
```

If one already exists, add the sections for Agent Hierarchy, Workflow, and Context Model to your existing file. The template can be found in `.claude/CLAUDE.md`.

### Step 4: Merge Settings

If `.claude/settings.local.json` already exists, merge the required permissions. The engine needs these permission patterns:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Bash(*)",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "Task"
    ]
  }
}
```

If the file does not exist, create it with the content above.

### Step 5: Update .gitignore

Add these patterns to your `.gitignore`:

```
# Claude Workflow Engine - sensitive files
CLAUDE.local.md
*.local.md
.env*
credentials.*
secrets.*
.workflow-health-report.json
.workflow-state.json
```

## What Goes Into Your Project

| Path | Purpose | Size |
|------|---------|------|
| `.claude/agents/` | 9 agent definition files | ~15 KB |
| `.claude/commands/workflow/` | 8 slash command files | ~30 KB |
| `.claude/skills/workflow/` | 10 skill directories (7 standards + 3 plugin) | ~15 KB |
| `.claude/CLAUDE.md` | Project context for Claude | ~4 KB |
| `.claude-plugin/plugin.json` | Plugin manifest | ~0.5 KB |
| `hooks/` | Hook definitions and scripts | ~5 KB |
| `workflow/config.yml` | Main configuration | ~3 KB |
| `workflow/orchestration.yml` | Delegation configuration | ~15 KB |
| `workflow/standards/` | 11 standard files + index | ~12 KB |
| `workflow/product/` | Empty (created by /plan-product) | 0 |
| `workflow/specs/` | Empty (created per feature) | 0 |

**Total: approximately 100 KB** of configuration and documentation files.

## Resolving Conflicts

### Existing .claude/agents/

If you already have agents:

- The engine adds its 9 agents alongside your existing ones
- Name collisions are detected (e.g., if you already have a `builder.md`)
- **Resolution:** Rename your agent or skip the engine version

### Existing .claude/commands/

If you already have slash commands:

- The engine uses a `workflow/` prefix (e.g., `/workflow/plan-product`)
- Collisions only occur if you also use the `workflow/` prefix
- **Resolution:** Rename your commands or skip conflicting engine commands

### Existing CLAUDE.md

The engine's `CLAUDE.md` contains agent hierarchy, workflow description, and context model reference. Options:

- **Replace:** Use the engine version (yours is backed up)
- **Merge:** Add the engine sections to your existing file
- **Skip:** Keep your version, but agents may not be properly documented for Claude

### Existing settings.local.json

The CLI merges permissions additively -- your existing permissions are preserved, and the required engine permissions are added. No permissions are removed.

### Existing workflow/ Directory

If you have a `workflow/` directory used for other purposes:

- The CLI warns about this conflict
- **Resolution:** Rename your directory or configure a different path in `config.yml`

## Post-Installation Customization

### Changing the Standards Path

Edit `workflow/config.yml`:

```yaml
context_model:
  standards:
    path: my-custom-standards-path/
```

### Removing Agents

Delete agent files from `.claude/agents/`. The remaining agents continue to work. Main Chat skips deleted agents during delegation.

### Disabling CLI Features

The CLI is optional. If you do not need it, simply do not build or run it. The workflow commands and agents function independently.

### Customizing the Tech Stack Standard

Edit `workflow/standards/global/tech-stack.md` and adapt it to your actual technology choices. This standard is injected into every delegated task.

## Uninstallation

### CLI Rollback

If you installed via CLI:

```bash
node cli/dist/index.js rollback /path/to/your/project
```

This restores files from the backup created during installation.

### Manual Removal

```bash
# Remove engine agents
rm -f .claude/agents/architect.md .claude/agents/builder.md \
      .claude/agents/devops.md .claude/agents/explainer.md .claude/agents/guide.md \
      .claude/agents/innovator.md .claude/agents/quality.md \
      .claude/agents/researcher.md .claude/agents/security.md

# Remove engine commands and skills
rm -rf .claude/commands/workflow/
rm -rf .claude/skills/workflow/

# Remove workflow directory
rm -rf workflow/

# If CLAUDE.md was merged: manually remove engine sections
# If settings.local.json was merged: manually remove engine permissions
```

## Troubleshooting

### "Agent not found" After Installation

- Check whether `.claude/agents/` contains the `.md` files
- Check whether `CLAUDE.md` references the agents
- Restart Claude Code (`claude` command)

### "Command not available"

- Check whether `.claude/commands/workflow/` contains the command files
- Verify file permissions (must be readable)
- Check `.claude/settings.local.json` for correct permissions

### "Standards not loading"

- Verify that `workflow/standards/index.yml` exists and is valid YAML
- Run `/workflow/index-standards` to rebuild the index
- Check whether the skills in `.claude/skills/workflow/` are present

### "GDPR warnings" After Installation

```bash
node cli/dist/index.js check --gdpr --fix /path/to/your/project
```

This automatically adds missing gitignore patterns and ensures sensitive files do not end up in the repository.

## See Also

- [Getting Started](getting-started.md) -- Fresh installation from scratch
- [CLI Reference](cli.md) -- All CLI commands in detail
- [Configuration](configuration.md) -- Customize configuration files after installation
- [Platform Architecture](platform-architecture.md) -- 6-layer architecture and hooks
