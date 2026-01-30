#!/bin/bash
# =============================================================================
# Engine-Sync: Self-Maintaining Documentation & Template Synchronization
# Version: 1.1.0
#
# A robust, performant sync system for Claude Workflow Engine.
# Ensures documentation, templates, and version info stay consistent.
#
# Usage:
#   engine-sync.sh [MODE]
#
# Modes:
#   check          - Report inconsistencies (default)
#   fix            - Fix documentation numbers
#   sync-templates - Sync CLI templates with main project
#   full           - Do everything (fix + sync + nano recovery)
#
# Exit Codes:
#   0 - All checks passed / fixes applied
#   1 - Issues found (check mode) or errors occurred
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="${SCRIPT_DIR}/../.."
readonly MODE="${1:-check}"

# Colors (disable if not terminal)
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly NC='\033[0m'
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# =============================================================================
# Logging
# =============================================================================

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()      { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }
log_section() { echo -e "\n${BLUE}=== $* ===${NC}"; }

# =============================================================================
# Source of Truth: Count resources
# =============================================================================

get_counts() {
    COMMANDS=$(find "${PROJECT_ROOT}/.claude/commands/workflow" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)
    SKILLS=$(find "${PROJECT_ROOT}/.claude/skills/workflow" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    STANDARDS=$(find "${PROJECT_ROOT}/workflow/standards" -name "*.md" -type f ! -name "README.md" 2>/dev/null | wc -l)
    DOMAINS=$(find "${PROJECT_ROOT}/workflow/standards" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    HOOKS=$(grep -c '"event"' "${PROJECT_ROOT}/hooks/hooks.json" 2>/dev/null || echo 0)
    AGENTS=$(find "${PROJECT_ROOT}/.claude/agents" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)
    VERSION=$(tr -d '\n' < "${PROJECT_ROOT}/VERSION" 2>/dev/null || echo "unknown")

    # Trim whitespace
    COMMANDS=${COMMANDS// /}
    SKILLS=${SKILLS// /}
    STANDARDS=${STANDARDS// /}
    DOMAINS=${DOMAINS// /}
    HOOKS=${HOOKS// /}
    AGENTS=${AGENTS// /}
}

print_counts() {
    log_section "Source of Truth"
    echo "  Commands:  ${COMMANDS}"
    echo "  Skills:    ${SKILLS}"
    echo "  Standards: ${STANDARDS} in ${DOMAINS} domains"
    echo "  Hooks:     ${HOOKS}"
    echo "  Agents:    ${AGENTS}"
    echo "  Version:   ${VERSION}"
}

# =============================================================================
# Documentation Checker/Fixer
# =============================================================================

# Files to check for number consistency
readonly DOC_FILES=(
    "README.md"
    "README_EN.md"
    ".claude/CLAUDE.md"
    "docs/erste-schritte.md"
    "docs/en/getting-started.md"
    "docs/plattform-architektur.md"
    "docs/en/platform-architecture.md"
    "docs/integration.md"
    "docs/en/integration.md"
    "docs/standards.md"
    "docs/en/standards.md"
    "docs/workflow.md"
    "docs/en/workflow.md"
)

check_docs() {
    log_section "Documentation Check"
    local issues=0

    for doc in "${DOC_FILES[@]}"; do
        local file="${PROJECT_ROOT}/${doc}"
        [[ -f "$file" ]] || continue

        local file_issues=()

        # Check outdated numbers
        grep -qE '\b8 (Commands|Slash-Commands|commands)\b' "$file" 2>/dev/null && \
            file_issues+=("Commands: 8 → ${COMMANDS}")
        grep -qE '\b10 Skills\b' "$file" 2>/dev/null && \
            file_issues+=("Skills: 10 → ${SKILLS}")
        grep -qE '\b11 Standards\b' "$file" 2>/dev/null && \
            file_issues+=("Standards: 11 → ${STANDARDS}")
        grep -qE '\b7 (Domains|Domaenen)\b' "$file" 2>/dev/null && \
            file_issues+=("Domains: 7 → ${DOMAINS}")

        if [[ ${#file_issues[@]} -gt 0 ]]; then
            log_warn "${doc}"
            for issue in "${file_issues[@]}"; do
                echo "    - ${issue}"
            done
            ((issues++))
        fi
    done

    if [[ $issues -eq 0 ]]; then
        log_ok "All documentation numbers are correct"
        return 0
    else
        log_warn "${issues} files need updates"
        return 1
    fi
}

fix_docs() {
    log_section "Fixing Documentation"
    local fixed=0

    for doc in "${DOC_FILES[@]}"; do
        local file="${PROJECT_ROOT}/${doc}"
        [[ -f "$file" ]] || continue

        local changed=false

        # Fix all outdated patterns
        if grep -qE '\b8 Commands\b' "$file" 2>/dev/null; then
            sed -i "s/\b8 Commands\b/${COMMANDS} Commands/g" "$file"
            changed=true
        fi
        if grep -qE '\b8 Slash-Commands\b' "$file" 2>/dev/null; then
            sed -i "s/\b8 Slash-Commands\b/${COMMANDS} Slash-Commands/g" "$file"
            changed=true
        fi
        if grep -qE '\b8 commands\b' "$file" 2>/dev/null; then
            sed -i "s/\b8 commands\b/${COMMANDS} commands/g" "$file"
            changed=true
        fi
        if grep -qE '\b10 Skills\b' "$file" 2>/dev/null; then
            sed -i "s/\b10 Skills\b/${SKILLS} Skills/g" "$file"
            changed=true
        fi
        if grep -qE '\b11 Standards\b' "$file" 2>/dev/null; then
            sed -i "s/\b11 Standards\b/${STANDARDS} Standards/g" "$file"
            changed=true
        fi
        if grep -qE '\b7 Domains\b' "$file" 2>/dev/null; then
            sed -i "s/\b7 Domains\b/${DOMAINS} Domains/g" "$file"
            changed=true
        fi
        if grep -qE '\b7 Domaenen\b' "$file" 2>/dev/null; then
            sed -i "s/\b7 Domaenen\b/${DOMAINS} Domaenen/g" "$file"
            changed=true
        fi

        if [[ "$changed" == "true" ]]; then
            log_ok "Fixed: ${doc}"
            ((fixed++))
        fi
    done

    echo "  Fixed ${fixed} files"
}

# =============================================================================
# Version Consistency
# =============================================================================

check_version() {
    log_section "Version Check"
    local issues=0

    # Version patterns to check
    declare -A version_checks=(
        ["README.md"]="version-${VERSION}-blue"
        ["workflow/config.yml"]="version: ${VERSION}"
        [".claude-plugin/plugin.json"]="\"version\": \"${VERSION}\""
        ["cli/package.json"]="\"version\": \"${VERSION}\""
    )

    for file in "${!version_checks[@]}"; do
        local filepath="${PROJECT_ROOT}/${file}"
        local pattern="${version_checks[$file]}"

        if [[ -f "$filepath" ]]; then
            if ! grep -qF "$pattern" "$filepath" 2>/dev/null; then
                log_warn "Version mismatch in ${file}"
                ((issues++))
            fi
        fi
    done

    if [[ $issues -eq 0 ]]; then
        log_ok "Version ${VERSION} is consistent everywhere"
        return 0
    else
        return 1
    fi
}

# =============================================================================
# Template Sync
# =============================================================================

sync_templates() {
    log_section "Template Sync"
    local template_dir="${PROJECT_ROOT}/cli/templates/base"
    local synced=0

    log_info "Syncing main project → CLI templates"

    # Commands
    mkdir -p "${template_dir}/.claude-commands/workflow"
    cp "${PROJECT_ROOT}/.claude/commands/workflow"/*.md "${template_dir}/.claude-commands/workflow/" 2>/dev/null
    synced=$((synced + $(ls "${template_dir}/.claude-commands/workflow"/*.md 2>/dev/null | wc -l)))
    log_ok "Commands: ${COMMANDS} files"

    # Skills
    for skill_dir in "${PROJECT_ROOT}/.claude/skills/workflow"/*/; do
        local skill_name=$(basename "$skill_dir")
        mkdir -p "${template_dir}/.claude-skills/workflow/${skill_name}"
        cp -r "$skill_dir"* "${template_dir}/.claude-skills/workflow/${skill_name}/" 2>/dev/null
    done
    log_ok "Skills: ${SKILLS} directories"

    # Agents
    mkdir -p "${template_dir}/.claude-agents"
    cp "${PROJECT_ROOT}/.claude/agents"/*.md "${template_dir}/.claude-agents/" 2>/dev/null
    log_ok "Agents: ${AGENTS} files"

    # CLAUDE.md
    cp "${PROJECT_ROOT}/.claude/CLAUDE.md" "${template_dir}/.claude-CLAUDE.md" 2>/dev/null
    log_ok "CLAUDE.md"

    # Hooks
    mkdir -p "${template_dir}/hooks/scripts"
    cp "${PROJECT_ROOT}/hooks/hooks.json" "${template_dir}/hooks/hooks.json" 2>/dev/null
    cp "${PROJECT_ROOT}/hooks/scripts"/*.sh "${template_dir}/hooks/scripts/" 2>/dev/null
    log_ok "Hooks: ${HOOKS} hooks + scripts"

    # Workflow configs
    cp "${PROJECT_ROOT}/workflow/config.yml" "${template_dir}/workflow/config.yml" 2>/dev/null
    cp "${PROJECT_ROOT}/workflow/orchestration.yml" "${template_dir}/workflow/orchestration.yml" 2>/dev/null
    log_ok "Workflow configs"

    # Standards
    rm -rf "${template_dir}/workflow/standards-full" 2>/dev/null
    mkdir -p "${template_dir}/workflow/standards-full"
    cp -r "${PROJECT_ROOT}/workflow/standards"/* "${template_dir}/workflow/standards-full/" 2>/dev/null
    log_ok "Standards: ${STANDARDS} in ${DOMAINS} domains"

    # Plugin manifest
    mkdir -p "${template_dir}/.claude-plugin"
    cp "${PROJECT_ROOT}/.claude-plugin/plugin.json" "${template_dir}/.claude-plugin/plugin.json" 2>/dev/null
    log_ok "Plugin manifest"

    echo ""
    log_ok "Template sync complete"
}

check_templates() {
    log_section "Template Check"
    local template_dir="${PROJECT_ROOT}/cli/templates/base"

    local tmpl_commands=$(find "${template_dir}/.claude-commands/workflow" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)
    local tmpl_skills=$(find "${template_dir}/.claude-skills/workflow" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)

    tmpl_commands=${tmpl_commands// /}
    tmpl_skills=${tmpl_skills// /}

    local issues=0

    if [[ "$COMMANDS" != "$tmpl_commands" ]]; then
        log_warn "Commands: main=${COMMANDS}, template=${tmpl_commands}"
        ((issues++))
    fi

    if [[ "$SKILLS" != "$tmpl_skills" ]]; then
        log_warn "Skills: main=${SKILLS}, template=${tmpl_skills}"
        ((issues++))
    fi

    if [[ $issues -eq 0 ]]; then
        log_ok "Templates are in sync"
        return 0
    else
        echo "  Run with 'sync-templates' or 'full' to fix"
        return 1
    fi
}

# =============================================================================
# NaNo Recovery
# =============================================================================

recover_nano() {
    log_section "NaNo Recovery"

    local nano_dir="${PROJECT_ROOT}/workflow/nano"
    local observations_dir="${nano_dir}/observations"

    if [[ ! -d "$nano_dir" ]]; then
        log_info "NaNo not configured"
        return 0
    fi

    local count=$(find "$observations_dir" -name "*.yml" -type f 2>/dev/null | wc -l)
    count=${count// /}

    if [[ "$count" -gt 0 ]]; then
        log_info "Found ${count} pending observations"
        local analyzer="${SCRIPT_DIR}/nano-observer.sh"
        if [[ -x "$analyzer" ]]; then
            "$analyzer" analyze 2>/dev/null && log_ok "Analysis complete" || log_warn "Analysis failed"
        else
            log_warn "NaNo analyzer not found"
        fi
    else
        log_ok "No pending observations"
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo -e "${BLUE}Engine-Sync v1.1.0${NC}"
    echo ""

    # Get current counts
    get_counts
    print_counts

    local exit_code=0

    case "$MODE" in
        check)
            check_docs || exit_code=1
            check_version || exit_code=1
            check_templates || exit_code=1
            ;;
        fix)
            fix_docs
            check_version || exit_code=1
            check_templates || exit_code=1
            ;;
        sync-templates)
            check_docs || true
            check_version || exit_code=1
            sync_templates
            ;;
        full)
            fix_docs
            check_version || exit_code=1
            sync_templates
            recover_nano
            ;;
        *)
            log_error "Unknown mode: $MODE"
            echo "Usage: engine-sync.sh [check|fix|sync-templates|full]"
            exit 1
            ;;
    esac

    echo ""
    if [[ $exit_code -eq 0 ]]; then
        log_ok "All checks passed"
    else
        log_warn "Issues found - run with 'full' to fix everything"
    fi

    exit $exit_code
}

main
