# Error Recovery Playbook

Strategies for recovering from common workflow failures. Reference this when a workflow gets stuck.

## Common Failure Scenarios

### 1. Standards-Index veraltet

**Symptom:** SessionStart Hook meldet "Standards-Index veraltet"
**Ursache:** Standard-Datei wurde geaendert aber Index nicht aktualisiert
**Recovery:**
```
/workflow:index-standards
```

### 2. Spec-Phase schlaegt fehl

**Symptom:** `/write-spec` oder `/shape-spec` erzeugt unvollstaendige Ausgabe
**Ursache:** Fehlende Prerequisites oder unklare Anforderungen
**Recovery:**
1. Pruefen ob `workflow/product/mission.md` existiert
2. Pruefen ob `shape.md` im Spec-Ordner vollstaendig ist
3. Phase mit zusaetzlichem Kontext wiederholen:
   - Fehlende Informationen in shape.md ergaenzen
   - Dann `/workflow:write-spec` erneut ausfuehren

### 3. Task-Delegation schlaegt fehl

**Symptom:** Agent-Delegation gibt Fehler zurueck oder laeuft in Timeout
**Ursache:** Context-Overflow, fehlende Permissions, ungueltige Dateiverweise
**Recovery:**
1. **Context-Overflow:** Task in kleinere Sub-Tasks aufteilen
2. **Permission-Fehler:** Pruefen ob Agent die noetige Access-Stufe hat (siehe CLAUDE.md)
3. **Timeout:** Task-Beschreibung vereinfachen, weniger Standards injizieren
4. **File-Not-Found:** Relativen Pfad pruefen, Projekt-Root verifizieren

### 4. Quality-Gate blockiert

**Symptom:** Workflow pausiert nach Gate-Failure
**Ursache:** Architektur- oder Security-Checks nicht bestanden
**Recovery:**
1. Gate-Ausgabe lesen (welche Checks fehlgeschlagen)
2. Remediation-Tasks erstellen fuer fehlgeschlagene Checks
3. Tasks ausfuehren und Gate erneut triggern
4. Bei Blockade: User-Override mit Begruendung moeglich

### 5. Hook-Timeout

**Symptom:** "Hook timed out" Fehlermeldung
**Ursache:** Script-Ausfuehrung dauert zu lange
**Recovery:**
- SessionStart: Timeout ist 30s - sollte reichen. Falls nicht: `workflow/standards/` auf ueberfluessige Dateien pruefen
- PreToolUse: Timeout ist 15s - falls jq nicht installiert: `sudo apt install jq`
- PostToolUse: Unkritisch (Fire-and-forget) - Timeout-Fehler ignorierbar

### 6. Orchestration steckt fest

**Symptom:** `/orchestrate-tasks` macht keinen Fortschritt
**Ursache:** Zirkulaere Abhaengigkeiten oder fehlende Task-Voraussetzungen
**Recovery:**
1. `tasks.md` pruefen auf korrekte Abhaengigkeits-Reihenfolge
2. `progress.md` Status pruefen: welche Tasks sind blockiert?
3. Manuelle Task-Ausfuehrung fuer blockierende Tasks
4. Dann Orchestration fortsetzen

### 7. Standards-Injection liefert irrelevante Standards

**Symptom:** Agent erhaelt falsche/zu viele Standards
**Ursache:** Tags in index.yml passen nicht zum Task-Kontext
**Recovery:**
1. `workflow/standards/index.yml` Tags pruefen
2. Task-Tags mit Standard-Tags abgleichen
3. Ggf. Tags in index.yml anpassen und `/workflow:index-standards` ausfuehren

## Auto-Recovery-Regeln

Die Workflow-Engine versucht automatisch:

| Fehlertyp | Auto-Recovery | Max Retries |
|-----------|---------------|-------------|
| Task-Failure | Re-Delegation mit mehr Context | 2 |
| Gate-Failure | Remediation-Task erstellen | 2 Zyklen |
| Agent-Unavailable | Fallback-Agent (siehe orchestration.yml) | 1 |
| Context-Overflow | Completed-Tasks summarisieren | 1 |
| Timeout | Retry ohne Aenderung | 1 |

## Praeventive Massnahmen

1. **Vor dem Workflow starten:** `/workflow:index-standards` ausfuehren
2. **Spec-Qualitaet:** Shape-Phase nicht ueberhasten, klare Anforderungen sammeln
3. **Task-Granularitaet:** Tasks sollten <30min Arbeit representieren
4. **Standards-Hygiene:** Unbenutzte Standards archivieren oder loeschen
5. **Regel-Massige Pruefung:** Standards-Index-Freshness beachten (SessionStart-Warnung)
