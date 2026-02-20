#!/usr/bin/env bash
# Shared helpers for CWE hook scripts
# Source this at the top of any hook that outputs JSON:
#   source "$(dirname "$0")/_lib.sh"

# --- Safe JSON string escape ---
# Escapes a string for safe embedding in JSON double-quotes.
# Handles: backslashes, quotes, tabs, carriage returns, newlines, control chars.
# Usage: ESCAPED=$(json_escape "raw string")
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"        # backslashes first (order matters!)
  s="${s//\"/\\\"}"        # double quotes
  s="${s//$'\t'/\\t}"      # tabs
  s="${s//$'\r'/}"         # strip carriage returns
  s="${s//$'\n'/\\n}"      # newlines to literal \n
  printf '%s' "$s"
}

# --- Emit JSON systemMessage ---
# Safely outputs {"systemMessage": "..."} with proper escaping.
# Usage: json_msg "Your message here with $variables"
json_msg() {
  local escaped
  escaped=$(json_escape "$1")
  printf '{"systemMessage": "%s"}\n' "$escaped"
}

# --- Safe grep -c wrapper ---
# grep -c returns exit code 1 on zero matches, which breaks || chains.
# Usage: COUNT=$(grep_count "pattern" "file")
grep_count() {
  local pattern="$1"
  local file="$2"
  local n
  n=$(grep -c "$pattern" "$file" 2>/dev/null) || true
  printf '%s' "${n:-0}"
}

# --- Determine project root ---
# Sets ROOT variable from CLAUDE_PROJECT_DIR or PWD.
# Usage: resolve_root
resolve_root() {
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    ROOT="$CLAUDE_PROJECT_DIR"
  else
    ROOT="$PWD"
  fi
}

# --- Determine project slug ---
# Sanitized, lowercase, hyphenated basename of project dir.
# Usage: resolve_slug  (sets PROJECT_SLUG)
resolve_slug() {
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    PROJECT_SLUG=$(basename "$CLAUDE_PROJECT_DIR" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9_-]//g')
  else
    PROJECT_SLUG="_global"
  fi
}

# --- Safe wc -l wrapper ---
# wc -l can have leading spaces on some platforms.
# Usage: COUNT=$(line_count "file")
line_count() {
  local file="$1"
  local n
  n=$(wc -l < "$file" 2>/dev/null) || true
  # Strip whitespace (macOS wc pads with spaces)
  printf '%s' "${n// /}"
}
