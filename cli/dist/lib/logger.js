"use strict";
// =============================================================================
// Claude Workflow Engine CLI - Logger
// Structured output with severity levels and formatting
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const COLORS = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};
const ICONS = {
    pass: `${COLORS.green}[PASS]${COLORS.reset}`,
    fail: `${COLORS.red}[FAIL]${COLORS.reset}`,
    warn: `${COLORS.yellow}[WARN]${COLORS.reset}`,
    info: `${COLORS.blue}[INFO]${COLORS.reset}`,
    skip: `${COLORS.gray}[SKIP]${COLORS.reset}`,
    step: `${COLORS.cyan}[>>>>]${COLORS.reset}`,
    done: `${COLORS.green}[DONE]${COLORS.reset}`,
};
class Logger {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    header(title) {
        const line = '='.repeat(60);
        console.log(`\n${COLORS.cyan}${line}${COLORS.reset}`);
        console.log(`${COLORS.bold}${COLORS.cyan}  ${title}${COLORS.reset}`);
        console.log(`${COLORS.cyan}${line}${COLORS.reset}\n`);
    }
    section(title) {
        console.log(`\n${COLORS.bold}--- ${title} ---${COLORS.reset}\n`);
    }
    pass(msg) {
        console.log(`  ${ICONS.pass} ${msg}`);
    }
    fail(msg) {
        console.log(`  ${ICONS.fail} ${msg}`);
    }
    warn(msg) {
        console.log(`  ${ICONS.warn} ${msg}`);
    }
    info(msg) {
        console.log(`  ${ICONS.info} ${msg}`);
    }
    skip(msg) {
        console.log(`  ${ICONS.skip} ${msg}`);
    }
    step(msg) {
        console.log(`  ${ICONS.step} ${msg}`);
    }
    done(msg) {
        console.log(`  ${ICONS.done} ${msg}`);
    }
    debug(msg) {
        if (this.verbose) {
            console.log(`  ${COLORS.gray}[DBG] ${msg}${COLORS.reset}`);
        }
    }
    error(msg, detail) {
        console.error(`\n  ${COLORS.red}${COLORS.bold}ERROR:${COLORS.reset} ${msg}`);
        if (detail) {
            console.error(`  ${COLORS.gray}${detail}${COLORS.reset}`);
        }
    }
    table(rows) {
        const maxKey = Math.max(...rows.map(([k]) => k.length));
        for (const [key, value] of rows) {
            console.log(`  ${COLORS.dim}${key.padEnd(maxKey)}${COLORS.reset}  ${value}`);
        }
    }
    severity(level, msg) {
        switch (level) {
            case 'error':
                this.fail(msg);
                break;
            case 'warning':
                this.warn(msg);
                break;
            case 'info':
                this.info(msg);
                break;
        }
    }
    newline() {
        console.log('');
    }
    summary(passed, warnings, errors) {
        this.newline();
        const total = passed + warnings + errors;
        console.log(`  ${COLORS.bold}Summary:${COLORS.reset} ${total} checks`);
        if (passed > 0)
            console.log(`    ${COLORS.green}${passed} passed${COLORS.reset}`);
        if (warnings > 0)
            console.log(`    ${COLORS.yellow}${warnings} warnings${COLORS.reset}`);
        if (errors > 0)
            console.log(`    ${COLORS.red}${errors} errors${COLORS.reset}`);
        this.newline();
    }
    box(lines) {
        const maxLen = Math.max(...lines.map(l => l.length));
        const border = '+' + '-'.repeat(maxLen + 2) + '+';
        console.log(`  ${COLORS.dim}${border}${COLORS.reset}`);
        for (const line of lines) {
            console.log(`  ${COLORS.dim}|${COLORS.reset} ${line.padEnd(maxLen)} ${COLORS.dim}|${COLORS.reset}`);
        }
        console.log(`  ${COLORS.dim}${border}${COLORS.reset}`);
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map