#!/usr/bin/env bash
# SessionStart Hook: Provides workflow context at session start
# Checks standards index freshness and returns context information

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

ROOT="$(get_project_root)"

warnings=""
context_parts=""

# Check if standards index exists
if [ -f "${ROOT}/workflow/standards/index.yml" ]; then
  index_time=$(stat -c %Y "${ROOT}/workflow/standards/index.yml" 2>/dev/null || stat -f %m "${ROOT}/workflow/standards/index.yml" 2>/dev/null)

  # Find newest standard file
  newest_standard=""
  newest_time=0
  while IFS= read -r -d '' file; do
    file_time=$(stat -c %Y "${file}" 2>/dev/null || stat -f %m "${file}" 2>/dev/null)
    if [ "${file_time}" -gt "${newest_time}" ]; then
      newest_time="${file_time}"
      newest_standard="${file}"
    fi
  done < <(find "${ROOT}/workflow/standards" -name "*.md" -print0 2>/dev/null)

  if [ "${newest_time}" -gt "${index_time}" ]; then
    warnings="${warnings}Standards-Index ist veraltet (neuere Datei: $(basename "${newest_standard}")). Fuehre /workflow/index-standards aus. "
  fi
else
  warnings="${warnings}Standards-Index (workflow/standards/index.yml) nicht gefunden. "
fi

# Check if mission exists
if [ -f "${ROOT}/workflow/product/mission.md" ]; then
  context_parts="${context_parts}Produkt-Mission vorhanden. "
else
  warnings="${warnings}Keine mission.md in workflow/product/ gefunden. Starte mit /workflow/plan-product. "
fi

# Check for active spec
active_spec="$(get_active_spec)"
if [ -n "${active_spec}" ]; then
  context_parts="${context_parts}Aktive Spezifikation: ${active_spec}. "
fi

# Build context message
context_msg="Claude Workflow Engine v0.2.7 (6-Layer Plugin)"
if [ -n "${context_parts}" ]; then
  context_msg="${context_msg} | ${context_parts}"
fi
if [ -n "${warnings}" ]; then
  context_msg="${context_msg} | Warnungen: ${warnings}"
fi

escaped_context="$(json_escape "${context_msg}")"

# Output hook response
cat <<EOF
{"hookSpecificOutput": {"additionalContext": "${escaped_context}"}}
EOF
