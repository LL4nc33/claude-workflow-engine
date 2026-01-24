#!/usr/bin/env bash
# PreToolUse Hook: Validates Write/Edit targets against secrets patterns
# Blocks writes to sensitive files (.env, credentials.*, secrets.*, *.local.md)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Read the tool input from stdin (JSON with file_path)
input="$(cat)"

# Extract file path from the tool input
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

# Exit early if no file path found (allow the operation)
if [ -z "${file_path}" ]; then
  echo '{"permissionDecision": "allow"}'
  exit 0
fi

# Check against secrets patterns
filename="$(basename "${file_path}")"

case "${filename}" in
  .env|.env.*)
    reason="$(json_escape "Schreibzugriff auf ${filename} blockiert: Umgebungsvariablen-Datei (Secrets-Schutz)")"
    echo "{\"permissionDecision\": \"deny\", \"reason\": \"${reason}\"}"
    exit 0
    ;;
  credentials.*|secrets.*)
    reason="$(json_escape "Schreibzugriff auf ${filename} blockiert: Credentials/Secrets-Datei")"
    echo "{\"permissionDecision\": \"deny\", \"reason\": \"${reason}\"}"
    exit 0
    ;;
  *.local.md)
    reason="$(json_escape "Schreibzugriff auf ${filename} blockiert: Lokale Konfigurationsdatei (GDPR-Schutz)")"
    echo "{\"permissionDecision\": \"deny\", \"reason\": \"${reason}\"}"
    exit 0
    ;;
esac

# All other paths are allowed
echo '{"permissionDecision": "allow"}'
