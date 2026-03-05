---
name: bookstack
description: >
  Use PROACTIVELY when uploading, creating, or updating documentation on BookStack.
  Provides API reference, auth, curl snippets and error handling for BookStack REST API.
  Used by /cwe:docs command — do not duplicate workflow logic here.
---

# BookStack API — Implementierungsdetails

Technische Referenz fuer die BookStack REST API. Wird vom `/cwe:docs`-Command genutzt.

## Auth

Config aus `~/.claude/cwe.local.md` lesen:

```yaml
bookstack:
  url: https://<your-bookstack-host>
  token: <token-id>:<token-secret>
```

**Wichtig:** BookStack Token besteht aus zwei Teilen — Token ID und Token Secret.
Format: `<Token-ID>:<Token-Secret>` (zu finden unter Profil → API Tokens).
Beispiel: `abc123xyz:secretvalue456`

```bash
BS_URL=$(grep -A2 'bookstack:' ~/.claude/cwe.local.md | grep 'url:' | awk '{print $2}')
BS_TOKEN=$(grep -A3 'bookstack:' ~/.claude/cwe.local.md | grep 'token:' | awk '{print $2}')
```

Jeder Request benoetigt:
```bash
-H "Authorization: Token $BS_TOKEN"
-H "Content-Type: application/json"
```

## Endpunkte

| Ressource | Endpunkt | Methoden |
|-----------|---------|---------|
| Books | `/api/books` | GET (list), POST (create) |
| Books | `/api/books/{id}` | GET, PUT, DELETE |
| Chapters | `/api/chapters` | GET (list), POST (create) |
| Chapters | `/api/chapters/{id}` | GET, PUT, DELETE |
| Pages | `/api/pages` | GET (list), POST (create) |
| Pages | `/api/pages/{id}` | GET, PUT, DELETE |
| Search | `/api/search` | GET |

## Snippets

### Pages erstellen

```bash
curl -s -X POST "$BS_URL/api/pages" \
  -H "Authorization: Token $BS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"book_id\": $BOOK_ID, \"chapter_id\": $CHAPTER_ID, \"name\": \"$TITLE\", \"markdown\": \"$CONTENT\"}"
```

`chapter_id` ist optional. Bevorzugtes Format: `markdown` (alternativ: `html`).

### Pages aktualisieren

```bash
curl -s -X PUT "$BS_URL/api/pages/$PAGE_ID" \
  -H "Authorization: Token $BS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$TITLE\", \"markdown\": \"$CONTENT\"}"
```

### Page-Existenz pruefen (Idempotenz)

```bash
curl -s "$BS_URL/api/search?query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TITLE'))")&type=page" \
  -H "Authorization: Token $BS_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
hits = [r for r in data.get('data', []) if r['name'] == '$TITLE']
print(hits[0]['id'] if hits else 'NOT_FOUND')
"
```

### Books auflisten

```bash
curl -s "$BS_URL/api/books?count=50" \
  -H "Authorization: Token $BS_TOKEN" | python3 -c "
import sys, json
for b in json.load(sys.stdin).get('data', []):
    print(f\"{b['id']}: {b['name']}\")
"
```

### Books erstellen

```bash
curl -s -X POST "$BS_URL/api/books" \
  -H "Authorization: Token $BS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$NAME\", \"description\": \"$DESC\"}"
```

### Chapters erstellen

```bash
curl -s -X POST "$BS_URL/api/chapters" \
  -H "Authorization: Token $BS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"book_id\": $BOOK_ID, \"name\": \"$NAME\", \"description\": \"$DESC\"}"
```

### Suchen

```bash
curl -s "$BS_URL/api/search?query=$QUERY&type=page&count=10" \
  -H "Authorization: Token $BS_TOKEN" | python3 -c "
import sys, json
for r in json.load(sys.stdin).get('data', []):
    print(f\"[{r['id']}] {r['name']}  {r.get('url', '')}\")
"
```

### Page loeschen

```bash
curl -s -X DELETE "$BS_URL/api/pages/$PAGE_ID" \
  -H "Authorization: Token $BS_TOKEN"
```

## Markdown-Verarbeitung

Frontmatter vor dem Upload entfernen:

```python
import re
content = open('file.md').read()
content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)
```

Titel aus erstem H1 extrahieren:

```python
import re
match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
title = match.group(1).strip() if match else 'Untitled'
```

Hinweis: Relative interne Links (`[Link](other.md)`) werden nicht aufgeloest — User informieren.

## Fehlerbehandlung

| HTTP-Code | Bedeutung | Loesung |
|-----------|-----------|---------|
| 401 | Token ungueltig/abgelaufen | `bookstack.token` in cwe.local.md pruefen |
| 403 | Keine Berechtigung | Token braucht Create/Edit-Rechte in BookStack |
| 404 | Ressource nicht gefunden | Buch-ID oder Chapter-ID pruefen |
| 413 | Inhalt zu gross | Page in kleinere Abschnitte aufteilen |
| Timeout | Server nicht erreichbar | `bookstack.url` und Netzwerkverbindung pruefen |
