# Development Log

Chronologische Dokumentation von Debugging-Sessions, Bugfixes und technischen Erkenntnissen.

---

## 2026-01-26: CWE Convenience-Layer - Natuerliche Sprachentwicklung

### Problem

CWE hatte funktionierende Komponenten (Agents, Standards, Hooks), aber diese arbeiteten nicht "logisch und intuitiv" zusammen:
- Neue User wurden direkt an builder delegiert statt Workflow-Setup anzubieten
- Komplexe Features (Auth) wurden ohne Klaerungsfragen gebaut
- Deutsche Fehler-Patterns ("funktioniert nicht") wurden nicht erkannt
- Context (Standards, Code) wurde nicht automatisch vor Delegation injiziert
- Keyword-Mappings waren zwischen orchestration.yml und common.sh inkonsistent

User-Feedback: "es muss wirklich alles logisch und intuitiv funktionieren" und "user sollten per natuerlicher sprache entwickeln koennen".

### Analyse

**End-to-End Szenario-Tests:**

| Szenario | Erwartung | Realitaet vor Fix |
|----------|-----------|-------------------|
| Neuer User: "Baue Todo-App" | Workflow-Setup anbieten | Direkt an builder delegiert |
| "Fuege Auth hinzu" | Fragen: OAuth/JWT/Session? | Keine Klaerung, einfach gebaut |
| "Login funktioniert nicht" | Als Bug erkannt → builder | Pattern nicht erkannt |
| "Wie funktioniert Auth?" | → explainer | Funktionierte bereits |

**Gap-Analyse durch researcher Agent:**
- 5 fehlende Komponenten identifiziert
- 6 existierende aber nicht getriggerte Features
- 3 manuelle Interventionen die automatisch sein sollten
- 2 Redundanzen (Keyword-Mappings, Intent-Patterns)
- 2 Inkonsistenzen (DE/EN Patterns, Standards-Injection)

### Root Cause

Fehlende "Convenience-Layer" zwischen User-Intent und Agent-Execution:
1. **Kein Pre-Delegation Context** - Standards/Code wurden nicht automatisch gesammelt
2. **Keine First-Run Erkennung** - System unterschied nicht zwischen neuem und bestehendem Projekt
3. **Unvollstaendige Pattern-Erkennung** - Deutsche Umgangssprache nicht abgedeckt
4. **Keine Feature-Scoping Logik** - Komplexe Features wurden nicht hinterfragt

### Loesung

**Pre-Delegation Context-Injection (PreToolUse Hook):**
- `hooks/scripts/pre-delegation-context.sh` - Neuer Hook
- Extrahiert Keywords aus Task-Prompt
- Injiziert matching Standards automatisch
- Scannt relevante Code-Files (Top-3)
- Fuegt Architecture-Context bei Design-Tasks hinzu

**First-Run Guard:**
- CLAUDE.md erweitert unter "Delegation Decision Rules"
- Wenn kein `workflow/` Verzeichnis: Frage nach Quick/Smart/Direkt
- Verhindert dass neue User ohne Setup losbauen

**Feature-Scoping:**
- Komplexe Features triggern Klaerungsfragen
- Auth: OAuth/JWT/Session?
- Database: SQL/NoSQL? ORM?
- UI: Eigene Komponenten/Library?

**Bilingual Pattern-Erkennung:**
- orchestration.yml erweitert mit deutschen Patterns
- "funktioniert nicht|geht nicht|kaputt|fehler" → builder
- "erklaer|wie funktioniert" → explainer
- common.sh injiziert "debug" Keyword bei Problem-Indikatoren

**Keyword-Sync:**
- common.sh hat jetzt SYNC WITH Kommentare
- Verweist auf orchestration.yml als Single Source of Truth

### Gelernte Lektionen

1. **User-Flows end-to-end testen** - Einzelne Komponenten koennen funktionieren, aber nicht zusammen
2. **Convenience ist kein Nice-to-have** - Wenn User manuell intervenieren muss, ist das System unvollstaendig
3. **Bilingual von Anfang an** - Deutsche User nutzen deutsche Umgangssprache
4. **Pre-Delegation ist kritisch** - Context muss VOR der Delegation da sein, nicht waehrenddessen

### Betroffene Dateien

**Neue Dateien:**
- `hooks/scripts/pre-delegation-context.sh` - Context-Injection Hook

**Modifizierte Dateien:**
- `.claude/CLAUDE.md` - First-Run Guard, Feature-Scoping Rules, Hook-Tabelle (7 Hooks)
- `workflow/orchestration.yml` - auto_context Section, bilingual Patterns, Error-Patterns
- `hooks/scripts/common.sh` - extract_keywords() mit Problem-Indikatoren, SYNC Kommentare
- `hooks/hooks.json` - PreToolUse Hook fuer Task registriert
- `.claude/skills/workflow/auto-delegation/SKILL.md` - Context-Injection dokumentiert

### Metriken

| Metrik | Wert |
|--------|------|
| Analysierte Dateien | 18 |
| Identifizierte Gaps | 12 |
| Implementierte Fixes | 8 |
| Neue Hooks | 1 |
| Erweiterte Patterns | 15+ |

---

## 2026-01-26: CWE Gap-Fixes - Agent-First Enforcement und Auto-Documentation

### Problem

CLAUDE.md dokumentierte Features die technisch nicht enforced waren:
- Auto-Delegation nur als Text, kein Skill der Intent erkennt
- Agent-First nur Warning, kein konfigurierbarer Block
- Quality Gates definiert aber nicht enforced
- Keine automatische Dokumentation nach Task-Completion

User-Feedback: "der mainchat sollte nur todolist anzeigen und delegieren, editing sollte isoliert passieren" und "es muss automatisch/entgegenkommend sein".

### Analyse

1. **Standards-System existiert** - `workflow/standards/` mit index.yml vorhanden aber unvollstaendig
2. **Agent-Conventions Standard** - Enthielt keine Enforcement-Rules
3. **Hooks vorhanden** - pre-write-validate.sh warnte nur, blockierte nicht konfigurierbar
4. **Keine Completion-Triggers** - Session endete ohne Dokumentations-Empfehlung

Hypothese: Skills werden nicht automatisch getriggert weil Description-Keywords fehlen. Standards existieren aber werden nicht als Single Source of Truth genutzt - CLAUDE.md dupliziert alles inline.

### Root Cause

Disconnect zwischen Dokumentation und Enforcement:
- CLAUDE.md beschrieb Verhalten das nicht technisch erzwungen wurde
- Standards waren unvollstaendig (kein Agent-First Enforcement, kein Completion-Workflow)
- Kein Hook der nach Session-Ende Dokumentation empfiehlt
- Redundanz zwischen CLAUDE.md und Standards fuehrte zu Drift

### Loesung

**Phase 1-3: Skills fuer proaktive Guidance**
- `auto-delegation/SKILL.md` - Intent-to-Agent Mapping mit PROACTIVELY Keywords
- `planning/SKILL.md` - EnterPlanMode Trigger fuer Planungsaufgaben
- `quality-gates/SKILL.md` - 4-Gate Checklisten

**Phase 4: Agent-First Enforcement**
- `pre-write-validate.sh` erweitert mit `get_agent_first_mode()`
- Konfigurierbar via `nano.local.md`: `enforcement: warn|block|off`

**Phase 5: Standards erweitert**
- `agent-conventions.md` - Agent-First Enforcement Rules, Write Permission Matrix
- `completion-workflow.md` (NEU) - Verification, Documentation Triggers, NaNo Recording

**Phase 6: Auto-Devlog Hook**
- `session-stop.sh` (NEU) - Empfiehlt `/workflow:devlog` bei >3 Aenderungen
- Registriert in hooks.json als Stop-Event

**Phase 7: Redundanz reduziert**
- CLAUDE.md von 406 auf 349 Zeilen (-14%)
- Verweise auf Standards statt inline-Duplikation
- `toon-format.md` (NEU) - TOON-Regeln als eigener Standard extrahiert

### Gelernte Lektionen

1. **Standards als Single Source of Truth** - CLAUDE.md sollte verweisen, nicht duplizieren
2. **Enforcement > Documentation** - Features muessen technisch erzwungen werden, nicht nur beschrieben
3. **Hooks fuer Automation** - Session-Ende ist der richtige Zeitpunkt fuer Dokumentations-Reminder
4. **Agent-First konsequent** - Main Chat sollte wirklich NUR orchestrieren, auch bei "kleinen" Tasks

### Betroffene Dateien

**Neue Dateien:**
- `.claude/skills/workflow/auto-delegation/SKILL.md`
- `.claude/skills/workflow/planning/SKILL.md`
- `.claude/skills/workflow/quality-gates/SKILL.md`
- `.claude/skills/workflow/cwe-principles/SKILL.md`
- `.claude/commands/workflow/nano-idea.md`
- `.claude/commands/workflow/nano-status.md`
- `hooks/scripts/session-stop.sh`
- `hooks/scripts/gate-check.sh`
- `workflow/standards/agents/completion-workflow.md`
- `workflow/standards/global/toon-format.md`
- `workflow/standards/frontend/design-tokens.md`

**Modifizierte Dateien:**
- `.claude/CLAUDE.md` - Redundanz reduziert, Standards-Referenzen
- `workflow/standards/agents/agent-conventions.md` - Enforcement Rules
- `workflow/standards/index.yml` - Neue Standards registriert
- `workflow/orchestration.yml` - Version 0.2.9
- `workflow/config.yml` - Version 0.2.9
- `.claude-plugin/plugin.json` - Version 0.2.9
- `hooks/hooks.json` - Neue Hooks registriert
- `hooks/scripts/pre-write-validate.sh` - Agent-First Mode
- `hooks/scripts/common.sh` - to_toon() Funktion
- `hooks/scripts/session-start.sh` - check_pending_gates()
- `hooks/scripts/nano-observer.sh` - handle_idea(), analyze_ideas()
- `.gitignore` - .claude/state/, workflow/nano/ideas/
- Alle 25 `/workflow:*` Commands - Frontmatter hinzugefuegt

---

## 2026-01-25: /workflow:devlog Command

### Problem

Nach Debugging-Sessions fehlte eine einfache Moeglichkeit, die Erkenntnisse zu dokumentieren. Manuelles Schreiben von Devlog-Eintraegen ist aufwaendig und wird oft vergessen.

### Analyse

Verschiedene Ansaetze wurden diskutiert:
- **Hook-basiert**: Automatische Erkennung von Debugging-Patterns bei SessionEnd
- **NaNo-Integration**: Beobachtung von Debugging-Sessions wie bei Delegations
- **Semi-automatisch**: Command mit Session-Analyse
- **Memento-Pattern**: Checkpoints bei jedem Fix

### Root Cause

Kein technisches Problem - Feature-Request fuer bessere Developer Experience.

### Loesung

Pragmatischster Ansatz: **Session-aware Command**

`/workflow:devlog` analysiert die aktuelle Konversation und extrahiert automatisch:
- Problem/Fehlermeldungen
- Debugging-Schritte und Hypothesen
- Root Cause
- Loesung und geaenderte Dateien

Kein manuelles Schreiben noetig - ein Command, fertig dokumentiert.

### Betroffene Dateien

- `.claude/commands/workflow/devlog.md` - Neuer Command
- `.claude/CLAUDE.md` - Command in Convenience-Tabelle hinzugefuegt
- `docs/devlog.md` - Devlog-Datei erstellt

---

## 2026-01-25: SessionStart:resume Hook Error

### Problem

Bei Session-Wiederaufnahme (`claude --resume`, `/resume`) erschien der Fehler:
```
SessionStart:resume hook error
```

Direkte Script-Tests zeigten keine Fehler - das Script lief lokal einwandfrei.

### Analyse

**SessionStart Event-Varianten in Claude Code:**

| Source | Trigger |
|--------|---------|
| `startup` | Neue Session |
| `resume` | `--resume`, `--continue`, `/resume` |
| `clear` | `/clear` Befehl |
| `compact` | Auto/manuelle Kompression |

**stdin-Format von Claude Code:**
```json
{
  "session_id": "abc123",
  "hook_event_name": "SessionStart",
  "source": "resume",
  "cwd": "/path/to/project",
  "transcript_path": "..."
}
```

### Debugging-Prozess

1. **Hypothese 1: stdin nicht konsumiert** - Hook-Script las stdin nicht
   - Fix-Versuch: `cat > /dev/null &` (Hintergrund)
   - Ergebnis: Fehler blieb

2. **Hypothese 2: stdin synchron lesen**
   - Fix-Versuch: `read -t 1 -d '' _stdin`
   - Ergebnis: Fehler blieb

3. **Hypothese 3: timeout cat**
   - Fix-Versuch: `timeout 1 cat > /dev/null`
   - Ergebnis: Fehler blieb

4. **Debug-Logging hinzugefuegt**
   ```bash
   DEBUG_LOG="/tmp/session-start-debug.log"
   echo "=== $(date) ===" >> "$DEBUG_LOG"
   STDIN_DATA=$(timeout 1 cat 2>/dev/null || true)
   echo "stdin: $STDIN_DATA" >> "$DEBUG_LOG"
   ```
   - Ergebnis: Log-Datei wurde NICHT erstellt bei Fehler!

5. **Erkenntnis:** Script wurde gar nicht ausgefuehrt wenn Fehler auftrat

6. **hooks/hooks.json Format geprueft**
   - Altes Format (Array-basiert) war inkompatibel
   - Konvertierung ins neue Plugin-Format mit verschachtelten Objekten

7. **Doppelte Hook-Definition entdeckt**
   - `hooks/hooks.json` (Plugin-Format)
   - `.claude/settings.local.json` (Settings-Format)
   - Beide definierten SessionStart-Hook!

### Root Cause

**Doppelte Hook-Registrierung** verursachte Konflikte:
- Plugin-Hooks aus `hooks/hooks.json`
- Settings-Hooks aus `.claude/settings.local.json`

Claude Code fuehrte beide parallel aus, was bei `resume`-Events zu Race-Conditions oder Deduplizierungs-Fehlern fuehrte.

### Loesung

1. **`hooks/hooks.json`** - Ins korrekte Plugin-Format konvertiert:
   ```json
   {
     "description": "Claude Workflow Engine Hooks",
     "hooks": {
       "SessionStart": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/scripts/session-start.sh",
               "timeout": 30
             }
           ]
         }
       ]
     }
   }
   ```

2. **`.claude/settings.local.json`** - Hooks-Sektion komplett entfernt

3. **Single Source of Truth:** Alle Hooks nur noch in `hooks/hooks.json`

### Gelernte Lektionen

1. **Hook-Formate unterscheiden sich:**
   - Plugin-Format (`hooks/hooks.json`): Verschachtelte Objekte mit `type`, `command`
   - Settings-Format (`.claude/settings*.json`): Aehnlich aber separat geladen

2. **Debugging-Strategie fuer Hooks:**
   - Debug-Logging ins Script einbauen
   - Wenn Log nicht erstellt wird: Problem liegt VOR Script-Ausfuehrung
   - Doppelte Definitionen pruefen

3. **Environment-Variablen:**
   - `$CLAUDE_PROJECT_DIR` - Projekt-Root (fuer beide Formate)
   - `${CLAUDE_PLUGIN_ROOT}` - Plugin-Verzeichnis (nur Plugin-Format)

### Betroffene Dateien

- `hooks/hooks.json` - Format-Konvertierung
- `.claude/settings.local.json` - Hooks entfernt
- `.claude/hooks/scripts/session-start.sh` - stdin-Handling (Nebeneffekt)

### Referenzen

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [GitHub Issue #13650](https://github.com/anthropics/claude-code/issues/13650) - SessionStart stdout Bug (behoben in v2.0.76)

---

## 2026-01-25: Background-Task Notification fehlt (ISSUE)

### Problem

Background-Task Notification kam nicht im Main Chat an. Agent a77fde9 (Interaktivitaets-Regeln dokumentieren) lief als Background-Task und hat seine Arbeit erfolgreich abgeschlossen (Edit wurde angewendet), aber die task-notification erreichte nie den Main Chat.

Main Chat musste manuell den Output pruefen um festzustellen, dass der Task fertig war.

### Impact

- Untergraebt das Background-Agent-Konzept
- Main Chat wartet moeglicherweise ewig auf Notifications die nie kommen
- Kann zu verlorener Arbeit fuehren wenn man nicht manuell prueft
- Bricht das asynchrone Workflow-Modell

### Analyse

**Beobachtete Symptome:**
- Agent lief erfolgreich im Hintergrund
- Edit-Operation wurde korrekt durchgefuehrt
- Keine Notification im Main Chat
- Manueller TaskOutput-Check zeigte erfolgreichen Abschluss

**Vermutete Ursachen:**
1. **Race-Condition im Claude Code Notification-System** - Agent completed schneller als Notification-Pipeline registriert
2. **Agent crashed nach Edit aber vor Notification** - Erfolgreicher Edit, aber Cleanup/Exit-Handler fehlgeschlagen
3. **Notification-Queue overflow oder dropped message** - Bei hoher Last
4. **IPC-Kanal-Problem** - Message verloren zwischen Agent-Prozess und Main Chat

### Root Cause

**Noch nicht identifiziert** - Issue dokumentiert zur weiteren Beobachtung.

### Workaround

1. **Bei kritischen Tasks:** TaskOutput manuell pruefen nach erwartetem Abschluss
2. **Oder synchron statt Background arbeiten** fuer wichtige Operationen
3. **Timeout setzen:** Nach erwarteter Task-Dauer manuell Status checken

### Status

**OPEN** - Beobachtung laeuft. Weitere Vorkommnisse hier dokumentieren.

### Betroffene Dateien

- Keine Code-Aenderungen (Issue-Dokumentation)

### Referenzen

- Agent ID: a77fde9
- Task: "Interaktivitaets-Regeln dokumentieren"

---

## Template fuer neue Eintraege

```markdown
## YYYY-MM-DD: Kurztitel

### Problem
[Beschreibung des Problems]

### Analyse
[Untersuchungsschritte]

### Root Cause
[Eigentliche Ursache]

### Loesung
[Durchgefuehrte Aenderungen]

### Gelernte Lektionen
[Was wir fuer die Zukunft mitnehmen]

### Betroffene Dateien
- [Liste der geaenderten Dateien]
```
