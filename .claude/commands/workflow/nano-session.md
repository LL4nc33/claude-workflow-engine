---
description: Aktuelle Session-Beobachtungen anzeigen
interactive: false
---

# NaNo Current Session

Zeigt die Observations der aktuellen Session in menschenlesbarer Form.

## Process

### Step 1: Find Current Session

Determine the current session file:
- Use `$CLAUDE_SESSION_ID` if available
- Otherwise find the most recently modified `session-*.toon` file in `workflow/nano/observations/`

If no session file exists, inform the user: "Keine aktive NaNo-Session gefunden. Starte eine neue Session mit aktivem NaNo Learning."

### Step 2: Parse Session File

Read the session file (TOON format):
```
session: <id>
started: <timestamp>
level: <medium|comprehensive|minimal>
count: <N>
observations:
  <timestamp> | <type> | <data>
  ...
```

### Step 3: Present Session View

Display in this format:

```
NaNo Session (started HH:MM)
─────────────────────────────
HH:MM:SS  <type> → <parsed_data>
HH:MM:SS  <type> → <parsed_data>
...
─────────────────────────────
N observations | level: <level> | threshold: <T>/<max> until pattern
```

For each observation, format the data human-readable:
- `delegation | agent=builder,task_group=implementation` → `builder → implementation`
- `delegation | agent=architect,task_group=architecture,desc=...` → `architect → architecture (desc...)`
- `quality | gate=lint,outcome=pass` → `quality: lint ✓`
- `quality | gate=test,outcome=fail` → `quality: test ✗`
- `standards | standard=naming,applied=true` → `standards: naming applied`

### Step 4: Show Progress Insight

Calculate and show:
- How many more observations until the pattern threshold is reached
- Which agent/task_group combinations are close to becoming patterns
- Example: "builder → implementation: 2/3 bis Pattern-Erkennung"

### Step 5: Offer Actions

Use AskUserQuestion with options:
1. "Analyse jetzt ausfuehren" - Trigger `nano-observer.sh analyze`
2. "Vollstaendigen Status" - Run /workflow:homunculus-status
3. "Fertig" - End command
