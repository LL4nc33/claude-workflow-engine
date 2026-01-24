---
name: hook-patterns
description: Hook-System Dokumentation und Patterns. Verwende bei hook, automation, PreToolUse, PostToolUse, SessionStart, event-driven
---

# Hook-System - Patterns und Referenz

## Implementierte Hooks

### 1. SessionStart Hook

**Datei:** `hooks/scripts/session-start.sh`
**Event:** `SessionStart`
**Timeout:** 30 Sekunden (ADR-003: einmalig pro Session, darf laenger dauern)

**Funktion:**
- Prueft ob `workflow/standards/index.yml` existiert und aktuell ist
- Prueft ob `workflow/product/mission.md` vorhanden ist
- Erkennt aktive Spezifikationen (in-progress Status)
- Zaehlt verfuegbare Standards
- Bereinigt abgelaufene Cache-Eintraege (TTL: 1h)
- Gibt Workflow-Kontext als `additionalContext` zurueck

**Output-Format:**
```json
{
  "hookSpecificOutput": {
    "additionalContext": "Claude Workflow Engine v0.2.5 (6-Layer Plugin) | Produkt-Mission vorhanden. | Aktive Spezifikation: feature-xyz."
  }
}
```

### 2. PreToolUse Hook (Write-Validierung)

**Datei:** `hooks/scripts/pre-write-validate.sh`
**Event:** `PreToolUse`
**Matcher:** Write, Edit Tools
**Timeout:** 15 Sekunden (ADR-003: Security-Check darf nicht zu hastig sein)

**Funktion:**
- Prueft ob das Schreibziel gegen Secrets-Patterns matcht
- Blockiert: `.env`, `.env.*`, `credentials.*`, `secrets.*`, `*.local.md`
- Erlaubt alle anderen Dateien

**Output-Format:**
```json
// Erlaubt
{"permissionDecision": "allow"}

// Blockiert
{"permissionDecision": "deny", "reason": "Schreibzugriff auf .env blockiert: Umgebungsvariablen-Datei (Secrets-Schutz)"}
```

### 3. PostToolUse Hook (Aenderungs-Logging)

**Datei:** `hooks/scripts/post-write-log.sh`
**Event:** `PostToolUse`
**Matcher:** Write, Edit Tools
**Timeout:** 5 Sekunden

**Funktion:**
- Loggt nur bei aktiver Orchestrierung (spec mit in-progress Status)
- Schreibt Dateiname + UTC-Zeitstempel in `delegation.log`
- Ignoriert `*.local.md` Dateien (GDPR)
- Erstellt Log-Datei falls nicht vorhanden

**Log-Format:**
```
# Delegation Log - feature-xyz
# Format: timestamp | file
2026-01-23T14:30:00Z | src/controllers/auth.ts
2026-01-23T14:31:15Z | src/models/user.ts
```

## Hook-Konfiguration

Die Hook-Definitionen stehen in `hooks/hooks.json`:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.sh",
      "timeout": 30000
    },
    {
      "event": "PreToolUse",
      "matcher": {"tool_name": ["Write", "Edit"]},
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-write-validate.sh",
      "timeout": 15000
    },
    {
      "event": "PostToolUse",
      "matcher": {"tool_name": ["Write", "Edit"]},
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-write-log.sh",
      "timeout": 5000
    }
  ]
}
```

## Neuen Hook hinzufuegen

### 1. Script erstellen

```bash
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Hook-Logik hier
# Input kommt via stdin (JSON) bei PreToolUse/PostToolUse

# Output als JSON auf stdout
echo '{"hookSpecificOutput": {"additionalContext": "..."}}'
```

### 2. In hooks.json registrieren

```json
{
  "event": "EventName",
  "matcher": {"tool_name": ["ToolName"]},
  "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/my-hook.sh",
  "timeout": 5000
}
```

### 3. Executable machen

```bash
chmod +x hooks/scripts/my-hook.sh
```

## Verfuegbare Events

| Event | Trigger | Input | Erwarteter Output |
|-------|---------|-------|-------------------|
| `SessionStart` | Session-Beginn | - | `hookSpecificOutput.additionalContext` |
| `PreToolUse` | Vor Tool-Aufruf | Tool-Input (JSON) | `permissionDecision: allow/deny` |
| `PostToolUse` | Nach Tool-Aufruf | Tool-Input (JSON) | Optional |
| `Stop` | Session-Ende | - | Optional |
| `SubagentStop` | Agent-Ende | - | Optional |
| `Notification` | Benachrichtigung | Notification-Daten | Optional |

## Shared Utilities (common.sh)

| Funktion | Beschreibung |
|----------|--------------|
| `get_project_root` | Projekt-Root ermitteln |
| `get_active_spec` | Aktive Spezifikation finden |
| `json_escape` | String fuer JSON escapen |
| `is_secrets_path` | Pruefen ob Pfad ein Secret ist |
| `init_cache` | Cache-Verzeichnis erstellen |
| `is_cache_fresh` | Cache-Freshness pruefen (mtime-basiert) |
| `read_cache` | Cached Content lesen |
| `write_cache` | Content in Cache schreiben |
| `clean_cache` | Abgelaufene Cache-Eintraege loeschen (TTL) |

## Debugging-Tipps

1. **Hook manuell testen:**
   ```bash
   echo '{"file_path": "/tmp/test.txt"}' | ./hooks/scripts/pre-write-validate.sh
   ```

2. **SessionStart testen:**
   ```bash
   ./hooks/scripts/session-start.sh
   ```

3. **Fehler finden:**
   - Pruefe ob Scripts executable sind (`ls -la hooks/scripts/`)
   - Pruefe Timeout (SessionStart: 30s, PreToolUse: 15s, PostToolUse: 5s)
   - Pruefe JSON-Output-Format (muss valides JSON sein)
   - Teste mit `bash -x hooks/scripts/my-hook.sh` fuer Trace-Output
   - Siehe `workflow/ERROR-RECOVERY.md` fuer haeufige Probleme

4. **WSL2-Kompatibilitaet:**
   - Verwende `#!/usr/bin/env bash` (nicht `#!/bin/bash`)
   - Verwende `stat -c %Y` mit Fallback auf `stat -f %m` (macOS)
   - Vermeide Windows-Pfade in Variablen
