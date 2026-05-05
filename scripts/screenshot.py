#!/usr/bin/env python3
"""Read screenshot from clipboard across platforms (WSL2 / macOS / Linux Wayland / Linux X11 / SSH-bridge).

Usage:
  python3 screenshot.py [--output PATH]

Default output: <cwd>/clipboard-screenshot.png

SSH-bridge mode: when running over SSH on a remote host (e.g. an LXC), this
script connects to a local clipboard bridge running on the developer's
workstation, reachable via an SSH RemoteForward. Default port 47998 (override
with CWE_CCPASTE_PORT). The bridge itself is started/stopped by the CWE
SessionStart/SessionEnd hooks on WSL.
"""

import json
import os
import platform
import shutil
import socket
import subprocess
import sys
from pathlib import Path

CCPASTE_PORT_DEFAULT = 47998
CCPASTE_PORT = int(os.environ.get("CWE_CCPASTE_PORT", CCPASTE_PORT_DEFAULT))


def json_ok(path, **meta):
    result = {"success": True, "path": str(path)}
    result.update(meta)
    print(json.dumps(result))
    sys.exit(0)


def json_err(error, hint=""):
    result = {"success": False, "error": error}
    if hint:
        result["hint"] = hint
    print(json.dumps(result))
    sys.exit(1)


def is_wsl():
    """Detect WSL2 by checking /proc/version for 'microsoft'."""
    try:
        with open("/proc/version") as f:
            return "microsoft" in f.read().lower()
    except FileNotFoundError:
        return False


def is_ssh_session():
    """Detect interactive SSH session (env-based, set by sshd)."""
    return bool(os.environ.get("SSH_CONNECTION") or os.environ.get("SSH_CLIENT"))


def ccpaste_bridge_reachable(port: int = None, timeout: float = 0.4) -> bool:
    """Quick TCP probe to 127.0.0.1:port. Used as SSH-bridge probe."""
    p = port or CCPASTE_PORT
    try:
        with socket.create_connection(("127.0.0.1", p), timeout=timeout) as s:
            s.shutdown(socket.SHUT_RDWR)
        return True
    except (OSError, ConnectionError):
        return False


def detect_platform():
    """Returns one of: wsl, macos, wayland, x11, ssh-bridge, unknown.

    Order matters: WSL local takes precedence over SSH-bridge so a user
    running Claude Code directly on WSL still uses the fast PowerShell path.
    SSH-bridge is only chosen when remote-on-SSH AND a bridge is reachable
    via the RemoteForward tunnel.
    """
    if is_wsl():
        return "wsl"
    system = platform.system()
    if system == "Darwin":
        return "macos"
    if system == "Linux":
        if os.environ.get("WAYLAND_DISPLAY"):
            return "wayland"
        if os.environ.get("DISPLAY"):
            return "x11"
        if is_ssh_session() and ccpaste_bridge_reachable():
            return "ssh-bridge"
    return "unknown"


def save_wsl(output: Path) -> bool:
    """Use PowerShell to read Windows clipboard, save to Windows path.

    Security: the Windows path is passed through stdin as a literal line,
    never interpolated into PowerShell script text. This prevents command
    injection via filenames with single quotes or PS meta characters.
    Linux env vars don't cross WSL→Windows process boundaries cleanly,
    so we use stdin instead.
    """
    try:
        win_dir = subprocess.check_output(
            ["wslpath", "-w", str(output.parent)], text=True
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        json_err("wslpath fehlgeschlagen", "Bist du wirklich in WSL2?")
    win_path = f"{win_dir}\\{output.name}"
    # Read path from stdin → injection-safe and WSL-boundary-safe.
    ps_script = (
        "$p = [Console]::In.ReadLine(); "
        "Add-Type -AssemblyName System.Windows.Forms; "
        "if ([System.Windows.Forms.Clipboard]::ContainsImage()) { "
        "[System.Windows.Forms.Clipboard]::GetImage().Save($p, "
        "[System.Drawing.Imaging.ImageFormat]::Png); "
        "Write-Output 'SAVED' "
        "} else { Write-Output 'NO_IMAGE' }"
    )
    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-Command", ps_script],
        input=win_path + "\n",
        capture_output=True, text=True, timeout=10
    )
    # PowerShell writes progress/verbose to stderr even on success; only
    # fail on non-zero returncode AND empty stdout (real crash).
    if result.returncode != 0 and "SAVED" not in result.stdout and "NO_IMAGE" not in result.stdout:
        stderr_tail = (result.stderr or "").strip()[-200:]
        json_err(
            "PowerShell-Aufruf fehlgeschlagen",
            f"rc={result.returncode} stderr={stderr_tail}"
        )
    return "SAVED" in result.stdout


def save_macos(output: Path) -> bool:
    """Use pngpaste on macOS (brew install pngpaste).

    NOT YET TESTED on real macOS hardware (v0.8.2). The logic mirrors the
    other platforms' shape: check binary, run, verify file non-empty.
    Please report issues at https://github.com/LL4nc33/code-workspace-engine/issues
    """
    if not shutil.which("pngpaste"):
        json_err(
            "pngpaste nicht installiert",
            "brew install pngpaste"
        )
    result = subprocess.run(
        ["pngpaste", str(output)],
        capture_output=True, timeout=10
    )
    return result.returncode == 0 and output.exists() and output.stat().st_size > 0


def save_wayland(output: Path) -> bool:
    """Use wl-paste on Wayland. Writes atomically via a temp file."""
    if not shutil.which("wl-paste"):
        json_err(
            "wl-clipboard nicht installiert",
            "sudo apt install wl-clipboard"
        )
    tmp = output.with_suffix(output.suffix + ".tmp")
    try:
        with open(tmp, "wb") as f:
            result = subprocess.run(
                ["wl-paste", "--type", "image/png"],
                stdout=f, stderr=subprocess.DEVNULL, timeout=10
            )
        if result.returncode == 0 and tmp.stat().st_size > 0:
            os.replace(tmp, output)
            return True
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass
        return False
    except Exception:
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass
        raise


def save_ssh_bridge(output: Path) -> bool:
    """Pull PNG from a clipboard bridge over an SSH RemoteForward tunnel.

    Protocol (line-based request, raw-bytes response):
      → "GET\\n"
      ← "OK <size>\\n" + <size> bytes  OR  "EMPTY\\n"  OR  "ERR <msg>\\n"

    The bridge runs on the developer's workstation (started by the CWE
    SessionStart hook on WSL) and reads the Windows clipboard via PowerShell.
    Connection goes through 127.0.0.1:CCPASTE_PORT, which the developer's
    SSH client maps back to the workstation via `-R 47998:127.0.0.1:47998`.
    """
    tmp = output.with_suffix(output.suffix + ".tmp")
    try:
        with socket.create_connection(("127.0.0.1", CCPASTE_PORT), timeout=10) as s:
            s.sendall(b"GET\n")
            # Read header up to newline
            header = b""
            while not header.endswith(b"\n") and len(header) < 64:
                chunk = s.recv(1)
                if not chunk:
                    break
                header += chunk
            line = header.decode("ascii", errors="replace").strip()
            if line == "EMPTY":
                return False
            if not line.startswith("OK "):
                json_err(
                    "Bridge-Antwort ungueltig",
                    f"Got: {line[:80]!r}. Bridge-Logs: tail ~/.cache/cwe/ccpaste-bridge.log"
                )
            try:
                size = int(line.split(" ", 1)[1])
            except (ValueError, IndexError):
                json_err("Bridge-Header parse failed", f"Header: {line!r}")
            with open(tmp, "wb") as f:
                remaining = size
                while remaining > 0:
                    chunk = s.recv(min(65536, remaining))
                    if not chunk:
                        break
                    f.write(chunk)
                    remaining -= len(chunk)
            if remaining > 0:
                try:
                    tmp.unlink()
                except FileNotFoundError:
                    pass
                json_err(
                    "Bridge-Verbindung abgebrochen",
                    f"Erwartet {size} bytes, fehlten {remaining}"
                )
            os.replace(tmp, output)
            return True
    except (socket.timeout, OSError) as e:
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass
        json_err(
            "Bridge nicht erreichbar",
            (
                f"Port {CCPASTE_PORT} nicht offen. "
                "Lauft die Bridge auf deinem Laptop? Ist 'RemoteForward "
                f"{CCPASTE_PORT} 127.0.0.1:{CCPASTE_PORT}' im SSH-Client gesetzt? "
                f"Original error: {e}"
            )
        )


def save_x11(output: Path) -> bool:
    """Use xclip on X11. Writes atomically via a temp file."""
    if not shutil.which("xclip"):
        json_err(
            "xclip nicht installiert",
            "sudo apt install xclip"
        )
    tmp = output.with_suffix(output.suffix + ".tmp")
    try:
        with open(tmp, "wb") as f:
            result = subprocess.run(
                ["xclip", "-selection", "clipboard", "-t", "image/png", "-o"],
                stdout=f, stderr=subprocess.DEVNULL, timeout=10
            )
        if result.returncode == 0 and tmp.stat().st_size > 0:
            os.replace(tmp, output)
            return True
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass
        return False
    except Exception:
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass
        raise


def main():
    args = sys.argv[1:]
    output = Path.cwd() / "clipboard-screenshot.png"
    if "--output" in args:
        idx = args.index("--output")
        if idx + 1 >= len(args) or args[idx + 1].startswith("-"):
            json_err(
                "--output requires a path argument",
                "Beispiel: --output /tmp/shot.png"
            )
        output = Path(args[idx + 1])

    output.parent.mkdir(parents=True, exist_ok=True)

    platform_id = detect_platform()

    if platform_id == "wsl":
        saved = save_wsl(output)
    elif platform_id == "macos":
        saved = save_macos(output)
    elif platform_id == "wayland":
        saved = save_wayland(output)
    elif platform_id == "x11":
        saved = save_x11(output)
    elif platform_id == "ssh-bridge":
        saved = save_ssh_bridge(output)
    else:
        # No display/clipboard locally and no SSH-bridge reachable.
        hint = f"Unterstuetzt: WSL2, macOS, Linux Wayland/X11, SSH+Bridge. Erkannt: {platform.system()}"
        if is_ssh_session():
            hint += (
                f" (SSH-Session ohne Bridge auf 127.0.0.1:{CCPASTE_PORT}. "
                "Auf dem Laptop CWE-Plugin laden, oder manuell "
                "'python3 scripts/ccpaste-bridge.py serve' starten + "
                f"SSH mit '-R {CCPASTE_PORT}:127.0.0.1:{CCPASTE_PORT}' verbinden.)"
            )
        json_err("Plattform nicht erkannt", hint)

    if not saved:
        json_err(
            "Kein Bild in der Zwischenablage",
            "Mache zuerst einen Screenshot (Win+Shift+S / Cmd+Shift+4 / Screenshot-Tool)"
        )

    json_ok(output, platform=platform_id, size=output.stat().st_size)


if __name__ == "__main__":
    main()
