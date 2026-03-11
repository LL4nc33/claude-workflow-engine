---
description: QA-verified merge of terminal branches to main (team lead / QA only)
allowed-tools: ["Read", "Bash", "Glob", "Grep", "AskUserQuestion"]
---

# QA Merge — Verified Merge to Main

Merge terminal branches into main after QA verification. Should only be run from the QA terminal or team lead.

## Step 1: Pre-flight Checks

### Verify context

```bash
BRANCH=$(git branch --show-current 2>/dev/null)
echo "$BRANCH"
```

### Check for pending handoffs

Read all `shared/handoff/*.md` files. If there are any `📋 TODO` or `🔄 IN PROGRESS` entries, warn:

> "Warning: There are still open handoff items. Merging with open work items is not recommended."

Use AskUserQuestion: "Continue anyway?"
- "Yes, merge anyway"
- "No, finish open items first" → stop

### Check all terminal branches

```bash
git fetch --all --quiet
```

For each terminal branch:

```bash
git log --oneline main..origin/{branch} | head -20
```

Show what each branch adds.

## Step 2: QA Checklist

Use AskUserQuestion to walk through QA verification:

**Question:** "QA Checklist — bitte bestätigen:"

- "All tests pass on all branches"
- "No BLOCKED handoff items remain"
- "Code review completed"
- "Ready to merge"

If not all confirmed, stop.

## Step 3: Merge Strategy

Use AskUserQuestion:

**Question:** "Merge-Strategie?"

**Options:**
1. "Sequential merge" — Merge branches one by one (safer, easier conflicts)
2. "Octopus merge" — Merge all branches at once (cleaner history)

### Sequential Merge

```bash
git checkout main
git pull origin main
# For each terminal branch in order:
git merge origin/{branch} --no-ff -m "merge(t{N}): {role} branch"
```

If conflicts arise, stop and inform the user. Do NOT auto-resolve.

### Octopus Merge

```bash
git checkout main
git pull origin main
git merge origin/t1-* origin/t2-* origin/t3-* -m "merge: multi-terminal development complete"
```

## Step 4: Post-Merge

```bash
git push origin main
```

### Cleanup (ask first)

Use AskUserQuestion: "Worktree-Branches löschen?"
- "Yes, clean up" → delete terminal branches + worktrees
- "No, keep them" → leave for future work

```bash
# If cleanup:
git worktree remove .trees/t1-* 2>/dev/null
git worktree remove .trees/t2-* 2>/dev/null
git worktree remove .trees/t3-* 2>/dev/null
git branch -d t1-* t2-* t3-* 2>/dev/null
git push origin --delete t1-* t2-* t3-* 2>/dev/null
```

## Step 5: Summary

```markdown
## Merge Complete

| Branch | Commits Merged | Status |
|--------|---------------|--------|
| t1-frontend | 12 | ✅ Merged |
| t2-backend | 8 | ✅ Merged |
| t3-qa | 5 | ✅ Merged |

Total: {N} commits merged to main.
Worktrees: {cleaned up / kept}
```
