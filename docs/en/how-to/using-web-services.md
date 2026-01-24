# Using Web Services

The Web-Access-Layer provides all agents with access to web search, page scraping, and automatic captcha solving through self-hosted services.

## Prerequisites

- **Firecrawl** — Self-hosted instance (Docker recommended)
- **SearXNG** — Self-hosted instance (Docker recommended)
- **SolveCaptcha** — API key (optional, for protected pages only)
- `curl` + `jq` installed on the system

## Setup

```bash
/workflow:web-setup
```

Interactively prompts for URLs + API keys. Config is stored in `web-services.local.md` (gitignored, GDPR-compliant).

### ENV Fallbacks (for CI/CD)

```bash
export FIRECRAWL_URL="http://localhost:3002"
export SEARXNG_URL="http://localhost:8080"
export SOLVECAPTCHA_API_KEY="your-key"
```

---

## Functions

The Web-Access-Layer provides reusable shell functions (defined in `.claude/skills/workflow/web-access/SKILL.md`).

### `web_search` — Search

```bash
# Simple search
web_search "react server components"

# With category
web_search "kubernetes ingress" "it"

# Site-specific
web_search "site:docs.example.com authentication"
```

**Categories:** `general` (default), `it`, `science`, `images`, `news`

**Output:** JSON array with `{title, url, content}` (max 10 results).

---

### `web_fetch` — Fetch page (with auto-captcha)

```bash
# Markdown only (default)
web_fetch "https://example.com"

# Multiple formats
web_fetch "https://example.com" "markdown,screenshot,links"

# SPA with longer wait
web_fetch "https://spa-app.com" "markdown" 5000
```

**Formats:** `markdown`, `rawHtml`, `screenshot`, `links` (comma-separated)

**Captcha handling:** If the page shows a captcha and `SOLVECAPTCHA_API_KEY` is configured, it's automatically solved and the page is re-fetched. No manual intervention needed.

---

### `web_md` — Markdown content only

```bash
# Shorthand: Returns markdown text directly
web_md "https://docs.example.com/api"
```

---

### `web_search_fetch` — Search + fetch best result

```bash
# Searches and automatically fetches the first result
web_search_fetch "react 19 release notes"
```

Combines `web_search` + `web_md` in one call.

---

### `web_batch` — Fetch multiple URLs

```bash
web_batch "https://url1.com" "https://url2.com" "https://url3.com"
```

---

## Captcha Integration

The captcha system works **fully automatically** within `web_fetch`:

```
Load URL → Captcha detected? → Determine type → Extract sitekey
  → Call SolveCaptcha API → Poll → Reload page
```

### Supported Types

| Type | Detection | Provider |
|------|-----------|----------|
| Cloudflare Turnstile | `cf-turnstile` | Cloudflare |
| reCAPTCHA v2/v3 | `g-recaptcha` | Google |
| hCaptcha | `h-captcha` | hCaptcha |
| FunCaptcha | `funcaptcha` | Arkose Labs |
| Image CAPTCHA | Base64 image | Various |

### Detection

Two methods:
1. **HTML patterns:** `cf-turnstile`, `data-sitekey`, `g-recaptcha`, `h-captcha`, `challenge-platform`
2. **Fallback:** Markdown < 200 chars + words like "challenge", "verify", "robot"

### Error Behavior

| Situation | Behavior |
|-----------|----------|
| Captcha + key present | Auto-solve + re-fetch |
| Captcha + no key | WARN message, returns blocked content |
| Balance empty | ERROR message, stops solving |
| Captcha unsolvable | WARN, returns original content |
| Timeout (default 120s) | WARN, graceful degradation |

---

## Agent Access

| Agent | `web_search` | `web_fetch` | Captcha (auto) |
|-------|:---:|:---:|:---:|
| researcher | x | x | x |
| debug | x | x | x |
| architect | x | x | - |
| devops | x | x | - |
| security | x | x | - |
| ask | x | - | - |

---

## TOON Conversion

For token optimization (~40% savings):

```bash
# Search results as TOON
web_search "react 19" | npx @toon-format/cli

# Page metadata as TOON
web_fetch "$URL" "markdown,links" | jq '{
  title: .data.metadata.title,
  links: [.data.links[:5][]]
}' | npx @toon-format/cli
```

---

## Advanced Patterns

### SPA with Cookie Consent + Scroll

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

### Connectivity test

```bash
# Firecrawl
curl -sf "${FIRECRAWL_URL}/v1/scrape" -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","formats":["markdown"]}' | jq '.success'

# SearXNG
curl -sf "${SEARXNG_URL}/search?q=test&format=json" | jq '.results | length'

# Captcha balance
curl -sf "https://api.solvecaptcha.com/res.php?key=${SOLVECAPTCHA_API_KEY}&action=getbalance"
```

### Migration from visual-clone.local.md

1. Run `/workflow:web-setup` — values are automatically migrated
2. Old file can be deleted afterward

---

## Further Reading

- Skill implementation: `.claude/skills/workflow/web-access/SKILL.md`
- Visual Clone: [visual-clone-usage.md](visual-clone-usage.md)
- TOON format: [github.com/toon-format/toon](https://github.com/toon-format/toon)
