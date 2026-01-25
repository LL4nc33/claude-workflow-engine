# Web-Access-Layer

Universeller Web-Zugang: Suche (SearXNG), Fetch (Firecrawl), Captcha-Solving (SolveCaptcha).
Alle Funktionen als wiederverwendbare Shell-Funktionen — ein `source`-artiger Block pro Agent-Session.

---

## Config

Lookup-Reihenfolge: `web-services.local.md` → `visual-clone.local.md` (legacy) → ENV.

```bash
_wc() { # get_web_config shorthand: _wc <yaml_key> <env_name>
  local V=""
  for F in web-services.local.md visual-clone.local.md; do
    [ -z "$V" ] && [ -f "$F" ] && V=$(grep "^${1}:" "$F" 2>/dev/null | sed 's/^[^"]*"\([^"]*\)".*/\1/' | head -1)
  done
  [ -z "$V" ] && V="${!2}"
  echo "$V"
}

# Init (einmal pro Session)
FIRECRAWL_URL=$(_wc firecrawl_url FIRECRAWL_URL)
SEARXNG_URL=$(_wc searxng_url SEARXNG_URL)
CAPTCHA_KEY=$(_wc captcha_api_key SOLVECAPTCHA_API_KEY)
CAPTCHA_TIMEOUT=$(_wc captcha_timeout ""); : ${CAPTCHA_TIMEOUT:=120}
CAPTCHA_POLL=$(_wc captcha_polling ""); : ${CAPTCHA_POLL:=10}
```

---

## Funktionen

### `web_search` — SearXNG-Suche

```bash
web_search() { # web_search "query" [category]
  local Q=$(echo "$1" | jq -sRr @uri)
  local CAT="${2:-general}" # general|it|science|images|news
  curl -sf "${SEARXNG_URL}/search?q=${Q}&format=json&categories=${CAT}" \
    | jq '[.results[:10] | .[] | {title, url, content: (.content[:200])}]'
}
```

**Agents:** researcher, builder, architect, devops, security, explainer

---

### `web_fetch` — Firecrawl-Scrape mit Auto-Captcha

Der zentrale Wrapper — fetcht eine URL, erkennt Captchas automatisch und loest sie.

```bash
web_fetch() { # web_fetch "url" [formats] [wait_ms]
  local URL="$1"
  local FORMATS="${2:-markdown}"  # markdown|rawHtml|screenshot|links (kommasepariert)
  local WAIT="${3:-2000}"
  local MAX_RETRIES=2

  # Formate als JSON-Array
  local FMT_JSON=$(echo "$FORMATS" | jq -Rc 'split(",")')

  local ATTEMPT=0
  while [ $ATTEMPT -lt $MAX_RETRIES ]; do
    ATTEMPT=$((ATTEMPT + 1))

    local RESP=$(curl -sf -X POST "${FIRECRAWL_URL}/v1/scrape" \
      -H "Content-Type: application/json" \
      -d "{\"url\":\"${URL}\",\"formats\":${FMT_JSON},\"onlyMainContent\":true,\"waitFor\":${WAIT}}")

    # Erfolg pruefen
    if [ -z "$RESP" ] || echo "$RESP" | jq -e '.success == false' >/dev/null 2>&1; then
      echo "ERROR: Scrape failed for ${URL}" >&2
      return 1
    fi

    local HTML=$(echo "$RESP" | jq -r '.data.rawHtml // empty')
    local MD=$(echo "$RESP" | jq -r '.data.markdown // empty')

    # Captcha-Detection (nur wenn rawHtml vorhanden oder Markdown verdaechtig kurz)
    if _captcha_detected "$HTML" "$MD"; then
      if [ -n "$CAPTCHA_KEY" ] && [ $ATTEMPT -lt $MAX_RETRIES ]; then
        _solve_and_retry "$HTML" "$URL" && continue
      else
        echo "WARN: Captcha detected, no solver configured" >&2
      fi
    fi

    # Erfolg — Response zurueckgeben
    echo "$RESP"
    return 0
  done
  return 1
}

# Convenience: Nur Markdown extrahieren
web_md() { web_fetch "$1" "markdown" "${2:-2000}" | jq -r '.data.markdown'; }

# Convenience: Markdown + Links
web_full() { web_fetch "$1" "markdown,links,rawHtml" "${2:-3000}"; }
```

**Agents:** researcher, builder, architect, devops, security

---

### Captcha-Subsystem (intern)

Wird automatisch von `web_fetch` aufgerufen — kein manueller Aufruf noetig.

```bash
_captcha_detected() { # _captcha_detected "$html" "$markdown"
  local HTML="$1" MD="$2"
  # Bekannte Captcha-Marker im HTML
  echo "$HTML" | grep -qiE 'cf-turnstile|data-sitekey|g-recaptcha|h-captcha|challenge-platform|managed-challenge' && return 0
  # Fallback: Markdown verdaechtig kurz + "challenge" im Content
  [ ${#MD} -lt 200 ] && echo "$MD" | grep -qi 'challenge\|verify\|robot\|captcha' && return 0
  return 1
}

_get_captcha_method() { # -> turnstile|userrecaptcha|hcaptcha|unknown
  local H="$1"
  echo "$H" | grep -qi 'cf-turnstile' && echo "turnstile" && return
  echo "$H" | grep -qi 'g-recaptcha\|grecaptcha' && echo "userrecaptcha" && return
  echo "$H" | grep -qi 'h-captcha\|hcaptcha' && echo "hcaptcha" && return
  echo "unknown"
}

_get_sitekey() { echo "$1" | grep -oP 'data-sitekey="\K[^"]+' | head -1; }

_solve_and_retry() { # _solve_and_retry "$html" "$url" -> 0 on success
  local HTML="$1" URL="$2"
  local METHOD=$(_get_captcha_method "$HTML")
  local SITEKEY=$(_get_sitekey "$HTML")

  [ "$METHOD" = "unknown" ] || [ -z "$SITEKEY" ] && return 1

  # Submit
  local SUBMIT_RESP=$(curl -sf "https://api.solvecaptcha.com/in.php?key=${CAPTCHA_KEY}&method=${METHOD}&sitekey=${SITEKEY}&pageurl=${URL}")
  local TASK_ID=$(echo "$SUBMIT_RESP" | grep -oP 'OK\|\K\d+')
  [ -z "$TASK_ID" ] && echo "WARN: Captcha submit failed: $SUBMIT_RESP" >&2 && return 1

  # Poll mit exponentiellem Backoff (start 5s, dann config-interval)
  sleep 5
  local ELAPSED=5
  while [ $ELAPSED -lt $CAPTCHA_TIMEOUT ]; do
    local RES=$(curl -sf "https://api.solvecaptcha.com/res.php?key=${CAPTCHA_KEY}&action=get&id=${TASK_ID}")
    case "$RES" in
      OK\|*) return 0 ;; # Geloest — web_fetch macht automatisch retry
      CAPCHA_NOT_READY) ;; # Weiter warten
      ERROR_ZERO_BALANCE) echo "ERROR: Captcha balance empty" >&2; return 1 ;;
      ERROR_*) echo "WARN: Captcha error: $RES" >&2; return 1 ;;
    esac
    sleep $CAPTCHA_POLL
    ELAPSED=$((ELAPSED + CAPTCHA_POLL))
  done
  echo "WARN: Captcha timeout after ${CAPTCHA_TIMEOUT}s" >&2
  return 1
}
```

**Agents:** researcher, builder (automatisch via `web_fetch`)

---

### `web_search_fetch` — Suche + bestes Ergebnis laden

Kombinierter High-Level-Wrapper:

```bash
web_search_fetch() { # web_search_fetch "query" [category]
  local RESULTS=$(web_search "$1" "${2:-general}")
  local URL=$(echo "$RESULTS" | jq -r '.[0].url // empty')

  [ -z "$URL" ] && echo "ERROR: No results for '$1'" >&2 && return 1

  echo "--- Search Results ---"
  echo "$RESULTS" | jq -r '.[] | "- \(.title): \(.url)"'
  echo ""
  echo "--- Fetching: $URL ---"
  web_md "$URL"
}
```

---

## Agent-Zugang (Uebersicht)

| Agent | `web_search` | `web_fetch`/`web_md` | Captcha (auto) |
|-------|:---:|:---:|:---:|
| researcher | x | x | x |
| builder | x | x | x |
| architect | x | x | - |
| devops | x | x | - |
| security | x | x | - |
| explainer | x | - | - |

Agents ohne Captcha-Zugang erhalten bei Captcha-Detection eine Warnung statt Auto-Solve.

---

## Erweiterte Patterns

### SPA mit Scroll + Cookie-Consent

```bash
# Firecrawl Actions fuer dynamische Seiten
curl -sf -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'"$URL"'",
    "formats": ["markdown"],
    "waitFor": 5000,
    "actions": [
      {"type": "click", "selector": "[data-consent-accept], .cookie-accept, #accept-cookies"},
      {"type": "wait", "milliseconds": 1000},
      {"type": "scroll", "direction": "down", "amount": 2000}
    ]
  }' | jq -r '.data.markdown'
```

### Batch-Fetch (mehrere URLs)

```bash
web_batch() { # web_batch url1 url2 url3 ...
  for URL in "$@"; do
    echo "=== $URL ==="
    web_md "$URL" | head -50
    echo ""
  done
}
```

### Ergebnis als TOON (Token-Optimierung)

```bash
# Suchergebnisse kompakt
web_search "react 19" | npx @toon-format/cli

# Metadata einer Seite als TOON
web_fetch "$URL" "markdown,links" | jq '{
  title: .data.metadata.title,
  desc: .data.metadata.description,
  links: [.data.links[:5][]]
}' | npx @toon-format/cli
```

---

## Fehlerbehandlung

| Situation | Verhalten |
|-----------|-----------|
| Service nicht erreichbar | `curl -sf` gibt leeren Output → ERROR-Message, return 1 |
| Captcha + kein Key | WARN-Message, gibt original (captcha-blocked) Content zurueck |
| Captcha + Balance leer | ERROR, stoppt Captcha-Solving, gibt Warnung |
| Captcha unsolvable/timeout | WARN, gibt original Content zurueck (graceful degradation) |
| Leerer Markdown (<50 Chars) | Kein Fehler, aber Agent sollte rawHtml als Fallback nutzen |
| HTTP-Fehler der Zielseite | Firecrawl meldet `success: false`, web_fetch gibt ERROR |

---

## Setup

Einmalig: `/workflow:web-setup` ausfuehren.
Skill-Doku: `docs/how-to/web-services-nutzen.md`
