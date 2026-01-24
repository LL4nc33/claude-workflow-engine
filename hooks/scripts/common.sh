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

# Cache management utilities for session-level caching
# Cache directory lives in /tmp (session-scoped, auto-cleaned on reboot)
CACHE_DIR="/tmp/claude-workflow-cache-$$"

# Initialize cache directory
init_cache() {
  mkdir -p "${CACHE_DIR}"
}

# Check if a cached file is still fresh (based on source file mtime)
# Returns 0 if cache is valid, 1 if stale or missing
is_cache_fresh() {
  local source_file="$1"
  local cache_key="$2"
  local cache_file="${CACHE_DIR}/${cache_key}"

  [ -f "${cache_file}" ] || return 1
  [ -f "${source_file}" ] || return 1

  local source_mtime cache_mtime
  source_mtime=$(stat -c %Y "${source_file}" 2>/dev/null || stat -f %m "${source_file}" 2>/dev/null)
  cache_mtime=$(stat -c %Y "${cache_file}" 2>/dev/null || stat -f %m "${cache_file}" 2>/dev/null)

  [ "${cache_mtime}" -ge "${source_mtime}" ]
}

# Read from cache (returns cached content or empty string)
read_cache() {
  local cache_key="$1"
  local cache_file="${CACHE_DIR}/${cache_key}"

  if [ -f "${cache_file}" ]; then
    cat "${cache_file}"
  fi
}

# Write to cache
write_cache() {
  local cache_key="$1"
  local content="$2"

  init_cache
  echo "${content}" > "${CACHE_DIR}/${cache_key}"
}

# Clean stale cache entries (entries older than TTL seconds)
clean_cache() {
  local ttl_seconds="${1:-3600}"  # Default: 1 hour TTL

  if [ -d "${CACHE_DIR}" ]; then
    find "${CACHE_DIR}" -type f -mmin "+$((ttl_seconds / 60))" -delete 2>/dev/null
  fi
}
