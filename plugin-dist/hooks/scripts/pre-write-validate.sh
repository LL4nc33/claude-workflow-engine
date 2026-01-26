#!/usr/bin/env bash
# PreToolUse Hook: Validates Write/Edit targets against secrets patterns
# Blocks writes to sensitive files (.env, credentials.*, secrets.*, *.local.md)
# Supports configurable Agent-First enforcement (warn/block/off) via nano.local.md
# Optimized: fast-path exit for common allowed operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Get Agent-First enforcement mode from nano.local.md
# Returns: warn (default), block, or off
get_agent_first_mode() {
  local root
  root="$(get_project_root)"
  local config="${root}/.claude/nano.local.md"

  if [ ! -f "${config}" ]; then
    echo "warn"
    return
  fi

  # Look for agent_first.enforcement in YAML-like format
  local mode
  mode=$(grep -A1 "^agent_first:" "${config}" 2>/dev/null | grep "enforcement:" | awk '{print $2}' | tr -d '[:space:]')

  case "${mode}" in
    block|off|warn)
      echo "${mode}"
      ;;
    *)
      echo "warn"
      ;;
  esac
}

# Read the tool input from stdin (JSON with file_path)
input="$(cat)"

# Extract file path - optimized order: jq first (most reliable), then grep fallback
file_path=""
if command -v jq &>/dev/null; then
  file_path="$(echo "${input}" | jq -r '.file_path // .filePath // ""' 2>/dev/null)"
else
  # Fallback: simple grep for file_path
  file_path="$(echo "${input}" | grep -oP '"file_path"\s*:\s*"\K[^"]+' 2>/dev/null)"
  if [ -z "${file_path}" ]; then
    file_path="$(echo "${input}" | grep -oP '"filePath"\s*:\s*"\K[^"]+' 2>/dev/null)"
  fi
fi

# Fast path: no file path = allow immediately
if [ -z "${file_path}" ]; then
  echo '{"permissionDecision": "allow"}'
  exit 0
fi

# Fast path: check using shared utility function
if is_secrets_path "${file_path}"; then
  filename="$(basename "${file_path}")"
  reason="$(json_escape "Schreibzugriff auf ${filename} blockiert (Secrets/GDPR-Schutz)")"
  echo "{\"permissionDecision\": \"deny\", \"reason\": \"${reason}\"}"
  exit 0
fi

# Agent-First enforcement for code files outside allowed directories
if is_code_outside_allowed "${file_path}"; then
  filename="$(basename "${file_path}")"
  enforcement_mode="$(get_agent_first_mode)"

  case "${enforcement_mode}" in
    block)
      # Hard block: deny write, force delegation to builder
      reason="$(json_escape "Code-Writes nur via builder Agent erlaubt. Delegiere mit: /builder oder Task tool. (${filename})")"
      echo "{\"permissionDecision\": \"deny\", \"reason\": \"${reason}\"}"
      exit 0
      ;;
    off)
      # Disabled: allow without warning
      echo '{"permissionDecision": "allow"}'
      exit 0
      ;;
    *)
      # warn (default): allow with warning message
      message="$(json_escape "Code-Files sollten via builder Agent geschrieben werden. Bist du sicher dass Main Chat das machen soll? (${filename})")"
      echo "{\"permissionDecision\": \"allow\", \"outputMessage\": \"${message}\"}"
      exit 0
      ;;
  esac
fi

# All other paths are allowed
echo '{"permissionDecision": "allow"}'
