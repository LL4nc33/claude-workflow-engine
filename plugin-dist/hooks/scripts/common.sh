#!/usr/bin/env bash
# Common utilities for Claude Workflow Engine hooks
# All hooks source this file for shared functionality
#
# IMPORTANT: This script is designed for standalone plugin usage.
# When installed as a plugin, two directories are relevant:
#   - PLUGIN ROOT: Where the plugin is installed (has commands/, agents/, hooks/)
#   - PROJECT ROOT: Where the user's project lives (has workflow/, .claude/, src/)
#
# Environment variables:
#   CLAUDE_PLUGIN_ROOT - Set by Claude to the plugin installation directory
#   CLAUDE_PROJECT_DIR - Optional: explicitly set project directory
#   PWD / pwd - Fallback: current working directory (usually the project)

# Get the project root (where workflow/ and .claude/ live)
# This is the USER'S PROJECT, not the plugin installation directory
get_project_root() {
  # Priority:
  # 1. CLAUDE_PROJECT_DIR - explicit project directory (if set)
  # 2. pwd - current working directory (Claude runs from project root)
  # Note: CLAUDE_PLUGIN_ROOT is NOT used here - that's the plugin location
  local dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
  dir="$(cd "${dir}" 2>/dev/null && pwd)" || dir="$(pwd)"
  echo "${dir}"
}

# Get the plugin root (where the plugin is installed)
# This is where commands/, agents/, hooks/ etc. live
# Only needed if scripts need to reference plugin assets (rare)
get_plugin_root() {
  # CLAUDE_PLUGIN_ROOT is set by Claude when running a plugin
  # Fallback: assume we're running from the main project (development mode)
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    echo "${CLAUDE_PLUGIN_ROOT}"
  else
    # Development mode: plugin is part of the project
    # Navigate from hooks/scripts/ up to project root
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
    # hooks/scripts -> hooks -> project or plugin-dist
    echo "$(cd "${script_dir}/../.." 2>/dev/null && pwd)"
  fi
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
# TOON Format Conversion
# Converts JSON to TOON format for ~40% token savings
# =============================================================================

# Convert JSON input to TOON format
# Falls back to original input if conversion fails or npx not available
to_toon() {
  local input="$1"

  # Skip if input is empty or too small (< ~50 chars = ~12 tokens)
  if [ -z "${input}" ] || [ ${#input} -lt 50 ]; then
    echo "${input}"
    return
  fi

  # Check if npx is available
  if ! command -v npx &>/dev/null; then
    echo "${input}"
    return
  fi

  # Try conversion, fall back to original on failure
  local result
  result=$(echo "${input}" | npx --yes @toon-format/cli 2>/dev/null)

  if [ $? -eq 0 ] && [ -n "${result}" ]; then
    echo "${result}"
  else
    echo "${input}"
  fi
}

# =============================================================================
# Context Injection Utilities
# Used by pre-delegation-context.sh for auto-context injection
# =============================================================================

# Extract significant keywords from a prompt
# Filters out common words, returns space-separated unique keywords
# Also detects problem-indicators (German error patterns) and adds "debug" keyword
extract_keywords() {
  local prompt="$1"
  local keywords
  keywords=$(echo "${prompt}" | \
    tr '[:upper:]' '[:lower:]' | \
    tr -cs '[:alnum:]' '\n' | \
    grep -vE '^(the|a|an|is|are|to|for|in|on|of|and|or|with|that|this|it|be|do|does|did|has|have|was|were|will|would|can|could|should|shall|may|might|must|der|die|das|ein|eine|und|oder|fuer|mit|bei|von|zu)$' | \
    grep -E '.{3,}' | \
    sort -u | \
    head -20 | \
    tr '\n' ' ')

  # Detect problem-indicators (German + English) and add "debug" keyword
  if echo "${prompt}" | grep -qiE "funktioniert nicht|geht nicht|kaputt|fehler|problem|bug|broken|not working|failed|crash"; then
    keywords="${keywords}debug "
  fi

  echo "${keywords}"
}

# Match standards based on keywords
# Returns comma-separated list of standard paths
# SYNC WITH: workflow/orchestration.yml auto_context.keyword_mapping
# Usage: match_standards "auth login api" 4
match_standards() {
  local keywords="$1"
  local max_standards="${2:-4}"
  local matched="global/tech-stack"
  local count=1

  # Auth/Security keywords (sync: orchestration.yml auth_security)
  if echo "${keywords}" | grep -qiE "auth|login|session|jwt|oauth|password|token|security"; then
    matched="${matched},api/error-handling"
    ((count++)) || true
  fi

  # API keywords (sync: orchestration.yml api)
  if echo "${keywords}" | grep -qiE "api|endpoint|route|rest|graphql|controller"; then
    matched="${matched},api/response-format,api/error-handling"
    count=$((count + 2))
  fi

  # Database keywords (sync: orchestration.yml database)
  if echo "${keywords}" | grep -qiE "database|migration|schema|model|entity|query|sql"; then
    matched="${matched},database/migrations,global/naming"
    count=$((count + 2))
  fi

  # Frontend/UI keywords (sync: orchestration.yml frontend)
  if echo "${keywords}" | grep -qiE "component|ui|view|page|layout|form|button|modal|frontend"; then
    matched="${matched},frontend/components"
    ((count++)) || true
  fi

  # Testing keywords (sync: orchestration.yml testing)
  if echo "${keywords}" | grep -qiE "test|spec|coverage|mock|jest|vitest|cypress"; then
    matched="${matched},testing/coverage"
    ((count++)) || true
  fi

  # DevOps/CI keywords (sync: orchestration.yml devops)
  if echo "${keywords}" | grep -qiE "docker|ci|pipeline|deploy|kubernetes|terraform|helm"; then
    matched="${matched},devops/ci-cd,devops/containerization"
    count=$((count + 2))
  fi

  # CLI keywords (sync: orchestration.yml cli)
  if echo "${keywords}" | grep -qiE "cli|command|args|exit"; then
    matched="${matched},cli/command-structure,cli/exit-codes"
    count=$((count + 2))
  fi

  # Debug/Troubleshooting - inject error-handling for debug tasks
  if echo "${keywords}" | grep -qiE "debug|fehler|error|bug|broken|kaputt"; then
    matched="${matched},api/error-handling"
    ((count++)) || true
  fi

  # Remove duplicates and limit to max
  echo "${matched}" | tr ',' '\n' | sort -u | head -n "${max_standards}" | tr '\n' ',' | sed 's/,$//'
}

# Scan for relevant code files based on keywords
# Returns formatted list of matching files
# Usage: scan_relevant_code "auth login" 3
scan_relevant_code() {
  local keywords="$1"
  local max_files="${2:-3}"
  local root
  root="$(get_project_root)"
  local result=""

  # Build search patterns
  local patterns=""
  for keyword in ${keywords}; do
    [ ${#keyword} -lt 4 ] && continue
    patterns="${patterns}*${keyword}* "
  done

  [ -z "${patterns}" ] && echo "" && return

  # Find matching files
  local found_files=""
  if [ -d "${root}/src" ]; then
    for pattern in ${patterns}; do
      local found
      found=$(find "${root}/src" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" \) -iname "${pattern}" 2>/dev/null | head -n "${max_files}") || true
      found_files="${found_files}${found}"$'\n'
    done
  fi

  # Deduplicate and limit
  found_files=$(echo "${found_files}" | grep -v '^$' | sort -u | head -n "${max_files}")

  if [ -n "${found_files}" ]; then
    while IFS= read -r file; do
      [ -z "${file}" ] && continue
      local rel_path="${file#${root}/}"
      local first_line
      first_line=$(head -1 "${file}" 2>/dev/null | head -c 80) || true
      result="${result}- ${rel_path}: ${first_line}\n"
    done <<< "${found_files}"
  fi

  echo -e "${result}"
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
