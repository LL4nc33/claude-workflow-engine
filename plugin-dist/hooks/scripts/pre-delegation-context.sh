#!/usr/bin/env bash
# PreToolUse Hook: Auto-Context Injection for Task Delegations
# Reads Task prompt, finds relevant standards + code, injects context
#
# This hook intercepts Task tool calls and adds:
# 1. Standards - Based on task keywords (auth → security, api → response-format)
# 2. Relevant Code - Top files matching keywords (for implement/fix tasks)
# 3. Architecture Context - For design/architecture tasks
#
# Returns additionalContext field (does NOT block or modify the task)
# Configuration: workflow/orchestration.yml under standards_injection.auto_context

set -eo pipefail

# CRITICAL: Save stdin BEFORE any other operations
# The source command or other shell operations can consume stdin
STDIN_CONTENT=""
read -r STDIN_CONTENT 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# =============================================================================
# Configuration
# =============================================================================
MAX_STANDARDS=4
MAX_FILES=3
TIMEOUT_SECONDS=8  # Leave 2s buffer for hook timeout

# =============================================================================
# Get Standards Content
# Reads matched standards files and returns their content (truncated)
# =============================================================================
get_standards_content() {
  local matched="$1"
  local root
  root="$(get_project_root)"
  local result=""

  # Convert comma-separated to array
  IFS=',' read -ra standards <<< "${matched}"

  for std in "${standards[@]}"; do
    [ -z "${std}" ] && continue
    local file="${root}/workflow/standards/${std}.md"

    if [ -f "${file}" ]; then
      # Get first 50 lines (approximate token budget per standard)
      local content
      content=$(head -50 "${file}" 2>/dev/null || true)
      if [ -n "${content}" ]; then
        result="${result}### ${std}\n${content}\n\n"
      fi
    fi
  done

  echo -e "${result}"
}

# =============================================================================
# Architecture Context
# For design/architecture tasks, include architecture.md summary
# =============================================================================
get_architecture_summary() {
  local root
  root="$(get_project_root)"
  local arch_file="${root}/workflow/product/architecture.md"

  [ ! -f "${arch_file}" ] && echo "" && return

  # Get first ~100 lines (~500 tokens worth)
  local content
  content=$(head -100 "${arch_file}" 2>/dev/null) || true

  if [ -n "${content}" ]; then
    echo "### Architecture Context\n${content}"
  fi
}

# =============================================================================
# Main Hook Logic
# =============================================================================

# Use the stdin content captured at script start
input="${STDIN_CONTENT}"

# Timeout protection: exit gracefully if taking too long
(
  sleep "${TIMEOUT_SECONDS}"
  kill -TERM $$ 2>/dev/null
) &
TIMEOUT_PID=$!
trap 'kill ${TIMEOUT_PID} 2>/dev/null; exit 0' EXIT

# Fast path: empty input
if [ -z "${input}" ]; then
  echo '{}'
  exit 0
fi

# Extract tool name
tool_name=""
if command -v jq &>/dev/null; then
  tool_name=$(echo "${input}" | jq -r '.tool_name // empty' 2>/dev/null)
else
  tool_name=$(echo "${input}" | grep -oP '"tool_name"\s*:\s*"\K[^"]+' 2>/dev/null) || true
fi

# Fast path: Not a Task tool call
if [ "${tool_name}" != "Task" ]; then
  echo '{}'
  exit 0
fi

# Extract the prompt from tool_input
prompt=""
if command -v jq &>/dev/null; then
  prompt=$(echo "${input}" | jq -r '.tool_input.prompt // .tool_input.description // empty' 2>/dev/null)
else
  prompt=$(echo "${input}" | grep -oP '"prompt"\s*:\s*"\K[^"]+' 2>/dev/null) || true
fi

# Fast path: no prompt
if [ -z "${prompt}" ]; then
  echo '{}'
  exit 0
fi

# Extract keywords from prompt (uses common.sh function)
keywords=$(extract_keywords "${prompt}")

# 1. Match and get standards (uses common.sh function)
matched_standards=$(match_standards "${keywords}" "${MAX_STANDARDS}")
standards_content=$(get_standards_content "${matched_standards}")

# 2. Scan for relevant code (only for implement/fix/refactor tasks)
# Uses common.sh function
relevant_files=""
if echo "${prompt}" | grep -qiE "implement|fix|refactor|erweitere|aendere|baue|erstelle|bug"; then
  relevant_files=$(scan_relevant_code "${keywords}" "${MAX_FILES}")
  if [ -n "${relevant_files}" ]; then
    relevant_files="Potentially relevant files:\n${relevant_files}"
  fi
fi

# 3. Architecture context for design tasks
architecture_context=""
if echo "${prompt}" | grep -qiE "design|architect|entwerf|architektur|system|struktur"; then
  architecture_context=$(get_architecture_summary)
fi

# Build the additional context
additional_context=""

if [ -n "${matched_standards}" ]; then
  additional_context="${additional_context}## Relevante Standards\n\nAuto-injected based on task keywords: ${matched_standards}\n\n${standards_content}\n"
fi

if [ -n "${relevant_files}" ]; then
  additional_context="${additional_context}## Bestehender Code\n\n${relevant_files}\n"
fi

if [ -n "${architecture_context}" ]; then
  additional_context="${additional_context}${architecture_context}\n"
fi

# If we have context to inject, return it
if [ -n "${additional_context}" ]; then
  # Escape for JSON using jq if available, otherwise basic escape
  if command -v jq &>/dev/null; then
    escaped_context=$(echo -e "${additional_context}" | jq -Rs '.')
    echo "{\"additionalContext\": ${escaped_context}}"
  else
    # Basic JSON escaping fallback
    escaped_context=$(echo -e "${additional_context}" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | tr '\n' ' ')
    echo "{\"additionalContext\": \"${escaped_context}\"}"
  fi
else
  echo '{}'
fi
