---
description: Check and install CWE plugin dependencies, MCP servers, and verify CWE skills
allowed-tools: ["Bash", "AskUserQuestion"]
---

# CWE Plugin & Skill Manager

Check and install all CWE dependencies. Lightweight alternative to `/cwe:init` — only handles plugins, MCP servers, and skill verification. No project setup.

**Usage:** `/cwe:plugins` or `/cwe:plugins install`

## Step 1: Check Installed Plugins

```bash
claude plugin list --json 2>/dev/null || echo '[]'
```

### Required Plugins

| Plugin | Purpose | Level |
|--------|---------|-------|
| superpowers | TDD, debugging, planning, code review | **Required** |
| serena | Semantic code analysis via LSP | Recommended |
| feature-dev | 7-phase feature development | Recommended |
| frontend-design | Production-grade UI components | Optional |
| code-simplifier | Code cleanup and refactoring | Optional |
| claude-md-management | CLAUDE.md maintenance | Optional |
| plugin-dev | Plugin creation tools | Optional |

### Compare and Report

Show a status table:

```
Plugins:
  superpowers          installed
  serena               installed
  feature-dev          MISSING (recommended)
  frontend-design      MISSING (optional)
  ...
```

## Step 2: Install Missing Plugins

If any plugins are missing, use AskUserQuestion:

**Question:** "Missing plugins found. What would you like to install?"

**Options:**
1. "Install all missing" - Install everything that's missing (Recommended)
2. "Install required + recommended only" - Skip optional plugins
3. "Let me pick" - Choose individually
4. "Skip plugins" - Don't install any

For each plugin to install:
```bash
claude plugin install <plugin-name>
```

Show progress for each installation.

## Step 3: Check MCP Servers

```bash
claude mcp list 2>/dev/null || echo 'No MCP servers configured'
```

### Required MCP Servers

| MCP Server | Purpose | Level |
|------------|---------|-------|
| playwright | Browser automation, E2E testing, screenshots | Recommended |
| context7 | Up-to-date library docs via Context7 | Recommended |
| github | GitHub API integration (PRs, issues, repos) | Recommended |
| filesystem | Direct filesystem access for agents | Optional |
| sequential-thinking | Step-by-step reasoning for complex tasks | Optional |

### Compare and Report

Show status table like plugins above.

## Step 4: Install Missing MCP Servers

If any MCP servers are missing, use AskUserQuestion:

**Question:** "Missing MCP servers found. What would you like to install?"

**Options:**
1. "Install all recommended" - Install playwright, context7, github (Recommended)
2. "Install all" - Install all 5 servers
3. "Let me pick" - Choose individually
4. "Skip MCP servers" - Don't install any

### Detect platform first

```bash
uname -s
```

### Install commands

**Linux / macOS:**
```bash
claude mcp add playwright -- npx @playwright/mcp@latest --isolated --headless --no-sandbox
claude mcp add context7 -- npx @upstash/context7-mcp
claude mcp add github -- npx @modelcontextprotocol/server-github
claude mcp add filesystem -- npx @modelcontextprotocol/server-filesystem
claude mcp add sequential-thinking -- npx @modelcontextprotocol/server-sequential-thinking
```

**Windows / WSL:**
```bash
claude mcp add playwright -- npx @playwright/mcp@latest
claude mcp add context7 -- npx @upstash/context7-mcp
claude mcp add github -- npx @modelcontextprotocol/server-github
claude mcp add filesystem -- npx @modelcontextprotocol/server-filesystem
claude mcp add sequential-thinking -- npx @modelcontextprotocol/server-sequential-thinking
```

## Step 5: Verify CWE Skills & Commands

Check that all CWE commands and skills are loaded. List the expected commands and skills, then verify which ones appear.

### Expected CWE Commands

These should all be available as `/cwe:<name>`:

| Command | File |
|---------|------|
| init | commands/init.md |
| plugins | commands/plugins.md |
| start | commands/start.md |
| help | commands/help.md |
| ask | commands/ask.md |
| builder | commands/builder.md |
| architect | commands/architect.md |
| devops | commands/devops.md |
| security | commands/security.md |
| researcher | commands/researcher.md |
| explainer | commands/explainer.md |
| quality | commands/quality.md |
| innovator | commands/innovator.md |
| guide | commands/guide.md |
| screenshot | commands/screenshot.md |
| web-research | commands/web-research.md |

### Expected CWE Skills

These are auto-loaded skills (not invoked directly, used proactively by agents):

| Skill | Directory |
|-------|-----------|
| agent-detection | skills/agent-detection/ |
| auto-delegation | skills/auto-delegation/ |
| git-standards | skills/git-standards/ |
| health-dashboard | skills/health-dashboard/ |
| project-docs | skills/project-docs/ |
| quality-gates | skills/quality-gates/ |
| safety-gate | skills/safety-gate/ |
| web-research | skills/web-research/ |

### Verify

Check whether the CWE plugin directory is correctly registered:

```bash
cat ~/.claude/settings.json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
dirs = data.get('pluginDirectories', [])
print('Plugin directories:')
for d in dirs:
    print(f'  {d}')
if not dirs:
    print('  (none configured)')
"
```

If commands or skills are missing from the session, inform the user:

```
CWE Skills Check:
  Commands:  16/16 loaded
  Skills:     8/8  loaded

  All commands and skills loaded successfully.
```

If commands are missing, show:

```
  MISSING commands:
    /cwe:screenshot — file exists but not loaded (restart needed?)

  Tip: New commands require a Claude Code restart to appear.
```

## Step 6: Summary

```
CWE Dependencies Check Complete

Plugins:  5/7 installed
MCP:      3/5 configured
Commands: 16/16 loaded
Skills:   8/8  loaded

Changes this run:
  + installed feature-dev
  + installed playwright MCP server

All good — run /cwe:init for full project setup.
```
