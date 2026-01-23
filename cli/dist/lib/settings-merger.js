"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Settings Merger
// Safely merges Claude Workflow Engine settings with existing project settings
// - Non-destructive merge strategy
// - Permission aggregation
// - Profile-based customization
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsMerger = void 0;
const path = __importStar(require("path"));
const fs_utils_1 = require("./fs-utils");
const logger_1 = require("./logger");
// Base permissions required for Claude Workflow Engine
const WORKFLOW_BASE_PERMISSIONS = [
    'Skill(researcher)',
    'Skill(orchestrator)',
    'Skill(ask)',
    'Skill(architect)',
    'Skill(debug)',
    'Skill(devops)',
    'Skill(security)',
    'Agent(architect)',
    'Agent(ask)',
    'Agent(debug)',
    'Agent(devops)',
    'Agent(orchestrator)',
    'Agent(researcher)',
    'Agent(security)',
    'WebSearch',
    'WebFetch',
];
// Profile-specific permissions
const PROFILE_PERMISSIONS = {
    default: [
        'Bash(git clone:*)',
        'Bash(git status:*)',
        'Bash(git diff:*)',
        'Bash(git log:*)',
        'Bash(git add:*)',
        'Bash(git commit:*)',
        'Bash(mkdir:*)',
        'Bash(ls:*)',
        'Bash(echo:*)',
    ],
    node: [
        'Bash(npm:*)',
        'Bash(npx:*)',
        'Bash(node:*)',
        'Bash(yarn:*)',
        'Bash(pnpm:*)',
    ],
    python: [
        'Bash(python3:*)',
        'Bash(pip:*)',
        'Bash(pip3:*)',
        'Bash(poetry:*)',
        'Bash(pytest:*)',
    ],
    rust: [
        'Bash(cargo:*)',
        'Bash(rustc:*)',
        'Bash(rustup:*)',
        'Bash(clippy:*)',
    ],
    custom: [],
};
// DevOps-specific permissions (optional add-on)
const DEVOPS_PERMISSIONS = [
    'Bash(docker:*)',
    'Bash(terraform:*)',
    'Bash(kubectl:*)',
    'Bash(helm:*)',
    'Bash(curl:*)',
    'Bash(ping:*)',
];
// Security scanning permissions (optional add-on)
const SECURITY_PERMISSIONS = [
    'Bash(trivy:*)',
    'Bash(grype:*)',
    'Bash(semgrep:*)',
    'Bash(nmap:*)',
];
class SettingsMerger {
    targetPath;
    log;
    constructor(targetPath, verbose = false) {
        this.targetPath = path.resolve(targetPath);
        this.log = new logger_1.Logger(verbose);
    }
    /**
     * Merge Claude Workflow Engine settings into existing settings.local.json
     * Non-destructive: preserves existing permissions
     */
    merge(profile, options = {}) {
        const settingsPath = path.join(this.targetPath, '.claude', 'settings.local.json');
        const existing = this.loadExistingSettings(settingsPath);
        // Collect all permissions to add
        const requiredPermissions = [
            ...WORKFLOW_BASE_PERMISSIONS,
            ...PROFILE_PERMISSIONS.default,
            ...(profile !== 'default' && profile !== 'custom' ? PROFILE_PERMISSIONS[profile] : []),
            ...(options.includeDevOps ? DEVOPS_PERMISSIONS : []),
            ...(options.includeSecurity ? SECURITY_PERMISSIONS : []),
        ];
        // Determine what's new vs existing
        const existingPerms = new Set(existing.permissions?.allow || []);
        const addedPermissions = [];
        const existingPermissions = [];
        for (const perm of requiredPermissions) {
            if (existingPerms.has(perm)) {
                existingPermissions.push(perm);
            }
            else {
                addedPermissions.push(perm);
            }
        }
        // Build merged settings
        const merged = {
            ...existing,
            permissions: {
                ...existing.permissions,
                allow: [
                    ...(existing.permissions?.allow || []),
                    ...addedPermissions,
                ],
            },
        };
        // Deduplicate
        if (merged.permissions?.allow) {
            merged.permissions.allow = [...new Set(merged.permissions.allow)];
        }
        // Write if not dry-run
        if (!options.dryRun) {
            const dir = path.dirname(settingsPath);
            if (!(0, fs_utils_1.pathExists)(dir)) {
                require('fs').mkdirSync(dir, { recursive: true });
            }
            (0, fs_utils_1.writeFileSafe)(settingsPath, JSON.stringify(merged, null, 2) + '\n');
        }
        return {
            merged,
            addedPermissions,
            existingPermissions,
            filePath: settingsPath,
        };
    }
    /**
     * Generate a fresh settings.local.json for a given profile
     */
    generate(profile, options = {}) {
        const permissions = [
            ...WORKFLOW_BASE_PERMISSIONS,
            ...PROFILE_PERMISSIONS.default,
            ...(profile !== 'default' && profile !== 'custom' ? PROFILE_PERMISSIONS[profile] : []),
            ...(options.includeDevOps ? DEVOPS_PERMISSIONS : []),
            ...(options.includeSecurity ? SECURITY_PERMISSIONS : []),
        ];
        return {
            permissions: {
                allow: [...new Set(permissions)],
            },
        };
    }
    /**
     * Validate existing settings for Claude Workflow Engine compatibility
     */
    validateExisting() {
        const settingsPath = path.join(this.targetPath, '.claude', 'settings.local.json');
        const existing = this.loadExistingSettings(settingsPath);
        const existingPerms = new Set(existing.permissions?.allow || []);
        const missingPermissions = WORKFLOW_BASE_PERMISSIONS.filter(p => !existingPerms.has(p));
        const knownPerms = new Set([
            ...WORKFLOW_BASE_PERMISSIONS,
            ...PROFILE_PERMISSIONS.default,
            ...PROFILE_PERMISSIONS.node,
            ...PROFILE_PERMISSIONS.python,
            ...PROFILE_PERMISSIONS.rust,
            ...DEVOPS_PERMISSIONS,
            ...SECURITY_PERMISSIONS,
        ]);
        const extraPermissions = [...existingPerms].filter(p => !knownPerms.has(p));
        return {
            valid: missingPermissions.length === 0,
            missingPermissions,
            extraPermissions,
        };
    }
    /**
     * Load existing settings or return empty structure
     */
    loadExistingSettings(settingsPath) {
        if (!(0, fs_utils_1.pathExists)(settingsPath)) {
            return { permissions: { allow: [] } };
        }
        const content = (0, fs_utils_1.readFileSafe)(settingsPath);
        if (!content) {
            return { permissions: { allow: [] } };
        }
        try {
            return JSON.parse(content);
        }
        catch {
            this.log.warn(`Could not parse ${settingsPath} - treating as empty`);
            return { permissions: { allow: [] } };
        }
    }
}
exports.SettingsMerger = SettingsMerger;
//# sourceMappingURL=settings-merger.js.map