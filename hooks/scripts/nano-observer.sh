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
#   nano-observer.sh quality      # Record quality gate result (manual call)
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
AGENTS_DIR="${ROOT}/.claude/agents"

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
  # Parse simple key: value format (not YAML frontmatter)
  CFG_LEVEL=$(grep "^observation_level:" "${LOCAL_CONFIG}" 2>/dev/null | awk '{print $2}' || true)
  CFG_MAX_OBS=$(grep "^max_session_observations:" "${LOCAL_CONFIG}" 2>/dev/null | awk '{print $2}' || true)
  CFG_CLEANUP_DAYS=$(grep "^cleanup_after_days:" "${LOCAL_CONFIG}" 2>/dev/null | awk '{print $2}' || true)
  CFG_THRESHOLD=$(grep "^pattern_detection_threshold:" "${LOCAL_CONFIG}" 2>/dev/null | awk '{print $2}' || true)
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

# Get standards for an agent from its definition file
# Returns space-separated list of standard names (without path)
get_agent_standards() {
  local agent_type="$1"
  local agent_file="${AGENTS_DIR}/${agent_type}.md"

  if [ ! -f "${agent_file}" ]; then
    echo ""
    return
  fi

  # Extract @workflow/standards/* entries from Context Sources section
  # Only look in the Context Sources section (between ## Context Sources and next ##)
  local in_context_section=false
  local standards=""

  while IFS= read -r line; do
    if [[ "${line}" =~ ^##[[:space:]]+Context[[:space:]]+Sources ]]; then
      in_context_section=true
      continue
    fi
    if [[ "${in_context_section}" == "true" && "${line}" =~ ^## ]]; then
      break
    fi
    if [[ "${in_context_section}" == "true" && "${line}" =~ @workflow/standards/ ]]; then
      # Extract standard name from path like @workflow/standards/global/tech-stack.md
      local std_path
      std_path=$(echo "${line}" | grep -o '@workflow/standards/[^[:space:]]*' | sed 's/@workflow\/standards\///' | sed 's/\.md$//')
      if [ -n "${std_path}" ]; then
        # Convert path like "global/tech-stack" to "global:tech-stack"
        local std_name
        std_name=$(echo "${std_path}" | tr '/' ':')
        standards="${standards}${std_name} "
      fi
    fi
  done < "${agent_file}"

  echo "${standards}" | sed 's/ $//'
}

# --- Command Handlers ---

# Handle delegation observation (PostToolUse for Task tool OR SubagentStop)
handle_delegation() {
  # Read tool input from stdin (Claude hook protocol)
  local tool_input=""

  # Check if stdin has data (non-blocking)
  # -t 0 checks if stdin is a terminal (interactive)
  # We also add a timeout to prevent hanging
  if [ -t 0 ]; then
    # Stdin is a terminal - no piped data, skip
    return 0
  fi

  # Read with timeout to prevent hanging
  tool_input=$(timeout 1 cat 2>/dev/null) || true

  # Skip if no input received
  if [ -z "${tool_input}" ]; then
    return 0
  fi

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

  # Write delegation observation
  if [ "${CFG_LEVEL}" = "comprehensive" ]; then
    write_observation "delegation" "agent=${agent_type:-unknown},task_group=${task_group},desc=${task_desc:-none}"
  else
    write_observation "delegation" "agent=${agent_type:-unknown},task_group=${task_group}"
  fi

  # Track standards usage based on agent's Context Sources
  # This captures which standards are being injected when agents are delegated to
  if [ -n "${agent_type}" ] && [ "${agent_type}" != "unknown" ]; then
    local standards
    standards=$(get_agent_standards "${agent_type}")

    if [ -n "${standards}" ]; then
      # Write one observation per standard for proper counting
      for std in ${standards}; do
        write_observation "standards" "standard=${std},agent=${agent_type},task_group=${task_group}"
      done
    fi
  fi
}

# Handle quality gate observation (manual call from workflows)
# Usage: nano-observer.sh quality <gate_name> <pass|fail> [agent]
handle_quality() {
  local gate_name="${2:-unknown}"
  local status="${3:-unknown}"
  local agent="${4:-main}"

  # Validate status
  case "${status}" in
    pass|fail|skip|warn) ;;
    *) status="unknown" ;;
  esac

  write_observation "quality" "gate=${gate_name},status=${status},agent=${agent}"

  # If it's a failure, also track it for evolution candidates
  if [ "${status}" = "fail" ]; then
    # Check if this gate has failed multiple times
    local failure_count
    failure_count=$(grep "gate=${gate_name},status=fail" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | wc -l)

    if [ "${failure_count}" -ge 3 ]; then
      # Generate evolution candidate for recurring quality gate failures
      local candidate_file="${EVOLUTION_DIR}/candidates/quality-gate-$(date +%Y%m%d)-${gate_name}.yml"
      mkdir -p "${EVOLUTION_DIR}/candidates"
      if [ ! -f "${candidate_file}" ]; then
        cat > "${candidate_file}" << EOF
# Evolution Candidate: Quality Gate Improvement
# Generated: $(date -Iseconds)
# Status: pending_review

type: quality_improvement
confidence: medium
source: quality-patterns
gate: ${gate_name}
failure_count: ${failure_count}
suggestion: |
  The quality gate "${gate_name}" has failed ${failure_count} times.
  Consider:
  - Reviewing the gate threshold
  - Adding pre-checks to catch issues earlier
  - Improving related standards/documentation

proposed_change:
  target: workflow/standards/testing/coverage.md
  section: quality_gates
  action: review_and_adjust
EOF
      fi
    fi
  fi

  echo "Quality gate recorded: ${gate_name} = ${status}"
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

  # Count gate occurrences by status
  local gate_counts
  gate_counts=$(grep -o "gate=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  local pass_counts
  pass_counts=$(grep "status=pass" "${temp_file}" | grep -o "gate=[^,]*" | sort | uniq -c | sort -rn 2>/dev/null || echo "")

  local fail_counts
  fail_counts=$(grep "status=fail" "${temp_file}" | grep -o "gate=[^,]*" | sort | uniq -c | sort -rn 2>/dev/null || echo "")

  local pattern_count
  pattern_count=$(echo "${gate_counts}" | awk -v t="${threshold}" '$1 >= t' | wc -l)

  mkdir -p "${PATTERNS_DIR}"
  cat > "${PATTERNS_DIR}/quality-patterns.md" << EOF
# Quality Patterns

Erkannte Muster bei Quality Gate Ergebnissen.

## Active Patterns

### Gate Usage (threshold: ${threshold}+)

$(echo "${gate_counts}" | awk -v t="${threshold}" '$1 >= t {gsub(/gate=/, "", $2); printf "- **%s**: %s checks\n", $2, $1}')

### Pass Rate by Gate

$(if [ -n "${pass_counts}" ]; then
  echo "${pass_counts}" | awk '{gsub(/gate=/, "", $2); printf "- **%s**: %s passes\n", $2, $1}'
else
  echo "No passes recorded yet."
fi)

### Failure Rate by Gate

$(if [ -n "${fail_counts}" ]; then
  echo "${fail_counts}" | awk '{gsub(/gate=/, "", $2); printf "- **%s**: %s failures\n", $2, $1}'
else
  echo "No failures recorded."
fi)

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | ${total_obs} |
| Gates Tracked | ${pattern_count} |
| Last Updated | $(date -Iseconds) |
EOF

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

  # Count by agent
  local agent_std_counts
  agent_std_counts=$(grep -o "standard=[^,]*,agent=[^,]*" "${temp_file}" | sort | uniq -c | sort -rn)

  local standards_tracked
  standards_tracked=$(echo "${usage_counts}" | wc -l)

  mkdir -p "${PATTERNS_DIR}"
  cat > "${PATTERNS_DIR}/standards-usage.md" << EOF
# Standards Usage Patterns

Erkannte Muster bei Standards-Nutzung und deren Effektivitaet.

## Active Patterns

### Standards Usage Frequency

$(echo "${usage_counts}" | awk '{gsub(/standard=/, "", $2); printf "- **%s**: %s uses\n", $2, $1}')

### Standards by Agent

$(echo "${agent_std_counts}" | head -20 | awk '{
  combo=$2;
  gsub(/standard=/, "", combo);
  split(combo, parts, ",agent=");
  printf "- **%s** -> %s: %s times\n", parts[2], parts[1], $1
}')

## Insights

$(if [ "${total_obs}" -gt 10 ]; then
  # Calculate most/least used standards
  most_used=$(echo "${usage_counts}" | head -1 | awk '{gsub(/standard=/, "", $2); print $2}')
  least_used=$(echo "${usage_counts}" | tail -1 | awk '{gsub(/standard=/, "", $2); print $2}')
  echo "- Most used standard: **${most_used}**"
  echo "- Least used standard: **${least_used}**"
  echo ""
  echo "Consider reviewing least-used standards for relevance."
else
  echo "Not enough data for insights yet (${total_obs} observations)."
fi)

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
  local standards_count=0
  local quality_count=0
  local delegation_count=0

  if [ -d "${OBSERVATIONS_DIR}" ]; then
    obs_count=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" -type f 2>/dev/null | wc -l) || obs_count=0
    standards_count=$(grep -h "| standards |" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | wc -l) || standards_count=0
    quality_count=$(grep -h "| quality |" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | wc -l) || quality_count=0
    delegation_count=$(grep -h "| delegation |" "${OBSERVATIONS_DIR}"/session-*.toon 2>/dev/null | wc -l) || delegation_count=0
  fi

  if [ -d "${PATTERNS_DIR}" ]; then
    pattern_count=$(grep -l "## Active Patterns" "${PATTERNS_DIR}"/*.md 2>/dev/null | \
      xargs grep -c "^-\|^|" 2>/dev/null | \
      awk -F: '{sum += $2} END {print sum+0}') || pattern_count=0
  fi

  if [ -d "${EVOLUTION_DIR}/candidates" ]; then
    candidate_count=$(find "${EVOLUTION_DIR}/candidates" -name "*.yml" -type f 2>/dev/null | wc -l) || candidate_count=0
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
  tracking:
    delegations: ${delegation_count}
    standards: ${standards_count}
    quality_gates: ${quality_count}
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

  # Check standards patterns for underutilized standards
  if [ -f "${PATTERNS_DIR}/standards-usage.md" ]; then
    local total_stds
    # Parse markdown table format: | Standards Tracked | 2 |
    total_stds=$(grep "Standards Tracked" "${PATTERNS_DIR}/standards-usage.md" | sed 's/|//g' | awk '{print $NF}')
    total_stds="${total_stds//[^0-9]/}"  # Keep only digits

    if [ "${total_stds:-0}" -gt 5 ]; then
      # Check for standards that might be unused (low count compared to avg)
      local avg_usage
      avg_usage=$(grep "Total Observations" "${PATTERNS_DIR}/standards-usage.md" | sed 's/|//g' | awk '{print $NF}')
      avg_usage="${avg_usage//[^0-9]/}"  # Keep only digits
      avg_usage=$((${avg_usage:-0} / ${total_stds:-1}))

      if [ "${avg_usage:-0}" -gt 2 ]; then
        local candidate_file="${EVOLUTION_DIR}/candidates/standards-review-$(date +%Y%m%d).yml"
        if [ ! -f "${candidate_file}" ]; then
          mkdir -p "${EVOLUTION_DIR}/candidates"
          cat > "${candidate_file}" << EOF
# Evolution Candidate: Standards Review
# Generated: $(date -Iseconds)
# Status: pending_review

type: standards_review
confidence: medium
source: standards-usage
suggestion: |
  With ${total_stds} standards tracked and avg ${avg_usage} uses each,
  consider reviewing which standards are most/least effective.

proposed_change:
  target: workflow/standards/
  action: review_effectiveness
EOF
        fi
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
    quality)
      handle_quality "$@"
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
      echo "Usage: nano-observer.sh {delegation|quality|analyze|cleanup|status}" >&2
      echo "" >&2
      echo "Commands:" >&2
      echo "  delegation     Record agent delegation (called by PostToolUse hook)" >&2
      echo "  quality NAME STATUS [AGENT]  Record quality gate result" >&2
      echo "                 STATUS: pass|fail|skip|warn" >&2
      echo "  analyze        Analyze patterns (called by Stop hook)" >&2
      echo "  cleanup        Remove old session files" >&2
      echo "  status         Print learning status summary" >&2
      exit 1
      ;;
  esac
}

main "$@"
