---
name: mcp-usage
description: MCP Tool-Katalog und Nutzungsanleitung. Verwende bei semantic code analysis, symbol navigation, PR review, MCP, Serena, Greptile
---

# MCP Tools - Nutzungsanleitung

## Verfügbare MCP-Server

### Serena (Semantic Code Analysis)

Serena bietet semantische Code-Navigation und -Manipulation über den Language Server.

| Tool | Funktion | Typischer Einsatz |
|------|----------|-------------------|
| `get_symbols_overview` | Symbole in einer Datei auflisten | Dateistruktur verstehen |
| `find_symbol` | Symbol per Name-Pfad finden | Klasse/Methode lokalisieren |
| `find_referencing_symbols` | Referenzen auf ein Symbol finden | Abhaengigkeiten tracken |
| `replace_symbol_body` | Symbol-Body ersetzen | Praezise Code-Aenderungen |
| `search_for_pattern` | Regex-Suche in der Codebase | Pattern-Erkennung |
| `insert_after_symbol` | Code nach einem Symbol einfuegen | Neue Methoden hinzufuegen |
| `insert_before_symbol` | Code vor einem Symbol einfuegen | Imports hinzufuegen |
| `rename_symbol` | Symbol codebase-weit umbenennen | Refactoring |
| `read_file` | Datei lesen (mit Zeilenbereich) | Kontext holen |

#### Beispiele

```
# Alle Methoden einer Klasse finden
find_symbol(name_path_pattern="MyClass", depth=1, include_body=False)

# Wer ruft diese Methode auf?
find_referencing_symbols(name_path="MyClass/myMethod", relative_path="src/service.ts")

# Überblick über Dateistruktur
get_symbols_overview(relative_path="src/controllers/auth.ts", depth=1)

# Methode ersetzen
replace_symbol_body(name_path="MyClass/myMethod", relative_path="src/service.ts", body="...")
```

### Greptile (PR & Code Review)

Greptile bietet Zugriff auf Pull Requests, Code Reviews und Review-Kommentare.

| Tool | Funktion | Typischer Einsatz |
|------|----------|-------------------|
| `list_merge_requests` | PRs auflisten | Offene Arbeit pruefen |
| `get_merge_request` | PR-Details abrufen | PR-Kontext verstehen |
| `list_merge_request_comments` | PR-Kommentare auflisten | Review-Feedback lesen |
| `search_greptile_comments` | Review-Kommentare durchsuchen | Pattern in Feedback finden |
| `trigger_code_review` | Code Review ausloesen | Automatische Reviews |
| `list_custom_context` | Custom Context auflisten | Org-weite Regeln pruefen |
| `create_custom_context` | Custom Context erstellen | Neue Review-Regeln |

#### Beispiele

```
# Offene PRs pruefen
list_merge_requests(state="open")

# PR-Details mit Review-Status
get_merge_request(name="owner/repo", remote="github", defaultBranch="main", prNumber=42)

# Security-Kommentare in Reviews suchen
search_greptile_comments(query="authentication vulnerability")
```

## Agent-Tool-Matrix

| Agent | Serena-Tools | Greptile-Tools |
|-------|-------------|----------------|
| **architect** | find_symbol, get_symbols_overview, find_referencing_symbols | - |
| **researcher** | search_for_pattern, find_symbol, get_symbols_overview | - |
| **debug** | find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview | - |
| **ask** | get_symbols_overview, find_symbol | - |
| **security** | - | search_greptile_comments, list_merge_request_comments |
| **orchestrator** | - | list_merge_requests, get_merge_request |
| **devops** | - | - |

## Wann MCP-Tools statt Standard-Tools?

| Situation | Standard-Tool | MCP-Tool (besser) |
|-----------|---------------|-------------------|
| "Wo wird X aufgerufen?" | Grep | find_referencing_symbols |
| "Welche Methoden hat Klasse Y?" | Read (ganze Datei) | find_symbol + depth=1 |
| "Ersetze Methode Z" | Edit (String-Match) | replace_symbol_body |
| "Benenne Variable um" | Grep + Edit | rename_symbol |
| "Dateistruktur verstehen" | Read (ganze Datei) | get_symbols_overview |
| "Offene PRs?" | Bash(gh pr list) | list_merge_requests |

## Voraussetzungen

MCP-Tools sind nur verfügbar wenn die entsprechenden Server konfiguriert sind:
- **Serena:** Erfordert `.serena/` Konfiguration im Projekt
- **Greptile:** Erfordert Greptile-Account und API-Key

Falls ein MCP-Server nicht verfügbar ist, fallen Agents automatisch auf Standard-Tools zurück.
