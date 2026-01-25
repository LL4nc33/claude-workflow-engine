<div align="center">

# 🤖 Claude Workflow Engine

[![Version](https://img.shields.io/badge/version-0.2.8-blue.svg)](https://github.com/LL4nc33/claude-workflow-engine/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-purple.svg)](https://claude.com/claude-code)
[![DSGVO](https://img.shields.io/badge/DSGVO-konform-success.svg)](#datenschutz)

**Ein Multi-Agent Workflow-System für Claude Code**

*7 spezialisierte Agenten · 5-Phasen Workflow · Self-Learning · Token-Optimiert*

[Schnellstart](#-schnellstart) · [Features](#-features) · [Dokumentation](#-dokumentation) · [Use Cases](#-use-cases)

</div>

---

## ✨ Highlights

<table>
<tr>
<td width="50%">

### 🧠 Context Isolation
Agents arbeiten in isolierten Kontexten — dein Main Chat bleibt schlank und schnell.

### ⚡ Zero-Config Start
`/workflow:smart-workflow` erkennt deine aktuelle Phase automatisch und führt dich durch.

### 🔒 DSGVO-Konform
100% lokal, keine Cloud-Sync, EU-Hosting-ready. Deine Daten bleiben bei dir.

</td>
<td width="50%">

### 📉 Token-Optimiert
TOON-Format spart ~40% Tokens bei API-Responses. Mehr Context, weniger Kosten.

### 🎓 Self-Learning
NaNo beobachtet deine Workflow-Patterns und schlägt Verbesserungen vor.

### 👥 7 Spezialisten
Jeder Agent hat klare Expertise statt "one size fits all".

</td>
</tr>
</table>

---

## 📑 Inhaltsverzeichnis

<details>
<summary>Klicken zum Öffnen</summary>

- [Highlights](#-highlights)
- [Schnellstart](#-schnellstart)
- [Features](#-features)
  - [Agenten](#-7-spezialisierte-agenten)
  - [Workflow](#-workflow-optionen)
  - [Standards](#-standards-system)
- [Architektur](#-architektur)
- [CLI Installation](#-cli-installation)
- [Datenschutz](#-datenschutz)
- [Use Cases](#-use-cases)
- [Dokumentation](#-dokumentation)
- [Contributing](#-contributing)
- [License](#-license)

</details>

---

## 🚀 Schnellstart

```bash
# Option 1: Smart-Workflow (empfohlen)
/workflow:smart-workflow

# Option 2: Quick-Mode für MVPs
/workflow:quick

# Option 3: Hilfe anzeigen
/workflow:help
```

> **Tipp:** Shortcuts verfügbar: `sw`, `q`, `h`

---

## 🎯 Features

### 👥 7 Spezialisierte Agenten

<table>
<tr>
<th>Agent</th>
<th>Expertise</th>
<th>Zugriff</th>
<th>Beispiel</th>
</tr>
<tr>
<td>🏗️ <b>Architect</b></td>
<td>System Design, ADRs, API Review</td>
<td><code>READ-ONLY</code></td>
<td><i>"Wie soll ich X architektonisch aufbauen?"</i></td>
</tr>
<tr>
<td>❓ <b>Ask</b></td>
<td>Erklärungen, Tutorials, Walkthroughs</td>
<td><code>READ-ONLY</code></td>
<td><i>"Wie funktioniert Y?"</i></td>
</tr>
<tr>
<td>🔧 <b>Debug</b></td>
<td>Bug Investigation, Implementierung</td>
<td><code>FULL</code></td>
<td><i>"Finde und behebe diesen Bug"</i></td>
</tr>
<tr>
<td>🚢 <b>DevOps</b></td>
<td>CI/CD, Docker, Kubernetes, IaC</td>
<td><code>FULL</code></td>
<td><i>"Richte CI/CD ein"</i></td>
</tr>
<tr>
<td>🎭 <b>Orchestrator</b></td>
<td>Task Delegation, Koordination</td>
<td><code>DELEGATE</code></td>
<td><i>"Verteile diese Tasks"</i></td>
</tr>
<tr>
<td>🔬 <b>Researcher</b></td>
<td>Codebase-Analyse, Dokumentation</td>
<td><code>READ-ONLY</code></td>
<td><i>"Was macht dieser Code?"</i></td>
</tr>
<tr>
<td>🛡️ <b>Security</b></td>
<td>OWASP Audits, Vulnerability Assessment</td>
<td><code>READ-ONLY</code></td>
<td><i>"Ist das sicher?"</i></td>
</tr>
</table>

---

### 📋 Workflow-Optionen

<details>
<summary><b>🚀 Quick-Mode</b> — Für MVPs & kleine Features</summary>

```bash
/workflow:quick    # 3-Step: Plan → Spec → Build
```

Schneller Einstieg ohne viel Setup. Ideal für Prototypen.

</details>

<details>
<summary><b>⚡ Smart-Workflow</b> — Auto-Detection (empfohlen)</summary>

```bash
/workflow:smart-workflow    # Erkennt Phase automatisch
```

Das System analysiert deinen Projektstand und führt dich durch den passenden nächsten Schritt.

</details>

<details>
<summary><b>📋 5-Phasen-Workflow</b> — Volle Kontrolle</summary>

```bash
/workflow:plan-product        # Phase 1: Produktvision definieren
/workflow:shape-spec          # Phase 2: Anforderungen erfassen
/workflow:write-spec          # Phase 3: Technische Spec erstellen
/workflow:create-tasks        # Phase 4: Tasks generieren
/workflow:orchestrate-tasks   # Phase 5: An Agenten delegieren
```

Für Production-Features mit vollständiger Dokumentation.

</details>

<details>
<summary><b>🛠️ Utilities</b> — Hilfs-Commands</summary>

```bash
/workflow:help           # Kontextuelle Hilfe
/workflow:undo           # Git-basierte Revertierung
/workflow:release        # Version Bump + Changelog + Tag
/workflow:web-setup      # Web-Access-Layer konfigurieren
/workflow:visual-clone   # Website-Design extrahieren
```

</details>

<details>
<summary><b>🧠 NaNo Learning</b> — Self-Improvement</summary>

```bash
/workflow:nano-toggle        # NaNo ein/ausschalten
/workflow:homunculus-status  # Learning Status anzeigen
/workflow:learning-report    # Analyse-Report
/workflow:review-candidates  # Verbesserungsvorschläge reviewen
```

NaNo beobachtet deine Workflow-Patterns und schlägt Optimierungen vor.

</details>

---

### 📐 Standards System

<table>
<tr>
<td>📊 <b>17 Standards</b></td>
<td>in 8 Domänen: Global, DevOps, Agents, API, Database, Frontend, Testing, CLI</td>
</tr>
<tr>
<td>🔄 <b>Auto-Injection</b></td>
<td>Relevante Standards werden kontextbasiert als Skills geladen</td>
</tr>
<tr>
<td>🏷️ <b>Tag-Matching</b></td>
<td>Standards werden anhand der Aufgabe automatisch angewendet</td>
</tr>
<tr>
<td>➕ <b>Erweiterbar</b></td>
<td>Eigene Standards für projektspezifische Konventionen</td>
</tr>
</table>

---

## 🏛️ Architektur

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 6: Plugin Packaging (.claude-plugin/plugin.json)    │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Hooks (hooks/hooks.json) — 5 Event-Hooks         │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Agents (.claude/agents/) — 7 Spezialisten        │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Skills (.claude/skills/) — 13 Context-Skills     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Commands (.claude/commands/) — 23 Slash-Commands │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: CLAUDE.md — Projekt-Instruktionen                │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 CLI Installation

```bash
# 1. Repository klonen
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine

# 2. CLI bauen
cd cli && npm install && npm run build && cd ..

# 3. In dein Projekt installieren
./cli/dist/index.js install /pfad/zu/deinem/projekt
```

<details>
<summary>Profile verfügbar</summary>

| Profil | Tech-Stack |
|--------|------------|
| `default` | Generisch |
| `node` | Node.js 18+, TypeScript, ESLint |
| `python` | Python 3.11+, Poetry, Ruff |
| `rust` | Rust stable, Cargo, clippy |

```bash
./cli/dist/index.js install --profile node /pfad/zu/projekt
```

</details>

---

## 🔒 Datenschutz

<table>
<tr>
<td>✅</td>
<td><b>100% Lokal</b> — Keine Cloud-Synchronisation, alle Daten bleiben auf deinem Rechner</td>
</tr>
<tr>
<td>✅</td>
<td><b>EU-Ready</b> — DSGVO-konform, für EU Data Residency vorbereitet</td>
</tr>
<tr>
<td>✅</td>
<td><b>Keine PII</b> — Keine personenbezogenen Daten in Standards oder Specs</td>
</tr>
<tr>
<td>✅</td>
<td><b>Gitignored</b> — Sensitive Configs in <code>*.local.md</code> (automatisch ignoriert)</td>
</tr>
</table>

---

## 💡 Use Cases

<details>
<summary><b>🆕 Neues Feature entwickeln</b></summary>

```bash
/workflow:smart-workflow
# → Erkennt: Kein aktives Spec
# → Führt durch: shape-spec → write-spec → create-tasks → orchestrate
```

</details>

<details>
<summary><b>🐛 Bug fixen</b></summary>

```bash
"Fixe den Login-Bug in auth.ts"
# → Auto-Delegation an Debug-Agent
# → Agent untersucht, fixt, testet
```

</details>

<details>
<summary><b>📖 Code verstehen</b></summary>

```bash
"Erkläre mir wie das Payment-System funktioniert"
# → Auto-Delegation an Ask-Agent
# → Agent analysiert und erklärt
```

</details>

<details>
<summary><b>🔐 Security Audit</b></summary>

```bash
"Prüfe die API auf Sicherheitslücken"
# → Auto-Delegation an Security-Agent
# → OWASP-Check, Vulnerability Report
```

</details>

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [Erste Schritte](docs/erste-schritte.md) | Einstieg und Grundlagen |
| [Workflow Guide](docs/workflow.md) | 5-Phasen-Workflow im Detail |
| [Agenten](docs/agenten.md) | Alle 7 Agenten erklärt |
| [Standards](docs/standards.md) | Standards-System verstehen |
| [Konfiguration](docs/konfiguration.md) | Anpassungen und Einstellungen |
| [FAQ](docs/faq.md) | Häufige Fragen |

**English:** [docs/en/](docs/en/)

---

## 🤝 Contributing

Contributions sind willkommen! Bitte lies zuerst [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
# Fork, Clone, Branch
git checkout -b feature/mein-feature

# Entwickeln, Testen
/workflow:smart-workflow

# PR erstellen
gh pr create
```

---

## 📄 License

MIT License — siehe [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for the Claude Code Community**

[⬆ Nach oben](#-claude-workflow-engine)

</div>
