---
description: Autonomous multi-terminal task loop - sync, find TODOs, execute, commit, push
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "AskUserQuestion"]
---

# Autopilot — Autonomous Task Loop

Run an autonomous work cycle in this terminal's multi-terminal worktree.

## Prerequisites

Verify multi-terminal context:

```bash
BRANCH=$(git branch --show-current 2>/dev/null)
echo "$BRANCH"
```

If the branch does NOT match `t\d+-.*`, stop and inform the user:
> "Autopilot requires a multi-terminal worktree. Run `/cwe:init` to set up Multi-Terminal Development."

## Cycle

Repeat the following loop until no more TODOs remain or the user interrupts:

### 1. Sync

```bash
git fetch --all --quiet 2>/dev/null
```

### 2. Check Handoffs

Read all `shared/handoff/*.md` files. Extract entries with status `📋 TODO` that target this terminal.

Determine this terminal's number from the branch name (e.g., `t2-backend` → T2).

### 3. Pick Next Task

Select the oldest TODO entry targeting this terminal. If no TODOs exist:
- Check if there are any `🔄 IN PROGRESS` items for this terminal
- If yes, continue working on them
- If no, inform the user: "No pending tasks. Waiting for handoffs."
- Use AskUserQuestion: "No TODOs found. What would you like to do?"
  - "Wait and retry" — sleep 30s, then re-sync
  - "Create own task" — ask what to work on
  - "Exit autopilot" — stop the loop

### 4. Execute Task

1. Update the handoff entry status from `📋 TODO` to `🔄 IN PROGRESS`
2. Commit + push the status update
3. Execute the task described in the handoff entry's "Action Required"
4. Use appropriate CWE agents based on the task type (builder for code, quality for tests, etc.)

### 5. Complete + Handoff

1. Update the handoff entry status to `✅ DONE`
2. If follow-up work is needed for another terminal, write a new handoff entry via the entry format:

```markdown
## [YYYY-MM-DD HH:MM] T{this} → T{target}: {title}

**Status:** 📋 TODO

**Kontext:** {what was done}

**Action Required:** {what the target should do}

---
```

3. Commit all changes with message: `feat(t{N}): {brief description}`
4. Push to remote

### 6. Loop

Return to step 1 (Sync).

## Safety

- Never force-push
- Always commit before switching tasks
- If a task seems destructive or unclear, pause and ask the user
- Maximum 10 cycles before pausing for user confirmation
