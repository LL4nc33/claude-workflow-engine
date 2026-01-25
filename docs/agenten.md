# Agenten

Claude Workflow Engine umfasst 9 spezialisierte Agenten, jeder mit definierter Rolle, Zugangsstufe und Toolset. Agenten sind als Markdown-Dateien in `.claude/agents/` definiert und stehen automatisch als Claude Code Subagenten zur Verfügung.

**Hinweis:** Orchestration wird direkt vom Main Chat gehandhabt, nicht von einem dedizierten Agenten.

## Übersicht

| Agent | Zugang | Zweck | Tools | MCP-Tools |
|-------|--------|-------|-------|-----------|
| [architect](#architect) | READ-ONLY | System Design, ADRs, API Review | Read, Grep, Glob, WebSearch, WebFetch | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| [builder](#builder) | FULL | Bug Investigation, Implementation | Read, Write, Edit, Bash, Grep, Glob | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| [devops](#devops) | FULL | CI/CD, Docker, K8s, IaC | Read, Write, Edit, Bash, Grep, Glob | - |
| [explainer](#explainer) | READ-ONLY | Erklärungen, Lernen | Read, Grep, Glob | Serena: get_symbols_overview, find_symbol |
| [guide](#guide) | READ-ONLY | NaNo Evolution, Pattern-to-Standards | Read, Grep, Glob | Serena: search_for_pattern, get_symbols_overview |
| [innovator](#innovator) | READ-ONLY | Brainstorming, Kreative Lösungen | Read, Grep, Glob, WebSearch, WebFetch | - |
| [quality](#quality) | READ-ONLY | Testing, Coverage, Quality Gates | Read, Grep, Glob, Bash (Test-Tools) | Greptile: search_greptile_comments |
| [researcher](#researcher) | READ-ONLY | Analyse, Dokumentation | Read, Grep, Glob, WebSearch, WebFetch | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| [security](#security) | RESTRICTED | OWASP Audits, Vulnerability Scanning | Read, Grep, Glob, Bash (nur Security-Tools) | Greptile: search_greptile_comments, list_merge_request_comments |

## Zugangsstufen

| Stufe | Bedeutung | Agenten |
|-------|-----------|---------|
| **READ-ONLY** | Kann Dateien lesen und durchsuchen, aber nichts verändern | architect, explainer, guide, innovator, quality, researcher |
| **FULL** | Kann lesen, schreiben, editieren und Befehle ausführen | builder, devops |
| **RESTRICTED** | Read-Only plus ein eingeschränktes Set an Bash-Befehlen (nur Security-Scanning-Tools) | security |

Die Zugangsstufen definieren, was ein Agent technisch darf. Sie sind in der Frontmatter der jeweiligen Agent-Datei festgelegt und werden vom System erzwungen.

---

## Architect

**Datei:** `.claude/agents/architect.md`

**Rolle:** Senior Systems Architect. Denkt in Systemen, nicht in Dateien. Analysiert, empfiehlt und dokumentiert Architekturentscheidungen.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**MCP-Tools (optional):** Serena: `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`

**Spezialisierungen:**

- Architecture Decision Records (ADRs)
- System Design und Component Decomposition
- API Design Review und Konsistenzprüfung
- Dependency-Analyse und Technologie-Evaluation
- Trade-off-Analyse (Skalierbarkeit, Wartbarkeit, Performance)
- Integrationsmuster und Datenfluss-Design

**Kontext-Quellen:** tech-stack, agent-conventions, mission, architecture, roadmap

**Wann nutzen:**

- "Wie soll ich das Notification-System architektonisch aufbauen?"
- "Prüfe das API-Design auf Konsistenz"
- "Was sind die Trade-offs zwischen PostgreSQL und MongoDB hier?"
- "Erstelle ein ADR für den Wechsel zu Event-driven Architecture"

**Kollaboriert mit:** Main Chat (erhält Aufgaben), security (Architektur-Review), builder (stellt Guidance bereit), devops (Infrastruktur-Design), innovator (reviewt Konzepte), quality (Architektur-Quality-Gates)

---

## Builder

**Datei:** `.claude/agents/builder.md`

**Rolle:** Methodischer Debugging-Spezialist und Implementation-Expert. Voller Dateisystem-Zugriff für Code-Modifikation. Der "Leichenbestatter" -- findet heraus, warum Code gestorben ist.

**Zugang:** FULL

**Tools:** Read, Write, Edit, Bash, Grep, Glob

**MCP-Tools (optional):** Serena: `find_referencing_symbols`, `replace_symbol_body`, `find_symbol`, `get_symbols_overview`

**Spezialisierungen:**

- Hypothesengetriebene Bug-Investigation
- Root Cause Analysis (keine Symptombehandlung)
- Performance Profiling und Optimierung
- Test-Erstellung und Regressionsprävention
- Code-Implementation aus Specs

**Kontext-Quellen:** tech-stack, naming, error-handling, response-format, migrations, components, coverage, mission, architecture

**Wann nutzen:**

- "Fixe die NullPointerException im User Service"
- "Implementiere den Payment-Processing-Endpoint aus der Spec"
- "Warum ist die API-Response-Time 3x langsamer als letzte Woche?"
- "Schreibe Unit Tests für das Notification-Modul"

**Kollaboriert mit:** Main Chat (erhält Tasks), architect (erhält Guidance), devops (Deployment-Issues), security (flaggt Probleme), quality (Test-Coverage)

---

## DevOps

**Datei:** `.claude/agents/devops.md`

**Rolle:** Infrastruktur- und Deployment-Spezialist. Automatisiert alles was automatisiert werden kann. Baut Systeme die reproduzierbar, observable und resilient sind.

**Zugang:** FULL

**Tools:** Read, Write, Edit, Bash, Grep, Glob

**Spezialisierungen:**

- CI/CD Pipeline Design und Implementation (GitHub Actions)
- Docker Multi-Stage Builds und Container-Optimierung
- Kubernetes Manifests und Helm Charts
- Terraform Infrastructure as Code
- Deployment-Strategien (Blue-Green, Canary, Rolling)
- Monitoring, Logging und Alerting
- EU-konforme Infrastruktur (DSGVO Data Residency)

**Kontext-Quellen:** ci-cd, containerization, infrastructure, tech-stack, mission, architecture

**Wann nutzen:**

- "Richte eine GitHub Actions Pipeline für dieses Projekt ein"
- "Erstelle ein Multi-Stage Dockerfile für die API"
- "Deploye das auf Kubernetes mit Canary-Strategie"
- "Richte Terraform für die Datenbank-Infrastruktur ein"

**Kollaboriert mit:** Main Chat (erhält Tasks), security (Deployment-Hardening), builder (Environment-Issues), architect (Infrastruktur-Design), quality (CI Quality Gates)

---

## Explainer

**Datei:** `.claude/agents/explainer.md`

**Rolle:** Geduldiger technischer Educator. Erklärt komplexe Dinge einfach, ohne herablassend zu sein. Nutzt Analogien wenn hilfreich und Beispiele wenn nötig.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob

**MCP-Tools (optional):** Serena: `get_symbols_overview`, `find_symbol`

**Spezialisierungen:**

- Code Walkthroughs und Erklärungen
- Konzeptklärung (von Grundlagen bis Fortgeschritten)
- Pattern-Erkennung und -Erklärung
- Entscheidungsbegründungen dokumentieren
- Lernorientierte Antworten (Angelrute, nicht Fisch)

**Kontext-Quellen:** tech-stack, mission, architecture

**Wann nutzen:**

- "Wie funktioniert die Authentication-Middleware?"
- "Erkläre das Observer Pattern wie es in diesem Projekt verwendet wird"
- "Was macht diese Regex?"
- "Warum wurde Redis statt Memcached gewählt?"

**Kollaboriert mit:** Main Chat (Fragen-Routing), architect (für "Warum"-Fragen), researcher (für Deep Dives), builder (wenn Fragen zu Tasks werden), innovator (erklärt kreative Konzepte)

---

## Guide

**Datei:** `.claude/agents/guide.md`

**Rolle:** Prozess-Coach und Learning-Spezialist. Analysiert NaNo-Patterns und extrahiert Standards aus erfolgreichen Praktiken.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob

**MCP-Tools (optional):** Serena: `search_for_pattern`, `get_symbols_overview`

**Spezialisierungen:**

- Pattern-Erkennung aus historischen Daten
- Standards-Extraktion aus erfolgreichen Praktiken
- Workflow-Optimierung und Effizienz
- Anti-Pattern-Erkennung und Remediation
- Continuous Improvement Facilitation

**Kontext-Quellen:** agent-conventions, tech-stack, mission, roadmap

**Wann nutzen:**

- "Analysiere die Delegation-Patterns der letzten Sessions"
- "Welche Standards fehlen uns basierend auf wiederholten Entscheidungen?"
- "Was sind Anti-Patterns in unserem Workflow?"
- "Schlage Verbesserungen für den Entwicklungsprozess vor"

**Kollaboriert mit:** Main Chat (Prozess-Insights), researcher (Daten-Zulieferung), architect (Standards-Review), quality (Metriken-Trends)

---

## Innovator

**Datei:** `.claude/agents/innovator.md`

**Rolle:** Kreativ-Technologe und Ideation-Spezialist. Generiert Möglichkeiten die andere nicht sehen.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**Spezialisierungen:**

- Divergentes Denken und Brainstorming
- Alternative Lösungsgenerierung
- "What if" Szenario-Exploration
- Cross-Domain Inspiration
- Feature Ideation und Concepting

**Kontext-Quellen:** mission, roadmap, tech-stack

**Wann nutzen:**

- "Brainstorme Alternativen für das Authentication-System"
- "Was wäre wenn wir keinen Server bräuchten?"
- "Welche innovativen Approaches gibt es für dieses Problem?"
- "Generiere Feature-Ideen für das nächste Release"

**Kollaboriert mit:** Main Chat (Ideation-Requests), architect (Konzept-Validierung), researcher (Prior Art Research), builder (Machbarkeit), security (Security-Implikationen)

---

## Quality

**Datei:** `.claude/agents/quality.md`

**Rolle:** QA-Engineer und Code-Health-Guardian. Validiert Test-Coverage, analysiert Metriken und erzwingt Quality Gates.

**Zugang:** READ-ONLY (plus Test-Befehle)

**Tools:** Read, Grep, Glob, Bash (jest, npm test, nyc)

**MCP-Tools (optional):** Greptile: `search_greptile_comments`

**Spezialisierungen:**

- Test Coverage Analyse und Trending
- Code Complexity Metriken (Cyclomatic, Cognitive)
- Flaky Test Detection und Remediation
- Quality Gate Enforcement
- Technical Debt Assessment

**Kontext-Quellen:** coverage, tech-stack, naming, mission

**Wann nutzen:**

- "Wie ist die aktuelle Test-Coverage?"
- "Welche Funktionen haben zu hohe Komplexität?"
- "Gibt es flaky Tests?"
- "Prüfe ob wir release-ready sind"

**Kollaboriert mit:** Main Chat (Quality-Validation), builder (Coverage-Issues), architect (Struktur-Komplexität), devops (CI Quality Gates), researcher (Metriken-Dokumentation)

---

## Researcher

**Datei:** `.claude/agents/researcher.md`

**Rolle:** Akribischer technischer Researcher. Gründlich, strukturiert und quellen-orientiert. Jede Behauptung hat Evidenz, jede Empfehlung hat Kontext.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**MCP-Tools (optional):** Serena: `search_for_pattern`, `find_symbol`, `get_symbols_overview`

**Spezialisierungen:**

- Codebase-Analyse und Pattern Discovery
- Dokumentationsgenerierung aus bestehendem Code
- Standards-Extraktion und Formalisierung
- Technologie-Vergleich und Evaluation
- Best Practice Research via Web-Quellen

**Kontext-Quellen:** tech-stack, agent-conventions, mission, architecture, roadmap

**Wann nutzen:**

- "Analysiere die Error-Handling-Patterns in dieser Codebase"
- "Vergleiche Prisma vs TypeORM für unseren Use Case"
- "Welche Konventionen befolgen wir bereits aber haben sie noch nicht dokumentiert?"
- "Recherchiere aktuelle Best Practices für WebSocket-Authentifizierung"

**Kollaboriert mit:** architect (liefert Findings), Main Chat (stellt Kontext bereit), security (Vulnerability Research), devops (Infrastruktur Best Practices), guide (Pattern-Daten), innovator (Prior Art)

---

## Security

**Datei:** `.claude/agents/security.md`

**Rolle:** Security-Spezialist. Vorsichtig, gründlich, geht immer von einem Breach aus. "Trust nothing, verify everything."

**Zugang:** RESTRICTED (Read-Only plus spezifische Audit-Bash-Befehle)

**Tools:** Read, Grep, Glob, Bash (nur trivy, grype, semgrep, nmap, curl)

**MCP-Tools (optional):** Greptile: `search_greptile_comments`, `list_merge_request_comments`

**Spezialisierungen:**

- OWASP Top 10 Vulnerability Assessment
- Authentication und Authorization Review
- Input Validation und Sanitization-Analyse
- Secrets Management und Credential-Erkennung
- Dependency Vulnerability Scanning (CVEs)
- DSGVO/EU-Datenschutz-Compliance

**Kontext-Quellen:** tech-stack, naming, error-handling, response-format, mission, architecture

**Wann nutzen:**

- "Führe ein Security Audit am Authentication-Modul durch"
- "Prüfe Dependencies auf bekannte Vulnerabilities"
- "Reviewe diesen PR auf Security-Bedenken"
- "Sind wir DSGVO-konform bei der Datenverarbeitung?"

**Kollaboriert mit:** Main Chat (erhält Tasks), architect (Security Design), devops (Secure Deployment), builder (Implementation-Fixes), researcher (Compliance-Dokumentation), quality (Security Quality Gates)

---

## Agenten-Hierarchie

```
                         +-------------+
                         |  Main Chat  |  (Orchestration)
                         +------+------+
                                |
    +-------+-------+-------+---+---+-------+-------+-------+
    |       |       |       |       |       |       |       |
+---+---+ +-+--+ +--+--+ +--+---+ +-+--+ +--+---+ +--+--+ +-+---+
|architect|builder|devops|explainer|guide|innovator|quality|researcher|
+---------+------+------+---------+-----+---------+-------+----------+
                                                              |
                                                         +----+----+
                                                         | security |
                                                         +----------+
```

Der Main Chat orchestriert alle Agenten. Der Architect stellt Guidance für builder und devops bereit. Security reviewt Architektur- und Deployment-Entscheidungen. Quality überwacht Test-Coverage und Code-Health. Guide analysiert Patterns für Prozessverbesserung.

**Task-zu-Agent-Mapping:**

| Task-Typ | Default-Agent | Override wenn |
|-----------|---------------|---------------|
| backend | builder | security_sensitive --> security |
| frontend | builder | -- |
| testing | builder | coverage_analysis --> quality |
| database | builder | schema_breaking --> architect |
| security | security | implementation_needed --> builder |
| infrastructure | devops | -- |
| ci_cd | devops | -- |
| architecture | architect | -- |
| documentation | researcher | -- |
| review | architect | security_review --> security |
| explanation | explainer | implementation_needed --> builder |
| quality_assurance | quality | -- |
| ideation | innovator | -- |
| process_evolution | guide | -- |

---

## MCP-Tool-Integration

Agenten können optional MCP-Server (Model Context Protocol) nutzen, um erweiterte Fähigkeiten zu erhalten. MCP-Tools sind nicht erforderlich -- Agenten fallen automatisch auf Standard-Tools zurück wenn ein Server nicht verfügbar ist.

| MCP-Server | Funktion | Genutzt von |
|------------|----------|-------------|
| **Serena** | Semantische Code-Navigation (Symbol-Suche, Referenz-Tracking, Code-Manipulation) | architect, explainer, builder, researcher, guide, quality |
| **Greptile** | PR-Management und Code-Review-Integration | quality, security |

**Fallback-Verhalten:**
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

Siehe [Plattform-Architektur](plattform-architektur.md) für MCP-Server-Setup.

---

## Siehe auch

- [Workflow-Guide](workflow.md) -- Wie Agenten im 5-Phasen-Workflow eingesetzt werden
- [Standards](standards.md) -- Welche Standards jeder Agent erhält
- [Konfiguration](konfiguration.md) -- Agent Registry in orchestration.yml
- [Plattform-Architektur](plattform-architektur.md) -- 6-Schichten-Architektur und MCP-Setup
