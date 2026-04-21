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

Glob patterns do NOT expand against remote refs, so enumerate matching branches first and merge them explicitly:

```bash
git checkout main
git pull origin main

BRANCHES=$(git branch -r | grep -oE 'origin/t[0-9]+-[a-z0-9-]+' | sort)
if [ -z "$BRANCHES" ]; then
  echo "No terminal branches (origin/t<N>-*) found to merge."
  exit 1
fi

for br in $BRANCHES; do
  git merge --no-ff "$br" -m "merge($br): multi-terminal integration" || {
    echo "Merge of $br failed — resolve conflicts and re-run."
    exit 1
  }
done
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
# Glob patterns do NOT expand for worktree paths or remote branches — enumerate explicitly.

# Remove worktrees under .trees/t<N>-*
for wt in $(git worktree list --porcelain | awk '/^worktree / && /\.trees\/t[0-9]+/ {print $2}'); do
  git worktree remove --force "$wt"
done

# Delete local terminal branches
for br in $(git branch | grep -oE 't[0-9]+-[a-z0-9-]+'); do
  git branch -d "$br" 2>/dev/null || git branch -D "$br"
done

# Delete remote terminal branches
for br in $(git branch -r | grep -oE 'origin/t[0-9]+-[a-z0-9-]+' | sed 's#^origin/##'); do
  git push origin --delete "$br" 2>/dev/null || true
done
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
