---
description: Team-lead coordination - fetch, review commits, dispatch handoffs across terminals
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "AskUserQuestion"]
---

# Coordinate — Team Lead Coordination

Review progress across all terminals and dispatch new tasks. Typically run from the team lead terminal (T1).

## Step 1: Gather Status

### Fetch all branches

```bash
git fetch --all --quiet 2>/dev/null
```

### List all terminal branches

```bash
git branch -r | grep -E 'origin/t[0-9]+-' | sed 's|origin/||' | xargs -I{} echo "{}"
```

### Recent commits per branch

For each terminal branch, show the last 5 commits:

```bash
git log --oneline -5 origin/{branch}
```

### Handoff status

Read all `shared/handoff/*.md` files and summarize:
- Total entries per status (TODO, IN PROGRESS, DONE, BLOCKED, NEEDS REVIEW)
- Blocked items (highlight these)
- Pending TODOs per terminal

## Step 2: Present Overview

Display a summary table:

```markdown
## Team Status

| Terminal | Branch | Last Commit | Pending TODOs | In Progress | Blocked |
|----------|--------|-------------|---------------|-------------|---------|
| T1 | t1-frontend | ... | 2 | 1 | 0 |
| T2 | t2-backend | ... | 0 | 1 | 0 |
| T3 | t3-qa | ... | 3 | 0 | 1 |
```

## Step 3: Dispatch New Tasks

Use AskUserQuestion to ask the team lead:

**Question:** "What would you like to do?"

**Options:**
1. "Dispatch new tasks" — Write handoff entries for specific terminals
2. "Unblock a terminal" — Resolve a BLOCKED item
3. "Review progress" — Deep-dive into a specific terminal's work
4. "Merge check" — Check if branches are ready for QA merge
5. "Done" — Exit coordination

### If "Dispatch new tasks":

For each task, ask:
- Target terminal (T1, T2, T3, etc.)
- Task title
- Context/description
- Priority (high, normal, low)

Write handoff entries and commit + push.

### If "Merge check":

For each terminal branch, check:
- Are there uncommitted changes?
- Are there pending TODOs?
- Are there failing tests? (if detectable)
- Is the branch ahead/behind main?

Report readiness status per branch.
