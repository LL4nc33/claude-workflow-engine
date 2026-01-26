---
description: Letzte Workflow-Aenderungen rueckgaengig machen (git-basiert)
interactive: true
---

# Workflow Undo

Reverts recent workflow changes safely using git. Useful when a spec or task went wrong.

## Important Guidelines

- **Always use AskUserQuestion tool** before any destructive action
- **Git-based** — Only works in git repositories
- **Safe by default** — Shows preview before reverting
- **Scope limited** — Only reverts workflow/ directory changes

## Process

### Step 1: Check Git Status

Run git commands to understand current state:

```bash
# Check if git repo
git rev-parse --git-dir

# Get recent commits affecting workflow/
git log --oneline -10 -- workflow/

# Check for uncommitted changes in workflow/
git status -- workflow/
```

### Step 2: Present Undo Options

Use AskUserQuestion to show what can be undone:

```
Workflow Undo

Uncommitted Changes:
  {list of modified files in workflow/}

Recent Commits (workflow/):
  abc1234 - "Add auth spec" (2 hours ago)
  def5678 - "Update tasks" (yesterday)
  ghi9012 - "Initial spec" (2 days ago)

Was moechtest du rueckgaengig machen?
```

Options:
1. "Uncommitted Changes verwerfen" — `git checkout -- workflow/`
2. "Letzten Commit rueckgaengig" — `git revert HEAD -- workflow/`
3. "Bestimmten Commit auswaehlen" — Shows commit list
4. "Abbrechen"

### Step 3: Confirm Action

Before any revert, show exactly what will happen:

```
Du bist dabei folgende Aenderungen rueckgaengig zu machen:

Betroffene Dateien:
  - workflow/specs/2026-01-25-auth/spec.md (modified)
  - workflow/specs/2026-01-25-auth/tasks.md (deleted)

Diese Aktion kann nicht rueckgaengig gemacht werden!
Fortfahren? (ja/nein)
```

### Step 4: Execute Undo

Based on user choice:

#### Uncommitted Changes
```bash
git checkout -- workflow/
```

#### Last Commit (soft revert)
```bash
# Create backup branch first
git branch backup-before-undo-$(date +%Y%m%d-%H%M%S)

# Revert only workflow/ changes from last commit
git show HEAD --name-only -- workflow/ | xargs git checkout HEAD~1 --
```

#### Specific Commit
```bash
# Show diff first
git show {commit} -- workflow/

# Revert specific files from that commit
git checkout {commit}~1 -- workflow/path/to/file
```

### Step 5: Report Result

```
Undo erfolgreich!

Rueckgaengig gemacht:
  - workflow/specs/2026-01-25-auth/spec.md
  - workflow/specs/2026-01-25-auth/tasks.md

Backup erstellt: backup-before-undo-20260125-143022

Naechste Schritte:
  1. Aenderungen pruefen
  2. Bei Bedarf: git commit -m "Revert workflow changes"
  3. Oder: git branch -D backup-... (wenn alles ok)
```

## Safety Features

### What CAN be undone
- Changes to `workflow/specs/`
- Changes to `workflow/product/`
- Changes to `workflow/standards/`

### What CANNOT be undone (blocked)
- Changes outside `workflow/`
- Commits that touch non-workflow files
- Force pushes or history rewrites

### Automatic Backups
Before any destructive action:
1. Create backup branch: `backup-before-undo-{timestamp}`
2. Log action to `workflow/undo.log`

## Edge Cases

### No Git Repository
```
Undo nicht verfuegbar — kein Git-Repository gefunden.

Alternative:
  Manuell die gewuenschten Dateien bearbeiten oder loeschen.
```

### Uncommitted Changes Outside Workflow
```
WARNUNG: Es gibt uncommitted changes ausserhalb von workflow/

Diese werden NICHT beruehrt. Nur workflow/ wird zurueckgesetzt.

Fortfahren? (ja/nein)
```

### Merge Conflicts After Revert
```
Merge-Konflikt in: workflow/specs/auth/spec.md

Optionen:
  1. Konflikt manuell loesen
  2. "Theirs" behalten (alte Version)
  3. "Ours" behalten (aktuelle Version)
  4. Undo abbrechen
```

## Tips

- **Unsicher?** Mach erst einen Commit bevor du Undo nutzt
- **Grosser Fehler?** Nutze `git reflog` fuer tiefere Recovery
- **Nur ein File?** Beschreibe es direkt: "Revert spec.md to previous version"
