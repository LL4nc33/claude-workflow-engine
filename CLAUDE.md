# CWE v0.7.0

Orchestration plugin. Delegation via hooks — follow systemMessage routing hints.

## Mistakes to avoid
- Don't handle tasks yourself when a CWE agent exists for it
- Don't skip memory updates after changes (memory/MEMORY.md, CHANGELOG.md)
- Run /cwe:help if unsure about available commands

## Media Tools

Scripts in `scripts/` für Bild- und Video-Generierung. API-Keys in `scripts/media-keys.sh` (gitignored).

| Skill | Script | API | Beschreibung |
|-------|--------|-----|-------------|
| `/cwe:image` | `gemini_image.py` | OpenRouter (Gemini) | Text/Image-to-Image |
| `/cwe:faceswap` | `magichour_faceswap.py` | MagicHour | Face Swap (Foto + Video) |
| `/cwe:headswap` | `magichour_headswap.py` | MagicHour | Head Swap |
| `/cwe:upscale` | `magichour_upscale.py` | MagicHour | Image Upscaler (2x/4x) |
| `/cwe:video` | `magichour_video.py` | MagicHour | Text/Image-to-Video |
| `/cwe:motion` | Remotion Projekt | React + Remotion | Programmatische Motion Graphics |
