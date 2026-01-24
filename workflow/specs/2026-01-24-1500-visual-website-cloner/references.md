# References: Visual Website Cloner

## Bestehende Patterns

### Skill-Pattern (aus global-standards/SKILL.md)

```yaml
---
name: {skill-name}
description: {Wann/Warum nutzen, mit Trigger-Keywords}
allowed-tools: {Komma-getrennte Tool-Liste}
context: fork
agent: {Agent-Name}
---
```

- YAML Frontmatter mit Metadata
- Instructions-Sektion (wann anwenden)
- Key Standards (organisierte Inhalte)
- Application Triggers (Auto-Aktivierung)
- Reference Files (`@workflow/` Notation)

### Command-Pattern (aus write-spec.md, plan-product.md)

1. H1 Titel
2. Kurzbeschreibung (1-2 Sätze)
3. Important Guidelines ("Always use AskUserQuestion tool")
4. Prerequisites (Datei/Verzeichnis-Anforderungen)
5. Process (nummerierte Schritte mit Sub-Steps)
   - H3 für Hauptschritte (`### Step N:`)
   - Code-Blöcke für erwartete Formate
6. Tips (hilfreiche Hinweise)

**Schlüssel-Pattern:** Check → Ask → Process → Verify → Confirm

### Plugin-Konfiguration (plugin.json)

```json
{
  "commands": "./.claude/commands",
  "agents": "./.claude/agents",
  "skills": "./.claude/skills"
}
```

Skills werden via Pfad-Konfiguration auto-entdeckt — keine manuelle Registrierung einzelner Skills nötig.

## API-Referenzen

### Firecrawl v1 API
- **Endpoint:** `POST /v1/scrape`
- **Auth:** Bearer Token (optional bei self-hosted)
- **Formate:** markdown, rawHtml, screenshot, links
- **Scrape-Optionen:** waitFor, actions (click, scroll), headers, includeTags

### SearXNG JSON API
- **Endpoint:** `GET /search?q={query}&format=json`
- **Parameter:** categories, engines, language, pageno
- **Response:** `results[]` mit title, url, content
