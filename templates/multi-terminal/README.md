# Multi-Terminal Parallel Development

This project uses CWE Multi-Terminal for parallel development across multiple Claude Code instances.

## How It Works

Each terminal runs in its own git worktree with a dedicated branch. Terminals communicate via structured handoff files in `shared/handoff/`.

## Quick Reference

- **Check for work:** `/cwe:check-handoff`
- **Send work to another terminal:** `/cwe:handoff`
- **Run autonomous loop:** `/cwe:autopilot`
- **Coordinate team (lead only):** `/cwe:coordinate`
- **Merge to main (QA only):** `/cwe:qa-merge`

## Handoff Protocol

1. Write a handoff entry with `/cwe:handoff`
2. Commit + push automatically
3. Other terminals pick up new entries via sync hook
4. Update status as work progresses

## Entry Format

```markdown
## [YYYY-MM-DD HH:MM] T{source} → T{target}: {title}

**Status:** 📋 TODO | 🔄 IN PROGRESS | ✅ DONE | ❌ BLOCKED | ⚠️ NEEDS REVIEW

**Kontext:** {description of what was done}

**Action Required:** {what the recipient should do}

---
```

## Rules

- Always check handoffs before starting new work
- One action per handoff entry
- Never delete entries, only update status
- Commit + push after every handoff write
