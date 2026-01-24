# Platform Architecture

The Claude Workflow Engine uses all 6 extension layers of Claude Code as a complete plugin.

---

## 6-Layer Model

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging                                       |
|  .claude-plugin/plugin.json                                      |
|  Bundles all layers into an installable package                  |
+==================================================================+
|  Layer 5: Hooks                                                  |
|  hooks/hooks.json + hooks/scripts/*.sh                           |
|  Event-based automation                                          |
+------------------------------------------------------------------+
|  Layer 4: Agents                                                 |
|  .claude/agents/*.md (7 agents)                                  |
|  Specialized subagents with MCP tool integration                 |
+------------------------------------------------------------------+
|  Layer 3: Skills                                                 |
|  .claude/skills/workflow/*/SKILL.md                              |
|  Context-based knowledge (Standards + MCP + Hooks + Config)      |
+------------------------------------------------------------------+
|  Layer 2: Commands                                               |
|  .claude/commands/workflow/*.md                                   |
|  8 slash commands for the 5-phase workflow                       |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md                                              |
|  .claude/CLAUDE.md                                               |
|  Project instructions and system overview                        |
+------------------------------------------------------------------+
```

---

## Layer 1: CLAUDE.md

**Path:** `.claude/CLAUDE.md`

The foundation layer. Loaded every session, gives Claude Code the project context:
- Agent hierarchy and directory
- Workflow overview (5 phases)
- 3-layer context model (Standards/Product/Specs)
- Standards domains
- Configuration files
- MCP tool overview
- Hook behavior
- GDPR/EU compliance

---

## Layer 2: Commands

**Path:** `.claude/commands/workflow/`

8 slash commands for the structured workflow:

| Command | Phase | Function |
|---------|-------|----------|
| `/workflow/plan-product` | 1 | Define product vision |
| `/workflow/shape-spec` | 2 | Structure requirements |
| `/workflow/write-spec` | 3 | Create technical specification |
| `/workflow/create-tasks` | 4 | Generate tasks |
| `/workflow/orchestrate-tasks` | 5 | Delegate to agents |
| `/workflow/discover-standards` | - | Discover standards from code |
| `/workflow/index-standards` | - | Update standards index |
| `/workflow/inject-standards` | - | Manually load standards |

---

## Layer 3: Skills

**Path:** `.claude/skills/workflow/*/SKILL.md`

Skills are automatically loaded via description matching. Available skills:

### Standards Skills (existing)
Each standard in `workflow/standards/` is automatically provided as a skill.

### New Plugin Skills

| Skill | Trigger Keywords | Content |
|-------|-----------------|---------|
| `mcp-usage` | semantic code analysis, symbol navigation, PR review, MCP | Tool catalog and agent matrix |
| `hook-patterns` | hook, automation, PreToolUse, SessionStart | Hook reference and debugging |
| `plugin-config` | plugin configuration, 6-layer, engine setup | Architecture and installation |

---

## Layer 4: Agents

**Path:** `.claude/agents/*.md`

7 specialized agents with defined roles and access rights:

| Agent | Access | MCP Tools |
|-------|--------|-----------|
| architect | READ-ONLY | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| ask | READ-ONLY | Serena: get_symbols_overview, find_symbol |
| debug | FULL | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| devops | FULL | - (no MCP dependency) |
| orchestrator | TASK-DELEGATION | Greptile: list_merge_requests, get_merge_request |
| researcher | READ-ONLY | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| security | RESTRICTED | Greptile: search_greptile_comments, list_merge_request_comments |

---

## Layer 5: Hooks

**Path:** `hooks/hooks.json` + `hooks/scripts/*.sh`

Event-based automation with shell scripts:

### SessionStart Hook
- **Script:** `hooks/scripts/session-start.sh`
- **Function:** Checks standards freshness, provides workflow context
- **Output:** `additionalContext` with engine version, mission status, active spec

### PreToolUse Hook (Write/Edit)
- **Script:** `hooks/scripts/pre-write-validate.sh`
- **Function:** Secrets protection - blocks writes to sensitive files
- **Blocks:** `.env`, `credentials.*`, `secrets.*`, `*.local.md`
- **Output:** `permissionDecision: allow/deny`

### PostToolUse Hook (Write/Edit)
- **Script:** `hooks/scripts/post-write-log.sh`
- **Function:** Logs filename + timestamp during active orchestration
- **GDPR:** Only filenames, no contents; ignores `.local.md`

### Shared Utilities
- **Script:** `hooks/scripts/common.sh`
- **Functions:** `get_project_root()`, `get_active_spec()`, `json_escape()`, `is_secrets_path()`

---

## Layer 6: Plugin Packaging

**Path:** `.claude-plugin/plugin.json`

The plugin manifest bundles all layers:

```json
{
  "name": "claude-workflow-engine",
  "version": "0.2.0",
  "commands": "./.claude/commands",
  "agents": "./.claude/agents",
  "skills": "./.claude/skills",
  "hooks": "./hooks/hooks.json"
}
```

---

## MCP Server Setup

### Serena (Semantic Code Analysis)

Serena provides Language Server-based code navigation:

1. Create Serena configuration in the project (`.serena/`)
2. Configure MCP server in Claude Code
3. Agents automatically use available tools

**Used by:** architect, researcher, debug, ask

### Greptile (PR & Code Review)

Greptile provides PR management and review integration:

1. Create a Greptile account
2. Configure MCP server with API key
3. Agents automatically use available tools

**Used by:** orchestrator, security

### Fallback Behavior

When an MCP server is unavailable, agents fall back to standard tools:
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

---

## Layer Dependencies

```
Layer 6 ──references──> Layer 5, 4, 3, 2
Layer 5 ──uses──> common.sh (shared utilities)
Layer 4 ──uses──> Layer 3 (skills via MCP tools)
         ──reads──> Layer 1 (CLAUDE.md)
Layer 3 ──documents──> Layer 5, 4
Layer 1 ──describes──> All layers
```

---

## Extension

### Adding a New Hook

1. Create script in `hooks/scripts/my-hook.sh`
2. Make executable: `chmod +x hooks/scripts/my-hook.sh`
3. Register in `hooks/hooks.json`
4. Document in `hook-patterns` skill

### Adding a New Skill

1. Create directory: `.claude/skills/workflow/my-skill/`
2. Create `SKILL.md` with YAML frontmatter (name, description)
3. Description contains trigger keywords

### Adding a New Agent

1. Create `.claude/agents/my-agent.md` with frontmatter
2. Update `workflow/config.yml` (agents.available)
3. Update `.claude/CLAUDE.md` (agents table)

---

## See Also

- [Getting Started](getting-started.md) - Introduction and installation
- [Agents Reference](agents.md) - All 7 agents in detail
- [Workflow Guide](workflow.md) - 5-phase workflow
- [Configuration](configuration.md) - config.yml and settings
