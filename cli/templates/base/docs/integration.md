# Integration Guide

How to add Claude Workflow Engine to an existing project. This guide covers installation methods, conflict resolution, and what changes in your project.

## Before you start

Check if your project already has any of these:
- `.claude/` directory (Claude Code configuration)
- `.claude/settings.local.json` (Claude Code permissions)
- `.claude/agents/` (existing agents)
- `.claude/commands/` (existing slash commands)
- `CLAUDE.md` (existing project context)

If any exist, the CLI will detect conflicts and help you resolve them. Nothing gets silently overwritten.

## Method 1: CLI installation (recommended)

The CLI handles conflicts, backups, and permissions safely.

### Step 1: Build the CLI

```bash
# From the claude-workflow-engine repository
cd cli
npm install
npm run build
```

### Step 2: Preview changes

Always dry-run first:

```bash
node dist/index.js install --dry-run --verbose /path/to/your/project
```

This shows exactly what would be created, modified, or skipped.

### Step 3: Check for conflicts

```bash
node dist/index.js check --conflicts /path/to/your/project
```

Possible conflict types:
- **File conflicts:** Your project already has files that the engine wants to create
- **Command conflicts:** Existing slash commands with the same names
- **Permission issues:** Directories the CLI can't write to

### Step 4: Install

```bash
# Standard local installation
node dist/index.js install /path/to/your/project

# With a specific tech profile
node dist/index.js install --profile node /path/to/your/project

# Force install (skips non-blocking warnings)
node dist/index.js install --force /path/to/your/project
```

### Step 5: Verify

```bash
node dist/index.js health /path/to/your/project
```

## Method 2: Manual installation

If you prefer full control, copy files manually.

### Step 1: Create the directory structure

```bash
cd /path/to/your/project
mkdir -p .claude/agents
mkdir -p .claude/commands/workflow
mkdir -p .claude/skills/workflow
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

### Step 2: Copy core files

From the claude-workflow-engine repository:

```bash
# Agents
cp .claude/agents/*.md /path/to/your/project/.claude/agents/

# Commands
cp .claude/commands/workflow/*.md /path/to/your/project/.claude/commands/workflow/

# Skills
cp -r .claude/skills/workflow/* /path/to/your/project/.claude/skills/workflow/

# Standards
cp -r workflow/standards/* /path/to/your/project/workflow/standards/

# Configuration
cp workflow/config.yml /path/to/your/project/workflow/
cp workflow/orchestration.yml /path/to/your/project/workflow/
```

### Step 3: Create or merge CLAUDE.md

If your project doesn't have a `CLAUDE.md`, copy it:

```bash
cp .claude/CLAUDE.md /path/to/your/project/.claude/
```

If you already have one, add the agent hierarchy and workflow sections to your existing file. See the template in `.claude/CLAUDE.md` for the required sections.

### Step 4: Merge settings

If `.claude/settings.local.json` exists, merge the required permissions. The engine needs these permission patterns:

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

If the file doesn't exist, create it with the above content.

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

## What gets added to your project

| Path | Purpose | Size |
|------|---------|------|
| `.claude/agents/` | 7 agent definition files | ~15 KB |
| `.claude/commands/workflow/` | 8 slash command files | ~30 KB |
| `.claude/skills/workflow/` | 7 skill directories | ~10 KB |
| `.claude/CLAUDE.md` | Project context for Claude | ~3 KB |
| `workflow/config.yml` | Main configuration | ~3 KB |
| `workflow/orchestration.yml` | Delegation configuration | ~15 KB |
| `workflow/standards/` | 11 standard files + index | ~12 KB |
| `workflow/product/` | Empty (created by /plan-product) | 0 |
| `workflow/specs/` | Empty (created per feature) | 0 |

Total: approximately 90 KB of configuration and documentation files.

## Resolving conflicts

### Existing .claude/agents/

If you already have agents:
- The engine adds its 7 agents alongside yours
- Name collisions are flagged (e.g., if you already have `debug.md`)
- Resolution: rename your agent or skip the engine's version

### Existing .claude/commands/

If you already have slash commands:
- The engine uses a `workflow/` prefix (e.g., `/workflow/plan-product`)
- Collisions only happen if you also use the `workflow/` prefix
- Resolution: rename your commands or skip conflicting engine commands

### Existing CLAUDE.md

The engine's CLAUDE.md contains the agent hierarchy, workflow description, and context model reference. Options:
- **Replace:** Use the engine's version (backs up yours)
- **Merge:** Add the engine sections to your existing file
- **Skip:** Keep yours, but agents may not be properly documented to Claude

### Existing settings.local.json

The CLI merges permissions additively -- your existing permissions are kept, and the engine's required permissions are added. No permissions are removed.

### Existing workflow/ directory

If you happen to have a `workflow/` directory for something else:
- The CLI will warn about this conflict
- Resolution: either rename your directory or configure a different path in `config.yml`

## Customizing after installation

### Change the standards path

Edit `workflow/config.yml`:

```yaml
context_model:
  standards:
    path: my-custom-standards-path/
```

### Remove agents you don't need

Delete agent files from `.claude/agents/`. The remaining agents will still work. The orchestrator will skip deleted agents during delegation.

### Disable the CLI safety features

The CLI is optional. If you don't need it, simply don't build or run it. The workflow commands and agents work independently.

### Adjust tech stack standard

Edit `workflow/standards/global/tech-stack.md` to match your actual technology choices. This standard is injected into every delegated task.

## Uninstallation

### CLI rollback

If you installed via CLI:

```bash
node cli/dist/index.js rollback /path/to/your/project
```

This restores files from the backup created during installation.

### Manual removal

```bash
rm -rf .claude/agents/architect.md .claude/agents/ask.md .claude/agents/debug.md \
       .claude/agents/devops.md .claude/agents/orchestrator.md \
       .claude/agents/researcher.md .claude/agents/security.md
rm -rf .claude/commands/workflow/
rm -rf .claude/skills/workflow/
rm -rf workflow/
# Manually remove engine sections from CLAUDE.md if merged
# Manually remove engine permissions from settings.local.json if merged
```

## Troubleshooting

### "Agent not found" after installation

- Check that `.claude/agents/` contains the `.md` files
- Check that `CLAUDE.md` references the agents
- Restart Claude Code (`claude` command)

### "Command not available"

- Check that `.claude/commands/workflow/` contains the command files
- Verify file permissions (must be readable)
- Check `.claude/settings.local.json` for correct permissions

### Standards not loading

- Verify `workflow/standards/index.yml` exists and is valid YAML
- Run `/workflow/index-standards` to rebuild the index
- Check that skills exist in `.claude/skills/workflow/`

### GDPR warnings after installation

```bash
node cli/dist/index.js check --gdpr --fix /path/to/your/project
```

This adds missing gitignore patterns automatically.

## See also

- [Getting Started](getting-started.md) - Fresh installation from scratch
- [CLI Reference](cli.md) - All CLI commands in detail
- [Configuration](configuration.md) - Customizing config files after installation
