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

# Check if a path is a code file outside allowed directories
# Allowed: workflow/*, .claude/*, CHANGELOG.md, VERSION, hooks/*
# Returns 0 if it IS a code file outside allowed paths (should warn)
is_code_outside_allowed() {
  local path="$1"
  local filename
  filename="$(basename "${path}")"

  # First check: is it in an allowed path?
  # Normalize path for comparison
  case "${path}" in
    */workflow/*|workflow/*|*/\.claude/*|\.claude/*|*/.claude/*|.claude/*)
      return 1  # Allowed - no warning
      ;;
    */hooks/*|hooks/*)
      return 1  # Allowed - no warning
      ;;
  esac

  # Check for explicitly allowed root files
  case "${filename}" in
    CHANGELOG.md|VERSION|README.md|LICENSE|.gitignore|.gitattributes)
      return 1  # Allowed - no warning
      ;;
  esac

  # Now check if it's a code file extension
  case "${filename}" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
      return 0  # Code file outside allowed paths - warn
      ;;
    *.py|*.pyi|*.pyx)
      return 0  # Python code - warn
      ;;
    *.go|*.rs|*.rb|*.java|*.kt|*.scala)
      return 0  # Other languages - warn
      ;;
    *.c|*.cpp|*.cc|*.h|*.hpp)
      return 0  # C/C++ - warn
      ;;
    *.cs|*.fs|*.vb)
      return 0  # .NET languages - warn
      ;;
    *.php|*.swift|*.m|*.mm)
      return 0  # Other popular languages - warn
      ;;
    *.sh|*.bash|*.zsh)
      return 0  # Shell scripts - warn
      ;;
    *.sql|*.graphql|*.gql)
      return 0  # Query languages - warn
      ;;
    *.vue|*.svelte|*.astro)
      return 0  # Frontend frameworks - warn
      ;;
  esac

  return 1  # Not a code file or in allowed path - no warning
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

# =============================================================================
# NaNo Learning Utilities (named after Nala & Nino)
# Shared functions for the learning/observation system.
# =============================================================================

# Get NaNo directory path
get_nano_dir() {
  local root
  root="$(get_project_root)"
  echo "${root}/workflow/nano"
}

# Check if NaNo learning is enabled (fast check)
is_nano_enabled() {
  local root
  root="$(get_project_root)"
  local config="${root}/.claude/nano.local.md"

  if [ ! -f "${config}" ]; then
    return 1
  fi

  grep -q "^enabled: true" "${config}" 2>/dev/null
}

# Write a learning observation (generic helper)
# Usage: write_learning_observation "type" "key=value,key2=value2"
write_learning_observation() {
  local obs_type="$1"
  local obs_data="$2"

  if ! is_nano_enabled; then
    return 0
  fi

  local nano_dir
  nano_dir="$(get_nano_dir)"
  local obs_dir="${nano_dir}/observations"
  local session_id="${CLAUDE_SESSION_ID:-$(date +%Y%m%d-%H%M%S)}"
  local session_file="${obs_dir}/session-${session_id}.toon"
  local timestamp
  timestamp="$(date -Iseconds)"

  mkdir -p "${obs_dir}"

  # Initialize if needed
  if [ ! -f "${session_file}" ]; then
    cat > "${session_file}" << EOF
session: ${session_id}
started: ${timestamp}
observations:
EOF
  fi

  echo "  ${timestamp} | ${obs_type} | ${obs_data}" >> "${session_file}"
}

# Get learning status summary (single line, cached 60s)
get_learning_status() {
  local cache_file="/tmp/nano-status-cache"

  # Cache valid for 60s
  if [ -f "${cache_file}" ]; then
    local cache_age
    cache_age=$(($(date +%s) - $(stat -c %Y "${cache_file}" 2>/dev/null || echo 0)))
    if [ "${cache_age}" -lt 60 ]; then
      cat "${cache_file}"
      return
    fi
  fi

  if ! is_nano_enabled; then
    echo "disabled" | tee "${cache_file}"
    return
  fi

  local nano_dir
  nano_dir="$(get_nano_dir)"

  local obs_count=0
  if [ -d "${nano_dir}/observations" ]; then
    obs_count=$(find "${nano_dir}/observations" -name "session-*.toon" -type f 2>/dev/null | wc -l)
  fi

  local pattern_count=0
  if [ -d "${nano_dir}/patterns" ]; then
    pattern_count=$(find "${nano_dir}/patterns" -name "*.md" -type f 2>/dev/null | wc -l)
  fi

  local candidate_count=0
  if [ -d "${nano_dir}/evolution/candidates" ]; then
    candidate_count=$(find "${nano_dir}/evolution/candidates" -name "*.yml" -type f 2>/dev/null | wc -l)
  fi

  local result="active (${obs_count} sessions, ${pattern_count} patterns, ${candidate_count} candidates)"
  echo "${result}" | tee "${cache_file}"
}
