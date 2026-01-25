# NaNo Learning Status

Zeigt den aktuellen Status des projektbasierten Lernsystems mit actionable Insights.

## Process

### Step 1: Check Configuration

Read the file `.claude/nano.local.md` and verify:
- Is learning enabled?
- What observation level is configured?
- Which focus areas are active?

If the file doesn't exist, inform the user that NaNo is not configured and offer `/workflow:nano-toggle` to set it up.

### Step 2: Gather Metrics

Check these locations for current data:

1. **Observations**: Count files in `workflow/nano/observations/`
2. **Current Session**: Find and read the most recent session file for live data
3. **Patterns**: Read active patterns from:
   - `workflow/nano/patterns/delegation-patterns.md`
   - `workflow/nano/patterns/quality-patterns.md`
   - `workflow/nano/patterns/standards-usage.md`
4. **Evolution Candidates**: Count files in `workflow/nano/evolution/candidates/`

### Step 3: Present Actionable Status

Display a summary with insights, not just raw numbers:

```
NaNo Learning Status
=====================

Status: enabled | Level: medium | Threshold: 3

📊 Metriken
  Sessions: N beobachtete Sessions
  Patterns: N erkannte Muster
  Candidates: N ausstehende Reviews

📈 Insights
  - [Insight basierend auf den Daten]
  - [z.B. "builder wird 80% fuer implementation gewaehlt - starkes Pattern!"]
  - [z.B. "Noch 1 Beobachtung bis zum naechsten Pattern (architect→architecture)"]
  - [z.B. "3 neue Sessions seit letzter Analyse - Background-Analyse laeuft"]

🎯 Top Patterns
  1. builder → implementation (12x)
  2. architect → architecture (5x)
  3. researcher → research (4x)

⏳ Fast-Patterns (kurz vor Erkennung)
  - security → security: 2/3
  - devops → infrastructure: 2/3
```

### Insight-Generation Rules

Generate insights based on the data:

1. **Dominant Agent**: If one agent has >60% of delegations → "Agent X dominiert mit Y% aller Delegationen"
2. **Near Threshold**: If a combination is 1 away from threshold → "Noch 1 Beobachtung bis Pattern: X→Y"
3. **Unused Agents**: If agents have 0 delegations → "Agents ohne Nutzung: X, Y"
4. **Candidate Backlog**: If candidates >3 → "N Candidates warten auf Review - empfohlen: /workflow:review-candidates"
5. **Stale Data**: If newest session is >7 days old → "Letzte Beobachtung vor N Tagen - System lernt nur bei aktiver Nutzung"
6. **Pattern Growth**: Compare pattern count to session count → "Pattern-Rate: 1 Pattern pro N Sessions"

### Step 4: Offer Quick Actions

Use AskUserQuestion with header "Aktion":

Options:
1. "Patterns im Detail" - Zeigt die vollstaendigen Pattern-Dateien
2. "Review Candidates" - Wechselt zu /workflow:review-candidates
3. "Aktuelle Session" - Wechselt zu /workflow:nano-session
4. "Konfiguration aendern" - Wechselt zu /workflow:nano-config
