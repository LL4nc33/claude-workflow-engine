#!/usr/bin/env bash
# PostToolUse Hook: Logs file changes during active orchestration
# Only logs filenames (GDPR-compliant), never file contents

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

ROOT="$(get_project_root)"

# Check if orchestration is active (any spec with in-progress status)
active_spec="$(get_active_spec)"
if [ -z "${active_spec}" ]; then
  # No active orchestration - skip logging
  exit 0
fi

# Read the tool input from stdin
input="$(cat)"

# Extract file path
file_path=""
if command -v jq &>/dev/null; then
  file_path="$(echo "${input}" | jq -r '.file_path // .filePath // ""' 2>/dev/null)"
else
  file_path="$(echo "${input}" | grep -oP '"file_path"\s*:\s*"\K[^"]+' 2>/dev/null)"
  if [ -z "${file_path}" ]; then
    file_path="$(echo "${input}" | grep -oP '"filePath"\s*:\s*"\K[^"]+' 2>/dev/null)"
  fi
fi

# Skip if no file path or if it's a .local.md file
if [ -z "${file_path}" ]; then
  exit 0
fi

filename="$(basename "${file_path}")"
if [[ "${filename}" == *.local.md ]]; then
  exit 0
fi

# Log the change (filename + timestamp only, GDPR-compliant)
log_file="${ROOT}/workflow/specs/${active_spec}/delegation.log"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Create log file if it doesn't exist
if [ ! -f "${log_file}" ]; then
  mkdir -p "$(dirname "${log_file}")"
  echo "# Delegation Log - ${active_spec}" > "${log_file}"
  echo "# Format: timestamp | file" >> "${log_file}"
  echo "" >> "${log_file}"
fi

echo "${timestamp} | ${file_path}" >> "${log_file}"
