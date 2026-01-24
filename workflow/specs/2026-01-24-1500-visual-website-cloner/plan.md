# Plan: Visual Website Cloner — Skill + Command

## Summary

Neuer Workflow-Skill und Command, der die visuelle Identität einer Website extrahiert (Farben, Fonts, Spacing, Komponenten) und als CSS Variables / Tailwind Config ausgibt. Nutzt self-hosted Firecrawl + SearXNG, rein curl/jq-basiert.

## Tasks

### Task 1: Spec Documentation
- `plan.md` — Dieser Plan
- `shape.md` — Scope, Entscheidungen, Kontext
- `references.md` — Bestehende Command/Skill-Patterns als Referenz

### Task 2: Skill erstellen
- `.claude/skills/workflow/visual-clone/SKILL.md`
- Enthält: Configuration, API Reference (Firecrawl, SearXNG), CSS Analysis Patterns, Output Templates, Troubleshooting

### Task 3: Command erstellen
- `.claude/commands/workflow/visual-clone.md`
- Interaktiver 7-Schritt-Workflow mit AskUserQuestion

### Task 4: Plugin-Registrierung prüfen
- `.claude-plugin/plugin.json` — Auto-Discovery prüfen

## Service-Konfiguration

| Service | URL | Zweck |
|---------|-----|-------|
| Firecrawl | `http://192.168.178.64:3002` | Website-Scraping |
| SearXNG | `https://search.oidanice.at` | URL-Discovery |

## Verifikation

1. Skill-Trigger: "Ich möchte eine Website visuell klonen" → Skill auto-laden
2. Command-Aufruf: `/workflow:visual-clone` → interaktiver Workflow
3. Firecrawl-Health: `curl -s "http://192.168.178.64:3002/v1/health"`
4. SearXNG-Test: `curl -s "https://search.oidanice.at/search?q=test&format=json"`
