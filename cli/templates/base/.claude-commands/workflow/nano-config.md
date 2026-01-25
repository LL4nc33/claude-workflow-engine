# NaNo Configuration

Interaktive Konfiguration des NaNo Learning Systems.

## Process

### Step 1: Read Current Config

Read `.claude/nano.local.md` and parse the YAML frontmatter values:
- `enabled`
- `observation_level`
- `max_session_observations`
- `cleanup_after_days`
- `pattern_detection_threshold`
- `focus_areas`

If file doesn't exist, offer to create it first (redirect to /workflow:nano-toggle).

### Step 2: Observation Level

Use AskUserQuestion with header "Obs Level":

Question: "Welches Observation-Level soll verwendet werden?"
Options:
1. "minimal" - Nur Agent-Typ + Task-Group. Minimaler Speicherverbrauch, schnellste Ausfuehrung.
2. "medium (Empfohlen)" - Agent, Task-Group, Outcome. Gute Balance aus Detail und Performance.
3. "comprehensive" - Zusaetzlich Task-Beschreibung (80 Zeichen). Maximaler Kontext fuer Pattern-Erkennung.

### Step 3: Pattern Threshold

Use AskUserQuestion with header "Threshold":

Question: "Ab wie vielen gleichen Beobachtungen soll ein Pattern erkannt werden?"
Options:
1. "3 (Standard)" - Erkennt Patterns nach 3 gleichen Delegationen. Gut fuer aktive Projekte.
2. "5 (Konservativ)" - Braucht 5 Wiederholungen. Weniger False Positives, laengere Lernphase.
3. "2 (Aggressiv)" - Erkennt Patterns sehr frueh. Mehr Candidates, mehr Review-Aufwand.

### Step 4: Focus Areas

Use AskUserQuestion with header "Focus" and multiSelect=true:

Question: "Welche Bereiche sollen beobachtet werden?"
Options:
1. "Delegation Patterns" - Welche Agents fuer welche Aufgaben gewaehlt werden
2. "Quality Patterns" - Quality Gate Ergebnisse und Failure-Muster
3. "Standards Effectiveness" - Wie oft und wie effektiv Standards angewendet werden

### Step 5: Cleanup Period

Use AskUserQuestion with header "Cleanup":

Question: "Wie lange sollen Session-Dateien aufbewahrt werden? (GDPR)"
Options:
1. "30 Tage (Standard)" - Gute Balance aus Lernhistorie und Datensparsamkeit
2. "14 Tage" - Kuerzere Aufbewahrung, striktere Datensparsamkeit
3. "60 Tage" - Laengere Historie fuer langsamere Projekte
4. "7 Tage" - Minimale Aufbewahrung, nur aktuelle Patterns

### Step 6: Apply Configuration

Write the updated configuration to `.claude/nano.local.md` via Bash tool (to bypass PreToolUse hook for .local.md files).

Map the answers:
- Observation Level: minimal/medium/comprehensive
- Threshold: 2/3/5
- Focus Areas: Array der gewaehlten Bereiche
- Cleanup: 7/14/30/60

Invalidate the status cache:
```bash
rm -f /tmp/nano-status-cache
```

### Step 7: Confirm

Show the applied configuration summary:
```
NaNo Konfiguration aktualisiert:
  Level: medium
  Threshold: 3
  Focus: delegation_patterns, quality_patterns
  Cleanup: 30 Tage
```
