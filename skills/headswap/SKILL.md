---
name: headswap
description: >
  Head Swap via MagicHour. Ganzen Kopf in einem Foto austauschen.
allowed-tools: ["Bash", "Read"]
argument-hint: "--source <foto.jpg> --head <kopf.jpg> [--output pfad]"
---

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/magichour_headswap.py $ARGUMENTS
```

Lies das Ergebnis-JSON. Bei `success: true` → zeig das Ergebnis mit Read-Tool.
