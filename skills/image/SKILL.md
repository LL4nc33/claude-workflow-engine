---
name: image
description: >
  Bild generieren mit Gemini via OpenRouter.
  Text-to-Image oder Image-Editing mit --input.
allowed-tools: ["Bash", "Read"]
argument-hint: "<prompt> [--input bild.jpg] [--output pfad.png] [--model flash|3.1|pro]"
---

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/gemini_image.py $ARGUMENTS
```

Lies das Ergebnis-JSON. Bei `success: true` → zeig das Bild mit Read-Tool.
Bei `success: false` → zeig den Fehler dem User.
