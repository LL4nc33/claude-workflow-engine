#!/usr/bin/env python3
"""ccpaste-bridge — local clipboard bridge for CWE screenshot over SSH.

Runs on the developer's workstation (typically WSL2). Listens on
127.0.0.1:47998 (override with CWE_CCPASTE_PORT). On each TCP request
"GET\\n" it reads the local OS clipboard for a PNG image and returns:

    OK <byte_size>\\n
    <png bytes...>

or

    EMPTY\\n        (no image in clipboard)
    ERR <msg>\\n   (e.g. PowerShell crashed, missing tool)

Used together with an SSH RemoteForward
(`-R 47998:127.0.0.1:47998`) so a Claude Code session on a remote
LXC/VM can pull the developer's clipboard without any extra UX.

Subcommands:
    serve              run server (default)
    start [--detach]   start in background, write PID file
    stop               read PID file, kill, remove file
    status             print PID + port if running, exit 0/1

PID file:  ${XDG_RUNTIME_DIR:-/tmp}/cwe-ccpaste-bridge.pid
Log file:  ~/.cache/cwe/ccpaste-bridge.log

Security: bound to 127.0.0.1 only. Never expose externally — the bridge
streams the user's clipboard on demand to anyone who can connect locally.
"""
from __future__ import annotations

import argparse
import os
import platform
import shutil
import signal
import socket
import socketserver
import subprocess
import sys
import time
from pathlib import Path

PORT = int(os.environ.get("CWE_CCPASTE_PORT", "47998"))
PID_DIR = Path(os.environ.get("XDG_RUNTIME_DIR", "/tmp"))
PID_FILE = PID_DIR / "cwe-ccpaste-bridge.pid"
LOG_FILE = Path.home() / ".cache" / "cwe" / "ccpaste-bridge.log"


def log(msg: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")


# --------------------------------------------------------------------------
# Clipboard backends
# --------------------------------------------------------------------------


def is_wsl() -> bool:
    try:
        with open("/proc/version") as f:
            return "microsoft" in f.read().lower()
    except FileNotFoundError:
        return False


def read_clipboard_wsl() -> tuple[str, bytes | str]:
    """Returns (status, payload). status: 'OK', 'EMPTY', 'ERR'."""
    # PowerShell writes the PNG bytes to stdout via Base64 to avoid binary
    # mangling across the WSL→Windows pipe.
    ps = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "Add-Type -AssemblyName System.Drawing; "
        "if ([System.Windows.Forms.Clipboard]::ContainsImage()) { "
        "  $img = [System.Windows.Forms.Clipboard]::GetImage(); "
        "  $ms = New-Object System.IO.MemoryStream; "
        "  $img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); "
        "  [Console]::OpenStandardOutput().Write($ms.ToArray(), 0, $ms.Length); "
        "} else { "
        "  [Console]::Error.WriteLine('NO_IMAGE'); "
        "  exit 2; "
        "}"
    )
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", ps],
            capture_output=True, timeout=10
        )
    except FileNotFoundError:
        return "ERR", "powershell.exe nicht gefunden (kein WSL?)"
    except subprocess.TimeoutExpired:
        return "ERR", "PowerShell-Timeout (10s)"
    if result.returncode == 2 and b"NO_IMAGE" in result.stderr:
        return "EMPTY", b""
    if result.returncode != 0:
        tail = result.stderr.decode("utf-8", errors="replace").strip()[-200:]
        return "ERR", f"PowerShell rc={result.returncode}: {tail}"
    if not result.stdout:
        return "EMPTY", b""
    return "OK", result.stdout


def read_clipboard_wayland() -> tuple[str, bytes | str]:
    if not shutil.which("wl-paste"):
        return "ERR", "wl-paste fehlt (sudo apt install wl-clipboard)"
    try:
        r = subprocess.run(
            ["wl-paste", "--type", "image/png"],
            capture_output=True, timeout=10
        )
    except subprocess.TimeoutExpired:
        return "ERR", "wl-paste timeout"
    if r.returncode != 0 or not r.stdout:
        return "EMPTY", b""
    return "OK", r.stdout


def read_clipboard_x11() -> tuple[str, bytes | str]:
    if not shutil.which("xclip"):
        return "ERR", "xclip fehlt (sudo apt install xclip)"
    try:
        r = subprocess.run(
            ["xclip", "-selection", "clipboard", "-t", "image/png", "-o"],
            capture_output=True, timeout=10
        )
    except subprocess.TimeoutExpired:
        return "ERR", "xclip timeout"
    if r.returncode != 0 or not r.stdout:
        return "EMPTY", b""
    return "OK", r.stdout


def read_clipboard_macos() -> tuple[str, bytes | str]:
    if not shutil.which("pngpaste"):
        return "ERR", "pngpaste fehlt (brew install pngpaste)"
    try:
        r = subprocess.run(["pngpaste", "-"], capture_output=True, timeout=10)
    except subprocess.TimeoutExpired:
        return "ERR", "pngpaste timeout"
    if r.returncode != 0 or not r.stdout:
        return "EMPTY", b""
    return "OK", r.stdout


def select_backend():
    if is_wsl():
        return read_clipboard_wsl, "wsl"
    sysname = platform.system()
    if sysname == "Darwin":
        return read_clipboard_macos, "macos"
    if sysname == "Linux":
        if os.environ.get("WAYLAND_DISPLAY"):
            return read_clipboard_wayland, "wayland"
        if os.environ.get("DISPLAY"):
            return read_clipboard_x11, "x11"
    return None, sysname.lower()


# --------------------------------------------------------------------------
# Server
# --------------------------------------------------------------------------


class _Handler(socketserver.BaseRequestHandler):
    def handle(self):
        try:
            self.request.settimeout(5)
            data = b""
            while not data.endswith(b"\n") and len(data) < 64:
                chunk = self.request.recv(1)
                if not chunk:
                    break
                data += chunk
            cmd = data.decode("ascii", errors="replace").strip().upper()
            if cmd != "GET":
                self.request.sendall(b"ERR unknown_cmd\n")
                return
            backend = self.server.backend  # type: ignore[attr-defined]
            status, payload = backend()
            if status == "OK":
                size = len(payload)
                header = f"OK {size}\n".encode("ascii")
                self.request.sendall(header)
                self.request.sendall(payload)
                log(f"served {size} bytes")
            elif status == "EMPTY":
                self.request.sendall(b"EMPTY\n")
            else:
                msg = str(payload).replace("\n", " ")[:200]
                self.request.sendall(f"ERR {msg}\n".encode("utf-8"))
                log(f"err: {msg}")
        except Exception as e:  # one bad request must not kill server
            try:
                self.request.sendall(f"ERR {e}\n".encode("utf-8"))
            except Exception:
                pass
            log(f"handler exception: {e}")


class _Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def serve_forever() -> None:
    backend, name = select_backend()
    if backend is None:
        log(f"no backend for platform={name}, exiting")
        print(f"ccpaste-bridge: no clipboard backend for {name}", file=sys.stderr)
        sys.exit(2)
    srv = _Server(("127.0.0.1", PORT), _Handler)
    srv.backend = backend  # type: ignore[attr-defined]
    log(f"listening on 127.0.0.1:{PORT} backend={name}")
    print(f"ccpaste-bridge: 127.0.0.1:{PORT} backend={name}", file=sys.stderr)

    def _stop(*_):
        log("shutting down")
        srv.shutdown()

    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)
    try:
        srv.serve_forever()
    finally:
        srv.server_close()


# --------------------------------------------------------------------------
# Lifecycle helpers (start/stop/status)
# --------------------------------------------------------------------------


def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def _read_pid() -> int | None:
    try:
        return int(PID_FILE.read_text().strip())
    except (FileNotFoundError, ValueError):
        return None


def cmd_start(detach: bool = True) -> int:
    pid = _read_pid()
    if pid and _alive(pid):
        print(f"ccpaste-bridge: already running (pid={pid})", file=sys.stderr)
        return 0

    if not detach:
        serve_forever()
        return 0

    PID_DIR.mkdir(parents=True, exist_ok=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    # Spawn as fully-detached background process. We deliberately don't
    # use Python's daemon-thread tricks because we want to survive the
    # parent shell.
    log_fd = open(LOG_FILE, "a", encoding="utf-8")
    proc = subprocess.Popen(
        [sys.executable, str(Path(__file__).resolve()), "serve"],
        stdin=subprocess.DEVNULL,
        stdout=log_fd,
        stderr=log_fd,
        start_new_session=True,
        env={**os.environ, "CWE_CCPASTE_PORT": str(PORT)},
    )
    PID_FILE.write_text(str(proc.pid))
    # Brief readiness probe so caller sees whether it actually came up
    deadline = time.time() + 2.5
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", PORT), timeout=0.2):
                pass
            print(f"ccpaste-bridge: started pid={proc.pid} port={PORT}", file=sys.stderr)
            return 0
        except OSError:
            time.sleep(0.1)
    print(
        f"ccpaste-bridge: spawned pid={proc.pid} but port {PORT} not bound yet "
        f"— check {LOG_FILE}",
        file=sys.stderr,
    )
    return 0


def cmd_stop() -> int:
    pid = _read_pid()
    if not pid:
        print("ccpaste-bridge: not running (no PID file)", file=sys.stderr)
        return 0
    if not _alive(pid):
        try:
            PID_FILE.unlink()
        except FileNotFoundError:
            pass
        print(f"ccpaste-bridge: stale PID file removed (pid={pid})", file=sys.stderr)
        return 0
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    deadline = time.time() + 3
    while time.time() < deadline:
        if not _alive(pid):
            break
        time.sleep(0.1)
    else:
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    try:
        PID_FILE.unlink()
    except FileNotFoundError:
        pass
    print(f"ccpaste-bridge: stopped (pid={pid})", file=sys.stderr)
    return 0


def cmd_status() -> int:
    pid = _read_pid()
    if not pid or not _alive(pid):
        print("ccpaste-bridge: not running", file=sys.stderr)
        return 1
    try:
        with socket.create_connection(("127.0.0.1", PORT), timeout=0.5):
            pass
        print(f"ccpaste-bridge: running pid={pid} port={PORT}", file=sys.stderr)
        return 0
    except OSError:
        print(
            f"ccpaste-bridge: pid={pid} alive but port {PORT} not bound — restarting recommended",
            file=sys.stderr,
        )
        return 1


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("serve", help="run server in foreground (default)")
    s = sub.add_parser("start", help="start in background")
    s.add_argument("--no-detach", action="store_true")
    sub.add_parser("stop")
    sub.add_parser("status")
    args = p.parse_args()
    cmd = args.cmd or "serve"
    if cmd == "serve":
        serve_forever()
        return 0
    if cmd == "start":
        return cmd_start(detach=not args.no_detach)
    if cmd == "stop":
        return cmd_stop()
    if cmd == "status":
        return cmd_status()
    p.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
