// =============================================================================
// Claude Workflow Engine CLI - Settings Merger
// Safely merges Claude Workflow Engine settings with existing project settings
// - Non-destructive merge strategy
// - Permission aggregation
// - Profile-based customization
// =============================================================================

import * as path from 'path';
import {
  ProfileType,
} from './types';
import {
  pathExists,
  readFileSafe,
  writeFileSafe,
} from './fs-utils';
import { Logger } from './logger';

interface ClaudeSettings {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  [key: string]: unknown;
}

// Base permissions required for Claude Workflow Engine
const WORKFLOW_BASE_PERMISSIONS: string[] = [
  'Skill(architect)',
  'Skill(builder)',
  'Skill(devops)',
  'Skill(explainer)',
  'Skill(guide)',
  'Skill(innovator)',
  'Skill(quality)',
  'Skill(researcher)',
  'Skill(security)',
  'Agent(architect)',
  'Agent(builder)',
  'Agent(devops)',
  'Agent(explainer)',
  'Agent(guide)',
  'Agent(innovator)',
  'Agent(quality)',
  'Agent(researcher)',
  'Agent(security)',
  'WebSearch',
  'WebFetch',
];

// Profile-specific permissions
const PROFILE_PERMISSIONS: Record<ProfileType, string[]> = {
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
const DEVOPS_PERMISSIONS: string[] = [
  'Bash(docker:*)',
  'Bash(terraform:*)',
  'Bash(kubectl:*)',
  'Bash(helm:*)',
  'Bash(curl:*)',
  'Bash(ping:*)',
];

// Security scanning permissions (optional add-on)
const SECURITY_PERMISSIONS: string[] = [
  'Bash(trivy:*)',
  'Bash(grype:*)',
  'Bash(semgrep:*)',
  'Bash(nmap:*)',
];

export class SettingsMerger {
  private targetPath: string;
  private log: Logger;

  constructor(targetPath: string, verbose = false) {
    this.targetPath = path.resolve(targetPath);
    this.log = new Logger(verbose);
  }

  /**
   * Merge Claude Workflow Engine settings into existing settings.local.json
   * Non-destructive: preserves existing permissions
   */
  merge(profile: ProfileType, options: {
    includeDevOps?: boolean;
    includeSecurity?: boolean;
    dryRun?: boolean;
  } = {}): {
    merged: ClaudeSettings;
    addedPermissions: string[];
    existingPermissions: string[];
    filePath: string;
  } {
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
    const addedPermissions: string[] = [];
    const existingPermissions: string[] = [];

    for (const perm of requiredPermissions) {
      if (existingPerms.has(perm)) {
        existingPermissions.push(perm);
      } else {
        addedPermissions.push(perm);
      }
    }

    // Build merged settings
    const merged: ClaudeSettings = {
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
      if (!pathExists(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
      }
      writeFileSafe(settingsPath, JSON.stringify(merged, null, 2) + '\n');
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
  generate(profile: ProfileType, options: {
    includeDevOps?: boolean;
    includeSecurity?: boolean;
  } = {}): ClaudeSettings {
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
  validateExisting(): {
    valid: boolean;
    missingPermissions: string[];
    extraPermissions: string[];
  } {
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
  private loadExistingSettings(settingsPath: string): ClaudeSettings {
    if (!pathExists(settingsPath)) {
      return { permissions: { allow: [] } };
    }

    const content = readFileSafe(settingsPath);
    if (!content) {
      return { permissions: { allow: [] } };
    }

    try {
      return JSON.parse(content) as ClaudeSettings;
    } catch {
      this.log.warn(`Could not parse ${settingsPath} - treating as empty`);
      return { permissions: { allow: [] } };
    }
  }
}
