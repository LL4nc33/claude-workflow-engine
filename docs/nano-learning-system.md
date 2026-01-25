# NaNo Learning System

Das NaNo Learning System ist ein projektbasiertes Lernsystem, das Workflow-Patterns beobachtet und aus der Nutzung lernt. Es wurde nach **Nala & Nino** benannt und basiert auf dem [Homunculus-Konzept](https://github.com/humanplane/homunculus).

## Inhaltsverzeichnis

1. [Warum NaNo](#warum-nano)
2. [Was ist NaNo](#was-ist-nano)
3. [Wie funktioniert es](#wie-funktioniert-es)
4. [Architektur-Entscheidungen](#architektur-entscheidungen)
5. [Datenfluss](#datenfluss)
6. [Verfuegbare Commands](#verfuegbare-commands)
7. [Konfiguration](#konfiguration)
8. [Hooks-Integration](#hooks-integration)
9. [Projekt-Isolation](#projekt-isolation)
10. [GDPR-Compliance](#gdpr-compliance)
11. [Troubleshooting](#troubleshooting)
12. [Beispiele](#beispiele)
13. [How-Tos](#how-tos)

---

## Implementierungsstatus

> **Wichtig:** Nicht alle dokumentierten Features sind aktuell implementiert. Diese Sektion zeigt den aktuellen Stand.

### Aktuell funktionsfaehig

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Delegation Observations | Implementiert | Agent-Delegationen werden erfasst und in Session-TOON gespeichert |
| Pattern Detection | Implementiert | Erkennung von Agent-Task-Kombinationen ueber Threshold |
| Evolution Candidates | Implementiert | Automatische Generierung bei hoher Konfidenz |
| GDPR Cleanup | Implementiert | Automatische Loeschung alter Sessions |

### Geplant / Nicht implementiert

| Feature | Status | Erklaerung |
|---------|--------|------------|
| Quality Gate Observations | Nicht implementiert | Erfordert Quality-Gate-Hook-Integration |
| Standards Injection Tracking | Nicht implementiert | Erfordert Standards-Injection-Hook |
| `auto_evolution` Config | Geplant | Automatische Anwendung von Candidates (aktuell immer manuell) |

Die Quality- und Standards-Observations sind in `pattern-rules.yml` definiert, aber die entsprechenden Hooks zum Erfassen dieser Events existieren noch nicht.

---

## Warum NaNo

### Das Problem

Die Claude Workflow Engine ist ein maechtige Multi-Agent-System, aber ohne Lernen wiederholen sich ineffiziente Muster:

**1. Context-Verschwendung**
Ohne Lernsystem delegiert Claude bei aemhlicher Fragestellung jedes Mal identische Standards, fuehrt dieselben Explorationen durch, und verbraucht Context-Tokens fuer bereits bekannte Entscheidungen.

```
Session 1: "Implementiere Login" -> Standards-Lookup -> Agent-Wahl -> Implementation
Session 2: "Implementiere Logout" -> Standards-Lookup -> Agent-Wahl -> Implementation
                                     ^^^^^^^^^^^^^^    ^^^^^^^^^^^
                                     Identische Schritte, kein Lerneffekt
```

**2. Wiederkehrende Fehler**
Wenn ein Quality Gate wiederholt an derselben Stelle fehlschlaegt, gibt es ohne Pattern-Erkennung keine Moeglichkeit, das systemisch zu adressieren.

**3. Manuelle Optimierung**
Ohne Daten muessen Optimierungen an `orchestration.yml` oder Standards auf Vermutungen basieren. Mit NaNo sind Entscheidungen datengetrieben.

### Die Loesung

NaNo beobachtet Nutzungsmuster und generiert daraus **Evolution Candidates** - konkrete Vorschlaege zur Verbesserung der Workflow-Konfiguration:

- Welche Agent-Task-Kombinationen funktionieren gut?
- Welche Quality Gates schlagen systematisch fehl?
- Welche Standards werden effektiv genutzt?

Diese Insights werden **niemals automatisch angewendet**, sondern erfordern manuelles Review. Der Mensch bleibt in der Kontrolle.

---

## Was ist NaNo

NaNo (Nano-Homunculus) ist ein lokales Lernsystem, das die Nutzung der Claude Workflow Engine beobachtet und daraus Muster ableitet. Anders als das originale Homunculus-Konzept, das auf persoenliches Lernen ausgerichtet ist, fokussiert sich NaNo auf **Projekt-Lernen**:

- **Welche Agents** werden fuer welche Aufgaben gewaehlt?
- **Welche Patterns** wiederholen sich im Projekt?
- **Welche Standards** werden effektiv genutzt?
- **Welche Quality Gates** schlagen regelmaessig fehl?

Das Ziel ist es, aus beobachteten Mustern **Evolution Candidates** zu generieren - Vorschlaege zur Verbesserung der Orchestration-Konfiguration oder zur Erstellung neuer Standards.

### Namensgebung

Der Name **NaNo** stammt von den Katzen Nala und Nino, die als Inspiration fuer das System dienten. "Nano" verweist gleichzeitig auf die minimale, leichtgewichtige Natur des Systems - es beobachtet im Hintergrund ohne merkliche Performance-Einbussen.

---

## Wie funktioniert es

NaNo arbeitet in einem 4-Stufen-Zyklus:

```
Session --> Observation --> Pattern --> Evolution Candidate
```

### 1. Session

Jede Claude-Session erhaelt eine eindeutige ID. Alle Beobachtungen einer Session werden in einer TOON-Datei gesammelt:

```
workflow/nano/observations/session-20260125-131559.toon
```

Beispielinhalt:
```
session: 20260125-131559
started: 2026-01-25T13:17:31+01:00
level: medium
count: 2
observations:
  2026-01-25T13:17:31+01:00 | delegation | agent=explainer,task_group=explanation
  2026-01-25T13:22:34+01:00 | delegation | agent=builder,task_group=implementation
```

### 2. Observation

Observations werden bei bestimmten Events erfasst:

| Event | Was wird erfasst |
|-------|-----------------|
| Agent-Delegation (Task-Tool) | Agent-Typ, Task-Group, optional Beschreibung |
| Quality Gate | Gate-Name, Ergebnis (pass/fail) |
| Standards-Injection | Welche Standards injiziert wurden |

Die Detailtiefe haengt vom konfigurierten `observation_level` ab:
- **minimal**: Nur Agent-Typ und Task-Group
- **medium**: Agent, Task-Group, Outcome (Standard)
- **comprehensive**: Zusaetzlich Task-Beschreibung (80 Zeichen)

### 3. Pattern Detection

Am Ende jeder Session (Stop-Hook) analysiert NaNo die Observations und erkennt Patterns:

**Delegation Patterns:**
- Welche Agent-Task-Kombinationen treten haeufig auf?
- Ab dem konfigurierten Threshold (Standard: 3) gilt ein Pattern als erkannt

Beispiel aus `workflow/nano/patterns/delegation-patterns.md`:
```markdown
### Agent-Task Combinations (threshold: 3+)

| Count | Agent | Task Group |
|-------|-------|-----------|
| 4 | explainer | explanation |
| 3 | builder | implementation |
```

**Quality Patterns:**
- Welche Gates schlagen regelmaessig fehl?
- Systemische Probleme erkennen

**Standards Patterns:**
- Welche Standards werden oft genutzt?
- Korrelation zwischen Standards und Task-Erfolg

### 4. Evolution Candidates

Wenn ein Pattern eine hohe Konfidenz erreicht (Standard: 5+ Beobachtungen), wird automatisch ein **Evolution Candidate** generiert:

```yaml
# workflow/nano/evolution/candidates/delegation-20260125.yml
type: orchestration_update
confidence: high
source: delegation-patterns
suggestion: |
  The following agent-task combinations show strong patterns
  and may benefit from explicit orchestration rules.

patterns:
  - agent: builder
    task_group: implementation
    occurrences: 12

proposed_change:
  target: workflow/orchestration.yml
  section: task_groups
  action: validate_or_add_mapping
```

Evolution Candidates werden **niemals automatisch angewendet**. Sie erfordern manuelles Review via `/workflow:review-candidates`.

---

## Architektur-Entscheidungen

### Warum TOON-Format?

**Problem:** JSON-Dateien verbrauchen viele Tokens wenn sie in den Context geladen werden.

**Loesung:** [TOON](https://github.com/toon-format/toon) ist ein token-optimiertes Format das ~40% kompakter als JSON ist, aber weiterhin menschenlesbar bleibt.

```
# JSON (95 Zeichen)
{"session":"20260125","count":3,"observations":[{"type":"delegation","agent":"builder"}]}

# TOON (58 Zeichen, ~39% weniger)
session: 20260125
count: 3
observations:
  delegation | agent=builder
```

Vorteile:
- Weniger Tokens = mehr Context fuer eigentliche Arbeit
- Menschenlesbar (kein Parsing noetig zum Debuggen)
- Einfach zu parsen mit Standard-Unix-Tools (grep, awk, sed)

### Warum flock-basiertes Locking?

**Problem:** Mehrere Hooks koennen gleichzeitig auf dieselbe Session-Datei schreiben (z.B. zwei parallele Task-Delegationen).

**Loesung:** File-Locking mit `flock` garantiert atomare Schreiboperationen.

```bash
(
  flock -w 2 200 || return 0  # 2s Timeout, skip if locked
  # ... Schreiboperationen ...
) 200>"${SESSION_FILE}.lock"
```

Vorteile:
- **Atomicity:** Keine korrupten Dateien durch Race Conditions
- **Timeout:** 2s Wartezeit, danach graceful Skip (kein Hang)
- **O(1) Writes:** Counter im Header statt Line-Count bei jedem Write
- **Lock-Files:** Sichtbar fuer Debugging (`session-*.toon.lock`)

### Warum inkrementelle Analyse?

**Problem:** Bei vielen Sessions waere Full-Scan bei jedem Stop-Hook zu langsam.

**Loesung:** Analyse nur fuer Sessions die neuer als die Pattern-Datei sind.

```bash
# Nur Sessions analysieren die neuer als delegation-patterns.md sind
new_sessions=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" \
  -newer "${PATTERNS_DIR}/delegation-patterns.md")
```

Vorteile:
- **Performance:** O(n) nur fuer neue Sessions, nicht O(total)
- **Idempotent:** Mehrfaches Ausfuehren aendert nichts
- **Append-Only:** Bestehende Patterns werden erweitert, nicht ueberschrieben

### Warum lokale Verarbeitung?

**Problem:** Cloud-basierte Analyse wuerde GDPR-Compliance erschweren.

**Loesung:** Alle Analysen laufen lokal via Bash-Skripte.

Vorteile:
- **GDPR-konform:** Keine Daten verlassen den Rechner
- **Offline-faehig:** Funktioniert ohne Netzwerk
- **Keine Abhaengigkeiten:** Nur Bash, grep, awk, sed (auf jedem Unix-System)

---

## Datenfluss

Das folgende Diagramm zeigt den kompletten NaNo-Datenfluss:

```mermaid
flowchart TD
    subgraph "Hooks Layer"
        A[SessionStart Hook] -->|Initialisiert Session-ID| B[Session-File erstellen]
        C[PostToolUse Hook] -->|Task Tool Event| D[nano-observer.sh delegation]
        E[Stop Hook] -->|Session Ende| F[nano-observer.sh analyze]
    end

    subgraph "Observation Layer"
        D -->|flock-atomic| G[Session-TOON schreiben]
        G -->|agent, task_group| H[(observations/session-*.toon)]
    end

    subgraph "Analysis Layer"
        F -->|Incremental| I{Neue Sessions?}
        I -->|Ja| J[Pattern-Aggregation]
        I -->|Nein| K[Skip]
        J -->|grep + awk| L[Delegation Patterns]
        J -->|grep + awk| M[Quality Patterns]
        J -->|grep + awk| N[Standards Patterns]
    end

    subgraph "Evolution Layer"
        L --> O{Threshold >= 5?}
        M --> O
        N --> O
        O -->|Ja| P[Evolution Candidate erstellen]
        O -->|Nein| Q[Warten auf mehr Daten]
        P --> R[(evolution/candidates/*.yml)]
    end

    subgraph "Review Layer"
        R --> S[/workflow:review-candidates]
        S --> T{User-Entscheidung}
        T -->|Approve| U[orchestration.yml aktualisieren]
        T -->|Defer| V[Candidate behalten]
        T -->|Reject| W[Candidate loeschen]
        U --> X[evolution-log.md]
    end

    style H fill:#e1f5fe
    style R fill:#fff3e0
    style X fill:#e8f5e9
```

### Datenfluss im Detail

1. **SessionStart:** Generiert eindeutige Session-ID, speichert in `/tmp/claude-current-session-id`

2. **Task-Delegation:** PostToolUse Hook feuert, extrahiert `subagent_type` aus JSON, schreibt TOON-Observation

3. **Session-Ende:** Stop Hook triggert inkrementelle Analyse
   - Findet Sessions neuer als Pattern-Dateien
   - Aggregiert Counts mit grep/awk
   - Aktualisiert Pattern-Markdown-Dateien

4. **Evolution Check:** Bei Pattern-Count >= Threshold
   - Generiert YAML-Candidate mit Vorschlag
   - Speichert in `evolution/candidates/`

5. **Review:** User fuehrt `/workflow:review-candidates` aus
   - Sieht Pattern-Details und vorgeschlagene Aenderung
   - Entscheidet: Approve/Defer/Reject
   - Approved Changes werden protokolliert

---

## Verfuegbare Commands

### /workflow:nano-toggle

Schaltet NaNo ein oder aus.

**Optionen bei aktivem NaNo:**
1. Deaktivieren - Setzt `enabled: false`
2. Status anzeigen - Zeigt aktuelle Metriken

**Optionen bei inaktivem NaNo:**
1. Aktivieren - Setzt `enabled: true`
2. Aktivieren + Konfigurieren - Startet zusaetzlich die Konfiguration

Bei erstmaliger Aktivierung wird die Verzeichnisstruktur angelegt und `nano.local.md` erstellt.

### /workflow:nano-config

Interaktive Konfiguration des NaNo-Systems. Fragt nacheinander ab:

1. **Observation Level**: minimal / medium / comprehensive
2. **Pattern Threshold**: 2 (aggressiv) / 3 (standard) / 5 (konservativ)
3. **Focus Areas**: delegation_patterns, quality_patterns, standards_effectiveness
4. **Cleanup Period**: 7 / 14 / 30 / 60 Tage

### /workflow:nano-session

Zeigt die Observations der aktuellen Session in lesbarer Form:

```
NaNo Session (started 13:17)
------------------------------
13:17:31  explainer -> explanation
13:22:34  builder -> implementation
------------------------------
2 observations | level: medium | threshold: 2/3 until pattern
```

Bietet Quick-Actions:
1. Analyse jetzt ausfuehren
2. Vollstaendigen Status
3. Fertig

### /workflow:nano-reset

Setzt NaNo-Daten zurueck. Optionen:

1. **Alles zuruecksetzen** - Observations, Patterns UND Evolution Candidates
2. **Nur Observations** - Session-Dateien loeschen, Patterns behalten
3. **Nur Candidates** - Evolution Candidates loeschen
4. **Abbrechen**

**ACHTUNG:** Diese Aktion ist unwiderruflich!

### /workflow:homunculus-status

Zeigt den aktuellen NaNo-Status mit actionable Insights:

```
NaNo Learning Status
=====================

Status: enabled | Level: medium | Threshold: 3

Metriken
  Sessions: 7 beobachtete Sessions
  Patterns: 2 erkannte Muster
  Candidates: 0 ausstehende Reviews

Insights
  - explainer dominiert mit 40% aller Delegationen
  - builder -> implementation: starkes Pattern (3x)
  - Noch 2 Beobachtungen bis Pattern: architect -> architecture

Top Patterns
  1. explainer -> explanation (4x)
  2. builder -> implementation (3x)
```

Quick-Actions:
1. Patterns im Detail
2. Review Candidates
3. Aktuelle Session
4. Konfiguration aendern

### /workflow:learning-report

Generiert einen umfassenden Bericht ueber die Lernfortschritte:

- **Executive Summary**: Gesamtueberblick
- **Delegation Insights**: Agent-Nutzung, Top-Matches, Verbesserungsmoeglichkeiten
- **Quality Gate Analysis**: Pass-Raten, systemische Probleme
- **Standards Effectiveness**: Wirksamste Standards, untergenutzte Standards
- **Evolution History**: Alle bisherigen Promotions
- **Recommendations**: Datenbasierte Empfehlungen

### /workflow:review-candidates

Interaktives Review der Evolution Candidates:

Fuer jeden Candidate:
1. Zeigt Pattern-Details und vorgeschlagene Aenderung
2. Fragt nach Entscheidung:
   - **Approve**: Aenderung anwenden
   - **Defer**: Fuer spaeter aufheben
   - **Reject**: Candidate loeschen
   - **Modify**: Anpassen vor Anwendung

Approved Candidates werden in `evolution-log.md` protokolliert.

---

## Konfiguration

### nano.local.md Format

Die Konfiguration liegt in `.claude/nano.local.md` (automatisch gitignored):

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
```

### Konfigurationsfelder

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `enabled` | boolean | true | NaNo aktiv/inaktiv |
| `observation_level` | string | medium | Detailtiefe: minimal, medium, comprehensive |
| `max_session_observations` | number | 1000 | Max. Observations pro Session (Speicherlimit) |
| `cleanup_after_days` | number | 30 | Session-Dateien aelter als X Tage loeschen (GDPR) |
| `pattern_detection_threshold` | number | 3 | Mindestwiederholungen fuer Pattern-Erkennung |
| `focus_areas` | array | alle | Welche Bereiche beobachtet werden |

### Focus Areas

| Area | Beobachtet | Status |
|------|-----------|--------|
| `delegation_patterns` | Welche Agents fuer welche Aufgaben gewaehlt werden | Implementiert |
| `quality_patterns` | Quality Gate Ergebnisse und Failure-Muster | Nicht implementiert |
| `standards_effectiveness` | Wie oft und wie effektiv Standards angewendet werden | Nicht implementiert |

> **Hinweis:** Aktuell wird nur `delegation_patterns` aktiv erfasst. Die anderen Focus Areas sind fuer zukuenftige Erweiterungen vorgesehen.

### Task-Group-Mapping

Bei der Erfassung von Delegations-Observations wird der Agent-Typ automatisch einer Task-Group zugeordnet:

| Agent | Task Group | Typische Aufgaben |
|-------|------------|-------------------|
| `builder` | `implementation` | Code schreiben, Bugs fixen, Tests |
| `architect` | `architecture` | System-Design, ADRs, API-Review |
| `security` | `security` | Audits, Vulnerability-Scans |
| `devops` | `infrastructure` | CI/CD, Docker, Kubernetes |
| `researcher` | `research` | Analyse, Dokumentation |
| `explainer` | `explanation` | Code-Erklaerungen, Walkthroughs |
| `quality` | `quality` | Test-Coverage, Quality Gates |
| `innovator` | `ideation` | Brainstorming, Alternativen |
| `guide` | `evolution` | NaNo-Patterns, Workflow-Verbesserung |
| `Explore` | `exploration` | Codebase-Exploration |
| (andere) | `other` | Fallback fuer unbekannte Agents |

Dieses Mapping ist in `nano-observer.sh` hardcoded und kann durch Anpassung der `case`-Statement geaendert werden.

### Threshold-Konzepte

NaNo verwendet zwei verschiedene Thresholds:

| Threshold | Konfiguration | Standard | Bedeutung |
|-----------|---------------|----------|-----------|
| **Pattern Detection** | `pattern_detection_threshold` in `nano.local.md` | 3 | Minimum-Wiederholungen damit eine Agent-Task-Kombination als "Pattern" erkannt und in `delegation-patterns.md` aufgenommen wird |
| **Candidate Generation** | `candidate_threshold` in `pattern-rules.yml` | 5 | Minimum-Wiederholungen damit ein Pattern als "Evolution Candidate" vorgeschlagen wird |

**Beispiel:** Bei den Standardwerten:
- Eine Kombination `builder -> implementation` erscheint nach 3 Beobachtungen in der Pattern-Datei
- Nach 5 Beobachtungen wird ein Evolution Candidate generiert

### pattern-rules.yml

Die Datei `workflow/nano/config/pattern-rules.yml` definiert erweiterte Pattern-Regeln:

```yaml
patterns:
  delegation_efficiency:
    trigger: task_completion
    threshold: 3
    fields: [agent, task_group, retry_count, outcome]

  quality_gate_insights:      # NOCH NICHT IMPLEMENTIERT
    trigger: gate_failure
    threshold: 2
    fields: [gate_name, failing_checks, agent_responsible]

  standards_effectiveness:    # NOCH NICHT IMPLEMENTIERT
    trigger: standards_injection
    threshold: 5
    fields: [standards_injected, task_group, outcome]

evolution:
  candidate_threshold: 5      # Fuer Evolution-Candidate-Generierung
  min_confidence: 0.7
  auto_generate: true         # Generiert Candidates, aber KEINE auto-apply
```

### Evolution Preferences (Geplant)

Zukuenftig ist geplant, folgende Optionen in `nano.local.md` zu unterstuetzen:

```yaml
evolution_preferences:
  auto_evolution: false       # Candidates automatisch anwenden (immer false aktuell)
  notify_on_candidate: true   # Benachrichtigung bei neuem Candidate
  min_confidence: 0.7         # Minimum-Konfidenz fuer Candidates
```

> **Aktueller Stand:** Diese Optionen sind noch nicht implementiert. Alle Candidates erfordern manuelles Review via `/workflow:review-candidates`.

---

## Hooks-Integration

NaNo nutzt drei Hooks fuer die Datenerfassung. Die Hooks sind in `.claude/settings.local.json` konfiguriert (nicht in `hooks/hooks.json` - diese Datei existiert nicht mehr).

### SessionStart Hook

Der SessionStart-Hook ist bewusst minimal gehalten:

```bash
#!/usr/bin/env bash
# SessionStart Hook - Absolute minimal, no output
echo "$(date +%Y%m%d-%H%M%S)" > "/tmp/claude-current-session-id" 2>/dev/null
exit 0
```

**Was er tut:**
- Generiert eine eindeutige Session-ID basierend auf Timestamp
- Schreibt die ID nach `/tmp/claude-current-session-id`
- Kein Output (vermeidet Hook-Timeout-Probleme)

**Was er NICHT tut (entgegen frueherer Dokumentation):**
- Zeigt keinen NaNo-Status an
- Triggert keine Background-Analyse
- Raeumt keinen Cache auf

Diese Funktionen wurden entfernt, um Hook-Timeouts zu vermeiden. Die Analyse erfolgt stattdessen im Stop-Hook.

### PostToolUse (Task) Hook

Erfasst Agent-Delegationen. Konfiguration in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/scripts/nano-observer.sh delegation"
          }
        ]
      }
    ]
  }
}
```

Der Hook:
1. Liest Tool-Input von stdin (Claude Hook Protocol)
2. Extrahiert `subagent_type` und `description`
3. Schreibt Observation atomar (flock-basiert, O(1))

### Stop Hook

Fuehrt Session-Analyse durch:

```bash
hooks/scripts/nano-observer.sh analyze
```

Der Analyse-Prozess:
1. Findet Sessions neuer als letzte Pattern-Datei (inkrementell)
2. Analysiert Delegation-, Quality- und Standards-Patterns
3. Aktualisiert Pattern-Dateien
4. Prueft auf Evolution Candidates
5. Raeumt alte Sessions auf (GDPR)

---

## Projekt-Isolation

### Lokale Daten

Alle NaNo-Daten bleiben lokal im Projekt:

```
workflow/nano/
  observations/          # Session-Dateien (TOON)
  patterns/              # Erkannte Muster (Markdown)
  evolution/
    candidates/          # Ausstehende Candidates (YAML)
    evolution-log.md     # Promotions-Historie
  config/
    pattern-rules.yml    # Pattern-Definitionen
```

### .gitignore

Observations und lokale Config werden nicht versioniert:

```gitignore
# NaNo Learning (GDPR: keine Session-Daten im Repo)
workflow/nano/observations/
.claude/nano.local.md
```

Pattern-Dateien und Evolution-Log **koennen** versioniert werden, da sie keine personenbezogenen Daten enthalten.

### Mehrere Projekte

Jedes Projekt hat sein eigenes NaNo-System. Learnings werden nicht zwischen Projekten geteilt. Das ermoeglicht:

- Projektspezifische Patterns
- Unterschiedliche Konfigurationen pro Projekt
- Keine Datenlecks zwischen Projekten

---

## GDPR-Compliance

NaNo wurde mit Datenschutz im Design entwickelt:

### Datensparsamkeit

- **Minimale Erfassung**: Nur Agent-Typ, Task-Group, optional 80 Zeichen Beschreibung
- **Keine PII**: Keine Benutzernamen, IP-Adressen oder andere personenbezogene Daten
- **Keine Cloud**: Alle Daten bleiben lokal (kein Sync, kein Upload)

### Automatische Bereinigung

Session-Dateien werden automatisch nach `cleanup_after_days` geloescht:

```bash
find workflow/nano/observations/ -name "session-*.toon" -mtime +30 -delete
```

Standard: 30 Tage. Konfigurierbar von 7 bis 60 Tagen.

### Manuelle Loeschung

Jederzeit moeglich via `/workflow:nano-reset`:

- Nur Observations loeschen
- Nur Candidates loeschen
- Alles zuruecksetzen

### Lokale Verarbeitung

Alle Analysen laufen lokal:

- Keine externen APIs
- Keine Cloud-Services
- Keine Telemetrie

### Transparenz

- Pattern-Dateien sind menschenlesbar (Markdown)
- Session-Dateien sind menschenlesbar (TOON)
- Konfiguration ist dokumentiert und einsehbar

---

## Troubleshooting

### Haeufige Probleme

#### 1. Keine Observations werden erfasst

**Symptome:**
- `workflow/nano/observations/` ist leer
- `/workflow:nano-session` zeigt keine Daten

**Moegliche Ursachen und Loesungen:**

| Ursache | Diagnose | Loesung |
|---------|----------|---------|
| NaNo nicht aktiviert | `grep "enabled:" .claude/nano.local.md` | `/workflow:nano-toggle` |
| Hook nicht konfiguriert | Pruefen ob `hooks.json` Task-Hook enthaelt | Hook-Konfiguration reparieren |
| Session-ID-Problem | Mehrere Session-Dateien pro Minute | `/tmp/claude-current-session-id` pruefen |
| Permission-Fehler | `ls -la workflow/nano/` | Verzeichnis-Rechte korrigieren |

#### 2. Hook-Timeout-Fehler

**Symptome:**
- "Hook timed out" Meldung
- Observations unvollstaendig

**Loesungen:**

```bash
# PostToolUse Hook Timeout (3s Standard)
# Problem: flock wartet zu lange
# Loesung: Lock-File manuell loeschen
rm workflow/nano/observations/*.lock

# Stop Hook Timeout (10s Standard)
# Problem: Zu viele Session-Dateien fuer Analyse
# Loesung: Alte Sessions manuell bereinigen
find workflow/nano/observations/ -name "session-*.toon" -mtime +7 -delete
```

#### 3. Pattern-Dateien werden nicht aktualisiert

**Symptome:**
- Observations vorhanden, aber `patterns/` leer oder veraltet
- Stop-Hook laeuft, aber keine Updates

**Diagnose:**
```bash
# Pruefen ob Sessions neuer als Patterns sind
ls -lt workflow/nano/observations/ | head -5
ls -lt workflow/nano/patterns/ | head -5

# Manuell Analyse triggern
hooks/scripts/nano-observer.sh analyze
```

**Loesungen:**

| Problem | Loesung |
|---------|---------|
| Threshold nicht erreicht | Threshold reduzieren via `/workflow:nano-config` |
| Pattern-Datei zu neu | Pattern-Datei loeschen, Analyse neu starten |
| Grep-Fehler | `grep "| delegation |"` manuell testen |

#### 4. Evolution Candidates werden nicht generiert

**Symptome:**
- Patterns vorhanden mit hohen Counts
- Keine Dateien in `evolution/candidates/`

**Loesung:**
```bash
# Pruefen ob Counts >= 5 (Candidate-Threshold)
grep "^|" workflow/nano/patterns/delegation-patterns.md | awk -F'|' '$2 >= 5'

# Candidate-Threshold in pattern-rules.yml anpassen
# evolution.candidate_threshold: 5  ->  3
```

#### 5. Lock-Dateien bleiben zurueck

**Symptome:**
- `.lock` Dateien haeufen sich an
- Observations werden uebersprungen

**Loesung:**
```bash
# Verwaiste Lock-Dateien entfernen (aelter als 1 Minute)
find workflow/nano/observations/ -name "*.lock" -mmin +1 -delete
```

### Debug-Modus

Fuer tiefere Analyse den Observer manuell mit Debug-Output ausfuehren:

```bash
# Delegation manuell testen
echo '{"subagent_type":"builder","description":"test task"}' | \
  bash -x hooks/scripts/nano-observer.sh delegation

# Analyse manuell mit Trace
bash -x hooks/scripts/nano-observer.sh analyze

# Status pruefen
hooks/scripts/nano-observer.sh status
```

### Kompletter Reset

Bei harnaeckigen Problemen: Kompletter Neustart:

```bash
# 1. NaNo deaktivieren
sed -i 's/enabled: true/enabled: false/' .claude/nano.local.md

# 2. Alle Daten loeschen
rm -rf workflow/nano/observations/*
rm -rf workflow/nano/patterns/*
rm -rf workflow/nano/evolution/candidates/*

# 3. Lock-Dateien entfernen
rm -f /tmp/nano-status-cache
rm -f /tmp/claude-current-session-id

# 4. NaNo reaktivieren
sed -i 's/enabled: false/enabled: true/' .claude/nano.local.md
```

---

## Beispiele

### Beispiel 1: Komplette Session-Observation

Eine typische Session mit mehreren Delegationen:

**Session-Datei** (`workflow/nano/observations/session-20260125-131559.toon`):
```
session: 20260125-131559
started: 2026-01-25T13:17:31+01:00
level: medium
count: 3
observations:
  2026-01-25T13:17:31+01:00 | delegation | agent=explainer,task_group=explanation
  2026-01-25T13:22:34+01:00 | delegation | agent=explainer,task_group=explanation
  2026-01-25T13:25:57+01:00 | delegation | agent=builder,task_group=implementation
```

**Interpretation:**
- Session-ID basiert auf Startzeit
- Level "medium" = Agent + Task-Group ohne Beschreibung
- Counter im Header fuer O(1) Count-Abfragen
- Pipe-separiertes Format fuer einfaches Parsing

### Beispiel 2: Erkanntes Delegation-Pattern

Nach mehreren Sessions zeigt die Pattern-Analyse:

**Pattern-Datei** (`workflow/nano/patterns/delegation-patterns.md`):
```markdown
# Delegation Patterns

Erkannte Muster bei Agent-Delegation und Task-Zuordnung.

## Active Patterns

### Agent-Task Combinations (threshold: 3+)

| Count | Agent | Task Group |
|-------|-------|-----------|
| 4 | builder | implementation |
| 4 | explainer | explanation |

### Agent Usage

- **builder**: 4 delegations
- **explainer**: 4 delegations
- **security**: 1 delegations
- **researcher**: 1 delegations
- **architect**: 1 delegations

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | 11 |
| Patterns Detected | 2 |
| Last Updated | 2026-01-25T13:26:04+01:00 |
```

**Interpretation:**
- 2 Patterns erkannt (Count >= 3)
- `builder -> implementation` und `explainer -> explanation` sind die dominanten Kombinationen
- 11 Observations gesamt, verteilt auf 5 verschiedene Agents

### Beispiel 3: Evolution Candidate

Wenn ein Pattern 5+ Mal auftritt, wird ein Candidate generiert:

**Candidate-Datei** (`workflow/nano/evolution/candidates/delegation-20260125.yml`):
```yaml
# Evolution Candidate: Delegation Optimization
# Generated: 2026-01-25T14:30:00+01:00
# Status: pending_review

type: orchestration_update
confidence: high
source: delegation-patterns
suggestion: |
  The following agent-task combinations show strong patterns
  and may benefit from explicit orchestration rules.

patterns:
  - agent: builder
    task_group: implementation
    occurrences: 7
  - agent: explainer
    task_group: explanation
    occurrences: 6

proposed_change:
  target: workflow/orchestration.yml
  section: task_groups
  action: validate_or_add_mapping
```

**Interpretation:**
- Automatisch generiert bei Count >= 5
- Status `pending_review` = wartet auf `/workflow:review-candidates`
- Vorgeschlagene Aenderung: Task-Group-Mappings in orchestration.yml validieren

### Beispiel 4: Quality Gate Pattern

Bei wiederholten Gate-Failures:

**Pattern-Datei** (`workflow/nano/patterns/quality-patterns.md`):
```markdown
# Quality Patterns

Erkannte Muster bei Quality Gate Ergebnissen.

## Active Patterns

### Gate Failure Frequency (threshold: 3+)

- **security-audit**: 4 failures
- **test-coverage**: 3 failures

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | 12 |
| Patterns Detected | 2 |
| Last Updated | 2026-01-25T15:00:00+01:00 |
```

**Interpretation:**
- Security-Audit Gate schlaegt systematisch fehl
- Moegliche Aktion: Security-Standards verstaerken oder Agent-Konfiguration anpassen

### Beispiel 5: Approved Evolution

Nach Review wird ein Candidate approved:

**Evolution-Log** (`workflow/nano/evolution/evolution-log.md`):
```markdown
# Evolution Log

Tracks all pattern promotions and standard evolutions.

| Date | Pattern | Action | Confidence | Target |
|------|---------|--------|------------|--------|
| 2026-01-25 | builder -> implementation (7x) | approved | high | orchestration.yml |
| 2026-01-25 | explainer -> explanation (6x) | approved | high | orchestration.yml |
```

**Interpretation:**
- Beide Patterns wurden approved und in orchestration.yml uebernommen
- Confidence "high" = basiert auf 5+ Beobachtungen
- Log dient als Audit-Trail fuer alle Evolution-Entscheidungen

---

## How-Tos

### How-To: Manuelle Analyse ausfuehren

Die Pattern-Analyse laeuft normalerweise automatisch beim Session-Ende (Stop-Hook). Fuer manuelle Ausfuehrung:

```bash
# 1. Ins Projekt-Verzeichnis wechseln
cd /pfad/zum/projekt

# 2. Analyse manuell starten
./hooks/scripts/nano-observer.sh analyze

# 3. Ergebnisse pruefen
cat workflow/nano/patterns/delegation-patterns.md
```

**Mit Debug-Output:**

```bash
# Voller Trace fuer Fehlersuche
bash -x ./hooks/scripts/nano-observer.sh analyze
```

**Status pruefen:**

```bash
./hooks/scripts/nano-observer.sh status
```

Output:
```yaml
nano:
  enabled: true
  level: medium
  sessions: 7
  patterns: 2
  candidates: 0
  threshold: 3
  cleanup_days: 30
```

### How-To: pattern-rules.yml anpassen

Die Pattern-Regeln in `workflow/nano/config/pattern-rules.yml` definieren, wann Patterns erkannt und Candidates generiert werden.

**1. Threshold fuer Pattern-Erkennung senken:**

```yaml
patterns:
  delegation_efficiency:
    threshold: 2    # War: 3, jetzt aggressiver
```

**2. Candidate-Threshold anpassen:**

```yaml
evolution:
  candidate_threshold: 3    # War: 5, generiert frueher Candidates
```

**3. Neues Pattern definieren (erfordert Code-Aenderung):**

Um ein neues Pattern zu tracken, muss zusaetzlich zur `pattern-rules.yml` auch der entsprechende Hook implementiert werden. Beispiel fuer ein hypothetisches "Error-Pattern":

```yaml
patterns:
  error_patterns:
    trigger: error_occurrence
    threshold: 2
    fields: [error_type, agent, context]
```

> **Wichtig:** Das Definieren in `pattern-rules.yml` allein reicht nicht. Der Observer-Code muss entsprechende Events erfassen.

**4. Confidence-Schwelle fuer Candidates aendern:**

```yaml
evolution:
  min_confidence: 0.5    # War: 0.7, akzeptiert unsicherere Patterns
```

### How-To: Task-Group-Mapping erweitern

Um einen neuen Agent oder ein anderes Mapping hinzuzufuegen, editiere `hooks/scripts/nano-observer.sh`:

```bash
# Suche die case-Anweisung in handle_delegation()
case "${agent_type}" in
  builder) task_group="implementation" ;;
  architect) task_group="architecture" ;;
  # ...
  # Neuer Agent:
  my_new_agent) task_group="my_new_group" ;;
  *) task_group="other" ;;
esac
```

### How-To: Observation-Level aendern

Das `observation_level` bestimmt, wie viel Detail erfasst wird:

```bash
# Via Command (interaktiv)
# Fuehre /workflow:nano-config aus und waehle Level

# Oder direkt in nano.local.md:
# Oeffne .claude/nano.local.md und aendere:
observation_level: comprehensive    # War: medium
```

| Level | Erfasste Daten | Speicherverbrauch |
|-------|----------------|-------------------|
| `minimal` | Nur Agent + Task-Group | Niedrig |
| `medium` | Agent + Task-Group + Outcome | Mittel |
| `comprehensive` | + 80 Zeichen Task-Beschreibung | Hoeher |

---

## Siehe auch

- [Workflow Guide](workflow.md) - Hauptdokumentation der Workflow Engine
- [Plattform-Architektur](plattform-architektur.md) - Hook-System und Event-basierte Automatisierung
- [Error Recovery](../workflow/ERROR-RECOVERY.md) - Fehlerbehebung bei Hook-Timeouts
- [Homunculus](https://github.com/humanplane/homunculus) - Original-Konzept fuer persoenliches Lernen
