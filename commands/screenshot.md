---
description: MUSS VERWENDET WERDEN wenn User einen Screenshot analysieren will oder Bild aus Zwischenablage braucht. Multi-OS (WSL2/macOS/Linux), inkl. SSH-Bridge zu WSL.
allowed-tools: ["Bash", "Read"]
argument-hint: "[--output pfad.png]"
---

# CWE Screenshot

Liest einen Screenshot aus der Zwischenablage und analysiert ihn. Multi-OS (WSL2 / macOS / Linux Wayland / Linux X11) plus **SSH-Bridge** fuer Claude-Code-Sessions auf Remote-LXC/VMs (Bild bleibt bei dir, kommt via SSH-RemoteForward rueber).

**Usage:** `/cwe:screenshot [--output pfad.png]`

## Ausfuehrung

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/screenshot.py $ARGUMENTS
```

Parse das JSON-Ergebnis:

- **`success: true`** → Lies `path` mit dem Read-Tool und analysiere das Bild im Kontext der Konversation. Danach die Datei loeschen: `rm -f <path>`.
- **`success: false`** → Zeige `error` + `hint` dem User an. Haeufige Faelle:
  - "Kein Bild in der Zwischenablage" → User soll zuerst einen Screenshot machen
  - "pngpaste nicht installiert" → `brew install pngpaste` (macOS)
  - "wl-clipboard nicht installiert" → `sudo apt install wl-clipboard` (Wayland)
  - "xclip nicht installiert" → `sudo apt install xclip` (X11)
  - "Bridge nicht erreichbar" → SSH-Tunnel pruefen (siehe SSH-Bridge unten)

## Unterstuetzte Plattformen

| OS | Tool | Install | Status |
|----|------|---------|--------|
| WSL2 | PowerShell (Windows Clipboard) | Automatisch verfuegbar | Getestet (v0.8.2) |
| macOS | `pngpaste` | `brew install pngpaste` | **Nicht getestet** — bitte bei Problemen Issue öffnen |
| Linux Wayland | `wl-paste` | `sudo apt install wl-clipboard` | Nicht getestet |
| Linux X11 | `xclip` | `sudo apt install xclip` | Nicht getestet |
| SSH+Bridge | `ccpaste-bridge.py` auf WSL + SSH `RemoteForward` | Auto-Start via Hook | **Beta** — privat getestet auf on-agents |

## SSH-Bridge (Claude Code auf Remote-LXC/VM)

Wenn Claude Code per SSH auf einem Remote-Host laeuft (LXC, VM, anderer Server), gibt es **keinen lokalen Clipboard-Zugriff**. Die SSH-Bridge loest das:

```
[Laptop / WSL2]                       [Remote LXC/VM]
  Windows-Clipboard                     Claude Code
       │                                    │
       ▼                                    ▼
  ccpaste-bridge.py  ←─ SSH-Tunnel ─→  /cwe:screenshot
  (Port 47998)         RemoteForward    (zieht via 127.0.0.1:47998)
```

### Setup (einmalig pro Laptop)

1. **Bridge startet automatisch** mit jeder Claude-Code-Session in CWE — der `SessionStart`-Hook `ccpaste-bridge.sh` erkennt WSL und startet sie im Hintergrund. Stop ebenfalls automatisch via `SessionEnd`-Hook.

2. **SSH mit RemoteForward verbinden.** In `~/.ssh/config` auf dem Laptop ergaenzen:

   ```
   Host *.lxc *.node testwebserver gpu00 on-agents
     RemoteForward 47998 127.0.0.1:47998
   ```

3. Auf dem Remote-Host Claude Code starten und `/cwe:screenshot` benutzen wie ueberall sonst.

### Override

- `CWE_CCPASTE_PORT=12345` setzen wenn 47998 belegt — gleicher Wert auf beiden Seiten + im SSH-Config.
- Manueller Start auf dem Laptop: `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/ccpaste-bridge.py start` (status / stop ebenso).

### Sicherheit

Die Bridge bindet ausschliesslich auf `127.0.0.1` und wird vom SSH-RemoteForward weitergereicht. **Niemals** an `0.0.0.0` binden — das wuerde dein Clipboard im LAN exposen.
