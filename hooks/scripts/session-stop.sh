#!/usr/bin/env bash
# =============================================================================
# Session Stop Hook: Auto-documentation suggestions based on session activity
# Runs at session end (Stop event) to suggest /workflow:devlog when appropriate
#
# Triggers:
#   - >3 files changed during session
#   - Orchestration completed (progress.md at 100%)
#   - Bug fixes detected (root-cause observations)
#
# Output: JSON with additionalContext for user notification
# =============================================================================

# Consume stdin to prevent hook errors (Claude sends JSON input)
cat > /dev/null 2>&1 &

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

ROOT="$(get_project_root)"
NANO_DIR="${ROOT}/workflow/nano"
OBSERVATIONS_DIR="${NANO_DIR}/observations"

# --- Configuration ---
# Threshold for suggesting documentation (from completion-workflow.md standard)
CHANGE_THRESHOLD=3

# --- Helper Functions ---

# Get session ID from shared file or env
get_session_id() {
  if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
    echo "${CLAUDE_SESSION_ID}"
  elif [ -f "/tmp/claude-current-session-id" ]; then
    cat /tmp/claude-current-session-id
  else
    echo ""
  fi
}

# Count file changes in current session from NaNo observations
# Uses delegation.log if active orchestration, otherwise session toon file
count_session_changes() {
  local count=0

  # Method 1: Check active spec's delegation.log (most accurate for orchestration)
  local active_spec
  active_spec="$(get_active_spec)"
  if [ -n "${active_spec}" ]; then
    local log_file="${ROOT}/workflow/specs/${active_spec}/delegation.log"
    if [ -f "${log_file}" ]; then
      # Count unique files (excluding header lines)
      count=$(grep -v "^#" "${log_file}" 2>/dev/null | grep "|" | awk -F'|' '{print $2}' | sort -u | wc -l)
      echo "${count}"
      return
    fi
  fi

  # Method 2: Check NaNo session file for this session
  local session_id
  session_id="$(get_session_id)"
  if [ -n "${session_id}" ] && [ -f "${OBSERVATIONS_DIR}/session-${session_id}.toon" ]; then
    # Count from session header
    count=$(sed -n 's/^count: //p' "${OBSERVATIONS_DIR}/session-${session_id}.toon" 2>/dev/null)
    echo "${count:-0}"
    return
  fi

  # Method 3: Count from most recent session file
  if [ -d "${OBSERVATIONS_DIR}" ]; then
    local latest_session
    latest_session=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | awk '{print $2}')
    if [ -n "${latest_session}" ]; then
      count=$(sed -n 's/^count: //p' "${latest_session}" 2>/dev/null)
      echo "${count:-0}"
      return
    fi
  fi

  echo "0"
}

# Check if any orchestration just completed (progress.md shows 100% or all done)
check_orchestration_completed() {
  local specs_dir="${ROOT}/workflow/specs"
  [ -d "${specs_dir}" ] || return 1

  for progress_file in "${specs_dir}"/*/progress.md; do
    [ -f "${progress_file}" ] || continue

    # Check for completion indicators
    if grep -qE "Completed.*$(date +%Y-%m-%d)|100%|\[x\].*Phase.*4|\[x\].*Final" "${progress_file}" 2>/dev/null; then
      # Only if it was recently modified (within last hour = likely this session)
      local file_age
      file_age=$(( $(date +%s) - $(stat -c %Y "${progress_file}" 2>/dev/null || echo 0) ))
      if [ "${file_age}" -lt 3600 ]; then
        basename "$(dirname "${progress_file}")"
        return 0
      fi
    fi
  done

  return 1
}

# Check for bug-fix observations in current session (builder with "fix" task)
check_bug_fixes() {
  local session_id
  session_id="$(get_session_id)"

  if [ -n "${session_id}" ] && [ -f "${OBSERVATIONS_DIR}/session-${session_id}.toon" ]; then
    if grep -qiE "desc=.*fix|desc=.*bug|desc=.*beheb" "${OBSERVATIONS_DIR}/session-${session_id}.toon" 2>/dev/null; then
      return 0
    fi
  fi

  return 1
}

# --- Main Logic ---

main() {
  local suggestions=""
  local change_count
  local completed_spec

  # Check 1: File change threshold
  change_count=$(count_session_changes)
  if [ "${change_count}" -gt "${CHANGE_THRESHOLD}" ]; then
    suggestions="${suggestions}${change_count} Dateien geaendert. "
  fi

  # Check 2: Orchestration completion
  completed_spec=$(check_orchestration_completed)
  if [ -n "${completed_spec}" ]; then
    suggestions="${suggestions}Spec '${completed_spec}' abgeschlossen. "
  fi

  # Check 3: Bug fixes detected
  if check_bug_fixes; then
    suggestions="${suggestions}Bug-Fix erkannt. "
  fi

  # Build output message
  if [ -n "${suggestions}" ]; then
    local message="Dokumentation empfohlen: ${suggestions}Nutze /workflow:devlog fuer automatische Session-Dokumentation."
    local escaped_message
    escaped_message="$(json_escape "${message}")"

    cat <<EOF
{"hookSpecificOutput": {"additionalContext": "${escaped_message}"}}
EOF
  else
    # No suggestions - output empty response
    echo '{"hookSpecificOutput": {}}'
  fi
}

main

# =============================================================================
# Manual Test Cases (run from project root):
#
# 1. No activity (should output empty):
#    bash hooks/scripts/session-stop.sh
#    Expected: {"hookSpecificOutput": {}}
#
# 2. Many file changes (>3):
#    mkdir -p workflow/nano/observations
#    echo -e "session: test\ncount: 5\nobservations:" > workflow/nano/observations/session-test.toon
#    echo "test" > /tmp/claude-current-session-id
#    bash hooks/scripts/session-stop.sh
#    Expected: {"hookSpecificOutput": {"additionalContext": "Dokumentation empfohlen: 5 Dateien geaendert..."}}
#    rm workflow/nano/observations/session-test.toon /tmp/claude-current-session-id
#
# 3. Bug fix detected:
#    mkdir -p workflow/nano/observations
#    echo -e "session: test\ncount: 1\nobservations:\n  2026-01-26 | delegation | desc=fix login bug" > workflow/nano/observations/session-test.toon
#    echo "test" > /tmp/claude-current-session-id
#    bash hooks/scripts/session-stop.sh
#    Expected: {"hookSpecificOutput": {"additionalContext": "...Bug-Fix erkannt..."}}
#    rm workflow/nano/observations/session-test.toon /tmp/claude-current-session-id
# =============================================================================
