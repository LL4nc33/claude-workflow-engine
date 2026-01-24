# FAQ und Troubleshooting

Hier findest du Antworten auf die haeufigsten Fragen zur Claude Workflow Engine.
Wenn dein Problem hier nicht abgedeckt ist, pruefe die verlinkten Detailseiten oder
erstelle ein Issue im Repository.

---

## Setup

### 1. Welche Voraussetzungen brauche ich?

Du brauchst folgende Tools auf deinem System:

- **Node.js >= 18** (fuer die CLI)
- **Claude Code CLI** (als Runtime fuer die Agents)
- **Git** (fuer Versionskontrolle und Standards-Management)

Pruefe deine Installation:

```bash
node --version    # >= 18.0.0
claude --version  # Claude Code CLI muss installiert sein
git --version     # beliebige aktuelle Version
```

Falls Node.js fehlt oder veraltet ist, empfiehlt sich die Installation via `nvm`:

```bash
nvm install 18
nvm use 18
```

---

### 2. Wie installiere ich die Workflow Engine in mein bestehendes Projekt?

Verwende den `workflow install` Befehl mit `--dry-run` um zuerst zu sehen, was passiert:

```bash
# Vorschau der geplanten Aenderungen
workflow install --dry-run

# Tatsaechliche Installation
workflow install
```

Der Installer erstellt folgende Struktur in deinem Projekt:

```
.claude/
  agents/           # Agent-Definitionen
  settings.local.json
workflow/
  config.yml        # Hauptkonfiguration
  orchestration.yml # Orchestrierung
  standards/        # Standards nach Domain
  product/          # Produktkontext (mission, roadmap, architecture)
  specs/            # Feature-Spezifikationen
```

Bestehende Dateien werden nie ueberschrieben. Bei Konflikten zeigt die CLI eine `CONFLICT`-Warnung (siehe Troubleshooting weiter unten).

---

### 3. Kann ich die Engine ohne CLI nutzen?

Ja, das ist moeglich. Du kannst die Dateien manuell einrichten:

1. Kopiere die Verzeichnisstruktur (`workflow/`, `.claude/agents/`) in dein Projekt
2. Erstelle oder passe die `CLAUDE.md` im Projekt-Root an
3. Registriere die Standards in `workflow/standards/index.yml`
4. Konfiguriere `workflow/config.yml` fuer dein Projekt

Der Nachteil: Du verlierst CLI-Features wie `--dry-run`, automatische Konflikterkennung, und `workflow check`. Die manuelle Einrichtung eignet sich vor allem fuer Sonderfaelle oder wenn du die Struktur stark anpassen willst.

---

### 4. Funktioniert das auch ohne Claude Code?

Nein. Die Agents sind als Claude Code Subagents implementiert und benoetigen die Claude Code Runtime. Konkret:

- Agent-Definitionen in `.claude/agents/` werden von Claude Code als Subagents geladen
- Das `Task`-Tool fuer Agent-Delegation ist ein Claude Code Feature
- Slash-Commands (`/plan-product`, `/shape-spec`, etc.) sind Claude Code Commands

Ohne Claude Code kannst du die Standards und Specs als reine Dokumentation nutzen, aber die Agent-Orchestrierung funktioniert nicht.

---

## Workflow

### 5. Muss ich immer alle 5 Phasen durchlaufen?

Nein. Die Phasen bauen aufeinander auf, aber du kannst einsteigen wo es Sinn macht:

| Situation | Starte mit |
|-----------|-----------|
| Neues Projekt, keine Produktvision | `/plan-product` |
| Product existiert, neues Feature | `/shape-spec` |
| Shape ist schon klar, nur Spec fehlt | `/write-spec` |
| Spec existiert, brauche Tasks | `/create-tasks` |
| Tasks sind definiert, nur ausfuehren | `/orchestrate-tasks` |

Beachte: Spaetere Phasen erwarten bestimmte Artefakte. Wenn du `/create-tasks` startest, muss eine `spec.md` im Spec-Ordner vorhanden sein.

---

### 6. Kann ich einen laufenden Workflow abbrechen?

Ja. Du kannst jederzeit abbrechen (Ctrl+C oder Session beenden). Alle bisher erzeugten Artefakte bleiben erhalten:

- Bereits geschriebene Specs, Shapes, Tasks bleiben in `workflow/specs/{folder}/`
- Der Fortschritt steht in `progress.md`
- Du kannst spaeter an der gleichen Stelle weiterarbeiten

Es gibt keinen "korrupten Zustand" -- die Engine ist idempotent. Wiederholtes Ausfuehren einer Phase ueberschreibt die vorherigen Artefakte in diesem Ordner.

---

### 7. Was passiert wenn eine Phase fehlschlaegt?

Die Engine pausiert und zeigt eine Fehlermeldung mit Kontext:

```
[ERROR] Phase 'write-spec' failed: quality gate 'gate_1_pre_implementation' not passed
  - Check: spec_architecturally_sound -> FAILED
  - Reason: Missing dependency analysis for database layer
  - Action: Ergaenze die Spec um Datenbank-Abhaengigkeiten und starte erneut
```

Du kannst:
1. Das Problem beheben und die Phase erneut starten
2. Den Quality Gate manuell ueberschreiben (wenn `allow_override: true` konfiguriert ist)
3. Zurueck zur vorherigen Phase gehen und dort nachbessern

---

### 8. Wie verknuepfe ich mehrere Features?

Jedes Feature bekommt seinen eigenen Ordner unter `workflow/specs/`:

```
workflow/specs/
  20250115-user-auth/
    shape.md
    spec.md
    tasks.md
  20250120-payment-integration/
    shape.md
    spec.md
    tasks.md
```

Features sind voneinander unabhaengig. Wenn Feature B von Feature A abhaengt, dokumentiere das in der `spec.md` von Feature B unter "Prerequisites" oder "Dependencies". Die Engine erzwingt keine Feature-Reihenfolge -- das ist eine bewusste Designentscheidung.

---

## Agents

### 9. Kann ich eigene Agents erstellen?

Ja. Erstelle eine Markdown-Datei in `.claude/agents/` mit Frontmatter fuer die Konfiguration:

```markdown
---
name: my-custom-agent
access: read-only
tools:
  - Read
  - Grep
  - Glob
---

# Mein Custom Agent

## Aufgabe
[Beschreibung was der Agent tut]

## Methodik
[Wie der Agent vorgeht]
```

Registriere den Agent anschliessend in `workflow/config.yml` unter `agents.available` und in `workflow/orchestration.yml` unter `agents.registry`. Fuer eine detaillierte Anleitung siehe den How-To Guide [Eigenen Agent erstellen](how-to/eigenen-agent-erstellen.md).

---

### 10. Warum darf der Architect-Agent nichts schreiben?

Das ist ein bewusstes Design-Prinzip: **Separation of Concerns**.

- Der Architect **entwirft** (Specs, ADRs, Reviews) -- aber implementiert nicht
- Der Debug-Agent **implementiert** -- aber trifft keine architektonischen Entscheidungen
- Der Orchestrator **delegiert** -- aber fuehrt selbst keine Tasks aus

Wenn der Architect schreiben duerfte, koennten architektonische Reviews und gleichzeitige Code-Aenderungen zu unkontrollierten Zustaenden fuehren. Die Trennung sorgt dafuer, dass jede Aenderung durch den vorgesehenen Kanal (Debug-Agent mit Standards-Injection) laeuft.

---

### 11. Wie kommunizieren die Agents untereinander?

Agents kommunizieren **nicht direkt** miteinander. Die Kommunikation laeuft ausschliesslich ueber den Orchestrator:

```
Orchestrator --[Task-Tool]--> Debug-Agent
Orchestrator --[Task-Tool]--> Security-Agent
Orchestrator <--[Ergebnis]--- Debug-Agent
```

Der Orchestrator:
1. Liest die Task-Definition und zugehoerige Standards
2. Formuliert einen Delegation-Prompt (mit Standards-Injection)
3. Delegiert via `Task`-Tool an den zustaendigen Agent
4. Empfaengt das Ergebnis und aktualisiert `progress.md`
5. Delegiert den naechsten Task basierend auf dem Ergebnis

Es gibt keine direkte Agent-zu-Agent-Kommunikation. Das verhindert unkontrollierte Seiteneffekte.

---

### 12. Kann ich Agent-Zugriffsrechte anpassen?

Ja. Die Zugriffsrechte werden an zwei Stellen definiert:

1. **In der Agent-Datei** (`.claude/agents/{name}.md`):
   ```yaml
   ---
   access: full  # Optionen: read-only, full, restricted, task-delegation
   tools:
     - Read
     - Write
     - Edit
     - Bash
   ---
   ```

2. **In `orchestration.yml`** unter `agents.registry`:
   ```yaml
   my-agent:
     access: full
     tools: [Read, Write, Edit, Bash, Grep, Glob]
   ```

Beide muessen konsistent sein. Die Tools in der Agent-Datei bestimmen, was Claude Code dem Agent tatsaechlich erlaubt.

---

## Standards

### 13. Was ist der Unterschied zwischen Standards und Specs?

| Aspekt | Standards | Specs |
|--------|-----------|-------|
| **Zweck** | HOW (wie wird gebaut) | WHAT NEXT (was wird gebaut) |
| **Lebensdauer** | Langlebig, projektuebergreifend | Einmalig pro Feature |
| **Pfad** | `workflow/standards/` | `workflow/specs/{feature}/` |
| **Beispiel** | "API-Responses haben immer ein `data`-Envelope" | "User-Auth braucht Login, Register, Password-Reset" |
| **Wer nutzt sie** | Alle Agents (via Injection) | Orchestrator und zustaendiger Agent |

Standards definieren die Qualitaetsregeln. Specs definieren was konkret umgesetzt wird. Ein Feature-Spec referenziert relevante Standards, aber Standards referenzieren nie einzelne Specs.

---

### 14. Wie erstelle ich eine neue Standards-Domain?

Drei Schritte:

1. **Ordner anlegen:**
   ```bash
   mkdir -p workflow/standards/my-domain
   ```

2. **Standard-Datei erstellen** (z.B. `workflow/standards/my-domain/my-topic.md`):
   ```markdown
   # My Topic Standard

   ## Konventionen
   - Regel 1: ...
   - Regel 2: ...

   ## Beispiele
   ...
   ```

3. **In `workflow/standards/index.yml` registrieren:**
   ```yaml
   my-domain:
     my-topic:
       description: Beschreibung des Standards
       tags: [relevante, tags, fuer, matching]
   ```

4. **Standards-Zuordnung in `orchestration.yml`** ergaenzen:
   ```yaml
   standards_injection:
     domain_mapping:
       my-domain:
         - my-domain/my-topic
   ```

Fuer eine ausfuehrliche Anleitung siehe [Standards erweitern](how-to/standards-erweitern.md).

---

### 15. Werden Standards automatisch injiziert?

Ja, basierend auf der Konfiguration in `workflow/orchestration.yml`:

- `always_inject` Standards werden bei **jeder** Delegation eingefuegt (z.B. `global/tech-stack`)
- `domain_mapping` bestimmt welche Standards fuer welchen Task-Typ geladen werden
- Die `task_groups` in `orchestration.yml` definieren welche Standards pro Task-Gruppe relevant sind

Beispiel: Ein Backend-Task bekommt automatisch:
```
global/tech-stack (always_inject)
global/naming (domain_mapping: backend)
api/response-format (domain_mapping: backend)
api/error-handling (domain_mapping: backend)
```

Die Injection passiert inline -- der Standard-Inhalt wird direkt in den Delegation-Prompt eingefuegt, da Subagents keine Dateipfade aufloesen koennen.

---

## CLI

### 16. Warum schlaegt 'workflow install' fehl?

Haeufige Ursachen und Loesungen:

**Node.js-Version zu alt:**
```bash
node --version
# Falls < 18: nvm install 18 && nvm use 18
```

**Fehlende Schreibrechte:**
```bash
# Pruefe Berechtigungen im Zielverzeichnis
ls -la .
# Falls noetig: sudo chown -R $USER:$USER .
```

**Bestehende Dateien mit Konflikten:**
```bash
# Zeigt Konflikte an
workflow check --type conflicts

# Optionen:
workflow install --force      # Ueberschreibt bestehende Dateien
workflow install --merge      # Versucht zu mergen
workflow install --skip       # Ueberspringt Konflikte
```

**CLAUDE.md existiert bereits:**
Die CLI fuegt den Workflow-Abschnitt an bestehende CLAUDE.md-Dateien an, statt sie zu ueberschreiben. Falls die Datei gesperrt ist oder unerwartete Inhalte hat, pruefe sie manuell.

---

### 17. Was macht --dry-run genau?

`--dry-run` simuliert den Befehl ohne Aenderungen am Dateisystem:

```bash
workflow install --dry-run
```

Ausgabe:
```
[DRY-RUN] Would create: .claude/agents/architect.md
[DRY-RUN] Would create: .claude/agents/debug.md
[DRY-RUN] Would create: workflow/config.yml
[DRY-RUN] Would create: workflow/standards/global/tech-stack.md
[DRY-RUN] Would modify: CLAUDE.md (append workflow section)
[DRY-RUN] Would skip: .gitignore (already contains patterns)

Summary: 12 files to create, 1 to modify, 1 skipped
No changes were made.
```

Das ist besonders nuetzlich bei bestehenden Projekten, um vor der Installation zu verstehen was passiert.

---

### 18. Wie deinstalliere ich die Engine?

**Option A: CLI Rollback** (empfohlen)
```bash
workflow rollback
```
Dies entfernt alle von `workflow install` erstellten Dateien und stellt den vorherigen Zustand wieder her (sofern ein Backup existiert).

**Option B: Manuelles Entfernen**
```bash
# Workflow-Verzeichnis entfernen
rm -rf workflow/

# Agent-Definitionen entfernen
rm -rf .claude/agents/

# CLAUDE.md bereinigen (Workflow-Abschnitt manuell entfernen)
# Oder komplett entfernen falls sie nur Workflow-Inhalte hat:
rm CLAUDE.md
```

Beachte: `workflow rollback` entfernt nur die Engine-Dateien, nicht deine Specs oder Produktdaten. Diese musst du bei Bedarf manuell loeschen.

---

## Troubleshooting

### 19. Agent reagiert nicht wie erwartet

**Symptom:** Ein Agent ignoriert Standards, gibt unerwartete Antworten, oder verhaelt sich anders als definiert.

**Diagnose-Schritte:**

1. **CLAUDE.md pruefen** -- Ist die Projekt-Konfiguration korrekt geladen?
   ```bash
   # Ist die CLAUDE.md im richtigen Verzeichnis?
   ls -la CLAUDE.md .claude/CLAUDE.md
   ```

2. **Agent-Definition pruefen** -- Stimmen Tools und Access-Level?
   ```bash
   # Agent-Datei lesen
   cat .claude/agents/{agent-name}.md
   ```

3. **Standards-Injection pruefen** -- Werden die richtigen Standards injiziert?
   ```bash
   # Pruefe orchestration.yml: task_groups und standards_injection
   grep -A5 "standards:" workflow/orchestration.yml
   ```

4. **Kontext-Ueberlauf** -- Zu viele Standards koennen den Kontext sprengen:
   ```yaml
   # In orchestration.yml:
   context_optimization:
     max_delegation_tokens: 8000  # Ggf. erhoehen
   ```

5. **Agent-Definition aktualisieren** -- Nach Aenderungen an der Agent-Datei muss eine neue Claude Code Session gestartet werden.

---

### 20. Workflow-Artefakte sind leer

**Symptom:** `shape.md`, `spec.md` oder `tasks.md` werden erstellt, sind aber leer oder haben nur minimalen Inhalt.

**Ursachen und Loesungen:**

1. **Zu wenig Input in der Phase:**
   Die Phasen sind interaktiv. Je mehr Kontext du gibst, desto besser das Ergebnis:
   ```
   # Schlecht:
   /shape-spec "User Login"

   # Besser:
   /shape-spec "User Login mit OAuth2 (Google, GitHub),
     E-Mail/Passwort als Fallback, 2FA optional,
     Session-Management mit JWT, Refresh-Tokens,
     GDPR-konformes Consent-Handling"
   ```

2. **Fehlender Produktkontext:**
   Pruefe ob `workflow/product/mission.md` und `workflow/product/architecture.md` existieren und Inhalt haben. Ohne Produktkontext fehlt den Agents die Grundlage.

3. **Standards nicht registriert:**
   Wenn `index.yml` leer ist oder die relevanten Domains fehlen, haben die Agents keine Leitplanken.

---

### 21. CLI zeigt 'CONFLICT' Warnung

**Symptom:**
```
[CONFLICT] workflow/config.yml already exists with different content
[CONFLICT] .claude/agents/debug.md has local modifications
```

**Loesung:**

```bash
# Zeige alle Konflikte im Detail
workflow check --type conflicts

# Optionen zur Aufloesung:
workflow resolve              # Interaktiver Merge
workflow resolve --theirs     # Engine-Version uebernehmen
workflow resolve --ours       # Lokale Version behalten
workflow install --force      # Alles ueberschreiben (Vorsicht!)
```

Konflikte entstehen typischerweise wenn:
- Du Agent-Definitionen manuell geaendert hast und ein Update installierst
- Mehrere Teammitglieder die Engine unterschiedlich konfiguriert haben
- Eine aeltere Engine-Version installiert ist und du aktualisierst

---

### 22. Standards werden nicht angewandt

**Symptom:** Der delegierte Agent ignoriert offensichtlich die Standards (z.B. falsches Response-Format, fehlende Error-Codes).

**Diagnose:**

1. **Registrierung pruefen:**
   ```bash
   # Ist der Standard in index.yml registriert?
   grep "my-standard" workflow/standards/index.yml
   ```

2. **Zuordnung pruefen:**
   ```bash
   # Ist der Standard einer Task-Gruppe zugeordnet?
   grep -A10 "domain_mapping:" workflow/orchestration.yml
   ```

3. **Injection-Methode pruefen:**
   Die Standards muessen `inline` injiziert werden (Standard-Einstellung). Subagents koennen keine Dateipfade aufloesen:
   ```yaml
   # In orchestration.yml:
   standards_injection:
     method: inline  # MUSS inline sein fuer Subagents
   ```

4. **Max-Limit pruefen:**
   ```yaml
   optimization:
     max_standards_per_task: 5  # Ggf. erhoehen wenn mehr Standards noetig
   ```

5. **Standard-Datei pruefen:**
   Ist der Inhalt der Standard-Datei klar und eindeutig formuliert? Vage Standards werden vage umgesetzt.

---

## Weitergehende Informationen

- [Erste Schritte](erste-schritte.md) -- Schnellstart-Anleitung
- [CLI-Referenz](cli.md) -- Alle CLI-Befehle im Detail
- [Workflow Guide](workflow.md) -- Die 5 Phasen im Detail
- [Agenten](agenten.md) -- Alle 7 Agents mit Faehigkeiten und Konfiguration
- [Standards](standards.md) -- Standards-System und Domain-Uebersicht
- [Konfiguration](konfiguration.md) -- config.yml und orchestration.yml Referenz
- How-Tos:
  - [Feature entwickeln](how-to/neues-feature-entwickeln.md)
  - [Eigenen Agent erstellen](how-to/eigenen-agent-erstellen.md)
  - [Standards erweitern](how-to/standards-erweitern.md)
  - [CLI Installation](how-to/cli-installation.md)
