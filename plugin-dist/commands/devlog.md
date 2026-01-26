---
description: Session-Dokumentation fuer Debugging und Fixes erstellen
interactive: true
---

# Devlog

Dokumentiert die aktuelle Session automatisch im strukturierten Devlog-Format.

**Usage:** `/workflow:devlog` - Analysiert Session und erstellt Eintrag

## Process

### Step 1: Session analysieren

Analysiere die aktuelle Konversation und extrahiere:

1. **Problem** - Was war das initiale Problem/die Aufgabe?
   - Fehlermeldungen
   - User-Beschreibung des Problems

2. **Analyse** - Welche Schritte wurden unternommen?
   - Hypothesen die getestet wurden
   - Tools die verwendet wurden (Read, Edit, Bash, etc.)
   - Fehlgeschlagene Versuche

3. **Root Cause** - Was war die eigentliche Ursache?
   - Die Erkenntnis die zum Fix fuehrte

4. **Loesung** - Was wurde geaendert?
   - Konkrete Fixes
   - Code-Aenderungen (kurz)

5. **Betroffene Dateien** - Welche Dateien wurden editiert?
   - Aus Edit/Write Tool-Aufrufen extrahieren

### Step 2: Devlog-Eintrag generieren

Erstelle einen Eintrag:

```markdown
## YYYY-MM-DD: [Kurztitel aus Problem abgeleitet]

### Problem
[Extrahiert aus Session]

### Analyse
[Debugging-Schritte, getestete Hypothesen]

### Root Cause
[Eigentliche Ursache]

### Loesung
[Durchgefuehrte Aenderungen]

### Betroffene Dateien
- file1.ext
- file2.ext
```

### Step 3: Devlog aktualisieren

1. Pruefe ob `docs/devlog.md` existiert
2. Falls nicht, erstelle mit Header:
   ```markdown
   # Development Log

   Chronologische Dokumentation von Debugging-Sessions, Bugfixes und technischen Erkenntnissen.

   ---
   ```
3. Fuege neuen Eintrag NACH dem `---` unter dem Header ein (neueste zuerst)
4. Bestaetigung: "Devlog-Eintrag erstellt: [Kurztitel]"

## Hinweise

- Halte Eintraege kompakt aber informativ
- Extrahiere nur relevante Details, keine Tool-Output-Dumps
- Bei mehreren Problemen in einer Session: Fokus auf das Hauptproblem
- Keine sensiblen Daten (Tokens, Credentials) dokumentieren
