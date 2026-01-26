#!/usr/bin/env bash
# SessionStart Hook: Simple status check for CWE
# Provides workflow context at session start

# Consume stdin to prevent hook errors
cat > /dev/null 2>&1 &

# Find project root (where .git or workflow/ exists)
find_root() {
  local dir="${PWD}"
  while [ "${dir}" != "/" ]; do
    if [ -d "${dir}/.git" ] || [ -d "${dir}/workflow" ]; then
      echo "${dir}"
      return
    fi
    dir="$(dirname "${dir}")"
  done
  echo "${PWD}"
}

ROOT="$(find_root)"

# Simple status check
if [ -d "${ROOT}/workflow" ]; then
  echo '{"systemMessage": "Claude Workflow Engine v0.3.1 | Ready. Run /cwe:start to continue."}'
else
  echo '{"systemMessage": "Claude Workflow Engine v0.3.1 | No project initialized. Run /cwe:init to start."}'
fi
