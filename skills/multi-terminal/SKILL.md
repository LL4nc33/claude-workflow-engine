---
name: multi-terminal
description: Multi-Terminal Parallel Development reference. Handoff protocol, entry format, routing, and coordination patterns for parallel terminal workflows.
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---

# Multi-Terminal Parallel Development

Reference skill for coordinating work across multiple Claude Code terminals using git worktrees and structured handoff files.

## Architecture

```
projekt/
├── .trees/
│   ├── t1-*/              # Git Worktrees (one per terminal)
│   ├── t2-*/
│   └── t3-*/
├── shared/
│   └── handoff/
│       ├── README.md       # Protocol explanation
│       ├── *.md            # Handoff files per role pair
│       └── .changelog      # Audit trail
├── terminal-prompts/
│   ├── T1-*.md            # Role + CWE-Agents + First Actions
│   ├── T2-*.md
│   └── T3-*.md
```

## Branch Naming Convention

Worktree branches follow the pattern `t{N}-{role}`:
- `t1-frontend`
- `t2-backend`
- `t3-qa`

The `t\d+-` prefix is used by hooks to detect multi-terminal context.

## Handoff Protocol

### Entry Format

```markdown
## [YYYY-MM-DD HH:MM] T{source} → T{target}: {title}

**Status:** 📋 TODO | 🔄 IN PROGRESS | ✅ DONE | ❌ BLOCKED | ⚠️ NEEDS REVIEW

**Kontext:** {was gemacht wurde}

**Action Required:** {was der Empfänger tun soll}

---
```

### Status Flow

```
📋 TODO → 🔄 IN PROGRESS → ✅ DONE
                          → ❌ BLOCKED (with reason)
                          → ⚠️ NEEDS REVIEW
```

### Rules

1. **Always commit + push** after writing a handoff entry
2. **Check handoffs first** at the start of each work cycle
3. **Update status** when starting work on a handoff item
4. **Never delete entries** — only update status
5. **One action per entry** — keep handoffs atomic

## Merge Strategy

Entry-count based: The branch with more entries in a handoff file is considered more complete. During sync, entries from other branches are appended if they don't already exist (matched by timestamp + title).

## Presets

| Preset | Terminals | Roles |
|--------|-----------|-------|
| A (2T) | 2 | Dev + QA |
| B (3T) | 3 | Frontend + Backend + QA |
| C (4T) | 4 | Frontend + Backend + Infra + QA |
| D | Custom | User-defined roles |

## CWE Agent Mapping

Each terminal role maps to preferred CWE agents:

| Role | Primary Agents | Secondary |
|------|---------------|-----------|
| Frontend | builder, quality | architect, explainer |
| Backend | builder, devops | architect, security |
| QA | quality, security | researcher, ask |
| Infra | devops, security | architect, researcher |
| Dev (generic) | builder, quality | architect, devops |

## Commands

| Command | Purpose | Who |
|---------|---------|-----|
| `/cwe:autopilot` | Autonomous task loop | Any terminal |
| `/cwe:coordinate` | Team-lead coordination | Team Lead (T1) |
| `/cwe:check-handoff` | Read + summarize handoffs | Any terminal |
| `/cwe:handoff` | Write handoff entry | Any terminal |
| `/cwe:qa-merge` | QA-verified merge to main | QA terminal only |

## Hooks

| Event | Hook | Purpose |
|-------|------|---------|
| UserPromptSubmit | handoff-sync.py | Sync entries from other branches |
| SessionStart | mt-session-init.py | Detect worktree + load handoff context |

Both hooks silently skip when not in a multi-terminal worktree (no `t\d+-` branch prefix).
