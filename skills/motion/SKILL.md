---
name: motion
description: >
  Video erstellen mit Remotion + Claude Code. React-basierte Motion Graphics,
  Intros, Tutorials, Social Clips. Nutzt Remotion Best Practices Skill.
allowed-tools: ["Bash", "Read", "Write", "Edit"]
argument-hint: "<beschreibung> [--duration 5] [--project <pfad-zu-remotion-projekt>]"
---

# Remotion Video erstellen

Liest den Remotion-Projekt-Pfad aus `.claude/cwe-settings.yml` (Schlüssel: `remotion_project_dir`). Fällt auf `./remotion/` im Current-Working-Directory zurück wenn nicht gesetzt.

```bash
REMOTION_DIR=$(grep '^remotion_project_dir:' .claude/cwe-settings.yml 2>/dev/null | sed 's/^remotion_project_dir:\s*//' | tr -d '"')
REMOTION_DIR=${REMOTION_DIR:-./remotion}
```

Falls kein Remotion-Projekt existiert, zeige dem User wie man eins anlegt:
```bash
npx create-video@latest
```

## Workflow

1. **Dev-Server starten** (falls nicht laufend):
```bash
cd "$REMOTION_DIR" && npm run dev &
```
Preview auf http://localhost:3000

2. **Remotion Best Practices laden** — nutze den `remotion-best-practices` Skill für Regeln zu Animationen, Assets, Audio, Compositions etc.

3. **React-Komponenten erstellen/editieren** in `src/` — Compositions, Sequences, Animationen mit Framer Motion + Tailwind.

4. **Assets** (Bilder, Audio, Video) in `public/` ablegen. Tipp: Nutze `/cwe:image` um Bilder zu generieren und direkt nach `public/` zu kopieren.

5. **Rendern**:
```bash
cd "$REMOTION_DIR" && npx remotion render
```
Output landet in `out/`.

## Kombination mit anderen CWE Media Skills

- `/cwe:image "prompt" --output "$REMOTION_DIR/public/bg.png"` — Hintergrundbilder generieren
- `/cwe:video "prompt" --output "$REMOTION_DIR/public/broll.mp4"` — B-Roll generieren
- `/cwe:faceswap` / `/cwe:headswap` — fuer Thumbnails oder Szenen
- `/cwe:upscale` — Assets hochskalieren vor Einbindung
