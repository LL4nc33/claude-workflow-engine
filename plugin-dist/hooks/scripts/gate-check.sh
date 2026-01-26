#!/usr/bin/env bash
# PreToolUse Hook: Quality Gate Enforcement
# Blocks workflow commands if required gates haven't passed
# Token-optimized: fast-path exits, minimal output

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Read command from Skill tool input
input="$(cat)"
skill_name=$(echo "${input}" | jq -r '.tool_input.skill // empty' 2>/dev/null)

# Fast-path: not a Skill tool call
[ -z "${skill_name}" ] && echo '{"permissionDecision":"allow"}' && exit 0

# Fast-path: not a workflow command
[[ "${skill_name}" != workflow:* ]] && echo '{"permissionDecision":"allow"}' && exit 0

ROOT="$(get_project_root)"
STATE_DIR="${ROOT}/.claude/state/gates"

# Get active spec directory
get_active_spec_dir() {
  local specs_dir="${ROOT}/workflow/specs"
  [ ! -d "${specs_dir}" ] && return

  # Find most recently modified spec folder
  find "${specs_dir}" -maxdepth 1 -type d -name "[0-9]*" 2>/dev/null | \
    xargs -I{} stat -c '%Y %n' {} 2>/dev/null | \
    sort -rn | head -1 | awk '{print $2}' | xargs basename 2>/dev/null
}

ACTIVE_SPEC="$(get_active_spec_dir)"
SPEC_PATH="${ROOT}/workflow/specs/${ACTIVE_SPEC}"

# Gate enforcement logic
case "${skill_name}" in
  workflow:create-tasks)
    # Requires Gate 1 (Pre-Implementation) if spec.md exists
    if [ -n "${ACTIVE_SPEC}" ] && [ -f "${SPEC_PATH}/spec.md" ]; then
      if [ ! -f "${STATE_DIR}/gate1_${ACTIVE_SPEC}" ]; then
        reason="Gate 1 (Pre-Implementation) nicht bestanden. Fuehre erst Review durch: architect + security pruefen spec.md"
        echo "{\"permissionDecision\":\"deny\",\"reason\":\"$(json_escape "${reason}")\"}"
        exit 0
      fi
    fi
    ;;

  workflow:orchestrate-tasks)
    # Requires Gate 2 (Pre-Execution) if tasks.md exists
    if [ -n "${ACTIVE_SPEC}" ] && [ -f "${SPEC_PATH}/tasks.md" ]; then
      if [ ! -f "${STATE_DIR}/gate2_${ACTIVE_SPEC}" ]; then
        reason="Gate 2 (Pre-Execution) nicht bestanden. Fuehre erst Review durch: architect prueft tasks.md"
        echo "{\"permissionDecision\":\"deny\",\"reason\":\"$(json_escape "${reason}")\"}"
        exit 0
      fi
    fi
    ;;

  workflow:release)
    # Requires Gate 4 (Final Acceptance) if orchestration was done
    if [ -n "${ACTIVE_SPEC}" ] && [ -f "${SPEC_PATH}/progress.md" ]; then
      if [ ! -f "${STATE_DIR}/gate4_${ACTIVE_SPEC}" ]; then
        reason="Gate 4 (Final Acceptance) nicht bestanden. Fuehre erst Final Review durch."
        echo "{\"permissionDecision\":\"deny\",\"reason\":\"$(json_escape "${reason}")\"}"
        exit 0
      fi
    fi
    ;;
esac

# All other commands allowed
echo '{"permissionDecision":"allow"}'
