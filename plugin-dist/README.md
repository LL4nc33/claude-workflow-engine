# Claude Workflow Engine - Plugin Distribution

> **Status:** 0.3.0 - Basisstruktur fertig, Tests in Progress

Dieses Verzeichnis enthält die **standalone Plugin-Version** von CWE, die ohne CLI installiert werden kann.

## Quick Start

```bash
# Lokaler Test
claude --plugin-dir /path/to/plugin-dist

# Commands nutzen
/cwe:help
/cwe:smart-workflow
```

## Fresh Install Test

Um das Plugin wie ein neuer User zu testen (ohne bestehende ~/.claude/ Config):

```bash
# Option 1: Temporäres HOME
export HOME=/tmp/fresh-claude-test
mkdir -p $HOME
cd /path/to/test-project
claude --plugin-dir /path/to/plugin-dist

# Option 2: LXC/Docker Container
# (für echte Isolation)

# Option 3: Backup + Clean
mv ~/.claude ~/.claude.backup
claude --plugin-dir /path/to/plugin-dist
# Nach Test:
rm -rf ~/.claude && mv ~/.claude.backup ~/.claude
```

## Ziel (Marketplace)

```bash
# Statt:
git clone ... && cd cli && npm install && npm run build && node dist/index.js install ...

# Einfach:
claude plugin install cwe
/cwe:init
```

## Struktur (geplant)

```
plugin-dist/
├── plugin.json              # Marketplace-kompatibles Manifest
├── commands/
│   └── workflow/
│       ├── init.md          # NEU: Ersetzt CLI install
│       ├── ... (alle 25 Commands)
├── agents/
│   └── ... (alle 9 Agents)
├── skills/
│   └── workflow/
│       └── ... (alle Skills)
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       └── ... (alle Hook-Scripts)
└── templates/               # NEU: Eingebettete Templates
    ├── base/
    │   └── workflow/
    │       ├── config.yml
    │       ├── orchestration.yml
    │       └── standards/
    ├── profiles/
    │   ├── node/
    │   ├── python/
    │   └── rust/
    └── CLAUDE.md.template
```

## Unterschied zu cli/

| Aspekt | cli/ (aktuell) | plugin-dist/ (neu) |
|--------|----------------|-------------------|
| Installation | `npm install && npm run build` | `claude plugin install` |
| Dependency | Node.js >= 18 | Keine |
| Onboarding | `node dist/index.js install` | `/workflow:init` |
| Updates | Git pull + rebuild | Automatisch via Marketplace |
| Offline | Ja | Nein (braucht Marketplace) |

## Migration von cli/

Die Templates aus `cli/templates/` werden hierher kopiert und das Init-Command übernimmt die Logik aus `cli/src/commands/install.ts`.

## Roadmap (0.3.x Serie)

| Version | Task | Status |
|---------|------|--------|
| 0.3.0 | Plugin-Manifest für Marketplace erstellen | [x] |
| 0.3.1 | `/workflow:init` Command implementieren | [ ] |
| 0.3.2 | Templates einbetten | [ ] |
| 0.3.3 | Profile-Auswahl (Node/Python/Rust/Default) | [ ] |
| 0.3.4 | Health-Check als Command (`/workflow:health`) | [ ] |
| 0.3.5 | User-Präferenzen merken (Versionierung, etc.) | [ ] |
| 0.3.6 | Native `/plan` Integration | [ ] |
| 0.3.7 | Marketplace-Submission vorbereiten | [ ] |
| 0.3.8 | Testing & Bugfixes | [ ] |
| 0.3.9 | **Docs Update** (README, workflow.md, etc.) | [ ] |

## Geparkte Features (für später)

| Feature | Notizen |
|---------|---------|
| CLI deprecaten | Nach 0.4.0 wenn Plugin stabil |
| Auto-Plan-Mode Suggestion | Native Claude Code `/plan` nutzen, CWE injiziert nur Context |
| Versionierungs-Schema | `semver-with-suffix` (0.2.9a-z für Fixes, 0.0.1 Schritte) |

## Docs-Update Notizen (für 0.3.9)

Siehe vollständigen Plan: `docs/plans/2026-01-26-docs-update-0.3.0.md`

**Bekannte Issues:**
- README.md: "5 hooks" → 7, "23 commands" → 25, "13 skills" → 17
- docs/workflow.md: Version 0.2.7, homunculus-status → nano-status
- docs/plattform-architektur.md: Fehlende neue Hooks/Skills
- English docs: Nicht synchron mit deutschen Docs

## Siehe auch

- [Official Plugin Docs](https://docs.claude.com/en/docs/claude-code/plugins)
- [plugin-dev Plugin](https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev)
