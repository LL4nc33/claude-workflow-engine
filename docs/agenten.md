# Agenten

Claude Workflow Engine umfasst 7 spezialisierte Agenten, jeder mit definierter Rolle, Zugangsstufe und Toolset. Agenten sind als Markdown-Dateien in `.claude/agents/` definiert und stehen automatisch als Claude Code Subagenten zur Verfügung.

## Übersicht

| Agent | Zugang | Zweck | Tools | MCP-Tools |
|-------|--------|-------|-------|-----------|
| [architect](#architect) | READ-ONLY | System Design, ADRs, API Review | Read, Grep, Glob, WebSearch, WebFetch | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| [ask](#ask) | READ-ONLY | Erklärungen, Lernen | Read, Grep, Glob | Serena: get_symbols_overview, find_symbol |
| [debug](#debug) | FULL | Bug Investigation, Implementation | Read, Write, Edit, Bash, Grep, Glob | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| [devops](#devops) | FULL | CI/CD, Docker, K8s, IaC | Read, Write, Edit, Bash, Grep, Glob | - |
| [orchestrator](#orchestrator) | TASK-DELEGATION | Koordination, Delegation | Task, Read, Grep, Glob | Greptile: list_merge_requests, get_merge_request |
| [researcher](#researcher) | READ-ONLY | Analyse, Dokumentation | Read, Grep, Glob, WebSearch, WebFetch | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| [security](#security) | RESTRICTED | OWASP Audits, Vulnerability Scanning | Read, Grep, Glob, Bash (nur Security-Tools) | Greptile: search_greptile_comments, list_merge_request_comments |

## Zugangsstufen

| Stufe | Bedeutung | Agenten |
|-------|-----------|---------|
| **READ-ONLY** | Kann Dateien lesen und durchsuchen, aber nichts verändern | architect, ask, researcher |
| **FULL** | Kann lesen, schreiben, editieren und Befehle ausführen | debug, devops |
| **TASK-DELEGATION** | Kann Dateien lesen und Aufgaben an andere Agenten via Task-Tool delegieren | orchestrator |
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

**Output-Formate:**

- Architecture Reviews (aktueller Zustand, Beobachtungen, Empfehlungen, Risiken)
- ADRs (Status, Context, Decision, Consequences)
- API Reviews (Konsistenzprüfung, Verbesserungsvorschläge)

**Wann nutzen:**

- "Wie soll ich das Notification-System architektonisch aufbauen?"
- "Prüfe das API-Design auf Konsistenz"
- "Was sind die Trade-offs zwischen PostgreSQL und MongoDB hier?"
- "Erstelle ein ADR für den Wechsel zu Event-driven Architecture"
- "Analysiere die Abhängigkeiten des Auth-Moduls"

**Kollaboriert mit:** security (Architektur-Review), debug (stellt Guidance bereit), devops (Infrastruktur-Design), researcher (Pattern-Dokumentation)

---

## Ask

**Datei:** `.claude/agents/ask.md`

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

**Output-Formate:**

- Code-Erklärungen (TL;DR, Funktionsweise, Begründung, Verwandtes)
- Konzept-Erklärungen (einfache Worte, Projektbezug, Beispiel, Weiterführendes)
- How-to-Guides (Kurzantwort, Schritt für Schritt, Fallstricke, Standards)

**Wann nutzen:**

- "Wie funktioniert die Authentication-Middleware?"
- "Erkläre das Observer Pattern wie es in diesem Projekt verwendet wird"
- "Was macht diese Regex?"
- "Warum wurde Redis statt Memcached gewählt?"
- "Erkläre mir den Datenfluss beim Login"

**Kollaboriert mit:** architect (für "Warum"-Fragen), researcher (für Deep Dives), debug (wenn Fragen zu Implementierungsaufgaben werden)

---

## Debug

**Datei:** `.claude/agents/debug.md`

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

**Debugging-Methodik:**

| Phase | Aktion | Beschreibung |
|-------|--------|--------------|
| 1 | REFLECT | Erwartetes vs. tatsächliches Verhalten, wann es angefangen hat, Reproduzierbarkeit |
| 2 | HYPOTHESIZE | Ursachen nach Wahrscheinlichkeit ranken, Evidenz sammeln |
| 3 | DIAGNOSE | Tests entwerfen die jede Hypothese beweisen/widerlegen |
| 4 | ISOLATE | Minimalen Reproduktionsfall erstellen, Fix isoliert verifizieren |
| 5 | FIX | Minimalen Fix implementieren, Regressionstest hinzufügen, dokumentieren |

**Output-Formate:**

- Bug Reports (Symptome, Root Cause, angewandter Fix, Prävention, Regressionstest)
- Implementation Reports (was gebaut wurde, Design-Entscheidungen, Dateien, Tests, Standards-Compliance)

**Wann nutzen:**

- "Fixe die NullPointerException im User Service"
- "Implementiere den Payment-Processing-Endpoint aus der Spec"
- "Warum ist die API-Response-Time 3x langsamer als letzte Woche?"
- "Schreibe Unit Tests für das Notification-Modul"
- "Der Build bricht ab -- finde heraus warum"

**Kollaboriert mit:** architect (erhält Guidance), devops (Deployment-Issues), security (flaggt Probleme), orchestrator (erhält Tasks)

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
- Secret Management und Environment-Konfiguration
- EU-konforme Infrastruktur (GDPR Data Residency)

**Kontext-Quellen:** ci-cd, containerization, infrastructure, tech-stack, mission, architecture

**Kernprinzipien:**

- Infrastructure as Code (keine manuellen Aenderungen)
- Security-first (keine Secrets im Code)
- EU Data Residency (eu-central-1)
- Immutable Infrastructure (Container aendern sich nicht nach Build)
- Observability (alles muss monitorbar sein)
- Rollback-ready (jedes Deployment hat einen Rollback-Pfad)
- Cost-conscious (Ressourcen richtig dimensionieren)
- 12-Factor App Methodology

**Output-Formate:**

- CI/CD Pipelines (Trigger, Stages, Dateien, Environment Variables)
- Docker-Konfiguration (Base Image, Build Stages, Security)
- Infrastruktur-Aenderungen (Was geaendert, Terraform Resources, Rollback-Plan, Kosten-Impact, Compliance)

**Wann nutzen:**

- "Richte eine GitHub Actions Pipeline für dieses Projekt ein"
- "Erstelle ein Multi-Stage Dockerfile für die API"
- "Deploye das auf Kubernetes mit Canary-Strategie"
- "Richte Terraform für die Datenbank-Infrastruktur ein"
- "Der Container startet nicht -- hilf mir beim Debugging"

**Kollaboriert mit:** security (Deployment-Hardening), debug (Environment-spezifische Issues), architect (Infrastruktur-Design)

---

## Orchestrator

**Datei:** `.claude/agents/orchestrator.md`

**Rolle:** Koordinationszentrale des Multi-Agent-Systems. Delegiert Arbeit, trackt Fortschritt, erzwingt Quality Gates. Implementiert nie direkt -- sieht das ganze Brett und bewegt die Figuren.

**Zugang:** TASK-DELEGATION

**Tools:** Task, Read, Grep, Glob

**MCP-Tools (optional):** Greptile: `list_merge_requests`, `get_merge_request`

**Spezialisierungen:**

- Task Decomposition und Dependency Resolution
- Agent-Auswahl und Delegation
- Progress Tracking und Status-Reporting
- Quality Gate Enforcement
- Failure Handling und Eskalation
- Parallele Ausfuehrungskoordination

**Kontext-Quellen:** agent-conventions, tech-stack, mission, architecture

**Delegationsprotokoll:**

1. Task-Liste analysieren und Dependencies identifizieren
2. Execution Plan bauen (Phasen unabhaengiger Tasks)
3. Jeden Task delegieren mit: Beschreibung, Standards (inline), Spec-Kontext, Acceptance Criteria
4. Completion gegen Acceptance Criteria verifizieren
5. Failures handhaben (max. 2 Retries, dann Eskalation an User)
6. Fortschritt in `progress.md` tracken

**Execution-Modi:**

| Modus | Verhalten |
|-------|-----------|
| automatic | Alle Phasen ausführen, nur bei Failures pausieren |
| phase-by-phase | Nach jeder Phase beim User bestaetigen (Default) |
| task-by-task | Nach jedem Task beim User bestaetigen |
| selective | User waehlt spezifische Tasks zur Ausfuehrung |

**Standards-Injection:** Der Orchestrator liest Standards-Dateien und fuegt deren vollstaendigen Inhalt in Delegations-Prompts ein. Subagenten können keine Datei-Referenzen aufloesen -- sie brauchen den Content inline.

**Wann nutzen:**

- Nach `/workflow/create-tasks` um die Task-Liste auszufuehren
- Wenn du mehrere unabhaengige Tasks zu verteilen hast
- Wenn koordinierte Multi-Agent-Arbeit gebraucht wird
- "Fuehre die Tasks für das Auth-Feature aus"

**Kollaboriert mit:** Alle anderen Agenten (delegiert an sie). Delegiert nie an sich selbst (keine rekursive Orchestration).

---

## Researcher

**Datei:** `.claude/agents/researcher.md`

**Rolle:** Akribischer technischer Researcher. Gruendlich, strukturiert und quellen-orientiert. Jede Behauptung hat Evidenz, jede Empfehlung hat Kontext.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**MCP-Tools (optional):** Serena: `search_for_pattern`, `find_symbol`, `get_symbols_overview`

**Spezialisierungen:**

- Codebase-Analyse und Pattern Discovery
- Dokumentationsgenerierung aus bestehendem Code
- Standards-Extraktion und Formalisierung
- Technologie-Vergleich und Evaluation
- Best Practice Research via Web-Quellen
- Trend-Analyse und Empfehlungsberichte

**Kontext-Quellen:** tech-stack, agent-conventions, mission, architecture, roadmap

**Output-Formate:**

- Codebase-Analyse (Findings mit Dateipfaden, Statistiken, Empfehlungen)
- Technologie-Research (evaluierte Optionen, Pros/Cons, Empfehlung, Quellen)
- Standards-Extraktion (Pattern-Beschreibung, Evidenz, vorgeschlagener Standard, Ausnahmen)

**Wann nutzen:**

- "Analysiere die Error-Handling-Patterns in dieser Codebase"
- "Vergleiche Prisma vs TypeORM für unseren Use Case"
- "Welche Konventionen befolgen wir bereits aber haben sie noch nicht dokumentiert?"
- "Recherchiere aktuelle Best Practices für WebSocket-Authentifizierung"
- "Erstelle einen Bericht über die Codebase-Qualitaet"

**Kollaboriert mit:** architect (liefert Findings), orchestrator (stellt Kontext bereit), security (Vulnerability Research), devops (Infrastruktur Best Practices)

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
- Security Header und TLS-Konfiguration
- GDPR/EU-Datenschutz-Compliance

**Kontext-Quellen:** tech-stack, naming, error-handling, response-format, mission, architecture

**Kernprinzipien:**

- Gefundene Secrets nie exponieren (Ort melden, nicht Wert)
- OWASP Top 10 als primaeres Assessment-Framework
- Severity Ratings: Critical, High, Medium, Low, Informational
- Jedes Finding enthaelt eine Remediation-Empfehlung
- Least Privilege überall
- Defense in Depth (einzelne Controls sind nie ausreichend)

**Verfuegbare Audit-Befehle:**

```bash
trivy fs --severity HIGH,CRITICAL .    # Dependency Scanning
grype dir:.                             # Alternatives Dependency Scanning
semgrep --config=p/owasp-top-ten .     # Statische Analyse
semgrep --config=p/secrets .           # Secret Detection
nmap -sV -sC localhost                 # Netzwerk-Reconnaissance
curl -I https://target.example.com     # Header-Inspektion
```

**Output-Formate:**

- Security Audits (Executive Summary, Findings nach Severity, GDPR Compliance Check)
- Dependency Reports (CVE-Tabelle, Upgrade-Empfehlungen)
- Security Code Reviews (Input Validation, Auth, Data Handling Checklisten)

**Wann nutzen:**

- "Fuehre ein Security Audit am Authentication-Modul durch"
- "Pruefe Dependencies auf bekannte Vulnerabilities"
- "Reviewe diesen PR auf Security-Bedenken"
- "Validiert unsere API den Input korrekt?"
- "Sind wir GDPR-konform bei der Datenverarbeitung?"

**Kollaboriert mit:** architect (Security Design), devops (Secure Deployment), debug (Implementation-Fixes), researcher (Compliance-Dokumentation)

---

## Agenten-Hierarchie

```
                 +------------------+
                 |   orchestrator   |  (Koordination)
                 +--------+---------+
                          |
      +-------------------+-------------------+
      |         |         |         |         |
 +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
 |architect| |  debug | |devops  | |security| |researcher|
 +---------+ +--------+ +--------+ +--------+ +----------+
      |
 +----+---+
 |  ask   |  (Erklaerungen)
 +---------+
```

Der Orchestrator delegiert an alle anderen Agenten. Der Architect stellt Guidance für debug und devops bereit. Security reviewt Architektur- und Deployment-Entscheidungen. Der Ask-Agent behandelt Nutzerfragen die keine Implementation erfordern.

**Task-zu-Agent-Mapping:**

| Task-Typ | Default-Agent | Override wenn |
|-----------|---------------|---------------|
| backend | debug | -- |
| frontend | debug | -- |
| testing | debug | -- |
| database | debug | -- |
| security | security | Implementation noetig --> debug |
| infrastructure | devops | -- |
| ci_cd | devops | -- |
| architecture | architect | -- |
| documentation | researcher | -- |
| review | architect | Security Review --> security |
| explanation | ask | Implementation noetig --> debug |

---

## MCP-Tool-Integration

Agenten können optional MCP-Server (Model Context Protocol) nutzen, um erweiterte Faehigkeiten zu erhalten. MCP-Tools sind nicht erforderlich -- Agenten fallen automatisch auf Standard-Tools zurueck wenn ein Server nicht verfügbar ist.

| MCP-Server | Funktion | Genutzt von |
|------------|----------|-------------|
| **Serena** | Semantische Code-Navigation (Symbol-Suche, Referenz-Tracking, Code-Manipulation) | architect, ask, debug, researcher |
| **Greptile** | PR-Management und Code-Review-Integration | orchestrator, security |

**Fallback-Verhalten:**
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

Siehe [Plattform-Architektur](plattform-architektur.md) für MCP-Server-Setup.

---

## Siehe auch

- [Workflow-Guide](workflow.md) -- Wie Agenten im 5-Phasen-Workflow eingesetzt werden
- [Standards](standards.md) -- Welche Standards jeder Agent erhaelt
- [Konfiguration](konfiguration.md) -- Agent Registry in orchestration.yml
- [Plattform-Architektur](plattform-architektur.md) -- 6-Schichten-Architektur und MCP-Setup
