# Agenten

Claude Workflow Engine umfasst 9 spezialisierte Agenten, jeder mit definierter Rolle, Zugangsstufe und Toolset. Agenten sind als Markdown-Dateien in `.claude/agents/` definiert und stehen automatisch als Claude Code Subagenten zur Verfuegung.

## Übersicht

| Agent | Zugang | Zweck | Tools | MCP-Tools |
|-------|--------|-------|-------|-----------|
| [architect](#architect) | READ-ONLY | System Design, ADRs, API Review | Read, Grep, Glob, WebSearch, WebFetch | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| [builder](#builder) | FULL | Bug Investigation, Implementation | Read, Write, Edit, Bash, Grep, Glob | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| [devops](#devops) | FULL | CI/CD, Docker, K8s, IaC | Read, Write, Edit, Bash, Grep, Glob | - |
| [explainer](#explainer) | READ-ONLY | Erklaerungen, Lernen | Read, Grep, Glob | Serena: get_symbols_overview, find_symbol |
| [guide](#guide) | READ-ONLY | NaNo Evolution, Pattern-to-Standards | Read, Grep, Glob | Serena: search_for_pattern, get_symbols_overview |
| [innovator](#innovator) | READ-ONLY | Brainstorming, Kreative Loesungen | Read, Grep, Glob, WebSearch, WebFetch | Serena: get_symbols_overview |
| [quality](#quality) | READ-ONLY | Testing, Coverage, Quality Gates | Read, Grep, Glob, Bash (nur Test-Tools) | Serena: find_symbol, get_symbols_overview |
| [researcher](#researcher) | READ-ONLY | Analyse, Dokumentation | Read, Grep, Glob, WebSearch, WebFetch | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| [security](#security) | RESTRICTED | OWASP Audits, Vulnerability Scanning | Read, Grep, Glob, Bash (nur Security-Tools) | Greptile: search_greptile_comments, list_merge_request_comments |

## Zugangsstufen

| Stufe | Bedeutung | Agenten |
|-------|-----------|---------|
| **READ-ONLY** | Kann Dateien lesen und durchsuchen, aber nichts veraendern | architect, explainer, guide, innovator, researcher |
| **FULL** | Kann lesen, schreiben, editieren und Befehle ausfuehren | builder, devops |
| **RESTRICTED** | Read-Only plus ein eingeschraenktes Set an Bash-Befehlen (Security-/Test-Tools) | quality, security |

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
- API Design Review und Konsistenzpruefung
- Dependency-Analyse und Technologie-Evaluation
- Trade-off-Analyse (Skalierbarkeit, Wartbarkeit, Performance)
- Integrationsmuster und Datenfluss-Design

**Kontext-Quellen:** tech-stack, agent-conventions, mission, architecture, roadmap

**Output-Formate:**

- Architecture Reviews (aktueller Zustand, Beobachtungen, Empfehlungen, Risiken)
- ADRs (Status, Context, Decision, Consequences)
- API Reviews (Konsistenzpruefung, Verbesserungsvorschlaege)

**Wann nutzen:**

- "Wie soll ich das Notification-System architektonisch aufbauen?"
- "Pruefe das API-Design auf Konsistenz"
- "Was sind die Trade-offs zwischen PostgreSQL und MongoDB hier?"
- "Erstelle ein ADR für den Wechsel zu Event-driven Architecture"
- "Analysiere die Abhängigkeiten des Auth-Moduls"

**Kollaboriert mit:** security (Architektur-Review), builder (stellt Guidance bereit), devops (Infrastruktur-Design), researcher (Pattern-Dokumentation)

---

## Explainer

**Datei:** `.claude/agents/explainer.md`

**Rolle:** Geduldiger technischer Educator. Erklaert komplexe Dinge einfach, ohne herablassend zu sein. Nutzt Analogien wenn hilfreich und Beispiele wenn noetig.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob

**MCP-Tools (optional):** Serena: `get_symbols_overview`, `find_symbol`

**Spezialisierungen:**

- Code Walkthroughs und Erklärungen
- Konzeptklaerung (von Grundlagen bis Fortgeschritten)
- Pattern-Erkennung und -Erklaerung
- Entscheidungsbegruendungen dokumentieren
- Lernorientierte Antworten (Angelrute, nicht Fisch)

**Kontext-Quellen:** tech-stack, mission, architecture

**Output-Formate:**

- Code-Erklärungen (TL;DR, Funktionsweise, Begruendung, Verwandtes)
- Konzept-Erklärungen (einfache Worte, Projektbezug, Beispiel, Weiterfuehrendes)
- How-to-Guides (Kurzantwort, Schritt für Schritt, Fallstricke, Standards)

**Wann nutzen:**

- "Wie funktioniert die Authentication-Middleware?"
- "Erklaere das Observer Pattern wie es in diesem Projekt verwendet wird"
- "Was macht diese Regex?"
- "Warum wurde Redis statt Memcached gewaehlt?"
- "Erklaere mir den Datenfluss beim Login"

**Kollaboriert mit:** architect (für "Warum"-Fragen), researcher (für Deep Dives), builder (wenn Fragen zu Implementierungsaufgaben werden)

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
- Test-Erstellung und Regressionspraevention
- Code-Implementation aus Specs

**Kontext-Quellen:** tech-stack, naming, error-handling, response-format, migrations, components, coverage, mission, architecture

**Debugging-Methodik:**

| Phase | Aktion | Beschreibung |
|-------|--------|--------------|
| 1 | REFLECT | Erwartetes vs. tatsaechliches Verhalten, wann es angefangen hat, Reproduzierbarkeit |
| 2 | HYPOTHESIZE | Ursachen nach Wahrscheinlichkeit ranken, Evidenz sammeln |
| 3 | DIAGNOSE | Tests entwerfen die jede Hypothese beweisen/widerlegen |
| 4 | ISOLATE | Minimalen Reproduktionsfall erstellen, Fix isoliert verifizieren |
| 5 | FIX | Minimalen Fix implementieren, Regressionstest hinzufuegen, dokumentieren |

**Output-Formate:**

- Bug Reports (Symptome, Root Cause, angewandter Fix, Praevention, Regressionstest)
- Implementation Reports (was gebaut wurde, Design-Entscheidungen, Dateien, Tests, Standards-Compliance)

**Wann nutzen:**

- "Fixe die NullPointerException im User Service"
- "Implementiere den Payment-Processing-Endpoint aus der Spec"
- "Warum ist die API-Response-Time 3x langsamer als letzte Woche?"
- "Schreibe Unit Tests für das Notification-Modul"
- "Der Build bricht ab -- finde heraus warum"

**Kollaboriert mit:** architect (erhaelt Guidance), devops (Deployment-Issues), security (flaggt Probleme), Main Chat (erhaelt Tasks)

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

**Kollaboriert mit:** security (Deployment-Hardening), builder (Environment-spezifische Issues), architect (Infrastruktur-Design)

---

## Guide

**Datei:** `.claude/agents/guide.md`

**Rolle:** NaNo-Evolution-Experte und Prozessverbesserungs-Spezialist. Analysiert Workflow-Patterns, identifiziert Verbesserungskandidaten und hilft das System basierend auf echten Nutzungsdaten weiterzuentwickeln.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob

**MCP-Tools (optional):** Serena: `search_for_pattern`, `get_symbols_overview`

**Spezialisierungen:**

- NaNo Pattern-Analyse und Evolution-Candidates
- Workflow-Effizienz-Verbesserung
- Pattern-to-Standards Extraktion
- Prozess-Engpass-Identifikation
- Agent-Kollaborations-Optimierung
- Learning-System-Kalibrierung

**Kontext-Quellen:** nano-learning, agent-conventions, tech-stack

**Analyse-Protokoll:**

1. NaNo-Observations und Patterns analysieren
2. Wiederkehrende erfolgreiche Verhaltensweisen identifizieren
3. Evolution-Candidates fuer Standards vorschlagen
4. Prozessverbesserungen empfehlen
5. Gegen bestehende Standards validieren

**Wann nutzen:**

- "Analysiere die letzten Delegation-Patterns"
- "Welche Patterns entstehen aus unserem Workflow?"
- "Pruefe Evolution-Candidates fuer Promotion"
- "Wie koennen wir den Spec-to-Task-Prozess verbessern?"

**Kollaboriert mit:** researcher (Datenanalyse), architect (Standards-Design), quality (Metriken)

---

## Innovator

**Datei:** `.claude/agents/innovator.md`

**Rolle:** Kreativer Technologe und Ideation-Spezialist. Denkt ausserhalb der Box, generiert alternative Loesungen und erkundet "Was waere wenn"-Szenarien ohne Implementierungszwaenge.

**Zugang:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**MCP-Tools (optional):** Serena: `get_symbols_overview`

**Spezialisierungen:**

- Divergentes Denken und Brainstorming
- Alternative Loesungsgenerierung
- "Was waere wenn"-Szenario-Exploration
- Cross-Domain Pattern-Erkennung
- Feature-Ideation und Konzeptentwicklung
- Trade-off-Exploration ohne Implementierungs-Bias

**Kontext-Quellen:** mission, architecture, tech-stack

**Ideations-Protokoll:**

1. Problemraum verstehen ohne zu Loesungen zu springen
2. Mehrere diverse Ansaetze generieren (mindestens 3)
3. Unkonventionelle Alternativen erkunden
4. Cross-Domain-Loesungen in Betracht ziehen
5. Optionen mit Trade-offs praesentieren (ohne Empfehlung)

**Wann nutzen:**

- "Welche alternativen Ansaetze gibt es fuer X?"
- "Brainstorme Feature-Ideen fuer Y"
- "Was waere wenn wir Z komplett anders machen?"
- "Erkunde unkonventionelle Loesungen fuer dieses Problem"

**Kollaboriert mit:** architect (Machbarkeits-Review), researcher (Prior Art), builder (Implementierungs-Realitaetscheck)

---

## Quality

**Datei:** `.claude/agents/quality.md`

**Rolle:** Quality-Assurance und Testing-Experte. Fokussiert auf Test-Coverage, Code-Health-Metriken, Quality Gates und stellt sicher dass die Codebase Qualitaetsstandards erfuellt.

**Zugang:** RESTRICTED (nur Test-Tools)

**Tools:** Read, Grep, Glob, Bash (jest, npm test, npx nyc, npx eslint)

**MCP-Tools (optional):** Serena: `find_symbol`, `get_symbols_overview`

**Spezialisierungen:**

- Test-Coverage-Analyse und Luecken-Identifikation
- Code-Health-Metriken (Komplexitaet, Duplikation, Debt)
- Quality-Gate-Enforcement
- Flaky-Test-Erkennung und Remediation
- Test-Strategie und Test-Pyramiden-Balance
- CI/CD-Quality-Integration

**Kontext-Quellen:** testing, tech-stack, coverage

**Quality-Protokoll:**

1. Aktuelle Test-Coverage und Luecken analysieren
2. Code-Health-Metriken messen
3. Quality-Gate-Verletzungen identifizieren
4. Gezielte Verbesserungen empfehlen
5. Gegen Qualitaetsstandards validieren

**Wann nutzen:**

- "Wie ist die Test-Coverage fuer Modul X?"
- "Gibt es Flaky Tests in der Suite?"
- "Pruefe Code-Health-Metriken fuer diesen PR"
- "Erfuellen wir die Quality Gates fuer Release?"

**Kollaboriert mit:** builder (Test-Implementierung), devops (CI-Integration), security (Security-Testing)

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
- "Erstelle einen Bericht über die Codebase-Qualität"

**Kollaboriert mit:** architect (liefert Findings), security (Vulnerability Research), devops (Infrastruktur Best Practices)

---

## Security

**Datei:** `.claude/agents/security.md`

**Rolle:** Security-Spezialist. Vorsichtig, gruendlich, geht immer von einem Breach aus. "Trust nothing, verify everything."

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

- "Führe ein Security Audit am Authentication-Modul durch"
- "Pruefe Dependencies auf bekannte Vulnerabilities"
- "Reviewe diesen PR auf Security-Bedenken"
- "Validiert unsere API den Input korrekt?"
- "Sind wir GDPR-konform bei der Datenverarbeitung?"

**Kollaboriert mit:** architect (Security Design), devops (Secure Deployment), builder (Implementation-Fixes), researcher (Compliance-Dokumentation)

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

Main Chat koordiniert und delegiert an alle 9 Agenten. Der Architect stellt Guidance fuer Builder und DevOps bereit. Security reviewt Architektur- und Deployment-Entscheidungen. Der Explainer behandelt Nutzerfragen die keine Implementation erfordern. Guide, Innovator und Quality sind spezialisierte Support-Agenten fuer Prozessverbesserung, Ideation und Qualitaetssicherung.

**Task-zu-Agent-Mapping:**

| Task-Typ | Default-Agent | Override wenn |
|-----------|---------------|---------------|
| backend | builder | -- |
| frontend | builder | -- |
| testing | builder | -- |
| database | builder | -- |
| security | security | Implementation noetig --> builder |
| infrastructure | devops | -- |
| ci_cd | devops | -- |
| architecture | architect | -- |
| documentation | researcher | -- |
| review | architect | Security Review --> security |
| explanation | explainer | Implementation noetig --> builder |

---

## MCP-Tool-Integration

Agenten können optional MCP-Server (Model Context Protocol) nutzen, um erweiterte Fähigkeiten zu erhalten. MCP-Tools sind nicht erforderlich -- Agenten fallen automatisch auf Standard-Tools zurück wenn ein Server nicht verfügbar ist.

| MCP-Server | Funktion | Genutzt von |
|------------|----------|-------------|
| **Serena** | Semantische Code-Navigation (Symbol-Suche, Referenz-Tracking, Code-Manipulation) | architect, explainer, builder, researcher |
| **Greptile** | PR-Management und Code-Review-Integration | quality, security |

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
