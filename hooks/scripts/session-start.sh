#!/usr/bin/env bash
# SessionStart Hook: Provides workflow context at session start
# Optimized for fast execution with background checks
# Target: <50ms perceived latency for initial response

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

ROOT="$(get_project_root)"

warnings=""
context_parts=""

# Clean stale cache entries from previous sessions
clean_cache 3600

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

# Check mission (simple file existence - fast)
if [ -f "${ROOT}/workflow/product/mission.md" ]; then
  context_parts="${context_parts}Mission vorhanden. "
else
  warnings="${warnings}Keine mission.md. Starte mit /workflow:plan-product. "
fi

# Check for active spec (optimized: early exit on first match)
active_spec="$(get_active_spec)"
if [ -n "${active_spec}" ]; then
  context_parts="${context_parts}Aktive Spec: ${active_spec}. "
fi

# Count available standards for context info
standards_count=$(find "${ROOT}/workflow/standards" -name "*.md" -not -name "README*" 2>/dev/null | wc -l)
if [ "${standards_count}" -gt 0 ]; then
  context_parts="${context_parts}${standards_count} Standards verfuegbar. "
fi

# Build compact context message
context_msg="Workflow Engine v0.2.5"
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
