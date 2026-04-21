---
name: video
description: >
  Video generieren via MagicHour. Text-to-Video oder Image-to-Video mit --input.
allowed-tools: ["Bash", "Read"]
argument-hint: "<prompt> [--input bild.jpg] [--duration 5] [--output video.mp4]"
---

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/magichour_video.py $ARGUMENTS
```

Lies das Ergebnis-JSON. Bei `success: true` → informiere den User wo das Video liegt.
