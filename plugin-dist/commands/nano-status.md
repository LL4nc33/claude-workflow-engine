---
description: NaNo Learning Status - Actionable Insights und Quick-Actions
interactive: true
---

# NaNo Learning Status

Zeigt den aktuellen Lern-Status des NaNo-Systems mit actionable Insights.

## Important Guidelines

- Always use AskUserQuestion for user interaction
- Show compact, actionable information
- Offer quick-actions based on current state

## Process

### Step 1: Check NaNo Status

Run the status command:

```bash
$CLAUDE_PROJECT_DIR/hooks/scripts/nano-observer.sh status
```

Parse the YAML output for:
- `enabled` - Ist NaNo aktiv?
- `sessions` - Anzahl beobachteter Sessions
- `patterns` - Erkannte Muster
- `candidates` - Pending Evolution-Candidates
- `ideas` - Gesammelte Ideen
- `tracking.delegations` - Delegation-Beobachtungen
- `tracking.standards` - Standards-Usage
- `tracking.quality_gates` - Gate-Ergebnisse

### Step 2: Present Status

Format the output as:

```
NaNo Learning Status
====================

Enabled: {enabled}
Level: {level}

Sessions: {sessions} | Patterns: {patterns} | Candidates: {candidates} | Ideas: {ideas}

Tracking:
- Delegations: {delegations}
- Standards: {standards}
- Quality Gates: {quality_gates}

{Insights basierend auf Daten}
```

### Step 3: Generate Insights

Based on the data, generate 1-3 insights:

**Wenn candidates > 0:**
> "{candidates} Evolution-Candidates warten auf Review. Nutze `/workflow:review-candidates`."

**Wenn patterns > 5:**
> "Starke Muster erkannt. Das System lernt deine Arbeitsweise."

**Wenn sessions > 10 und patterns == 0:**
> "Viele Sessions aber keine Muster. Threshold erhoehen? `/workflow:nano-config`"

**Wenn ideas > 3:**
> "{ideas} Ideen gesammelt. Zeit fuer Review?"

### Step 4: Offer Quick Actions

Use AskUserQuestion with context-appropriate options:

```yaml
options:
  - "Review Candidates" # wenn candidates > 0
  - "Patterns anzeigen" # wenn patterns > 0
  - "Ideen anzeigen"    # wenn ideas > 0
  - "Config aendern"
  - "Schliessen"
```

## Related Commands

- `/workflow:nano-toggle` - Ein/Ausschalten
- `/workflow:nano-config` - Konfiguration aendern
- `/workflow:nano-session` - Aktuelle Session-Details
- `/workflow:nano-idea` - Idee sammeln
- `/workflow:review-candidates` - Candidates reviewen
- `/workflow:learning-report` - Ausfuehrlicher Report
