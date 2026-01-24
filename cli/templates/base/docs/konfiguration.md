# Konfiguration

Die Claude Workflow Engine verwendet mehrere Konfigurationsdateien. Diese Referenz erklaert jede Datei, ihre Optionen und wie sie zusammenspielen.

---

## Konfig-Dateien Übersicht

| Datei | Zweck | Erforderlich |
|-------|-------|:------------:|
| `workflow/config.yml` | Hauptkonfiguration | Ja |
| `workflow/orchestration.yml` | Task-Delegation und Quality Gates | Ja |
| `workflow/standards/index.yml` | Standards-Registry | Ja |
| `.claude/CLAUDE.md` | Projektkontext für Claude Code | Ja |
| `.claude/settings.local.json` | Claude Code Berechtigungen | Ja |
| `.claude-plugin/plugin.json` | Plugin-Manifest (6-Schichten-Architektur) | Ja |
| `hooks/hooks.json` | Hook-Definitionen (Event-basierte Automatisierung) | Ja |

---

## workflow/config.yml

Die Hauptkonfiguration steuert, welche Features aktiv sind, wie das Context Model aufgebaut ist und welche Agents verfügbar sind.

### Vollstaendige Referenz

```yaml
version: 0.2.7
default_profile: default

# --- Claude Code Integration ---

# Workflow Slash Commands aktivieren
# Steuert: /plan-product, /shape-spec, /write-spec, /create-tasks, /orchestrate-tasks
claude_code_commands: true

# Delegation an spezialisierte Subagents erlauben
# Wenn false: Alle Aufgaben werden vom Haupt-Agent bearbeitet
use_claude_code_subagents: true

# Standards als Claude Code Skills registrieren
# true:  Claude wendet relevante Standards automatisch basierend auf Task-Kontext an
# false: Standards müssen manuell oder durch den Orchestrator injiziert werden
standards_as_claude_code_skills: true

# Ausgaben für andere AI-Tools deaktivieren (Cursor, Codex, Gemini)
workflow_engine_commands: false

# --- 3-Layer Context Model ---

context_model:
  # Layer 1: HOW - Konventionen, Patterns, Best Practices
  standards:
    path: workflow/standards/       # Verzeichnis der Standards
    auto_inject: false              # Skills-basiertes Matching statt vollem Inject
    domains:                        # Registrierte Domaenen
      - global       # Cross-cutting: tech-stack, naming
      - devops       # CI/CD, Docker, K8s, IaC
      - agents       # Agent-spezifische Standards
      - api          # Response-Format, Error-Handling
      - database     # Migration-Patterns
      - frontend     # Component-Standards
      - testing      # Coverage-Ziele, Teststruktur

  # Layer 2: WHAT/WHY - Mission, Vision, Roadmap
  product:
    path: workflow/product/
    files:
      - mission.md
      - roadmap.md
      - architecture.md

  # Layer 3: WHAT NEXT - Feature-Spezifikationen
  specs:
    path: workflow/specs/
    naming_convention: "{timestamp}-{feature-name}/"

# --- Agent System ---

agents:
  directory: .claude/agents/       # Verzeichnis der Agent-Definitionen
  available:
    - name: architect
      access: read-only
      purpose: System Design, ADRs, Architektur-Review
    - name: ask
      access: read-only
      purpose: Erklärungen, Lern-Anfragen, Dokumentations-Queries
    - name: debug
      access: full
      purpose: Bug-Investigation mit vollem Dateisystem-Zugriff
    - name: orchestrator
      access: task-delegation
      purpose: Task-Delegation via Task Tool
    - name: researcher
      access: read-only
      purpose: Codebase-Analyse und Dokumentationsgenerierung
    - name: security
      access: read-only
      purpose: OWASP-Audits, Vulnerability-Assessment
    - name: devops
      access: full
      purpose: CI/CD, Docker, Kubernetes, IaC

# --- GDPR / EU Compliance ---

gdpr:
  enabled: true
  data_residency: eu-central-1     # Frankfurt - oesterreichische/EU-Compliance

  # Die Engine macht KEINE externen API-Aufrufe
  local_only: true

  sensitive_data:
    pii_in_standards: forbidden     # Keine personenbezogenen Daten in Standards
    pii_in_specs: forbidden         # Keine personenbezogenen Daten in Specs
    local_files_only: true          # .local.md für persoenliche Daten verwenden
    gitignored_patterns:
      - "CLAUDE.local.md"
      - "*.local.md"
      - ".env*"
      - "credentials.*"
      - "secrets.*"

  audit:
    log_spec_changes: true          # Aenderungen an Specs protokollieren
    log_standard_changes: true      # Aenderungen an Standards protokollieren

# --- Orchestration ---

orchestration:
  config_file: workflow/orchestration.yml
  per_spec_config: workflow/specs/{folder}/orchestration.yml
  default_execution_mode: phase-by-phase
  track_progress: true

# --- Profile-Konfiguration ---

profiles:
  default:
    description: Basis-Standards für alle Projekte
```

### Wichtige Einstellungen

| Einstellung | Default | Wirkung |
|-------------|---------|---------|
| `standards_as_claude_code_skills` | `true` | Standards werden automatisch via Skills-System zugeordnet |
| `context_model.standards.auto_inject` | `false` | Wenn true: alle Standards immer injiziert (Token-intensiv) |
| `orchestration.default_execution_mode` | `phase-by-phase` | Standard-Ausfuehrungsmodus der Orchestrierung |
| `gdpr.enabled` | `true` | GDPR-Compliance-Checks aktivieren |
| `gdpr.data_residency` | `eu-central-1` | Ziel-AWS-Region für Infrastruktur |

---

## workflow/orchestration.yml

Steuert die Task-Delegation, Quality Gates und Fehlerbehandlung. Dies ist die komplexeste Konfigurationsdatei.

### Workflow-Phasen

Die 5-Phasen Command Chain definiert den Ablauf von der Planung bis zur Ausfuehrung:

```yaml
workflow:
  phases:
    - name: plan-product
      command: /plan-product
      description: Mission, Ziele und Constraints definieren
      output_path: workflow/product/
      outputs: [mission.md, roadmap.md, architecture.md]
      prerequisites: []
      responsible_agent: architect
      review_agent: null
      quality_gate: null

    - name: shape-spec
      command: /shape-spec
      description: Anforderungen, Referenzen und Stakeholder-Input sammeln
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [shape.md, references.md, standards.md, visuals/]
      prerequisites: [plan-product]
      responsible_agent: researcher
      review_agent: architect
      quality_gate: null

    - name: write-spec
      command: /write-spec
      description: Technische Spezifikation aus Shape erstellen
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [spec.md]
      prerequisites: [shape-spec]
      responsible_agent: architect
      review_agent: security
      quality_gate: gate_1_pre_implementation

    - name: create-tasks
      command: /create-tasks
      description: Spec in implementierbare, delegierbare Tasks aufbrechen
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [tasks.md, orchestration.yml]
      prerequisites: [write-spec]
      responsible_agent: orchestrator
      review_agent: architect
      quality_gate: gate_2_pre_execution

    - name: orchestrate-tasks
      command: /orchestrate-tasks
      description: Tasks an spezialisierte Agents delegieren, Fortschritt tracken
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [progress.md, delegation.log]
      prerequisites: [create-tasks]
      responsible_agent: orchestrator
      review_agent: null
      quality_gate: gate_3_post_phase
```

Jede Phase erfordert den Abschluss ihrer Prerequisite-Phase. Die Phasen sind strikt sequenziell.

### Agent Registry

Vollstaendige Capability-Definition für jeden der 7 Agents:

```yaml
agents:
  registry:
    architect:
      access: read-only
      tools: [Read, Grep, Glob, WebSearch, WebFetch]
      strengths:
        - System Design und Dekomposition
        - Architecture Decision Records (ADRs)
        - API-Design-Review und Konsistenz
        - Dependency-Analyse und Technologie-Evaluation
        - Trade-off-Analyse
      standards_domains: [global, agents]

    ask:
      access: read-only
      tools: [Read, Grep, Glob]
      strengths:
        - Code-Erklärungen und Walkthroughs
        - Konzept-Klaerung
        - Pattern-Identifikation und Erklaerung
      standards_domains: [global]

    debug:
      access: full
      tools: [Read, Write, Edit, Bash, Grep, Glob]
      strengths:
        - Bug-Investigation und Root-Cause-Analyse
        - Code-Implementation aus Specs
        - Performance-Profiling und Optimierung
        - Test-Erstellung und Regressionspraevention
      standards_domains: [global, api, database, frontend, testing]

    security:
      access: restricted
      tools: [Read, Grep, Glob, "Bash(trivy:*)", "Bash(grype:*)", "Bash(semgrep:*)"]
      strengths:
        - OWASP Top 10 Vulnerability-Assessment
        - Authentication- und Authorization-Review
        - Input-Validation und Sanitization
        - Secrets-Management und Credential-Detection
        - Dependency-CVE-Scanning
        - GDPR/EU-Compliance-Verification
      standards_domains: [global, api]

    devops:
      access: full
      tools: [Read, Write, Edit, Bash, Grep, Glob]
      strengths:
        - CI/CD-Pipeline-Design (GitHub Actions)
        - Docker Multi-Stage Builds
        - Kubernetes-Manifeste und Helm Charts
        - Terraform Infrastructure as Code
        - EU-konforme Infrastruktur
      standards_domains: [devops, global]

    researcher:
      access: read-only
      tools: [Read, Grep, Glob, WebSearch, WebFetch]
      strengths:
        - Codebase-Analyse und Pattern-Discovery
        - Dokumentationsgenerierung
        - Standards-Extraktion und Formalisierung
        - Technologie-Vergleich und Evaluation
      standards_domains: [global, agents]

    orchestrator:
      access: task-delegation
      tools: [Task, Read, Grep, Glob]
      strengths:
        - Task-Dekomposition und Dependency-Resolution
        - Agent-Auswahl und Delegation
        - Progress-Tracking und Status-Reporting
        - Quality-Gate-Enforcement
        - Failure-Handling und Escalation
      standards_domains: [agents, global]
```

### Task-to-Agent Mapping

Ordnet abstrakte Task-Typen konkreten Agents zu mit Override-Bedingungen:

```yaml
task_groups:
  backend:
    primary_agent: debug
    review_agent: architect
    standards: [global/tech-stack, global/naming, api/response-format, api/error-handling]
    override_when:
      security_sensitive: security    # Auth-Endpoints, Kryptographie etc.

  frontend:
    primary_agent: debug
    review_agent: architect
    standards: [global/tech-stack, global/naming, frontend/components]

  testing:
    primary_agent: debug
    review_agent: null
    standards: [global/tech-stack, testing/coverage]

  database:
    primary_agent: debug
    review_agent: architect
    standards: [global/tech-stack, global/naming, database/migrations]
    override_when:
      schema_breaking_change: architect   # Braucht Architektur-Review zuerst

  security:
    primary_agent: security
    review_agent: architect
    standards: [global/tech-stack, global/naming, api/error-handling]
    override_when:
      implementation_needed: debug        # Wenn Fix Code-Aenderungen erfordert

  infrastructure:
    primary_agent: devops
    review_agent: architect
    standards: [devops/ci-cd, devops/containerization, devops/infrastructure]

  ci_cd:
    primary_agent: devops
    review_agent: security
    standards: [devops/ci-cd, devops/containerization]

  architecture:
    primary_agent: architect
    review_agent: security
    standards: [global/tech-stack, agents/agent-conventions]

  documentation:
    primary_agent: researcher
    review_agent: null
    standards: [global/tech-stack, global/naming]

  review:
    primary_agent: architect
    review_agent: null
    standards: [global/tech-stack, agents/agent-conventions]
    override_when:
      security_review: security
      infra_review: devops

  explanation:
    primary_agent: ask
    review_agent: null
    standards: [global/tech-stack]

  coordination:
    primary_agent: orchestrator
    review_agent: null
    standards: [agents/agent-conventions, global/tech-stack]

  research:
    primary_agent: researcher
    review_agent: null
    standards: [global/tech-stack]
```

### Standards Injection Konfiguration

Steuert, wie Standards-Inhalte an delegierte Agents übergeben werden:

```yaml
standards_injection:
  # Methode: inline = vollständigen Inhalt in den Delegation-Prompt einfuegen
  # Subagents können keine Dateireferenzen lesen - sie brauchen Inhalt inline
  method: inline
  standards_path: workflow/standards/

  # Immer injiziert, unabhaengig vom Task-Typ (globale Baseline)
  always_inject:
    - global/tech-stack

  # Domaenen-spezifische Injection-Regeln
  domain_mapping:
    backend: [global/naming, api/response-format, api/error-handling]
    frontend: [global/naming, frontend/components]
    database: [database/migrations, global/naming]
    testing: [testing/coverage]
    devops: [devops/ci-cd, devops/containerization, devops/infrastructure]
    security: [global/naming, api/error-handling]
    agents: [agents/agent-conventions]

  # Token-Optimierung
  optimization:
    max_standards_per_task: 5         # Context-Overflow verhindern
    prefer_skill_reference: false     # Skills funktionieren nicht im Subagent-Kontext
    cache_standard_content: true      # Orchestrator cached Datei-Reads innerhalb der Session
```

### Quality Gates (4-Gate-Architektur)

Quality Gates erzwingen Review-Checkpoints an kritischen Workflow-Uebergaengen:

**Gate 1: Pre-Implementation** -- Feuert nach `/write-spec`, vor `/create-tasks`:

```yaml
gate_1_pre_implementation:
  trigger: after_write_spec
  blocking: true
  reviewers:
    - agent: architect
      checks:
        - spec_architecturally_sound      # Spec ist architektonisch sinnvoll
        - dependencies_identified         # Abhängigkeiten identifiziert
        - tech_stack_aligned              # Tech-Stack passt
        - scope_reasonable                # Scope ist angemessen
    - agent: security
      checks:
        - no_security_antipatterns        # Keine Security-Antipatterns
        - auth_model_defined              # Auth-Modell definiert
        - data_flow_gdpr_compliant        # Datenfluss GDPR-konform
        - threat_model_considered         # Threat-Model beruecksichtigt
  pass_condition: all_reviewers_approve
  on_failure:
    action: pause_and_report
    notify: user
    allow_override: true
    override_requires: user_acknowledgement
```

**Gate 2: Pre-Execution** -- Feuert nach `/create-tasks`, vor `/orchestrate-tasks`:

```yaml
gate_2_pre_execution:
  trigger: after_create_tasks
  blocking: true
  reviewers:
    - agent: architect
      checks:
        - tasks_cover_spec_requirements   # Tasks decken Spec-Anforderungen ab
        - dependencies_correctly_ordered  # Abhängigkeiten korrekt geordnet
        - agent_assignments_appropriate   # Agent-Zuweisungen passend
        - no_scope_creep                  # Kein Scope Creep
  pass_condition: all_reviewers_approve
  on_failure:
    action: pause_and_report
    notify: user
    allow_override: true
```

**Gate 3: Post-Phase** -- Feuert nach jeder Orchestration-Phase:

```yaml
gate_3_post_phase:
  trigger: after_each_phase
  blocking: true
  checks_by_phase:
    data_layer:
      - schema_valid                    # Schema gueltig
      - types_consistent                # Typen konsistent
      - migrations_reversible           # Migrationen umkehrbar
    api_layer:
      - endpoints_documented            # Endpoints dokumentiert
      - error_handling_present          # Error-Handling vorhanden
      - standards_compliant             # Standards-konform
      - response_format_correct         # Response-Format korrekt
    frontend_layer:
      - components_typed                # Komponenten typisiert
      - state_managed                   # State verwaltet
      - accessibility_basic             # Grundlegende Barrierefreiheit
      - naming_conventions_followed     # Naming-Conventions befolgt
    testing_layer:
      - coverage_threshold_met          # 80% Minimum
      - edge_cases_covered              # Edge Cases abgedeckt
      - integration_passing             # Integration-Tests bestehen
      - no_flaky_tests                  # Keine flaky Tests
    infrastructure_layer:
      - iac_valid                       # terraform validate / docker build --check
      - security_scanned                # Security-Scan durchgefuehrt
      - eu_compliance_verified          # EU-Compliance verifiziert
      - rollback_path_defined           # Rollback-Pfad definiert
  on_failure:
    action: retry_phase
    max_retries: 1
    then: pause_and_report
```

**Gate 4: Final Acceptance** -- Feuert nach Abschluss aller Orchestration-Phasen:

```yaml
gate_4_final_acceptance:
  trigger: after_orchestration_complete
  blocking: true
  reviewers:
    - agent: security
      checks:
        - no_new_vulnerabilities          # Keine neuen Schwachstellen
        - secrets_not_exposed             # Secrets nicht exponiert
        - dependency_cves_addressed       # Dependency-CVEs adressiert
        - gdpr_compliance_verified        # GDPR-Compliance verifiziert
    - agent: architect
      checks:
        - implementation_matches_spec     # Implementation passt zur Spec
        - no_architectural_drift          # Kein architektonischer Drift
        - standards_followed              # Standards befolgt
        - documentation_complete          # Dokumentation vollstaendig
    - agent: user
      checks:
        - acceptance_criteria_met         # Acceptance Criteria erfuellt
        - manual_review_complete          # Manuelles Review abgeschlossen
  pass_condition: all_reviewers_approve
  on_failure:
    action: create_remediation_tasks
    delegate_to: orchestrator
```

### Execution Config

Laufzeitverhalten der Orchestrierung:

```yaml
execution:
  # Ausfuehrungsmodus
  # automatic:      Alles automatisch durchlaufen
  # phase-by-phase: Nach jeder Phase pausieren
  # task-by-task:   Nach jedem Task pausieren
  # selective:      Nur ausgewaehlte Tasks ausführen
  default_mode: phase-by-phase

  max_retries: 2                   # Retries vor Eskalation an User
  verify_after_each: true          # Acceptance Criteria nach jedem Task verifizieren
  track_progress: true             # Fortschritt in progress.md tracken
  parallel_within_phase: true      # Unabhaengige Tasks innerhalb einer Phase parallel
  task_timeout: 300                # Sekunden pro Task (0 = kein Timeout)

  # Bedingungen die Orchestrierung pausieren
  pause_on:
    - task_failure                  # Task fehlgeschlagen
    - dependency_missing            # Abhaengigkeit fehlt
    - standards_violation           # Standards-Verletzung
    - quality_gate_failed           # Quality Gate fehlgeschlagen
    - security_finding_critical     # Kritisches Security-Finding

  # Context-Window-Management
  context_optimization:
    selective_injection: true       # Nur relevante Standards injizieren
    summarize_completed: true       # Abgeschlossene Tasks zusammenfassen
    max_delegation_tokens: 8000    # Approximatives Token-Budget pro Delegation
```

### Fallback-Strategien

Definieren das Verhalten wenn Primaer-Delegation fehlschlaegt:

```yaml
fallbacks:
  # Agent nicht verfügbar
  agent_unavailable:
    architect:
      fallback_to: researcher
      reason: "Researcher kann analysieren aber keine ADRs produzieren"
      limitation: "Keine architektonische Autoritaet - Ergebnisse sind beratend"
    security:
      fallback_to: debug
      reason: "Debug hat vollen Zugriff für security-relevantes Code-Review"
      limitation: "Kein Zugriff auf trivy/grype/semgrep Scanning-Tools"
    devops:
      fallback_to: debug
      reason: "Debug hat vollen Dateisystem-Zugriff für Infrastruktur-Code"
      limitation: "Moegliche Luecken bei infrastrukturspezifischem Domain-Wissen"
    researcher:
      fallback_to: ask
      reason: "Ask kann im Read-Only-Modus erklaeren und analysieren"
      limitation: "Kein WebSearch/WebFetch für externe Recherche"
    ask:
      fallback_to: researcher
      reason: "Researcher hat aehnliche Read + Explain Capabilities"
      limitation: "Antworten koennten formeller/report-orientierter sein"
    debug:
      fallback_to: null
      reason: "Kein Fallback - Debug ist der primaere Implementor"
      escalation: user
    orchestrator:
      fallback_to: null
      reason: "Kein Fallback - Orchestrator ist einzigartiger Koordinator"
      escalation: user

  # Task fehlgeschlagen nach max_retries
  task_failure:
    strategy: escalate
    steps:
      - retry_with_additional_context     # Mehr Spec/Standards-Kontext hinzufuegen
      - retry_with_different_approach     # Delegation-Prompt umformulieren
      - escalate_to_user                  # Fehlschlag mit Diagnostics melden

  # Quality Gate fehlgeschlagen
  gate_failure:
    strategy: remediate
    steps:
      - identify_failing_checks           # Fehlende Checks identifizieren
      - create_remediation_tasks          # Behebungs-Tasks erstellen
      - delegate_remediation              # Behebung delegieren
      - re_run_gate                       # Gate erneut ausführen
    max_remediation_cycles: 2
    then: escalate_to_user
```

### Escalation und Konfliktloesung

```yaml
escalation:
  # Prioritaetsstufen
  levels:
    - name: info
      action: log_only
      notify: none
    - name: warning
      action: log_and_flag
      notify: progress_file
    - name: error
      action: pause_task
      notify: user
    - name: critical
      action: pause_orchestration
      notify: user

  # Konfliktloesung zwischen Agents
  agent_conflicts:
    # Wenn Architect und Security sich widersprechen
    architect_vs_security:
      priority: security                  # Security gewinnt per Default
      escalate_if: architect_flags_blocking_concern
      resolution: user_decision

    # Wenn Debug-Implementation von Architect-Spec abweicht
    debug_vs_architect:
      priority: architect                 # Spec-Autoritaet gewinnt
      action: debug_must_justify_divergence
      resolution: architect_reviews_justification

    # Wenn DevOps und Security bei Infrastruktur kollidieren
    devops_vs_security:
      priority: security                  # Security-Constraints sind nicht verhandelbar
      action: devops_proposes_alternative
      resolution: security_approves_alternative
```

---

## workflow/standards/index.yml

Die Standards-Registry dient dem intelligenten Matching basierend auf Task-Kontext.

### Format

```yaml
# Jeder Eintrag mappt zu: workflow/standards/{domain}/{topic}.md
# Skills laden automatisch von: .claude/skills/workflow/{domain}-standards/SKILL.md

global:
  tech-stack:
    description: Technology stack definitions, framework versions, and tooling choices
    tags: [technology, framework, tooling, infrastructure-choice]
  naming:
    description: Naming conventions for files, code identifiers, APIs, and git artifacts
    tags: [naming, convention, files, variables, endpoints]

devops:
  ci-cd:
    description: CI/CD pipeline conventions, GitHub Actions patterns, deployment workflows
    tags: [ci, cd, pipeline, github-actions, deployment]
  containerization:
    description: Docker multi-stage builds, security scanning, image optimization
    tags: [docker, container, image, registry]
  infrastructure:
    description: Infrastructure as Code patterns, Terraform, Kubernetes conventions
    tags: [terraform, kubernetes, iac, cloud, aws, hetzner]

agents:
  agent-conventions:
    description: Agent definition standards, permission models, skill formats
    tags: [agent, skill, permission, orchestration]

api:
  response-format:
    description: API response envelope structure, pagination, status codes
    tags: [api, response, json, http, rest, status-code]
  error-handling:
    description: Error hierarchy, error codes, logging levels, GDPR-compliant error responses
    tags: [error, exception, logging, error-code, gdpr]

database:
  migrations:
    description: Database migration naming, reversibility rules, safe schema change patterns
    tags: [database, migration, sql, schema, orm]

testing:
  coverage:
    description: Test coverage targets, test structure (AAA), CI integration, test data rules
    tags: [test, coverage, unit-test, integration, e2e, ci]

frontend:
  components:
    description: UI component structure, naming, accessibility, state management patterns
    tags: [component, ui, react, accessibility, a11y, state]
```

### Regeln

- Domaenen alphabetisch ordnen, dann Standards innerhalb jeder Domaene
- Descriptions sind ein kurzer Satz (verwendet für Matching, nicht für Dokumentation)
- Tags sind lowercase, mit Bindestrich getrennte Keywords
- Neue Standards immer über den Command `/workflow/index-standards` verwalten

### Verwaltung

Das Kommando `/workflow/index-standards` synchronisiert die Index-Datei mit den vorhandenen Standard-Dateien im Dateisystem. Es:

1. Scannt `workflow/standards/` nach allen `.md`-Dateien
2. Erkennt neue, geaenderte oder entfernte Standards
3. Aktualisiert Descriptions und Tags
4. Validiert das YAML-Format

---

## .claude/CLAUDE.md

Die Projektkontext-Datei, die Claude Code beim Start liest.

### Was drin steht

- Systemübersicht (was die Engine ist)
- Agent-Hierarchie-Diagramm
- Agent-Verzeichnis-Tabelle (Name, Zweck, Access-Level)
- Workflow-Command-Chain
- Context-Model-Beschreibung (3 Layers)
- Standards-Domaenen-Tabelle
- Pfade zu den wichtigsten Konfigurationsdateien
- GDPR/EU-Compliance-Hinweise

### Warum es wichtig ist

Diese Datei ist das, was Claude Code über das Multi-Agent-System informiert. Ohne sie weiss Claude weder, dass die Agents existieren, noch wie der Workflow funktioniert. Sie wird bei jedem Gespraech automatisch als Kontext geladen.

---

## .claude/settings.local.json

Die Berechtigungsdatei für Claude Code. Die Engine benoetigt folgende Tool-Berechtigungen:

### Erforderliche Berechtigungen

```json
{
  "permissions": {
    "allow": [
      "Agent(architect)",
      "Agent(ask)",
      "Agent(debug)",
      "Agent(devops)",
      "Agent(orchestrator)",
      "Agent(researcher)",
      "Agent(security)",
      "Skill(researcher)",
      "Skill(orchestrator)",
      "Skill(architect)",
      "Skill(ask)",
      "Skill(debug)",
      "Skill(devops)",
      "Skill(security)",
      "Bash(git clone:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(mkdir:*)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(docker:*)",
      "Bash(terraform:*)",
      "Bash(kubectl:*)",
      "Bash(helm:*)",
      "WebSearch",
      "WebFetch"
    ]
  }
}
```

### CLI-Verwaltung

Der `install`-Command der CLI merged diese Berechtigungen mit bestehenden. Der `health`-Command verifiziert ihre Praesenz. Du kannst Berechtigungen auch manuell hinzufuegen - das Format ist:

- `Agent(name)` -- Agent-Delegation erlauben
- `Skill(name)` -- Skill-Nutzung erlauben
- `Bash(command:*)` -- Spezifischen Bash-Befehl erlauben
- `WebSearch` / `WebFetch` -- Web-Zugriff erlauben

---

## Per-Spec orchestration.yml

Wenn `/workflow/create-tasks` ausgefuehrt wird, generiert es eine Spec-spezifische Orchestration-Konfiguration:

```
workflow/specs/{folder}/orchestration.yml
```

### Was /create-tasks generiert

Diese Datei enthaelt:

- Feature-Name und Spec-Folder-Referenz
- Task-Gruppen mit Agent-Zuweisungen
- Task-Dependencies (Abhaengigkeitsreihenfolge)
- Execution-Phasen
- Agent-Mapping-Overrides (falls abweichend vom globalen Mapping)
- Quality-Gate-Konfigurationen spezifisch für dieses Feature

### Inhalt

```yaml
feature: "Feature-Name"
spec_folder: workflow/specs/20250115-feature-name/

phases:
  - name: data_layer
    tasks: [task-1, task-2]
  - name: api_layer
    tasks: [task-3, task-4]
    depends_on: [data_layer]
  - name: frontend_layer
    tasks: [task-5]
    depends_on: [api_layer]
  - name: testing_layer
    tasks: [task-6, task-7]
    depends_on: [frontend_layer]

tasks:
  task-1:
    title: "Datenbank-Schema erstellen"
    agent: debug
    group: database
    standards: [database/migrations, global/naming]
    depends_on: []
  # ...
```

Diese Per-Spec-Konfiguration ist das, was `/workflow/orchestrate-tasks` liest, um zu wissen welche Tasks in welcher Reihenfolge delegiert werden.

---

## Umgebung und sensitive Dateien

Diese Dateien sind gitignored und dienen der lokalen Konfiguration:

| Datei | Zweck |
|-------|-------|
| `CLAUDE.local.md` | Persoenliche Praeferenzen, API-Keys, lokale Pfade |
| `*.local.md` | Agent-spezifische lokale Overrides |
| `.env*` | Umgebungsvariablen |
| `credentials.*` | Credentials (werden nie committet) |
| `secrets.*` | Secrets (werden nie committet) |
| `.workflow-state.json` | CLI-Installationszustand |
| `.workflow-health-report.json` | Health-Check-Ausgabe |

Alle sensitiven Dateien bleiben lokal. Die Engine macht keine externen API-Aufrufe und synct keine Daten in die Cloud (GDPR-konform).

---

## Haeufige Anpassungen

### Ausfuehrungsmodus aendern

In `workflow/orchestration.yml`:

```yaml
execution:
  # Optionen: automatic, phase-by-phase, task-by-task, selective
  default_mode: automatic   # Alles ohne Pause durchlaufen
```

- `automatic` -- Laeuft komplett durch, pausiert nur bei Fehlern
- `phase-by-phase` -- Pausiert nach jeder Phase zur Ueberpruefung
- `task-by-task` -- Pausiert nach jedem einzelnen Task
- `selective` -- Nur ausgewaehlte Tasks ausführen

### Task Timeout erhoehen

```yaml
execution:
  task_timeout: 600   # 10 Minuten statt der Standard-5-Minuten
```

Setze auf `0` für kein Timeout (nicht empfohlen in Produktionsumgebungen).

### Quality Gate deaktivieren

```yaml
quality_gates:
  gate_1_pre_implementation:
    blocking: false   # Gate laeuft noch, blockiert aber nicht mehr
```

Du kannst auch einzelne Checks entfernen statt das gesamte Gate zu deaktivieren:

```yaml
quality_gates:
  gate_1_pre_implementation:
    reviewers:
      - agent: architect
        checks:
          - spec_architecturally_sound
          # dependencies_identified entfernt - nicht mehr geprueft
          - tech_stack_aligned
```

### Neue Standards-Domaene hinzufuegen

1. Verzeichnis erstellen:

```bash
mkdir -p workflow/standards/neue-domaene/
```

2. Standard-Datei anlegen:

```bash
# workflow/standards/neue-domaene/mein-standard.md erstellen
```

3. `config.yml` aktualisieren:

```yaml
context_model:
  standards:
    domains:
      - global
      - devops
      - agents
      - api
      - database
      - frontend
      - testing
      - neue-domaene    # Neu hinzugefügt
```

4. Index aktualisieren:

```bash
# /workflow/index-standards ausführen
```

5. Domain-Mapping in `orchestration.yml` hinzufuegen:

```yaml
standards_injection:
  domain_mapping:
    # ... bestehende Mappings ...
    neue-domaene: [neue-domaene/mein-standard]

task_groups:
  mein-task-typ:
    primary_agent: debug
    standards: [neue-domaene/mein-standard]
```

### Datenresidenz aendern

In `workflow/config.yml`:

```yaml
gdpr:
  data_residency: eu-west-1   # Irland statt Frankfurt
```

Verfuegbare EU-Regionen:

| Region | Standort |
|--------|----------|
| `eu-central-1` | Frankfurt (Standard) |
| `eu-west-1` | Irland |
| `eu-west-2` | London |
| `eu-west-3` | Paris |
| `eu-south-1` | Mailand |
| `eu-north-1` | Stockholm |

---

## .claude-plugin/plugin.json

Das Plugin-Manifest buendelt alle 6 Schichten der Engine in ein Claude-Code-Plugin:

```json
{
  "name": "claude-workflow-engine",
  "version": "0.2.7",
  "description": "Multi-Agent Workflow System",
  "author": "LL4nc33",
  "license": "MIT",
  "commands": "./.claude/commands",
  "agents": "./.claude/agents",
  "skills": "./.claude/skills",
  "hooks": "./hooks/hooks.json"
}
```

### Wirkung

Claude Code erkennt das Plugin automatisch beim Start. Das Manifest referenziert Commands, Agents, Skills und Hooks -- Claude laedt diese Komponenten entsprechend.

---

## hooks/hooks.json

Die Hook-Konfiguration definiert Event-basierte Automatisierung:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.sh",
      "timeout": 10000
    },
    {
      "event": "PreToolUse",
      "matcher": {"tool_name": ["Write", "Edit"]},
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-write-validate.sh",
      "timeout": 5000
    },
    {
      "event": "PostToolUse",
      "matcher": {"tool_name": ["Write", "Edit"]},
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-write-log.sh",
      "timeout": 5000
    }
  ]
}
```

### Implementierte Hooks

| Hook | Event | Funktion |
|------|-------|----------|
| SessionStart | Session-Beginn | Prueft Standards-Aktualitaet, gibt Workflow-Kontext zurück |
| PreToolUse | Vor Write/Edit | Secrets-Schutz (blockiert .env, credentials.*, secrets.*, *.local.md) |
| PostToolUse | Nach Write/Edit | Loggt Dateiname + Zeitstempel bei aktiver Orchestrierung (GDPR-konform) |

### Hook-Scripts

Alle Scripts liegen in `hooks/scripts/`:

| Script | Funktion |
|--------|----------|
| `session-start.sh` | Kontext-Check und Workflow-Status |
| `pre-write-validate.sh` | Secrets-Pattern-Erkennung |
| `post-write-log.sh` | Aenderungs-Logging in delegation.log |
| `common.sh` | Shared Utilities (get_project_root, json_escape, etc.) |

Siehe [Hook-Patterns Skill](../docs/plattform-architektur.md#layer-5-hooks) für Details und Debugging-Tipps.

---

## MCP-Server (optional)

MCP-Server erweitern die Agent-Fähigkeiten um semantische Code-Analyse und PR-Management.

### Empfohlene Server

| Server | Funktion | Genutzt von |
|--------|----------|-------------|
| **Serena** | Language-Server-basierte Code-Navigation | architect, researcher, debug, ask |
| **Greptile** | PR-Management und Code-Review | orchestrator, security |

### Konfiguration in config.yml

```yaml
# MCP-Server sind optional und werden NICHT im Repository ausgeliefert.
# Konfiguration erfolgt lokal per Claude Code MCP-Settings.
mcp:
  recommended_servers:
    - name: serena
      purpose: Semantic code analysis via Language Server
      setup: Create .serena/ configuration in project
    - name: greptile
      purpose: PR management and code review
      setup: Configure Greptile MCP server with API key
```

### Fallback-Verhalten

Wenn ein MCP-Server nicht verfügbar ist, fallen Agents automatisch auf Standard-Tools zurück:
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

---

## Siehe auch

- [Standards](standards.md) -- Wie du Standards schreibst und verwaltest
- [Agenten](agenten.md) -- Agent-Capabilities und MCP-Tools
- [CLI-Referenz](cli.md) -- Commands die diese Dateien verwalten
- [Workflow-Leitfaden](workflow.md) -- Wie Konfiguration den Workflow beeinflusst
- [Plattform-Architektur](plattform-architektur.md) -- 6-Schichten-Architektur im Detail
