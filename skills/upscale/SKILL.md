---
name: upscale
description: >
  Bild hochskalieren via MagicHour. Default 2x, optional 4x (nicht im Free-Tier).
allowed-tools: ["Bash", "Read"]
argument-hint: "<bild.png> [--scale 2|4] [--output pfad]"
---

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/magichour_upscale.py $ARGUMENTS
```

Lies das Ergebnis-JSON. Bei `success: true` → zeig das Ergebnis mit Read-Tool.
