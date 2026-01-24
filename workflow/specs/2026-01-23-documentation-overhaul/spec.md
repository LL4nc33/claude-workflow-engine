# Technical Specification: Documentation Overhaul

## Overview

**Status:** Ready for implementation
**Created:** 2026-01-23
**Spec Folder:** workflow/specs/2026-01-23-documentation-overhaul/

## Summary

Komplette Überarbeitung der Projektdokumentation: README neu schreiben, alle 7 bestehenden Docs überarbeiten (professionell-technisch + Tutorial-Stil), 4 neue Dokumente erstellen (How-To Guides, Use-Case Beispiele, Best Practices, FAQ), Credits korrigieren, zweisprachig (Deutsch primär, Englisch sekundär unter docs/en/).

## Scope

### In Scope
- README.md komplett neu (Deutsch)
- README_EN.md (Englische Version)
- 7 bestehende Docs überarbeiten und auf Deutsch übersetzen
- 4 How-To Guides (neues Feature, eigener Agent, Standards erweitern, CLI-Installation)
- 5 Use-Case Beispiele (API Feature, Bugfix, Greenfield, CLI Installation, weiteres Szenario)
- Best Practices / Tipps Seite
- FAQ / Troubleshooting Seite
- Credits mit korrekten URLs aktualisieren
- Englische Kopien aller Docs unter docs/en/

### Out of Scope
- Code-Änderungen an der CLI oder den Agents
- Neue Features implementieren
- API-Dokumentation (existiert nicht als separates Modul)

## Credits - Korrekte URLs

| Projekt | Korrekte URL | Beschreibung |
|---------|-------------|--------------|
| Agent OS | https://github.com/buildermethods/agent-os | Inspiration 3-Layer Context Model |
| Roo Code | https://github.com/RooCodeInc/Roo-Code | Multi-Agent Orchestration Patterns |
| Claude Code | https://github.com/anthropics/claude-code | Platform für Multi-Agent Workflows |
| Context7 | https://github.com/upstash/context7 | MCP Server für aktuelle Dokumentation |

## Dokumentationsstruktur (Ziel)

```
README.md                              # Deutsch, komplett neu
README_EN.md                           # Englische Version

docs/
  erste-schritte.md                   # Getting Started (DE, Tutorial-Stil)
  agenten.md                          # Agents Reference (DE)
  workflow.md                         # Workflow Guide (DE)
  standards.md                        # Standards System (DE)
  cli.md                              # CLI Reference (DE)
  konfiguration.md                    # Configuration (DE)
  integration.md                      # Integration Guide (DE)
  how-to/
    neues-feature-entwickeln.md       # Kompletter 5-Phasen Durchlauf
    eigenen-agent-erstellen.md        # Agent-Definition, Registration, Test
    standards-erweitern.md            # Neue Standards für dein Team
    cli-installation.md               # CLI Installation und Nutzung
  beispiele/
    use-case-api-feature.md           # REST API von Idee bis Endpoint
    use-case-bugfix-workflow.md       # Debug-Agent systematisch nutzen
    use-case-greenfield-projekt.md    # Neues Projekt von Scratch
    use-case-cli-integration.md       # CLI in bestehendes Projekt
    use-case-standards-team.md        # Standards für ein Team etablieren
  tipps.md                            # Best Practices & Workflow-Tipps
  faq.md                              # FAQ & Troubleshooting

docs/en/
  getting-started.md
  agents.md
  workflow.md
  standards.md
  cli.md
  configuration.md
  integration.md
  how-to/
    develop-new-feature.md
    create-custom-agent.md
    extend-standards.md
    cli-installation.md
  examples/
    use-case-api-feature.md
    use-case-bugfix-workflow.md
    use-case-greenfield-project.md
    use-case-cli-integration.md
    use-case-team-standards.md
  tips.md
  faq.md
```

## Stil-Guide

### Deutsch (Primaer)
- Professionell-technisch: Sachlich, präzise, wie offizielle Framework-Dokumentation
- Tutorial-orientiert: Schritt-für-Schritt Anleitungen mit Beispielen
- Du-Form (informell aber respektvoll)
- Technische Begriffe bleiben Englisch (CLI, Agent, Workflow, Standards, etc.)
- Code-Beispiele mit deutschen Kommentaren wo sinnvoll

### Englisch (Sekundaer)
- Gleicher Inhalt, professionell übersetzt
- Standard Open-Source Dokumentationsstil

### Allgemein
- Jede Seite hat klare Ueberschriften-Hierarchie
- Code-Beispiele mit erwarteter Ausgabe
- "Tipp"/"Hinweis"/"Warnung" Boxen für wichtige Infos
- Cross-Referenzen zwischen Dokumenten
- Keine Emojis (ausser in Feature-Tabellen zur visuellen Unterscheidung)

## Inhaltliche Anforderungen

### README.md (Deutsch)
- Kurzer, praegnanter Teaser (1-2 Saetze)
- Features-Uebersicht mit visueller Hierarchie
- Schnellstart Tutorial (Clone, Start, erster Workflow)
- Architektur-Diagramm (Mermaid oder ASCII)
- Korrekte Credits mit Beschreibung der Inspiration
- Links zu allen Docs

### How-To Guides
Jeder Guide folgt diesem Schema:
1. Ziel (was erreichen wir)
2. Voraussetzungen
3. Schritt-für-Schritt Anleitung mit Code-Beispielen
4. Erwartetes Ergebnis
5. Naechste Schritte / Weiterführende Lektuere

### Use-Case Beispiele
Jedes Beispiel folgt diesem Schema:
1. Szenario-Beschreibung (realistisches Problem)
2. Loesungsansatz mit dem Workflow Engine
3. Vollstaendiger Durchlauf mit allen Befehlen und Ausgaben
4. Ergebnis und Zusammenfassung
5. Variationen / Alternativen

### Tipps & Best Practices
- Agent-Auswahl Cheat Sheet (Tabelle)
- Workflow-Abkuerzungen (wann Phasen überspringen)
- Standards-Design Regeln
- Haeufige Fehler und wie man sie vermeidet
- Performance-Tipps

### FAQ
- Mindestens 15 Fragen mit ausfuehrlichen Antworten
- Kategorisiert: Setup, Workflow, Agents, Standards, CLI, Troubleshooting

## Dependencies

- Keine technischen Dependencies (reine Markdown-Dateien)
- Benoetigt Zugriff auf bestehende Docs als Basis
- Benoetigt Kenntnis der CLI-Funktionalitaet (bereits verifiziert: funktioniert)

## Testing Strategy

- Alle internen Links müssen gültig sein (relative Pfade)
- Code-Beispiele müssen syntaktisch korrekt sein
- CLI-Befehle müssen der tatsächlichen Implementierung entsprechen
- Keine broken references zwischen Docs

## Migration

- Bestehende docs/ Dateien werden durch neue ersetzt (alte Inhalte fliessen ein)
- README.md wird komplett ersetzt
- Keine Backwards-Compatibility noetig (Docs sind nicht API)
