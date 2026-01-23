import { Severity } from './types';
export declare class Logger {
    private verbose;
    constructor(verbose?: boolean);
    header(title: string): void;
    section(title: string): void;
    pass(msg: string): void;
    fail(msg: string): void;
    warn(msg: string): void;
    info(msg: string): void;
    skip(msg: string): void;
    step(msg: string): void;
    done(msg: string): void;
    debug(msg: string): void;
    error(msg: string, detail?: string): void;
    table(rows: Array<[string, string]>): void;
    severity(level: Severity, msg: string): void;
    newline(): void;
    summary(passed: number, warnings: number, errors: number): void;
    box(lines: string[]): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map