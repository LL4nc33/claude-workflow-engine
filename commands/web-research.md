---
description: Web search and scraping via local SearXNG + Firecrawl/trafilatura
allowed-tools: ["Bash", "WebFetch", "WebSearch", "AskUserQuestion"]
---

# Web Research

Search the web and scrape pages using local self-hosted services.

**Usage:** `/cwe:web-research [query or URL]`

## Prerequisites

| Service | URL | Required |
|---------|-----|----------|
| SearXNG | `http://localhost:8080` | Yes — local metasearch |
| Firecrawl | `http://localhost:3002` | Optional — JS-capable scraping |
| trafilatura | Python library | Fallback — always available |

## Interactive Mode (no arguments)

If user runs `/cwe:web-research` without arguments, use AskUserQuestion:

```
Question: "What do you want to research?"
Header: "Research"
Options:
  1. "Search the web" - Find information on a topic (Recommended)
  2. "Read a webpage" - Scrape and summarize a specific URL
  3. "Search + Deep read" - Search then scrape top results
```

### If "Search the web":
Ask for the search query, then run:

```bash
curl -s "http://localhost:8080/search?q=QUERY&format=json&language=de" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, r in enumerate(data.get('results', [])[:10], 1):
    print(f\"{i}. {r.get('title', '?')}\")
    print(f\"   {r.get('url', '')}\")
    s = r.get('content', '')[:120]
    if s: print(f\"   {s}\")
    print()
"
```

Present results and offer to scrape any of them for full content.

### If "Read a webpage":
Ask for the URL, then scrape it:

1. **Try Firecrawl first** (better for JS-heavy sites):
```bash
curl -s -X POST "http://localhost:3002/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url":"URL_HERE","formats":["markdown"],"onlyMainContent":true}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    print(data['data'].get('markdown', '')[:5000])
else:
    print('FIRECRAWL_FAILED')
"
```

2. **Fallback to trafilatura**:
```bash
python3 -c "
import trafilatura
d = trafilatura.fetch_url('URL_HERE')
if d:
    t = trafilatura.extract(d, include_tables=True)
    if t: print(t[:5000])
    else: print('ERROR: No content extracted')
else: print('ERROR: Could not fetch')
"
```

3. **Last resort**: Use `WebFetch` tool directly.

### If "Search + Deep read":
Combine both: search first, then scrape top 3-5 results and synthesize.

## Direct Mode (arguments provided)

If user provides a query or URL:

- **URL detected** (starts with http/https): Scrape it directly
- **Otherwise**: Search SearXNG with the query

Examples:
- `/cwe:web-research React Server Components 2025` → SearXNG search
- `/cwe:web-research https://docs.example.com/api` → Scrape page

## Search Parameters

| Param | Default | Options |
|-------|---------|---------|
| `language` | `de` | `de`, `en`, `all` |
| `time_range` | none | `day`, `week`, `month`, `year` |
| `categories` | `general` | `news`, `images`, `science`, `videos` |

## Output

Always provide:
- Structured summary of findings
- Source URLs for verification
- Key facts highlighted
- Offer to dig deeper if needed
