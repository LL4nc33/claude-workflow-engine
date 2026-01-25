# NaNo Toggle

Schaltet das NaNo Learning System ein oder aus.

## Process

### Step 1: Check Current State

Read `.claude/nano.local.md`:
- If file exists: parse `enabled:` value from YAML frontmatter
- If file doesn't exist: NaNo is not configured (First-Run)

### Step 2: Present Status & Options

Use AskUserQuestion with header "NaNo Toggle":

**If NaNo is currently ENABLED:**
```
NaNo Learning ist aktuell AKTIV.
```
Options:
1. "Deaktivieren" - Setzt enabled: false (Observations werden pausiert)
2. "Status anzeigen" - Zeigt aktuelle Metriken via /workflow:homunculus-status

**If NaNo is currently DISABLED or not configured:**
```
NaNo Learning ist aktuell INAKTIV.
```
Options:
1. "Aktivieren" - Setzt enabled: true (startet Observation)
2. "Aktivieren + Konfigurieren" - Aktiviert und oeffnet /workflow:nano-config

### Step 3: Apply Change

**Aktivieren/Deaktivieren:**
- Edit the `enabled:` field in `.claude/nano.local.md` YAML frontmatter
- IMPORTANT: This file is a `.local.md` file - the PreToolUse hook blocks writes to it.
  Tell the user to manually change the value, OR use the Bash tool to write it (hooks don't block Bash).

**First-Run (file doesn't exist):**
Create `.claude/nano.local.md` via Bash with this template:
```yaml
---
enabled: true
observation_level: medium
max_session_observations: 1000
cleanup_after_days: 30
pattern_detection_threshold: 3
focus_areas:
  - delegation_patterns
  - quality_patterns
  - standards_effectiveness
---

# NaNo Learning Configuration

Projektbasiertes Lernsystem - beobachtet Agent-Delegationen und erkennt Muster.

## Observation Levels

- **minimal**: Nur Agent-Typ und Task-Group
- **medium**: Agent, Task-Group, Outcome (Standard)
- **comprehensive**: Zusaetzlich Task-Beschreibung (mehr Kontext, mehr Speicher)

## Focus Areas

- `delegation_patterns` - Welche Agents fuer welche Aufgaben gewaehlt werden
- `quality_patterns` - Quality Gate Ergebnisse
- `standards_effectiveness` - Wie oft Standards angewendet werden
```

Also create the necessary directories:
```bash
mkdir -p workflow/nano/{observations,patterns,evolution/candidates}
```

### Step 4: Confirm

Output confirmation message:
- "NaNo Learning wurde aktiviert. Delegationen werden ab jetzt beobachtet."
- OR "NaNo Learning wurde deaktiviert. Keine weiteren Observations."

Invalidate the status cache:
```bash
rm -f /tmp/nano-status-cache
```
