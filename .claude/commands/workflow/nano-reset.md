# NaNo Reset

Setzt das NaNo Learning System zurueck. Loescht alle gesammelten Daten.

## Process

### Step 1: Show Current State

Read and display what will be deleted:
- Count session files in `workflow/nano/observations/`
- Count pattern files in `workflow/nano/patterns/`
- Count evolution candidates in `workflow/nano/evolution/candidates/`

### Step 2: Confirmation

Use AskUserQuestion with header "Reset":

Question: "ACHTUNG: Dies loescht alle NaNo-Lerndaten unwiderruflich. Was soll zurueckgesetzt werden?"
Options:
1. "Alles zuruecksetzen" - Observations, Patterns UND Evolution Candidates loeschen
2. "Nur Observations" - Nur Session-Dateien loeschen, Patterns und Candidates behalten
3. "Nur Candidates" - Nur Evolution Candidates loeschen
4. "Abbrechen" - Nichts aendern

### Step 3: Execute Reset

Based on user choice, delete the appropriate directories' contents:

**Alles zuruecksetzen:**
```bash
rm -rf workflow/nano/observations/session-*.toon
rm -rf workflow/nano/patterns/*.md
rm -rf workflow/nano/evolution/candidates/*.yml
rm -f /tmp/nano-status-cache
```

**Nur Observations:**
```bash
rm -rf workflow/nano/observations/session-*.toon
rm -f /tmp/nano-status-cache
```

**Nur Candidates:**
```bash
rm -rf workflow/nano/evolution/candidates/*.yml
```

IMPORTANT: Never delete the directory structure itself, only the content files.
IMPORTANT: Never delete `workflow/nano/config/` or `.claude/nano.local.md`.

### Step 4: Confirm

Show what was deleted:
```
NaNo Reset abgeschlossen:
  - N Session-Dateien geloescht
  - N Pattern-Dateien geloescht
  - N Evolution Candidates geloescht

Das System beginnt mit der naechsten Session neu zu lernen.
```
