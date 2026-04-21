---
description: Read and summarize pending handoff entries for this terminal
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# Check Handoff — Read Pending Entries

Read all handoff files and present a summary of entries relevant to this terminal.

## Step 1: Detect Terminal

```bash
BRANCH=$(git branch --show-current 2>/dev/null)
echo "$BRANCH"
```

Extract terminal number from branch (e.g., `t2-backend` → `2`).

If not in a multi-terminal branch, inform the user:
> "Not in a multi-terminal worktree. No handoffs to check."

## Step 2: Sync

```bash
git fetch --all --quiet 2>/dev/null
```

Pull latest handoff changes from other branches (best effort).

**Dirty-tree guard:** `git checkout <branch> -- shared/handoff/` silently overwrites the working-tree copy of those files. If `shared/handoff/` has uncommitted changes, refuse to proceed — the user should commit or stash first.

```bash
if [ -n "$(git status --porcelain shared/handoff/ 2>/dev/null)" ]; then
  echo "ERROR: shared/handoff/ has uncommitted changes. Commit or stash first before syncing from other terminals." >&2
  exit 1
fi

# Merge shared/handoff from other terminal branches
for remote_branch in $(git branch -r | grep -E 'origin/t[0-9]+-' | grep -v "origin/$(git branch --show-current)"); do
  git checkout "$remote_branch" -- shared/handoff/ 2>/dev/null || true
done
```

## Step 3: Read Handoffs

Read all `shared/handoff/*.md` files. Parse entries targeting this terminal (T{N}).

## Step 4: Present Summary

```markdown
## Handoff Summary for T{N} ({role})

### 📋 TODO ({count})
- [{timestamp}] From T{source}: {title}
  Action: {action required}

### 🔄 IN PROGRESS ({count})
- [{timestamp}] From T{source}: {title}

### ⚠️ NEEDS REVIEW ({count})
- [{timestamp}] From T{source}: {title}

### ❌ BLOCKED ({count})
- [{timestamp}] From T{source}: {title}
  Reason: {context}

### ✅ Recently Completed ({count, last 5})
- [{timestamp}] {title}
```

If no entries exist, show: "No handoffs pending. You're free to work on your own tasks."
