# Shape: Visual Website Cloner

## Scope

**In-Scope:**
- Extraktion visueller Identität (Farben, Fonts, Spacing, Breakpoints, Animations)
- CSS Variables Output
- Tailwind Config Output
- Design Tokens JSON Output
- Multi-Page Discovery via SearXNG
- SPA-Handling via Firecrawl Interactive Mode
- Cookie-Banner-Handling

**Out-of-Scope:**
- Vollständiges HTML-Cloning
- JavaScript-Logik-Replikation
- Backend-Funktionalität
- CMS-Migration
- Lizenzrechtliche Prüfung der extrahierten Assets

## Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| curl/jq statt SDK | Keine zusätzliche Dependency, direkt in Bash nutzbar |
| Firecrawl self-hosted | Datensouveränität, keine API-Limits |
| SearXNG für Discovery | Self-hosted, kein Google API-Key nötig |
| CSS Variables als Primärformat | Universell nutzbar, framework-agnostisch |
| Skill + Command statt nur Command | Skill ermöglicht Auto-Trigger bei relevanten Anfragen |
| JSON → TOON Konvertierung | ~40% weniger Tokens bei strukturierten API-Responses |
| `/clone-setup` separater Command | Setup-Logik vom Hauptworkflow entkoppelt, wiederverwendbar |
| `visual-clone.local.md` für URLs | DSGVO-konform, gitignored, pro-Projekt konfigurierbar |

## Kontext

### Bestehende Infrastruktur
- Firecrawl läuft auf `192.168.178.64:3002` (LAN)
- SearXNG unter `https://search.oidanice.at` (öffentlich erreichbar)
- Beide Services sind self-hosted und DSGVO-konform

### Integration
- Skill wird auto-entdeckt via Plugin-Konfiguration (`skills` Pfad in plugin.json)
- Command folgt bestehendem Pattern: AskUserQuestion-driven, linear, verifizierbar
- Output-Dateien werden im aktuellen Projekt abgelegt

### Trigger-Szenarien
- "Clone die Website X"
- "Extrahiere die Farben von X"
- "Erstelle ein Design-System basierend auf X"
- "Welche Fonts verwendet X?"
- "Reverse-Engineer das UI von X"
