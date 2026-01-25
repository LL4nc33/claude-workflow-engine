# Claude Workflow Engine

[![Version](https://img.shields.io/badge/version-0.2.8-blue.svg)](https://github.com/LL4nc33/claude-workflow-engine/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-purple.svg)](https://claude.com/claude-code)

Ein Multi-Agent Workflow-System für Claude Code: 7 spezialisierte Agenten, ein 5-Phasen Entwicklungsworkflow und ein Standards-System, das Konsistenz über Projekte hinweg sicherstellt.

---

## Highlights

| Stärke | Vorteil |
|--------|---------|
| **Context Isolation** | Agents arbeiten in isolierten Kontexten - Main Chat bleibt schlank |
| **Zero-Config Start** | `/workflow:smart-workflow` erkennt Phase automatisch |
| **DSGVO-Konform** | 100% lokal, keine Cloud-Sync, EU-Hosting-ready |
| **Token-Optimiert** | TOON-Format spart ~40% Tokens bei API-Responses |
| **Self-Learning** | NaNo beobachtet Patterns und schlägt Verbesserungen vor |
| **7 Spezialisten** | Jeder Agent hat klare Expertise statt "one size fits all" |

---

## Inhaltsverzeichnis

- [Highlights](#highlights)
- [Features](#features)
- [Schnellstart](#schnellstart)
- [Architektur](#architektur)
- [Projektstruktur](#projektstruktur)
- [Standards Commands](#standards-commands)
- [CLI Usage](#cli-usage)
- [Datenschutz](#datenschutz)
- [Use Cases](#use-cases)
- [Dokumentation](#dokumentation)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Features

### 7 Spezialisierte Agenten

| Agent | Rolle | Zugriff | Wann einsetzen |
|-------|-------|---------|----------------|
| **Architect** | System Design, ADRs, API Review | READ-ONLY | "Wie soll ich X architektonisch aufbauen?" |
| **Ask** | Erklärungen, Tutorials, Code Walkthroughs | READ-ONLY | "Wie funktioniert Y?" |
| **Debug** | Bug Investigation, Implementierung | FULL | "Finde und behebe diesen Bug" |
| **DevOps** | CI/CD, Docker, Kubernetes, IaC | FULL | "Richte CI/CD für mich ein" |
| **Orchestrator** | Task Delegation, Koordination | TASK-DELEGATION | "Verteile diese 10 Tasks" |
| **Researcher** | Codebase-Analyse, Dokumentation | READ-ONLY | "Was macht dieser Code?" |
| **Security** | OWASP Audits, Vulnerability Assessment | READ-ONLY | "Ist das sicher?" |

Jeder Agent hat klar definierte Zugriffsrechte und Spezialisierungen. Der Orchestrator delegiert Tasks an den jeweils passenden Agenten.

### Workflow-Optionen (Flexibel je nach Projektgröße)

#### 🚀 Quick-Mode (MVPs & kleine Features)
```bash
/workflow:quick              # 3-Step: Plan → Spec → Build
```

#### ⚡ Smart-Workflow (Auto-Detection)
```bash
/workflow:smart-workflow     # Erkennt Phase automatisch, führt durch Workflow
# Shortcuts: sw, q, h
```

#### 📋 Expliziter 5-Phasen-Workflow
```bash
/workflow:plan-product        # Phase 1: Produktvision und Mission definieren
/workflow:shape-spec          # Phase 2: Anforderungen strukturiert erfassen
/workflow:write-spec          # Phase 3: Technische Spezifikation erstellen
/workflow:create-tasks        # Phase 4: Tasks automatisch generieren
/workflow:orchestrate-tasks   # Phase 5: An Spezialisten-Agenten delegieren
```

#### 🛠️ Utilities
```bash
/workflow:help               # Kontextuelle Hilfe basierend auf aktuellem Status
/workflow:undo               # Git-basierte Workflow-Revertierung
/workflow:release            # Version Bump + Changelog + Git Tag
/workflow:web-setup          # Web-Access-Layer konfigurieren (Firecrawl, SearXNG)
/workflow:visual-clone       # Website-Design extrahieren
```

#### 🧠 NaNo Learning System
```bash
/workflow:nano-toggle        # NaNo ein/ausschalten + First-Run Setup
/workflow:homunculus-status  # Learning Status + Quick-Actions
/workflow:learning-report    # Umfassender Analyse-Report
/workflow:review-candidates  # Evolution-Candidates reviewen
```

NaNo beobachtet Workflow-Patterns und schlaegt Verbesserungen vor. Weitere Commands: `nano-session`, `nano-config`, `nano-reset`.

Der Workflow passt sich deiner Arbeitsweise an: Schnell für MVPs, vollständig für Production-Features.

### Standards System

- **11 Standards** in **7 Domänen** (Global, DevOps, Agents, API, Database, Frontend, Testing)
- **Automatische Injection** als Claude Code Skills - relevante Standards werden kontextbasiert geladen
- **Tag-basiertes Matching** - Standards werden anhand der Aufgabe automatisch angewendet
- **Erweiterbar** - eigene Standards für projektspezifische Konventionen

### Shortcuts & Auto-Features

- **Shortcuts**: `sw` (`/workflow:smart-workflow`), `q` (`/workflow:quick`), `h` (`/workflow:help`)
- **Auto-Delegation**: "Implementiere X" → automatisch an debug agent
- **Auto-Scope-Detection**: Keywords erkennen betroffene Dateien automatisch
- **Predictive Suggestions**: System schlägt nächste Schritte vor
- **Contextual Help**: `/workflow:help` zeigt relevante Optionen für aktuellen Status

### CLI Safety System

- **Pre-flight Checks** vor der Installation
- **Conflict Detection** für bestehende Setups
- **Health Monitoring** mit Auto-Fix
- **Rollback Support** bei Problemen (`/workflow:undo`)
- **GDPR Compliance Check** für EU-Konformität

---

## Schnellstart

### Voraussetzungen

- [Claude Code CLI](https://claude.com/claude-code) installiert
- Node.js >= 18 (für CLI Features)
- Git

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine

# 2. Claude Code starten (lädt das System automatisch)
claude

# 3. Optional: CLI Safety Tools installieren
cd cli
npm install && npm run build
```

### Erster Workflow: Von der Idee zur Implementierung

Starte Claude Code und führe die 5 Phasen nacheinander aus:

```bash
# Phase 1: Produkt planen
# Definiere Mission, Vision und Ziele deines Projekts
/workflow/plan-product

# Phase 2: Spezifikation formen
# Sammle Anforderungen, Referenzen und Constraints
/workflow/shape-spec

# Phase 3: Spezifikation schreiben
# Erstelle eine detaillierte technische Spezifikation
/workflow/write-spec

# Phase 4: Tasks erstellen
# Generiere implementierbare Aufgaben aus der Spezifikation
/workflow/create-tasks

# Phase 5: Tasks orchestrieren
# Delegiere Tasks an spezialisierte Agenten
/workflow/orchestrate-tasks
```

Jede Phase erstellt Dateien im `workflow/`-Verzeichnis, die als Kontext für nachfolgende Phasen dienen.

---

## Architektur

### 6-Schichten Plugin-Architektur

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging (.claude-plugin/plugin.json)          |
|  Bündelt alle Schichten in ein installierbares Paket            |
+------------------------------------------------------------------+
|  Layer 5: Hooks (hooks/hooks.json)                               |
|  Event-basierte Automatisierung (SessionStart, Pre/PostToolUse)  |
+------------------------------------------------------------------+
|  Layer 4: Agents (.claude/agents/*.md)                           |
|  7 spezialisierte Subagenten mit MCP-Tool-Integration            |
+------------------------------------------------------------------+
|  Layer 3: Skills (.claude/skills/workflow/)                       |
|  Kontextbasiertes Wissen (Standards, MCP, Hooks, Config)         |
+------------------------------------------------------------------+
|  Layer 2: Commands (.claude/commands/workflow/)                   |
|  23 Slash-Commands (5-Phasen + Convenience + Utilities + NaNo)  |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md (.claude/CLAUDE.md)                          |
|  Projekt-Anweisungen und Systemüberblick                        |
+------------------------------------------------------------------+
```

### Empfohlene MCP-Server

| Server | Funktion | Genutzt von |
|--------|----------|-------------|
| **Serena** | Semantische Code-Analyse (Symbol-Navigation, Refactoring) | architect, researcher, debug, ask |
| **Greptile** | PR-Management und Code Review Integration | orchestrator, security |

MCP-Server sind optional - Agents fallen automatisch auf Standard-Tools zurück wenn Server nicht verfügbar sind.

### 3-Schichten Kontextmodell

```
+------------------------------------------------------------------+
|  Layer 1: Standards (HOW)                                        |
|  Konventionen, Patterns, Best Practices                          |
|  -> workflow/standards/                                           |
|  -> 7 Domänen: global, devops, agents, api, database,           |
|     frontend, testing                                            |
+------------------------------------------------------------------+
|  Layer 2: Product (WHAT / WHY)                                   |
|  Mission, Vision, Architekturentscheidungen, Roadmap             |
|  -> workflow/product/                                            |
+------------------------------------------------------------------+
|  Layer 3: Specs (WHAT NEXT)                                      |
|  Feature-Spezifikationen, Implementierungstasks                  |
|  -> workflow/specs/                                               |
+------------------------------------------------------------------+
```

- **Layer 1 (HOW):** Definiert *wie* gebaut wird - Coding-Standards, Naming Conventions, CI/CD-Patterns
- **Layer 2 (WHAT/WHY):** Definiert *was* gebaut wird und *warum* - Produktvision, Architektur, Roadmap
- **Layer 3 (WHAT NEXT):** Definiert *was als nächstes* kommt - konkrete Feature-Specs und Tasks

### Agenten-Hierarchie

```
                    +------------------+
                    |   Orchestrator   |  (Task Delegation)
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |         |         |         |         |
    +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
    |Architect| |  Debug | |DevOps  | |Security| |Researcher|
    +---------+ +--------+ +--------+ +--------+ +----------+
         |
    +----+---+
    |  Ask   |  (Erklärungen)
    +---------+
```

Der Orchestrator analysiert Tasks und delegiert sie an den jeweils spezialisierten Agenten. Agenten mit READ-ONLY Zugriff können den Code analysieren aber nicht verändern, während FULL-Agenten auch implementieren.

---

## Projektstruktur

```
claude-workflow-engine/
|
|-- .claude-plugin/               # Layer 6: Plugin Packaging
|   +-- plugin.json               # Plugin-Manifest (v0.2.7)
|
|-- .claude/                      # Claude Code Konfiguration
|   |-- agents/                   # Layer 4: 7 Agenten-Definitionen
|   |   |-- architect.md          # +Serena MCP-Tools
|   |   |-- ask.md                # +Serena MCP-Tools
|   |   |-- debug.md              # +Serena MCP-Tools
|   |   |-- devops.md
|   |   |-- orchestrator.md       # +Greptile MCP-Tools
|   |   |-- researcher.md         # +Serena MCP-Tools
|   |   +-- security.md           # +Greptile MCP-Tools
|   |-- commands/workflow/         # Layer 2: 23 Workflow Slash Commands
|   +-- skills/workflow/           # Layer 3: Standards + 3 neue Skills
|       |-- mcp-usage/            # MCP-Tool-Katalog
|       |-- hook-patterns/        # Hook-Referenz
|       +-- plugin-config/        # 6-Schichten-Konfiguration
|
|-- hooks/                        # Layer 5: Event-basierte Hooks
|   |-- hooks.json                # Hook-Definitionen
|   +-- scripts/                  # Hook-Implementierungen
|       |-- common.sh             # Shared Utilities
|       |-- session-start.sh      # SessionStart: Kontext laden
|       |-- pre-write-validate.sh # PreToolUse: Secrets-Schutz
|       +-- post-write-log.sh     # PostToolUse: Aenderungs-Log
|
|-- workflow/                      # Wissens-Layer (3-Schichten Modell)
|   |-- config.yml                # Hauptkonfiguration (v0.2.7)
|   |-- orchestration.yml         # Orchestrierungs-Einstellungen
|   |-- product/                  # Layer 2: Mission, Roadmap, Architektur
|   |-- standards/                # Layer 1: 11 Standards in 7 Domaenen
|   |   +-- index.yml             # Standards-Registry mit Tags
|   +-- specs/                    # Layer 3: Feature-Spezifikationen
|
|-- cli/                          # Safety Tools (TypeScript)
|-- docs/                         # Dokumentation (DE + EN)
+-- LICENSE                       # MIT License
```

---

## Standards Commands

Drei zusätzliche Commands für das Standards-Management:

```bash
# Standards aus der Codebase entdecken
# Analysiert bestehenden Code und schlägt neue Standards vor
/workflow/discover-standards

# Standards-Index aktualisieren
# Synchronisiert index.yml mit vorhandenen Standard-Dateien
/workflow/index-standards

# Standards manuell in den Kontext laden
# Für Fälle wo automatisches Matching nicht ausreicht
/workflow/inject-standards
```

---

## Visual Website Cloner

Extrahiere die visuelle Identität (Farben, Fonts, Spacing, CSS Variables) von beliebigen Websites:

```bash
# 1. Web-Access-Layer konfigurieren (einmalig)
/workflow/web-setup

# 2. Website visuell klonen
/workflow/visual-clone
```

**Voraussetzungen:** Self-hosted [Firecrawl](https://github.com/mendableai/firecrawl) + optional [SearXNG](https://github.com/searxng/searxng)

> **Hinweis:** `/workflow:clone-setup` ist deprecated. Nutze `/workflow:web-setup` stattdessen.

**Output-Formate:** CSS Variables, Tailwind Config, Design Tokens JSON

**Token-Optimierung:** API-Responses werden in [TOON-Format](https://github.com/toon-format/toon) konvertiert (~40% weniger Tokens).

Ausführlicher Guide: [How-To: Visual Clone nutzen](docs/how-to/visual-clone-nutzen.md)

---

## CLI Usage

```bash
# CLI Tools bauen
cd cli && npm install && npm run build

# Health Check - Systemzustand prüfen
node dist/index.js health --verbose

# Compliance Check - GDPR-Konformität prüfen
node dist/index.js check --gdpr --fix

# Conflict Detection - vor Integration prüfen
node dist/index.js check --conflicts

# Sichere Installation mit Backup
node dist/index.js install --backup /path/to/project
```

---

## Datenschutz

Dieses System ist mit Datensouveränität als Grundprinzip entwickelt:

- **Lokale Datenhaltung:** Alle Standards, Specs und Produktkontext leben in deinem Repository
- **Keine zusätzlichen Cloud-Dienste:** Das System macht keine API-Aufrufe über Claude Code hinaus
- **Sensible Daten geschützt:** `.local.md`-Dateien sind standardmäßig gitignored
- **PII-Erkennung:** CLI Tools können nach versehentlich committeten personenbezogenen Daten scannen
- **EU-konform:** Konfiguration standardmäßig auf `eu-central-1` (Frankfurt)

> **Hinweis:** Claude Code selbst kommuniziert mit der Anthropic API. Dieses System fügt keine zusätzliche externe Kommunikation hinzu - es organisiert den lokalen Workflow-Kontext, den Claude Code verwendet.

---

## Use Cases

- **Konsistente Standards** - Auch nach langen Pausen bleibt der Code einheitlich
- **Strukturierte Feature-Entwicklung** - Von der Idee über die Spezifikation zur Implementierung
- **Automatische Dokumentation** - Architekturentscheidungen und Spezifikationen werden mitgeführt
- **Einheitliche Workflows** - Gleiche Prozesse über verschiedene Projekte hinweg
- **Wissenserhalt** - Kontext bleibt zwischen Sessions erhalten
- **Team-Onboarding** - Neue Teammitglieder verstehen Standards und Architektur sofort

---

## Dokumentation

Die vollständige Dokumentation ist auf Deutsch verfügbar:

| Dokument | Beschreibung |
|----------|--------------|
| [Erste Schritte](docs/erste-schritte.md) | Einstieg und Grundlagen |
| [Plattform-Architektur](docs/plattform-architektur.md) | 6-Schichten Plugin-Architektur |
| [Agenten-Referenz](docs/agenten.md) | Alle 7 Agenten im Detail |
| [Workflow Guide](docs/workflow.md) | 5-Phasen Workflow erklärt |
| [Standards System](docs/standards.md) | Standards erstellen und verwalten |
| [CLI-Referenz](docs/cli.md) | Safety Tools und Commands |
| [Konfiguration](docs/konfiguration.md) | config.yml und Einstellungen |
| [Integration](docs/integration.md) | In bestehende Projekte integrieren |
| [Visual Clone](docs/how-to/visual-clone-nutzen.md) | Website-Design extrahieren |

---

## Contributing

Beiträge sind willkommen! Besonders in diesen Bereichen:

- **Neue Standards** für zusätzliche Tech-Stacks
- **Agent-Verbesserungen** für bessere Spezialisierung
- **CLI Features** für erweiterte Safety Checks
- **Dokumentation** - Verbesserungen und Übersetzungen

---

## License

MIT License - siehe [LICENSE](LICENSE) für Details.

---

## Credits

Dieses Projekt baut auf Konzepten und Inspiration der folgenden Projekte auf:

| Projekt | Was wir übernommen haben |
|---------|---------------------------|
| [Agent OS](https://github.com/buildermethods/agent-os) | 3-Layer Context Model (Standards/Product/Specs) und Spec-Driven Development |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | Spezialisierte Agent-Modi mit definierten Zugriffsrechten |
| [Claude Code](https://github.com/anthropics/claude-code) | CLI-Plattform als Runtime für Agent-Definitionen |
| [Context7](https://github.com/upstash/context7) | MCP-Server-Konzept für kontextbezogene Wissensbereitstellung |
