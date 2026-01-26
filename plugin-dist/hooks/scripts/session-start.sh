#!/usr/bin/env bash
# SessionStart Hook: Provides workflow context at session start
# Optimized for fast execution with background checks
# Target: <50ms perceived latency for initial response

# Consume stdin to prevent hook errors (Claude sends JSON input)
cat > /dev/null 2>&1 &

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

ROOT="$(get_project_root)"

# Store session ID for nano-observer to use
echo "$(date +%Y%m%d-%H%M%S)" > "/tmp/claude-current-session-id" 2>/dev/null

warnings=""
context_parts=""

# Clean stale cache entries from previous sessions
clean_cache 3600

# Check for pending quality gates based on active spec state
check_pending_gates() {
  local spec_dir="$1"
  [ -z "${spec_dir}" ] && return

  local root
  root="$(get_project_root)"
  local full_path="${root}/workflow/specs/${spec_dir}"

  # Gate 2: Pre-Execution (tasks.md exists but no orchestration started)
  if [ -f "${full_path}/tasks.md" ] && [ ! -f "${full_path}/progress.md" ]; then
    if [ ! -f "${root}/.claude/state/gates/gate2_passed" ]; then
      echo "Gate 2 (Pre-Execution) pending"
      return
    fi
  fi

  # Gate 1: Pre-Implementation (spec.md exists but no tasks.md)
  if [ -f "${full_path}/spec.md" ] && [ ! -f "${full_path}/tasks.md" ]; then
    if [ ! -f "${root}/.claude/state/gates/gate1_passed" ]; then
      echo "Gate 1 (Pre-Implementation) pending"
      return
    fi
  fi

  # Gate 4: Final Acceptance (all tasks completed)
  if [ -f "${full_path}/progress.md" ]; then
    if grep -q "Status.*completed\|100%" "${full_path}/progress.md" 2>/dev/null; then
      if [ ! -f "${root}/.claude/state/gates/gate4_passed" ]; then
        echo "Gate 4 (Final Acceptance) pending"
        return
      fi
    fi
  fi
}

# Fast path: Check index existence first (no find traversal)
if [ -f "${ROOT}/workflow/standards/index.yml" ]; then
  index_time=$(stat -c %Y "${ROOT}/workflow/standards/index.yml" 2>/dev/null || stat -f %m "${ROOT}/workflow/standards/index.yml" 2>/dev/null)

  # Optimized: only check domains directories (not recursive find)
  stale=false
  for domain_dir in "${ROOT}/workflow/standards"/*/; do
    [ -d "${domain_dir}" ] || continue
    for md_file in "${domain_dir}"*.md; do
      [ -f "${md_file}" ] || continue
      file_time=$(stat -c %Y "${md_file}" 2>/dev/null || stat -f %m "${md_file}" 2>/dev/null)
      if [ "${file_time}" -gt "${index_time}" ]; then
        stale=true
        warnings="${warnings}Standards-Index veraltet ($(basename "${md_file}")). Fuehre /workflow:index-standards aus. "
        break 2
      fi
    done
  done
else
  warnings="${warnings}Standards-Index nicht gefunden. "
fi

# First-Run Detection: Check if workflow is set up at all
first_run=false
if [ ! -d "${ROOT}/workflow" ] || [ ! -f "${ROOT}/workflow/config.yml" ]; then
  first_run=true
  context_parts="${context_parts}FIRST-RUN: Neues Projekt erkannt. "
  warnings="${warnings}Starte mit /workflow:smart-workflow oder /workflow:quick fuer schnellen Einstieg. "
fi

# Check mission (simple file existence - fast)
if [ -f "${ROOT}/workflow/product/mission.md" ]; then
  context_parts="${context_parts}Mission vorhanden. "
elif [ "${first_run}" = "false" ]; then
  warnings="${warnings}Keine mission.md. Starte mit /workflow:plan-product. "
fi

# Check for active spec (optimized: early exit on first match)
active_spec="$(get_active_spec)"
if [ -n "${active_spec}" ]; then
  context_parts="${context_parts}Aktive Spec: ${active_spec}. "

  # Check for pending quality gates
  pending_gate="$(check_pending_gates "${active_spec}")"
  if [ -n "${pending_gate}" ]; then
    warnings="${warnings}${pending_gate} -> /workflow:quality-gates. "
  fi
fi

# Count available standards for context info
standards_count=$(find "${ROOT}/workflow/standards" -name "*.md" -not -name "README*" 2>/dev/null | wc -l)
if [ "${standards_count}" -gt 0 ]; then
  context_parts="${context_parts}${standards_count} Standards verfuegbar. "
fi

# NaNo learning status (fast check with cache)
learning_status="$(get_learning_status)"
if [ "${learning_status}" != "disabled" ]; then
  context_parts="${context_parts}NaNo: ${learning_status}. "

  # Check for pending evolution candidates
  nano_dir="${ROOT}/workflow/nano"
  if [ -d "${nano_dir}/evolution/candidates" ]; then
    candidate_count=$(find "${nano_dir}/evolution/candidates" -name "*.yml" -type f 2>/dev/null | wc -l)
    if [ "${candidate_count}" -gt 0 ]; then
      context_parts="${context_parts}${candidate_count} evolution candidate(s) pending -> /workflow:review-candidates. "
    fi
  fi

  # Show delegation statistics if available
  if [ -f "${nano_dir}/patterns/delegation-patterns.md" ]; then
    # Extract top 3 agents from delegation patterns
    top_agents=$(grep -o "agent=[^,]*" "${nano_dir}/patterns/delegation-patterns.md" 2>/dev/null | \
      sed 's/agent=//' | sort | uniq -c | sort -rn | head -3 | \
      awk '{printf "%s(%s) ", $2, $1}' | sed 's/ $//')
    if [ -n "${top_agents}" ]; then
      context_parts="${context_parts}Top agents: ${top_agents}. "
    fi
  fi

  # Background: trigger analysis of unanalyzed sessions (non-blocking)
  if [ -d "${nano_dir}/observations" ]; then
    needs_analysis=false
    if [ -f "${nano_dir}/patterns/delegation-patterns.md" ]; then
      unanalyzed=$(find "${nano_dir}/observations" -name "session-*.toon" -type f \
        -newer "${nano_dir}/patterns/delegation-patterns.md" 2>/dev/null | wc -l)
      [ "${unanalyzed}" -gt 0 ] && needs_analysis=true
    else
      # No patterns file yet, check if any sessions exist
      any_sessions=$(find "${nano_dir}/observations" -name "session-*.toon" -type f 2>/dev/null | head -1)
      [ -n "${any_sessions}" ] && needs_analysis=true
    fi

    if [ "${needs_analysis}" = "true" ]; then
      "${SCRIPT_DIR}/nano-observer.sh" analyze &>/dev/null &
    fi
  fi
fi

# Build compact context message
context_msg="Workflow Engine v0.2.9"
if [ -n "${context_parts}" ]; then
  context_msg="${context_msg} | ${context_parts}"
fi
if [ -n "${warnings}" ]; then
  context_msg="${context_msg} | WARN: ${warnings}"
fi

escaped_context="$(json_escape "${context_msg}")"

# Output hook response
cat <<EOF
{"hookSpecificOutput": {"additionalContext": "${escaped_context}"}}
EOF
