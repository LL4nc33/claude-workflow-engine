# Command Structure

Every CLI command follows this skeleton:

```typescript
export async function xCommand(args: string[]): Promise<void> {
  const options = parseXArgs(args);
  const log = new Logger(options.verbose);
  const targetPath = path.resolve(options.path);
  log.header('Claude Workflow Engine X');
  // ... command logic
}
```

## Rules

- Export a single async function named `{command}Command`
- Parse args via dedicated `parseXArgs()` (private, same file)
- Instantiate Logger with `options.verbose`
- Resolve `targetPath` from `options.path`
- Call `log.header()` with command title
- Use `log.section()` for logical groupings (complex commands)
- End with `log.summary()` or `log.done()` (complex commands)
- Exit with `process.exit(1)` only on fatal errors

## Options every command must support

- `--path <dir>` (default: `process.cwd()`)
- `--verbose` / `-v`

## Args parser pattern

```typescript
function parseXArgs(args: string[]): XOptions {
  const options: XOptions = { path: process.cwd(), verbose: false };
  for (let i = 0; i < args.length; i++) { switch(args[i]) { ... } }
  return options;
}
```
