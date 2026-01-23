export type InstallMode = 'template' | 'integrated';
export type InstallScope = 'global' | 'local';
export type ProfileType = 'default' | 'node' | 'python' | 'rust' | 'custom';
export type Severity = 'error' | 'warning' | 'info';
export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';
export interface CheckResult {
    name: string;
    status: CheckStatus;
    severity: Severity;
    message: string;
    fix?: string;
    autoFixable?: boolean;
}
export interface PreFlightReport {
    timestamp: string;
    platform: NodeJS.Platform;
    nodeVersion: string;
    checks: CheckResult[];
    canProceed: boolean;
    warnings: number;
    errors: number;
}
export interface FileConflict {
    path: string;
    type: 'exists' | 'modified' | 'permission';
    currentContent?: string;
    proposedContent?: string;
    resolution?: 'overwrite' | 'merge' | 'skip' | 'backup';
}
export interface CommandConflict {
    command: string;
    existingSource: string;
    proposedSource: string;
    resolution?: 'rename' | 'namespace' | 'skip';
}
export interface ConflictReport {
    fileConflicts: FileConflict[];
    commandConflicts: CommandConflict[];
    hasBlockingConflicts: boolean;
}
export interface GDPRIssue {
    file: string;
    line?: number;
    type: 'pii_detected' | 'not_gitignored' | 'cloud_sync' | 'missing_local_config';
    detail: string;
    severity: Severity;
    fix?: string;
}
export interface GDPRReport {
    compliant: boolean;
    issues: GDPRIssue[];
    recommendations: string[];
}
export interface InstallationState {
    version: string;
    installedAt: string;
    updatedAt: string;
    mode: InstallMode;
    scope: InstallScope;
    profile: ProfileType;
    path: string;
    filesInstalled: string[];
    backupPath?: string;
    checksumMap: Record<string, string>;
    history: InstallationEvent[];
}
export interface InstallationEvent {
    timestamp: string;
    action: 'install' | 'update' | 'rollback' | 'repair';
    version: string;
    filesChanged: string[];
    success: boolean;
    error?: string;
}
export interface HealthStatus {
    overall: 'healthy' | 'degraded' | 'broken';
    checks: HealthCheck[];
    lastChecked: string;
}
export interface HealthCheck {
    component: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
    fixable: boolean;
    fixAction?: string;
}
export interface InstallOptions {
    scope: InstallScope;
    mode: InstallMode;
    profile: ProfileType;
    path: string;
    dryRun: boolean;
    force: boolean;
    verbose: boolean;
}
export interface HealthOptions {
    fix: boolean;
    report: boolean;
    path: string;
    verbose: boolean;
}
export interface CheckOptions {
    conflicts: boolean;
    permissions: boolean;
    gdpr: boolean;
    path: string;
    verbose: boolean;
}
export interface StatusOptions {
    verbose: boolean;
    path: string;
}
export interface ResolveOptions {
    interactive: boolean;
    path: string;
    autoFix: boolean;
}
//# sourceMappingURL=types.d.ts.map