#!/usr/bin/env python3
"""Read screenshot from clipboard across platforms (WSL2 / macOS / Linux Wayland / Linux X11).

Usage:
  python3 screenshot.py [--output PATH]

Default output: <cwd>/clipboard-screenshot.png
"""

import json
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path


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


def detect_platform():
    """Returns one of: wsl, macos, wayland, x11, unknown."""
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
    return "unknown"


def save_wsl(output: Path) -> bool:
    """Use PowerShell to read Windows clipboard, save to Windows path.

    Security: the Windows path is passed via the CWE_OUT environment variable
    and never interpolated into the PowerShell script text. This prevents
    command injection via filenames containing single quotes or other PS meta
    characters (e.g. "foo'; rm -rf *; '.png").
    """
    try:
        win_dir = subprocess.check_output(
            ["wslpath", "-w", str(output.parent)], text=True
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        json_err("wslpath fehlgeschlagen", "Bist du wirklich in WSL2?")
    win_path = f"{win_dir}\\{output.name}"
    ps_script = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "if ([System.Windows.Forms.Clipboard]::ContainsImage()) { "
        "[System.Windows.Forms.Clipboard]::GetImage().Save($env:CWE_OUT, "
        "[System.Drawing.Imaging.ImageFormat]::Png); "
        "Write-Output 'SAVED' "
        "} else { Write-Output 'NO_IMAGE' }"
    )
    env = os.environ.copy()
    env["CWE_OUT"] = win_path
    result = subprocess.run(
        ["powershell.exe", "-Command", ps_script],
        capture_output=True, text=True, timeout=10, env=env
    )
    if result.returncode != 0 or (result.stderr and result.stderr.strip()):
        stderr_tail = (result.stderr or "").strip()[-200:]
        json_err(
            "PowerShell-Aufruf fehlgeschlagen",
            f"rc={result.returncode} stderr={stderr_tail}"
        )
    return "SAVED" in result.stdout


def save_macos(output: Path) -> bool:
    """Use pngpaste on macOS (brew install pngpaste)."""
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
    else:
        json_err(
            "Plattform nicht erkannt",
            f"Unterstuetzt: WSL2, macOS, Linux Wayland/X11. Erkannt: {platform.system()}"
        )

    if not saved:
        json_err(
            "Kein Bild in der Zwischenablage",
            "Mache zuerst einen Screenshot (Win+Shift+S / Cmd+Shift+4 / Screenshot-Tool)"
        )

    json_ok(output, platform=platform_id, size=output.stat().st_size)


if __name__ == "__main__":
    main()
