# Development Log

Chronologische Dokumentation von Debugging-Sessions, Bugfixes und technischen Erkenntnissen.

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
