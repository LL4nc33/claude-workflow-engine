# TOON Format Standards

Token-optimierte Notation fuer Context-Budget-Optimierung (~40% kompakter als JSON).

Referenz: [TOON Specification](https://github.com/toon-format/toon)

## Wann konvertieren

| Situation | Aktion |
|-----------|--------|
| JSON-Response > 200 Tokens (Tool-Output, API, File-Read) | Zusammenfassung/Weitergabe in TOON |
| JSON in Delegation-Prompts an Subagents | Vor Injection zu TOON konvertieren |
| Externe API-Responses in Workflows | Pipe durch `npx @toon-format/cli` |
| JSON < 200 Tokens oder Code-relevantes JSON | Behalten wie es ist |

## Konvertierungsregeln

### Array of Objects -> Table

```
[{"name":"A","val":1},{"name":"B","val":2}]
```

wird zu:

```
[2]{name,val}:
    A,1
    B,2
```

### Object -> Key-Value

```
{"title":"X","count":5,"active":true}
```

wird zu:

```
title: X
count: 5
active: true
```

### Nested Objects -> Indented

```
{"user":{"name":"A","roles":["admin","dev"]}}
```

wird zu:

```
user:
    name: A
    roles[2]: admin, dev
```

## Ausnahmen (NICHT konvertieren)

- JSON das als Code geschrieben/editiert wird (package.json, tsconfig.json, etc.)
- JSON in Code-Beispielen die der User sehen soll
- Kleine JSON-Fragmente (< 200 Tokens)
- JSON das programmatisch weiterverarbeitet wird

## Workflow-Integration

```bash
# API-Response komprimieren
curl -s "$API_URL" | jq '{relevant_fields}' | npx @toon-format/cli

# Lokale JSON-Datei
cat large-config.json | npx @toon-format/cli
```

## CLI-Tool

```bash
# Installation (einmalig)
npm install -g @toon-format/cli

# Usage
echo '{"foo":"bar"}' | npx @toon-format/cli
# Output: foo: bar
```
