# Credits Research - Inspirationsprojekte

**Erstellt:** 2026-01-23
**Zweck:** Referenzdokument für die Credits-Sektion in der Projektdokumentation

## Verifizierte Projekte

### 1. Agent OS

| | |
|---|---|
| **URL** | https://github.com/buildermethods/agent-os |
| **Autor** | Brian Casel / Builder Methods |
| **Lizenz** | MIT |
| **Status** | Aktiv, URL verifiziert |

**Was wir übernommen haben:**

Das Konzept des 3-Layer Context Models stammt von Agent OS. Die Idee, Kontext in drei
Schichten zu organisieren - Standards (HOW: Konventionen und Patterns), Product (WHAT/WHY:
Mission und Roadmap), und Specs (WHAT NEXT: Feature-Spezifikationen) - gibt Agents eine
strukturierte Wissensbasis. Zusaetzlich hat uns das Prinzip des "Spec-Driven Development"
inspiriert, bei dem gut dokumentierte Standards die KI-gestuetzte Code-Generierung leiten.

---

### 2. Roo Code

| | |
|---|---|
| **URL** | https://github.com/RooCodeInc/Roo-Code |
| **Typ** | VS Code Extension |
| **Status** | Aktiv, URL verifiziert |

**Was wir übernommen haben:**

Die Multi-Agent Orchestration Patterns von Roo Code waren Vorbild für unsere
Agent-Architektur. Roo Code setzt auf spezialisierte Modi (Code, Architect, Ask, Debug),
die jeweils eigene Zugriffsrechte und Verantwortlichkeiten haben - genau dieses Muster
haben wir mit unseren 7 Agents übernommen (Architect=READ-ONLY, Debug=FULL, etc.).
Das Konzept, dass Agents nicht simultan, sondern sequentiell mit definierten Handoffs
arbeiten, stammt ebenfalls aus diesem Projekt.

---

### 3. Claude Code

| | |
|---|---|
| **URL** | https://github.com/anthropics/claude-code |
| **Autor** | Anthropic |
| **Typ** | CLI Tool |
| **Status** | Aktiv, URL verifiziert |

**Was wir übernommen haben:**

Claude Code ist die Plattform und Runtime, auf der unser gesamtes Multi-Agent System
laeuft. Als agentic CLI-Tool versteht es die Codebase, fuehrt Befehle aus und ermoeglicht
natuerlichsprachliche Interaktion mit dem Entwicklungsprozess. Unsere Agent-Definitionen
(in `.claude/agents/`) und Custom Commands (in `.claude/commands/`) nutzen direkt die
Erweiterungsmechanismen von Claude Code, um spezialisierte Workflows zu realisieren.

---

### 4. Context7

| | |
|---|---|
| **URL** | https://github.com/upstash/context7 |
| **Autor** | Upstash |
| **Typ** | MCP Server |
| **Status** | Aktiv, URL verifiziert |

**Was wir übernommen haben:**

Das MCP-Server-Konzept von Context7 hat uns inspiriert, wie man aktuelle Dokumentation
in den KI-Kontext injiziert. Context7 loest das Problem veralteter Trainingsdaten, indem
es versionsspezifische Bibliotheksdokumentation direkt in den LLM-Prompt einbettet. Dieses
Prinzip der kontextbezogenen Wissensbereitstellung spiegelt sich in unserem Standards-
Injection-Mechanismus wider, der relevante Konventionen basierend auf dem aktuellen
Entwicklungskontext bereitstellt.

---

## Zusammenfassung

| Projekt | Inspiration | Umsetzung bei uns |
|---------|-------------|-------------------|
| Agent OS | 3-Layer Context Model | `workflow/standards/`, `workflow/product/`, `workflow/specs/` |
| Roo Code | Spezialisierte Agent-Modi | 7 Agents mit definierten Rollen und Zugriffsrechten |
| Claude Code | CLI-basierte Agent-Plattform | `.claude/agents/` und `.claude/commands/` Erweiterungen |
| Context7 | Kontextuelle Dokumentations-Injection | Standards-Injection basierend auf Entwicklungskontext |

## Hinweise

- Alle URLs wurden am 2026-01-23 verifiziert und sind erreichbar
- Diese Datei dient als Referenz für die Credits-Sektion in README.md und anderen Dokumenten
- Bei Verwendung in der Dokumentation bitte die Beschreibungen als Basis nehmen und ggf. kuerzen
