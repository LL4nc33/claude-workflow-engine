---
name: faceswap
description: >
  Face Swap via MagicHour. Gesicht in Foto oder Video austauschen.
  Erkennt automatisch ob Source ein Bild oder Video ist.
allowed-tools: ["Bash", "Read"]
argument-hint: "--source <foto/video> --face <gesicht.jpg> [--output pfad]"
---

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/magichour_faceswap.py $ARGUMENTS
```

Lies das Ergebnis-JSON. Bei `success: true` -> zeig das Ergebnis mit Read-Tool (bei Bildern).
