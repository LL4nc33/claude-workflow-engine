# Erste Schritte

## Was ist Claude Workflow Engine?

Claude Workflow Engine ist ein Multi-Agent-System, das Claude Code um strukturierte Workflows, spezialisierte KI-Agenten und ein Standards-basiertes Context Model erweitert. Statt einfach "frag Claude" bekommst du einen wiederholbaren, Spec-getriebenen Entwicklungsprozess.

**Was du bekommst:**

- 7 spezialisierte Agents (Architect, Debug, Security, DevOps, u.a.)
- Einen 5-Phasen-Workflow von der Idee bis zur Implementierung
- Standards, die automatisch auf delegierte Tasks angewendet werden
- CLI Safety Tools für Installation und Health Monitoring

## Voraussetzungen

| Tool | Version | Zweck |
|------|---------|-------|
| Claude Code | aktuell | [claude.ai/code](https://claude.ai/code) -- installiert und authentifiziert |
| Node.js | >= 18 | [nodejs.org](https://nodejs.org) -- nur für CLI Tools |
| Git | aktuell | Versionskontrolle |

Pruefe dein Setup:

```bash
claude --version
node --version   # >= 18
git --version
```

Erwartete Ausgabe (Versionen können abweichen):

```
1.0.x
v20.x.x
git version 2.x.x
```

## Installation

### Option A: Repository klonen

```bash
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine
```

Das ist der schnellste Weg für ein neues Projekt. Du hast sofort alle Agents, Commands und Standards verfügbar.

### Option B: In bestehendes Projekt integrieren

Wenn du Claude Workflow Engine zu einem bestehenden Projekt hinzufuegen willst, nutze den CLI Installer. Details findest du im [Integration Guide](integration.md).

Kurzfassung:

```bash
# CLI bauen (im claude-workflow-engine Repo)
cd cli && npm install && npm run build

# Vorschau (keine Aenderungen)
node dist/index.js install --dry-run /pfad/zu/deinem/projekt

# Installation ausführen
node dist/index.js install /pfad/zu/deinem/projekt
```

## Was du bekommst

Nach der Installation hat dein Projekt diese Struktur:

```
.claude/
  agents/              # 7 spezialisierte Agents
  commands/workflow/    # 8 Slash Commands
  skills/workflow/      # 10 Skills (7 Standards + 3 Plugin-Skills)

.claude-plugin/
  plugin.json          # Plugin-Manifest (6-Schichten-Architektur)

hooks/
  hooks.json           # Hook-Definitionen
  scripts/             # Hook-Scripts (SessionStart, Pre/PostToolUse)

workflow/
  config.yml           # Hauptkonfiguration
  orchestration.yml    # Task-Delegation Config
  product/             # Mission, Roadmap, Architecture
  standards/           # 11 Standards in 7 Domains
  specs/               # Feature Specs (pro Feature erstellt)

cli/                   # Safety Tools (optional)
```

Die wichtigsten Verzeichnisse:

- **`.claude/agents/`** -- Hier leben die Agent-Definitionen. Jeder Agent hat eine eigene Markdown-Datei mit Persoenlichkeit, Zugriffslevel und Aufgabenbereich.
- **`.claude/commands/workflow/`** -- Die Slash Commands, die du im naechsten Abschnitt nutzen wirst.
- **`.claude-plugin/`** -- Das Plugin-Manifest, das alle 6 Schichten buendelt.
- **`hooks/`** -- Event-basierte Automatisierung (Secrets-Schutz, Aenderungs-Logging).
- **`workflow/standards/`** -- Konventionen und Patterns, die automatisch als Context in Tasks injiziert werden.
- **`workflow/specs/`** -- Hier entstehen deine Feature-Spezifikationen.

## Dein erster Workflow

Starte Claude Code in deinem Projektverzeichnis:

```bash
claude
```

Jetzt durchlaeufst du die 5 Phasen des Workflows. Jede Phase baut auf der vorherigen auf.

---

### Phase 1: Produkt planen

```
/workflow/plan-product
```

Claude stellt dir interaktive Fragen zu deiner Produktvision, Zielgruppe und Constraints.

**Beispiel-Interaktion:**

```
claude> /workflow/plan-product

Claude: Was ist die Mission deines Produkts? Was soll es loesen?

Du: Eine Task-Management-App für kleine Teams mit Fokus auf Einfachheit.

Claude: Welche technischen Constraints gibt es?

Du: TypeScript, React Frontend, Node.js Backend, PostgreSQL.

Claude: Gibt es regulatorische Anforderungen?

Du: DSGVO-konform, Daten in der EU.
```

**Erwartetes Ergebnis:**

```
workflow/product/mission.md     # Produktmission und Vision
workflow/product/roadmap.md     # Feature-Roadmap
workflow/product/architecture.md  # Architektur-Ueberblick (falls definiert)
```

---

### Phase 2: Feature shapen

```
/workflow/shape-spec
```

Hier sammelst du Requirements für ein konkretes Feature. Claude fragt nach User Stories, Referenzen und anwendbaren Standards.

**Beispiel-Interaktion:**

```
claude> /workflow/shape-spec

Claude: Welches Feature moechtest du spezifizieren?

Du: User Authentication mit Email/Password und OAuth.

Claude: Welche Standards sind relevant?

Du: API Response Format, Error Handling, Testing Coverage.

Claude: Gibt es Referenz-Implementierungen oder externe APIs?

Du: Google OAuth 2.0, bestehende User-Tabelle in der DB.
```

**Erwartetes Ergebnis:**

```
workflow/specs/20260123-user-auth/
  shape.md              # Gesammelte Requirements
  references/           # Verlinkte Referenzen
  standards.md          # Anwendbare Standards
```

---

### Phase 3: Technische Spec schreiben

```
/workflow/write-spec
```

Die Shape wird in eine detaillierte technische Spezifikation transformiert -- mit API Design, Datenmodellen und Teststrategie.

**Beispiel-Interaktion:**

```
claude> /workflow/write-spec

Claude: Ich schreibe die technische Spec basierend auf der Shape in
        workflow/specs/20260123-user-auth/shape.md.
        Soll ich ein bestimmtes API-Pattern verwenden?

Du: REST mit dem Standard Response Format aus unseren Standards.
```

**Erwartetes Ergebnis:**

```
workflow/specs/20260123-user-auth/
  spec.md               # Vollstaendige technische Spezifikation
  api-design.md         # API Endpoints und Contracts
  data-model.md         # Datenbank-Schema
  test-strategy.md      # Teststrategie und Coverage-Ziele
```

---

### Phase 4: Tasks erstellen

```
/workflow/create-tasks
```

Die Spec wird in atomare, Agent-zuweisbare Tasks aufgeteilt. Jeder Task hat Dependencies und Acceptance Criteria.

**Beispiel-Interaktion:**

```
claude> /workflow/create-tasks

Claude: Ich breche die Spec in Tasks auf. Folgende Agents werden benoetigt:
        - architect: API Design Review
        - devops: Database Migration Setup
        - debug: Implementation der Auth-Logik
        - security: OWASP Audit der Auth-Endpoints

        Soll ich fortfahren?

Du: Ja, erstelle die Tasks.
```

**Erwartetes Ergebnis:**

```
workflow/specs/20260123-user-auth/
  tasks.md              # Alle Tasks mit Dependencies
  orchestration.yml     # Agent-Zuweisungen und Reihenfolge
```

---

### Phase 5: Tasks orchestrieren

```
/workflow/orchestrate-tasks
```

Tasks werden an spezialisierte Agents delegiert. Der Orchestrator tracked den Fortschritt und erzwingt Quality Gates.

**Beispiel-Interaktion:**

```
claude> /workflow/orchestrate-tasks

Claude: Starte Orchestration für 20260123-user-auth.
        Phase 1/3: Design Review (architect agent)
        [...]
        Phase 2/3: Implementation (debug agent)
        [...]
        Phase 3/3: Security Audit (security agent)
        [...]
        Alle Tasks abgeschlossen. 2 Findings aus dem Security Audit.
```

**Erwartetes Ergebnis:**

Implementierter Code gemaess Spec, inklusive Tests und Security Review.

---

## Verifikation

Nach dem Klonen oder der Installation pruefst du, ob das System korrekt geladen ist.

### Agents pruefen

Starte Claude Code und frage:

```
claude> Welche Agents sind verfügbar?
```

**Erwartete Antwort:** Claude listet alle 7 Agents auf (architect, ask, debug, devops, orchestrator, researcher, security). Wenn nicht, pruefe ob `.claude/agents/` die Agent-Dateien enthaelt und ob `CLAUDE.md` vorhanden ist.

### Commands pruefen

```
claude> /workflow/
```

Claude sollte Autocompletion für die 8 Workflow Commands anbieten:

```
/workflow/plan-product
/workflow/shape-spec
/workflow/write-spec
/workflow/create-tasks
/workflow/orchestrate-tasks
/workflow/discover-standards
/workflow/index-standards
/workflow/inject-standards
```

### Health Check (mit CLI)

Falls du die CLI Tools installiert hast:

```bash
cd cli
node dist/index.js health .
```

**Erwartete Ausgabe:**

```
Health Check Results:
  Agents:     7/7 loaded
  Commands:   8/8 available
  Standards:  11/11 indexed
  Config:     valid
  GDPR:       compliant

Overall: HEALTHY
```

## Datenschutz-Hinweis

Claude Workflow Engine selbst macht **keine API-Calls** und speichert **keine Daten extern**. Alle Standards, Specs und Konfigurationen bleiben in deinem lokalen Dateisystem und deiner Versionskontrolle.

**Wichtig:** Claude Code selbst nutzt die Anthropic API. Deine Prompts und Code-Context werden als Teil des normalen Claude-Code-Betriebs an Anthropic-Server gesendet. Das ist nichts, was die Workflow Engine kontrolliert -- so funktioniert Claude Code. Siehe [Anthropics Datenschutzerklärung](https://www.anthropic.com/privacy) für Details.

**DSGVO-Massnahmen im Projekt:**

- Daten-Residenz konfiguriert auf `eu-central-1` (Frankfurt)
- Keine PII (personenbezogene Daten) in Standards oder Specs erlaubt
- Sensitive Daten gehoeren in `.local.md`-Dateien (automatisch gitignored)
- Patterns wie `.env*`, `credentials.*`, `secrets.*` sind ausgeschlossen

## CLI Tools installieren (optional)

Die CLI bietet Safety Tools für Health Monitoring, Conflict Detection und DSGVO-Checks:

```bash
cd cli
npm install
npm run build
node dist/index.js --help
```

**Verfuegbare Befehle:**

```
install     Workflow Engine in ein Projekt installieren
health      System-Gesundheitscheck ausführen
check       Konflikte, DSGVO-Compliance pruefen
rollback    Installation rueckgaengig machen
```

Siehe [CLI Referenz](cli.md) für alle Befehle im Detail.

## Naechste Schritte

- [Workflow Guide](workflow.md) -- Jede Phase im Detail verstehen
- [Agenten](agenten.md) -- Was jeder Agent kann und wann du ihn einsetzt
- [Standards](standards.md) -- Wie das Standards-System funktioniert
- [Konfiguration](konfiguration.md) -- Die Engine für dein Projekt anpassen
- [Plattform-Architektur](plattform-architektur.md) -- 6-Schichten-Architektur, Hooks und MCP-Server
