# README Restyling - Fortschritt

## Status: 90% fertig

## Erledigt (2026-01-25)

1. **README.md komplett neu geschrieben**
   - Alle Emojis entfernt
   - Englische Hauptsprache
   - Clean Markdown im agent-os Stil
   - Feature-Liste: "Action — Benefit" Format

2. **Hero Banner erstellt**
   - `assets/hero-light.svg` — für Dark Mode
   - `assets/hero-dark.svg` — für Light Mode
   - Dark/Light Mode Support via `<picture>` Element

3. **Mermaid Diagramme**
   - Workflow Pipeline (Plan → Shape → Spec → Tasks → Orchestrate)
   - Architecture Stack (6-Layer)

4. **Struktur**
   - Features, Quick Start, Agents Table, Workflow, Architecture
   - Installation, Privacy, Documentation Links
   - agent-os Credit im Footer

## Offen

### Demo GIF aufnehmen
- Tool: asciinema oder Screen Recording
- Command: `/workflow:smart-workflow` ausführen
- Speichern als: `assets/demo.gif`
- Ins README einbinden nach dem Hero Banner

### README-Snippet für GIF-Einbindung
Nach dem Hero-Banner-Block einfügen:

```markdown
<p align="center">
  <img src="assets/demo.gif" alt="Demo" width="700">
</p>
```

## Verifikation (nach GIF)
1. `gh repo view --web` → GitHub Preview prüfen
2. Dark Mode Toggle testen
3. Mermaid rendert korrekt
4. Links funktionieren
5. Mobile-Ansicht prüfen

---

## Weitere TODOs

### Demo GIF aufnehmen
- Tool: asciinema oder Screen Recording
- Command: `/workflow:smart-workflow` ausführen
- Speichern als: `assets/demo.gif`
- Ins README einbinden nach dem Hero Banner

### Self-hosted Captcha-Solver recherchieren
- nopecha (Browser Extension + API)
- captcha-harvester (Self-hosted)
- ML-basierte Solver (TensorFlow/PyTorch)
- Ziel: Kostenlose lokale Lösung für den Web-Access-Layer

---

## Hooks-Fix (2026-01-25)

**Problem gefunden:** `${CLAUDE_PLUGIN_ROOT}` in hooks.json war nicht gesetzt (nur für Plugins).

**Fix:** Pfade auf relative Pfade geändert: `.claude/hooks/scripts/...`

**Status:** Gefixt, aber neue Session nötig zum Testen.

**Symlink:** `.claude/hooks/` → `../hooks/` (erstellt)

**Test nach Neustart:**
1. Delegiere was an einen Agent (Task Tool)
2. Check: `ls workflow/nano/observations/` — sollte Session-Datei haben
3. Session beenden (Ctrl+C)
4. Check: Patterns sollten aktualisiert sein