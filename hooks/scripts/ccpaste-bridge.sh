#!/usr/bin/env bash
# CWE: ccpaste-bridge lifecycle hook.
#
# - Called from SessionStart with "start": runs the bridge in the background
#   on WSL. No-op on every other platform — only WSL has the
#   workstation-side clipboard the bridge needs to expose.
# - Called from SessionEnd with "stop": tears it down.
#
# The bridge is harmless if started multiple times (idempotent: ccpaste-bridge.py
# checks its PID file). Failures here MUST NOT block the session — we just
# log and exit 0.

set -u
ACTION="${1:-start}"

# WSL-only — bridge has nothing to expose elsewhere.
if ! grep -qi microsoft /proc/version 2>/dev/null; then
  exit 0
fi

# Locate the bridge script via plugin root (set by Claude Code) with a
# fallback for direct invocation.
ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
BRIDGE="${ROOT}/scripts/ccpaste-bridge.py"

if [ ! -x "$BRIDGE" ]; then
  exit 0  # plugin not installed cleanly, don't break session
fi

case "$ACTION" in
  start)
    python3 "$BRIDGE" start >/dev/null 2>&1 || true
    ;;
  stop)
    python3 "$BRIDGE" stop >/dev/null 2>&1 || true
    ;;
  *)
    exit 0
    ;;
esac
exit 0
