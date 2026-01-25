#!/usr/bin/env bash
# =============================================================================
# NaNo Observer - Project-based learning through pattern observation
# Named after Nala & Nino. Based on: https://github.com/humanplane/homunculus
# Adapted: Personal-learning → Project-learning
#
# Usage:
#   nano-observer.sh delegation   # PostToolUse for Task tool
#   nano-observer.sh analyze      # Stop event - session analysis
#   nano-observer.sh cleanup      # Manual cleanup of old observations
#   nano-observer.sh status       # Print learning status
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

# --- Configuration ---
ROOT="$(get_project_root)"
NANO_DIR="${ROOT}/workflow/nano"
OBSERVATIONS_DIR="${NANO_DIR}/observations"
PATTERNS_DIR="${NANO_DIR}/patterns"
EVOLUTION_DIR="${NANO_DIR}/evolution"
CONFIG_FILE="${NANO_DIR}/config/pattern-rules.yml"
LOCAL_CONFIG="${ROOT}/.claude/nano.local.md"

# Session ID (stable per Claude session)
# Priority: 1. CLAUDE_SESSION_ID env var, 2. shared file from session-start hook, 3. fallback to timestamp
if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
  SESSION_ID="${CLAUDE_SESSION_ID}"
elif [ -f "/tmp/claude-current-session-id" ]; then
  SESSION_ID="$(cat /tmp/claude-current-session-id)"
else
  SESSION_ID="$(date +%Y%m%d-%H%M%S)"
fi
SESSION_FILE="${OBSERVATIONS_DIR}/session-${SESSION_ID}.toon"

# --- Cached Config Values (parsed once) ---
CFG_LEVEL=""
CFG_MAX_OBS=""
CFG_CLEANUP_DAYS=""
CFG_THRESHOLD=""

# Parse config once at script start
_parse_config() {
  if [ ! -f "${LOCAL_CONFIG}" ]; then
    CFG_LEVEL="medium"
    CFG_MAX_OBS="1000"
    CFG_CLEANUP_DAYS="30"
    CFG_THRESHOLD="3"
    return
  fi
  local frontmatter
  frontmatter=$(sed -n '/^---$/,/^---$/p' "${LOCAL_CONFIG}" 2>/dev/null || true)
  CFG_LEVEL=$(echo "${frontmatter}" | grep "^observation_level:" | awk '{print $2}')
  CFG_MAX_OBS=$(echo "${frontmatter}" | grep "^max_session_observations:" | awk '{print $2}')
  CFG_CLEANUP_DAYS=$(echo "${frontmatter}" | grep "^cleanup_after_days:" | awk '{print $2}')
  CFG_THRESHOLD=$(echo "${frontmatter}" | grep "^pattern_detection_threshold:" | awk '{print $2}')
  CFG_LEVEL="${CFG_LEVEL:-medium}"
  CFG_MAX_OBS="${CFG_MAX_OBS:-1000}"
  CFG_CLEANUP_DAYS="${CFG_CLEANUP_DAYS:-30}"
  CFG_THRESHOLD="${CFG_THRESHOLD:-3}"
}

# --- Helper Functions ---

# Count current observations in session file (O(1) via header counter)
count_observations() {
  if [ ! -f "${SESSION_FILE}" ]; then
    echo "0"
    return
  fi
  local count
  count=$(sed -n 's/^count: //p' "${SESSION_FILE}" 2>/dev/null)
  echo "${count:-0}"
}

# Write observation in TOON format with atomic locking
write_observation() {
  local type="$1" data="$2"
  local timestamp lock_file
  timestamp="$(date -Iseconds)"
  lock_file="${SESSION_FILE}.lock"

  # Atomic: flock-based locking
  (
    flock -w 2 200 || return 0  # 2s timeout, skip if locked

    # Init if needed
    if [ ! -f "${SESSION_FILE}" ]; then
      mkdir -p "${OBSERVATIONS_DIR}"
      printf 'session: %s\nstarted: %s\nlevel: %s\ncount: 0\nobservations:\n' \
        "${SESSION_ID}" "${timestamp}" "${CFG_LEVEL}" > "${SESSION_FILE}"
    fi

    # Count via header (O(1))
    local count
    count=$(sed -n 's/^count: //p' "${SESSION_FILE}" 2>/dev/null)
    [ "${count:-0}" -ge "${CFG_MAX_OBS}" ] && return 0

    # Append + update count atomically
    echo "  ${timestamp} | ${type} | ${data}" >> "${SESSION_FILE}"
    sed -i "s/^count: .*/count: $((${count:-0} + 1))/" "${SESSION_FILE}"

  ) 200>"${lock_file}"
}

# --- Command Handlers ---

# Handle delegation observation (PostToolUse for Task tool OR SubagentStop)
handle_delegation() {
  # Read tool input from stdin (Claude hook protocol)
  local tool_input=""
  if [ -t 0 ]; then
    # No stdin available, skip (avoid duplicate observations)
    return 0
  fi

  tool_input=$(cat)

  # Extract hook event type
  local hook_event
  hook_event=$(echo "${tool_input}" | grep -o '"hook_event_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"hook_event_name"[[:space:]]*:[[:space:]]*"//;s/"//')

  # Only process PostToolUse - SubagentStop lacks agent_type field
  # This avoids duplicate observations since both hooks fire for Task
  if [ "${hook_event}" = "SubagentStop" ]; then
    return 0
  fi

  # Extract fields from PostToolUse (Task) format
  local agent_type task_desc
  agent_type=$(echo "${tool_input}" | grep -o '"subagent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"subagent_type"[[:space:]]*:[[:space:]]*"//;s/"//')
  task_desc=$(echo "${tool_input}" | grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"description"[[:space:]]*:[[:space:]]*"//;s/"//' | cut -c1-80)

  # Determine task group from agent type
  local task_group="unknown"
  case "${agent_type}" in
    architect) task_group="architecture" ;;
    builder) task_group="implementation" ;;
    devops) task_group="infrastructure" ;;
    explainer) task_group="explanation" ;;
    guide) task_group="process_evolution" ;;
    innovator) task_group="ideation" ;;
    quality) task_group="quality_assurance" ;;
    researcher) task_group="research" ;;
    security) task_group="security" ;;
    Explore) task_group="exploration" ;;
    *) task_group="other" ;;
  esac

  # Write observation
  if [ "${CFG_LEVEL}" = "comprehensive" ]; then
    write_observation "delegation" "agent=${agent_type:-unknown},task_group=${task_group},desc=${task_desc:-none}"
  else
    write_observation "delegation" "agent=${agent_type:-unknown},task_group=${task_group}"
  fi
}

# Analyze session observations and detect patterns (incremental)
handle_analyze() {
  if [ ! -d "${OBSERVATIONS_DIR}" ]; then
    return 0
  fi

  # Incremental: Only analyze sessions newer than existing patterns
  local new_sessions=""
  if [ -f "${PATTERNS_DIR}/delegation-patterns.md" ]; then
    new_sessions=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" -type f \
      -newer "${PATTERNS_DIR}/delegation-patterns.md" 2>/dev/null)
  else
    new_sessions=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" -type f 2>/dev/null)
  fi

  if [ -z "${new_sessions}" ]; then
    return 0
  fi

  # --- Delegation Pattern Analysis ---
  analyze_delegation_patterns "${CFG_THRESHOLD}"

  # --- Quality Pattern Analysis ---
  analyze_quality_patterns "${CFG_THRESHOLD}"

  # --- Standards Usage Analysis ---
  analyze_standards_patterns "${CFG_THRESHOLD}"

  # --- Cleanup old session files ---
  cleanup_old_sessions
}

# Analyze delegation patterns across all session files
analyze_delegation_patterns() {
  local threshold="${1:-3}"
  local temp_file
  temp_file=$(mktemp)

  # Extract all delegation observations
  grep "| delegation |" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | \
    sed 's/.*| delegation | //' | \
    sort > "${temp_file}" 2>/dev/null || true

  if [ ! -s "${temp_file}" ]; then
    rm -f "${temp_file}"
    return 0
  fi

  # Count agent usage frequency
  local agent_counts
  agent_counts=$(grep -o "agent=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  # Count task_group frequency
  local group_counts
  group_counts=$(grep -o "task_group=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  # Detect patterns: agent-task_group combinations
  local combo_counts
  combo_counts=$(grep -o "agent=[^,]*,task_group=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  # Check if any combination exceeds threshold
  local has_patterns=false
  while IFS= read -r line; do
    local count
    count=$(echo "${line}" | awk '{print $1}')
    if [ "${count}" -ge "${threshold}" ]; then
      has_patterns=true
      break
    fi
  done <<< "${combo_counts}"

  if [ "${has_patterns}" = "true" ]; then
    mkdir -p "${PATTERNS_DIR}"
    # Update delegation patterns file
    local total_obs
    total_obs=$(wc -l < "${temp_file}")
    local pattern_count
    pattern_count=$(echo "${combo_counts}" | awk -v t="${threshold}" '$1 >= t' | wc -l)

    cat > "${PATTERNS_DIR}/delegation-patterns.md" << EOF
# Delegation Patterns

Erkannte Muster bei Agent-Delegation und Task-Zuordnung.

## Active Patterns

### Agent-Task Combinations (threshold: ${threshold}+)

| Count | Agent | Task Group |
|-------|-------|-----------|
$(echo "${combo_counts}" | awk -v t="${threshold}" '$1 >= t {
  combo=$2;
  gsub(/agent=/, "", combo);
  split(combo, parts, ",task_group=");
  printf "| %s | %s | %s |\n", $1, parts[1], parts[2]
}')

### Agent Usage

$(echo "${agent_counts}" | awk '{gsub(/agent=/, "", $2); printf "- **%s**: %s delegations\n", $2, $1}')

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | ${total_obs} |
| Patterns Detected | ${pattern_count} |
| Last Updated | $(date -Iseconds) |
EOF
  fi

  rm -f "${temp_file}"
}

# Analyze quality gate patterns
analyze_quality_patterns() {
  local threshold="${1:-3}"
  local temp_file
  temp_file=$(mktemp)

  # Extract quality observations
  grep "| quality |" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | \
    sed 's/.*| quality | //' | \
    sort > "${temp_file}" 2>/dev/null || true

  if [ ! -s "${temp_file}" ]; then
    rm -f "${temp_file}"
    return 0
  fi

  local total_obs
  total_obs=$(wc -l < "${temp_file}")

  # Count gate failures
  local failure_counts
  failure_counts=$(grep -o "gate=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  local pattern_count
  pattern_count=$(echo "${failure_counts}" | awk -v t="${threshold}" '$1 >= t' | wc -l)

  if [ "${pattern_count}" -gt 0 ]; then
    mkdir -p "${PATTERNS_DIR}"
    cat > "${PATTERNS_DIR}/quality-patterns.md" << EOF
# Quality Patterns

Erkannte Muster bei Quality Gate Ergebnissen.

## Active Patterns

### Gate Failure Frequency (threshold: ${threshold}+)

$(echo "${failure_counts}" | awk -v t="${threshold}" '$1 >= t {gsub(/gate=/, "", $2); printf "- **%s**: %s failures\n", $2, $1}')

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | ${total_obs} |
| Patterns Detected | ${pattern_count} |
| Last Updated | $(date -Iseconds) |
EOF
  fi

  rm -f "${temp_file}"
}

# Analyze standards usage patterns
analyze_standards_patterns() {
  local threshold="${1:-3}"
  local temp_file
  temp_file=$(mktemp)

  # Extract standards observations
  grep "| standards |" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | \
    sed 's/.*| standards | //' | \
    sort > "${temp_file}" 2>/dev/null || true

  if [ ! -s "${temp_file}" ]; then
    rm -f "${temp_file}"
    return 0
  fi

  local total_obs
  total_obs=$(wc -l < "${temp_file}")

  # Count standards usage
  local usage_counts
  usage_counts=$(grep -o "standard=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  local standards_tracked
  standards_tracked=$(echo "${usage_counts}" | wc -l)

  mkdir -p "${PATTERNS_DIR}"
  cat > "${PATTERNS_DIR}/standards-usage.md" << EOF
# Standards Usage Patterns

Erkannte Muster bei Standards-Nutzung und deren Effektivitaet.

## Active Patterns

### Standards Usage Frequency

$(echo "${usage_counts}" | awk '{gsub(/standard=/, "", $2); printf "- **%s**: %s uses\n", $2, $1}')

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | ${total_obs} |
| Standards Tracked | ${standards_tracked} |
| Last Updated | $(date -Iseconds) |
EOF

  rm -f "${temp_file}"
}

# Cleanup old session files (GDPR compliance)
cleanup_old_sessions() {
  if [ -d "${OBSERVATIONS_DIR}" ]; then
    find "${OBSERVATIONS_DIR}" -name "session-*.toon" -type f -mtime "+${CFG_CLEANUP_DAYS}" -delete 2>/dev/null || true
  fi
}

# Manual cleanup command
handle_cleanup() {
  cleanup_old_sessions
  echo "Cleanup completed. Sessions older than ${CFG_CLEANUP_DAYS} days removed."
}

# Print learning status
handle_status() {
  local obs_count=0
  local pattern_count=0
  local candidate_count=0

  if [ -d "${OBSERVATIONS_DIR}" ]; then
    obs_count=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" -type f 2>/dev/null | wc -l)
  fi

  if [ -d "${PATTERNS_DIR}" ]; then
    pattern_count=$(grep -l "## Active Patterns" "${PATTERNS_DIR}"/*.md 2>/dev/null | \
      xargs grep -c "^-\|^|" 2>/dev/null | \
      awk -F: '{sum += $2} END {print sum+0}')
  fi

  if [ -d "${EVOLUTION_DIR}/candidates" ]; then
    candidate_count=$(find "${EVOLUTION_DIR}/candidates" -name "*.yml" -type f 2>/dev/null | wc -l)
  fi

  cat << EOF
nano:
  enabled: true
  level: ${CFG_LEVEL}
  sessions: ${obs_count}
  patterns: ${pattern_count}
  candidates: ${candidate_count}
  threshold: ${CFG_THRESHOLD}
  cleanup_days: ${CFG_CLEANUP_DAYS}
EOF
}

# Check for evolution candidates
check_evolution() {
  local confidence_threshold="5"  # Higher bar for evolution

  # Check delegation patterns for high-confidence entries
  if [ -f "${PATTERNS_DIR}/delegation-patterns.md" ]; then
    # Extract counts >= confidence_threshold
    local high_confidence
    high_confidence=$(grep "^|" "${PATTERNS_DIR}/delegation-patterns.md" | \
      awk -F'|' 'NR>2 && $2+0 >= '"${confidence_threshold}"' {print $2, $3, $4}' 2>/dev/null || true)

    if [ -n "${high_confidence}" ]; then
      local candidate_file="${EVOLUTION_DIR}/candidates/delegation-$(date +%Y%m%d).yml"
      mkdir -p "${EVOLUTION_DIR}/candidates"
      if [ ! -f "${candidate_file}" ]; then
        cat > "${candidate_file}" << EOF
# Evolution Candidate: Delegation Optimization
# Generated: $(date -Iseconds)
# Status: pending_review

type: orchestration_update
confidence: high
source: delegation-patterns
suggestion: |
  The following agent-task combinations show strong patterns
  and may benefit from explicit orchestration rules.

patterns:
$(echo "${high_confidence}" | awk '{printf "  - agent: %s\n    task_group: %s\n    occurrences: %s\n", $2, $3, $1}')

proposed_change:
  target: workflow/orchestration.yml
  section: task_groups
  action: validate_or_add_mapping
EOF
      fi
    fi
  fi
}

# --- Main Entry Point ---

main() {
  # Use shared is_nano_enabled from common.sh (DRY)
  if ! is_nano_enabled; then
    exit 0
  fi

  # Parse config once
  _parse_config

  local command="${1:-}"

  case "${command}" in
    delegation)
      handle_delegation
      ;;
    analyze)
      handle_analyze
      check_evolution
      ;;
    cleanup)
      handle_cleanup
      ;;
    status)
      handle_status
      ;;
    *)
      echo "Usage: nano-observer.sh {delegation|analyze|cleanup|status}" >&2
      exit 1
      ;;
  esac
}

main "$@"
