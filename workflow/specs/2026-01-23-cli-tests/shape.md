# CLI Tests - Shaping Notes

## Scope Decisions
- Node.js built-in test runner statt Jest/Vitest (keine zusätzlichen Dependencies)
- Tests kompilieren mit dem Projekt (gleiche tsconfig)
- Alle Tests in `cli/src/tests/` (flache Struktur, keine __tests__ Subdirs)
- Temp-Verzeichnisse in `/tmp/` für Isolation

## Architecture Decisions
- Shared helpers für temp dir management und mock logger
- Integration Tests nutzen echte Filesystem-Operationen in isolierten temp dirs
- process.exit() Aufrufe werden nicht getestet (würden den Test-Prozess beenden)
- console.log wird via mock logger unterdrückt

## Constraints
- Keine echten Dateien außerhalb /tmp modifizieren
- Tests müssen unabhängig voneinander laufen
- Kein Netzwerk-Zugriff in Tests
