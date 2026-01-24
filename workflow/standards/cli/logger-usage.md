# Logger Usage

The Logger class provides structured CLI output. Use methods semantically:

| Method | Icon | When to use |
|--------|------|-------------|
| `pass()` | [PASS] | Check succeeded, condition met |
| `fail()` | [FAIL] | Check failed, blocking error |
| `warn()` | [WARN] | Non-critical issue, can proceed |
| `info()` | [INFO] | Neutral information, status display |
| `step()` | [>>>>] | Action performed (file created, setting applied) |
| `done()` | [DONE] | Command completed successfully |
| `skip()` | [SKIP] | Item intentionally skipped |
| `debug()` | [DBG] | Verbose-only detail (requires `--verbose`) |

## Structure methods

- `header(title)` - Command title, once per command
- `section(title)` - Logical grouping within command
- `table([[k,v]])` - Key-value display
- `box([lines])` - Highlighted info block
- `summary(pass, warn, fail)` - Final tally
- `newline()` - Visual separator

## Rules

- Never use `console.log` directly - always use Logger
- `debug()` output only visible with `--verbose`
- `summary()` counts must match actual check results
- `error()` takes 2 args: message + suggestion
