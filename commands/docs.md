---
description: Dokumentationen auf BookStack hochladen, erstellen und verwalten. Pages, Kapitel und Buecher per REST API.
allowed-tools: ["Bash", "AskUserQuestion", "Read", "Write", "Edit", "Glob"]
---

# CWE Docs — BookStack Dokumentations-Manager

Laedt Dokumentationen auf BookStack hoch und verwaltet Buecher, Kapitel und Pages.

**Usage:** `/cwe:docs <subcommand> [args]`

Nutze den `bookstack`-Skill fuer alle API-Details (Auth, Endpoints, curl-Snippets, Fehlerbehandlung).

## Konfiguration

Config aus `~/.claude/cwe.local.md` lesen (Abschnitt `bookstack:`).
Falls nicht vorhanden: AskUserQuestion nach URL und API-Token, dann in die Datei schreiben.

## Subcommands

### `upload <file>` (Default wenn Datei angegeben)

Laedt eine einzelne Markdown-Datei als BookStack-Page hoch.

**Ablauf:**
1. Datei lesen
2. Titel aus erstem `# H1`-Heading oder Dateiname bestimmen
3. AskUserQuestion: "In welches Buch?" (bestehende Buecher auflisten + "Neu erstellen")
4. AskUserQuestion: "In welches Kapitel?" (optional — "Kein Kapitel" / "Neu erstellen")
5. Existenz pruefen → erstellen oder aktualisieren (Skill: bookstack)
6. Page-URL ausgeben

### `upload-dir <directory>`

Laedt alle `.md`-Dateien eines Verzeichnisses hoch.

**Ablauf:**
1. `.md`-Dateien finden
2. Gemeinsames Ziel-Buch und -Kapitel per AskUserQuestion festlegen
3. Alle Dateien sequenziell hochladen
4. Abschlussbericht: X erstellt, Y aktualisiert, Z Fehler

### `list`

Listet alle Buecher mit ID und Seitenanzahl auf.

### `create-book <name>`

Erstellt ein neues Buch. Fragt per AskUserQuestion nach optionaler Beschreibung.

### `create-chapter <book-id> <name>`

Erstellt ein neues Kapitel in einem Buch.

### `search <query>`

Volltext-Suche ueber Pages, Kapitel und Buecher.

### `delete <page-id>`

Loescht eine Page — **immer** mit AskUserQuestion bestaetigen.

## Ausgabe-Stil

- Erfolgreich: "Page `<title>` erstellt → <URL>"
- Aktualisiert: "Page `<title>` (ID: <id>) aktualisiert → <URL>"
- Buch erstellt: "Buch `<name>` erstellt (ID: <id>)"
- Batch: "3 Pages hochgeladen: 2 neu, 1 aktualisiert"
