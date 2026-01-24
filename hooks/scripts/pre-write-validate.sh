#!/usr/bin/env bash
# PreToolUse Hook: Validates Write/Edit targets against secrets patterns
# Blocks writes to sensitive files (.env, credentials.*, secrets.*, *.local.md)
# Optimized: fast-path exit for common allowed operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

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

# All other paths are allowed
echo '{"permissionDecision": "allow"}'
