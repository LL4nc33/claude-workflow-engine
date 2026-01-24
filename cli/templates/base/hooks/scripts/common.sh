#!/usr/bin/env bash
# Common utilities for Claude Workflow Engine hooks
# All hooks source this file for shared functionality

# Get the project root (where .claude/ lives)
get_project_root() {
  local dir="${CLAUDE_PLUGIN_ROOT:-$(pwd)}"
  # Navigate up from hooks/scripts/ to project root
  dir="$(cd "${dir}" && pwd)"
  echo "${dir}"
}

# Get the currently active spec (if any orchestration is in progress)
get_active_spec() {
  local root
  root="$(get_project_root)"
  local specs_dir="${root}/workflow/specs"

  if [ ! -d "${specs_dir}" ]; then
    echo ""
    return
  fi

  # Find spec folders with an in-progress status in progress.md
  for spec_dir in "${specs_dir}"/*/; do
    if [ -f "${spec_dir}progress.md" ]; then
      if grep -q "in-progress\|IN PROGRESS" "${spec_dir}progress.md" 2>/dev/null; then
        basename "${spec_dir}"
        return
      fi
    fi
  done
  echo ""
}

# Escape a string for safe JSON embedding
json_escape() {
  local str="$1"
  str="${str//\\/\\\\}"
  str="${str//\"/\\\"}"
  str="${str//$'\n'/\\n}"
  str="${str//$'\r'/\\r}"
  str="${str//$'\t'/\\t}"
  echo "${str}"
}

# Check if a path matches secrets patterns
is_secrets_path() {
  local path="$1"
  local filename
  filename="$(basename "${path}")"

  case "${filename}" in
    .env|.env.*|credentials.*|secrets.*)
      return 0
      ;;
    *.local.md)
      return 0
      ;;
  esac
  return 1
}
