# Web-Services nutzen

Der Web-Access-Layer bietet allen Agents Zugang zu Web-Suche, Seiten-Scraping und automatischer Captcha-Loesung ueber selbst-gehostete Services.

## Voraussetzungen

- **Firecrawl** — Selbst-gehostete Instanz (Docker empfohlen)
- **SearXNG** — Selbst-gehostete Instanz (Docker empfohlen)
- **SolveCaptcha** — API-Key (optional, nur fuer geschuetzte Seiten)
- `curl` + `jq` auf dem System installiert

## Setup

```bash
/workflow:web-setup
```

Fragt interaktiv nach URLs + API-Keys. Config wird in `web-services.local.md` gespeichert (gitignored, DSGVO-konform).

### ENV-Fallbacks (fuer CI/CD)

```bash
export FIRECRAWL_URL="http://localhost:3002"
export SEARXNG_URL="http://localhost:8080"
export SOLVECAPTCHA_API_KEY="dein-key"
```

---

## Funktionen

Der Web-Access-Layer stellt wiederverwendbare Shell-Funktionen bereit (definiert in `.claude/skills/workflow/web-access/SKILL.md`).

### `web_search` — Suche

```bash
# Einfache Suche
web_search "react server components"

# Mit Kategorie
web_search "kubernetes ingress" "it"

# Site-spezifisch
web_search "site:docs.example.com authentication"
```

**Kategorien:** `general` (Standard), `it`, `science`, `images`, `news`

**Output:** JSON-Array mit `{title, url, content}` (max 10 Ergebnisse).

---

### `web_fetch` — Seite laden (mit Auto-Captcha)

```bash
# Nur Markdown (Standard)
web_fetch "https://example.com"

# Mehrere Formate
web_fetch "https://example.com" "markdown,screenshot,links"

# SPA mit laengerem Wait
web_fetch "https://spa-app.com" "markdown" 5000
```

**Formate:** `markdown`, `rawHtml`, `screenshot`, `links` (kommasepariert)

**Captcha-Handling:** Wenn die Seite ein Captcha zeigt und `SOLVECAPTCHA_API_KEY` konfiguriert ist, wird es automatisch geloest und die Seite neu geladen. Kein manueller Eingriff noetig.

---

### `web_md` — Nur Markdown-Content

```bash
# Kurzform: Gibt direkt den Markdown-Text zurueck
web_md "https://docs.example.com/api"
```

---

### `web_search_fetch` — Suche + bestes Ergebnis laden

```bash
# Sucht und fetcht automatisch das erste Ergebnis
web_search_fetch "react 19 release notes"
```

Kombiniert `web_search` + `web_md` in einem Aufruf.

---

### `web_batch` — Mehrere URLs laden

```bash
web_batch "https://url1.com" "https://url2.com" "https://url3.com"
```

---

## Captcha-Integration

Das Captcha-System arbeitet **vollautomatisch** innerhalb von `web_fetch`:

```
URL laden → Captcha erkannt? → Typ bestimmen → Sitekey extrahieren
  → SolveCaptcha API aufrufen → Pollen → Seite neu laden
```

### Unterstuetzte Typen

| Typ | Erkennung | Provider |
|-----|-----------|----------|
| Cloudflare Turnstile | `cf-turnstile` | Cloudflare |
| reCAPTCHA v2/v3 | `g-recaptcha` | Google |
| hCaptcha | `h-captcha` | hCaptcha |
| FunCaptcha | `funcaptcha` | Arkose Labs |
| Image CAPTCHA | Base64-Bild | Diverse |

### Erkennung

Zwei Methoden:
1. **HTML-Pattern:** `cf-turnstile`, `data-sitekey`, `g-recaptcha`, `h-captcha`, `challenge-platform`
2. **Fallback:** Markdown < 200 Zeichen + Woerter wie "challenge", "verify", "robot"

### Fehlerverhalten

| Situation | Verhalten |
|-----------|-----------|
| Captcha + Key vorhanden | Auto-Solve + Re-Fetch |
| Captcha + kein Key | WARN-Message, gibt blockierten Content zurueck |
| Balance leer | ERROR-Message, stoppt Solving |
| Captcha nicht loesbar | WARN, gibt original Content zurueck |
| Timeout (Standard 120s) | WARN, graceful degradation |

---

## Agent-Zugang

| Agent | `web_search` | `web_fetch` | Captcha (auto) |
|-------|:---:|:---:|:---:|
| researcher | x | x | x |
| builder | x | x | x |
| architect | x | x | - |
| devops | x | x | - |
| security | x | x | - |
| explainer | x | - | - |

---

## TOON-Konvertierung

Fuer Token-Optimierung (~40% Einsparung):

```bash
# Suchergebnisse als TOON
web_search "react 19" | npx @toon-format/cli

# Metadata als TOON
web_fetch "$URL" "markdown,links" | jq '{
  title: .data.metadata.title,
  links: [.data.links[:5][]]
}' | npx @toon-format/cli
```

---

## Erweiterte Patterns

### SPA mit Cookie-Consent + Scroll

```bash
curl -sf -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'"$URL"'",
    "formats": ["markdown"],
    "waitFor": 5000,
    "actions": [
      {"type": "click", "selector": "[data-consent-accept], .cookie-accept"},
      {"type": "wait", "milliseconds": 1000},
      {"type": "scroll", "direction": "down", "amount": 2000}
    ]
  }' | jq -r '.data.markdown'
```

---

## Troubleshooting

### Connectivity testen

```bash
# Firecrawl
curl -sf "${FIRECRAWL_URL}/v1/scrape" -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","formats":["markdown"]}' | jq '.success'

# SearXNG
curl -sf "${SEARXNG_URL}/search?q=test&format=json" | jq '.results | length'

# Captcha-Balance
curl -sf "https://api.solvecaptcha.com/res.php?key=${SOLVECAPTCHA_API_KEY}&action=getbalance"
```

### Migration von visual-clone.local.md

1. `/workflow:web-setup` ausfuehren — Werte werden automatisch uebernommen
2. Alte Datei kann danach geloescht werden

---

## Weiterfuehrend

- Skill-Implementierung: `.claude/skills/workflow/web-access/SKILL.md`
- Visual-Clone: [visual-clone-nutzen.md](visual-clone-nutzen.md)
- TOON-Format: [github.com/toon-format/toon](https://github.com/toon-format/toon)
