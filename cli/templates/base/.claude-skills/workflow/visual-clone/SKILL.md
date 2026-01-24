---
name: visual-clone
description: Visual Website Cloner - extract branding, colors, fonts, CSS variables from websites. Use when users want to clone/copy/recreate a website's visual design, extract branding/colors/fonts/typography, create design systems from existing sites, or reverse-engineer UI components.
allowed-tools: Bash, Read, Write, Edit
context: fork
---

# Visual Website Cloner

## Instructions

Apply this skill when the user wants to:
- Clone or recreate a website's visual identity
- Extract colors, fonts, typography, or spacing from a website
- Create a design system based on an existing site
- Reverse-engineer UI components or CSS variables
- Generate Tailwind config or CSS custom properties from a live site

## Configuration

> **Setup:** Run `/workflow:clone-setup` to configure service URLs interactively.
> URLs are stored in `visual-clone.local.md` (gitignored).

| Service | Placeholder | Purpose |
|---------|-------------|---------|
| Firecrawl | `${FIRECRAWL_URL}` | Website scraping with rawHtml, markdown, screenshot |
| SearXNG | `${SEARXNG_URL}` | URL discovery for multi-page analysis |

Replace `${FIRECRAWL_URL}` and `${SEARXNG_URL}` with values from `visual-clone.local.md`.

### TOON Output (Token-Optimized)

API responses are piped through `npx @toon-format/cli` to convert JSON → TOON before processing.
This saves ~40% tokens on structured data (metadata, links, search results).

```bash
# Ensure CLI is available
npx @toon-format/cli --help >/dev/null 2>&1 || npm install -g @toon-format/cli
```

> **Note:** `rawHtml` is extracted separately as a raw string (not suitable for TOON conversion).

## API Reference: Firecrawl /v1/scrape

### Basic Scrape (HTML + Metadata)

```bash
# Structured metadata as TOON (saves ~40% tokens)
curl -s -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["rawHtml", "markdown", "screenshot", "links"],
    "onlyMainContent": false,
    "waitFor": 2000
  }' | jq '{metadata: .data.metadata, links: .data.links}' | npx @toon-format/cli

# rawHtml separately (not suitable for TOON)
curl -s -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["rawHtml"],
    "onlyMainContent": false,
    "waitFor": 2000
  }' | jq -r '.data.rawHtml'
```

### Interactive Scrape (SPA / Cookie-Banner)

```bash
curl -s -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["rawHtml", "screenshot"],
    "onlyMainContent": false,
    "waitFor": 5000,
    "actions": [
      {"type": "click", "selector": "[data-consent-accept], .cookie-accept, #accept-cookies"},
      {"type": "wait", "milliseconds": 1000},
      {"type": "scroll", "direction": "down", "amount": 500}
    ]
  }' | jq '{metadata: .data.metadata, links: .data.links}' | npx @toon-format/cli
```

### Extract Only Stylesheets

```bash
curl -s -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["rawHtml"],
    "onlyMainContent": false,
    "includeTags": ["style", "link[rel=stylesheet]"]
  }' | jq -r '.data.rawHtml'
```

### Response Structure (as TOON)

After piping through `jq '{metadata: .data.metadata, links: .data.links}' | npx @toon-format/cli`:

```
metadata:
  title: Example Site
  description: A sample website
  ogImage: https://example.com/og.png
links[3]:
  https://example.com/about
  https://example.com/pricing
  https://example.com/contact
```

> **rawHtml** and **screenshot** are extracted separately via `jq -r '.data.rawHtml'` (plain strings, not TOON).

## API Reference: SearXNG

### URL Discovery

```bash
# Results as TOON table (title + url per row, ~50% token savings vs JSON)
curl -s "${SEARXNG_URL}/search?q=site:example.com&format=json&categories=general" \
  | jq '[.results[] | {title, url}]' | npx @toon-format/cli
```

Example TOON output:
```
[5]{title,url}:
  About Us,https://example.com/about
  Pricing,https://example.com/pricing
  Contact,https://example.com/contact
  Blog,https://example.com/blog
  Docs,https://example.com/docs
```

### Targeted Sub-Page Search

```bash
curl -s "${SEARXNG_URL}/search?q=site:example.com+pricing+OR+about+OR+contact&format=json" \
  | jq '[.results[] | {title, url, content}]' | npx @toon-format/cli
```

## CSS Analysis

### Extract CSS Custom Properties

```bash
# From rawHtml response
echo "$RAW_HTML" | grep -oP '(?<=--)[a-zA-Z0-9-]+\s*:\s*[^;]+' | sort -u
```

### Extract Colors (Hex, RGB, HSL)

```bash
echo "$RAW_HTML" | grep -oP '#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)' | sort -u | sort -t'(' -k2 -n
```

### Extract Font Families

```bash
echo "$RAW_HTML" | grep -oP 'font-family:\s*[^;"}]+' | sed 's/font-family:\s*//' | sort -u
```

### Extract Font Sizes

```bash
echo "$RAW_HTML" | grep -oP 'font-size:\s*[^;"}]+' | sed 's/font-size:\s*//' | sort -u
```

### Detect CSS Frameworks

```bash
# Check for Tailwind
echo "$RAW_HTML" | grep -q 'tailwindcss\|tw-' && echo "Tailwind CSS detected"

# Check for Bootstrap
echo "$RAW_HTML" | grep -q 'bootstrap\|\.container-fluid\|\.row\|\.col-' && echo "Bootstrap detected"

# Check for MUI/Material
echo "$RAW_HTML" | grep -q 'MuiBox\|css-[a-z0-9]\{5\}' && echo "MUI detected"
```

### Extract Spacing Values

```bash
echo "$RAW_HTML" | grep -oP '(margin|padding|gap):\s*[^;"}]+' | sed 's/.*:\s*//' | sort -u
```

### Extract Border Radius

```bash
echo "$RAW_HTML" | grep -oP 'border-radius:\s*[^;"}]+' | sed 's/border-radius:\s*//' | sort -u
```

### Extract Breakpoints

```bash
echo "$RAW_HTML" | grep -oP '@media[^{]+' | grep -oP '\d+px' | sort -un
```

### Extract Animations/Transitions

```bash
echo "$RAW_HTML" | grep -oP '(transition|animation):\s*[^;"}]+' | sort -u
```

## Output Templates

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #1a73e8;
  --color-secondary: #5f6368;
  --color-background: #ffffff;
  --color-surface: #f8f9fa;
  --color-text: #202124;
  --color-text-muted: #5f6368;
  --color-accent: #ea4335;

  /* Typography */
  --font-family-primary: 'Inter', -apple-system, sans-serif;
  --font-family-mono: 'Fira Code', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### Tailwind Config

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8',
        secondary: '#5f6368',
        background: '#ffffff',
        surface: '#f8f9fa',
        accent: '#ea4335',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
    },
  },
}
```

### Design Tokens JSON

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "primary": { "$value": "#1a73e8", "$type": "color" },
    "secondary": { "$value": "#5f6368", "$type": "color" },
    "background": { "$value": "#ffffff", "$type": "color" },
    "text": { "$value": "#202124", "$type": "color" }
  },
  "typography": {
    "fontFamily": {
      "primary": { "$value": "Inter, -apple-system, sans-serif", "$type": "fontFamily" }
    },
    "fontSize": {
      "base": { "$value": "1rem", "$type": "dimension" },
      "lg": { "$value": "1.125rem", "$type": "dimension" }
    }
  },
  "spacing": {
    "sm": { "$value": "0.5rem", "$type": "dimension" },
    "md": { "$value": "1rem", "$type": "dimension" },
    "lg": { "$value": "1.5rem", "$type": "dimension" }
  }
}
```

## Pixel-Perfect Tips

### Font Rendering
- Check `font-display`, `-webkit-font-smoothing`, `text-rendering` properties
- Google Fonts: Extract from `fonts.googleapis.com` links in HTML head
- Self-hosted fonts: Look for `@font-face` declarations and `woff2` URLs

### Color Matching
- Prefer extracted CSS variables over computed inline styles
- Check both light and dark mode (look for `prefers-color-scheme` or class-based toggling)
- OG-Image and favicon colors often reflect brand colors

### Spacing Consistency
- Identify the spacing scale (4px, 8px multiples = likely Tailwind/systematic)
- Check `max-width` for content containers (common: 1200px, 1280px, 1440px)
- Look for CSS Grid `gap` values for consistent spacing

### Component Patterns
- Button styles: Check primary/secondary/ghost variants
- Card patterns: Look for consistent `border-radius` + `box-shadow` combinations
- Navigation: Check sticky/fixed positioning and backdrop-filter usage

## Troubleshooting

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Leere rawHtml | JavaScript-rendered SPA | `waitFor: 5000` + `actions: scroll` verwenden |
| Cookie-Banner verdeckt | Consent nicht akzeptiert | `actions: click` auf Accept-Button |
| Keine CSS-Variablen gefunden | Inline-Styles oder Framework | CSS-Dateien separat via `<link>` URLs scrapen |
| Fonts nicht erkannt | Web Fonts extern geladen | `<link>` Tags mit `fonts.googleapis.com` prüfen |
| Firecrawl timeout | Seite zu groß/langsam | `timeout: 30000` setzen, `onlyMainContent: true` |
| SearXNG keine Ergebnisse | Rate-Limiting oder Query | Andere Suchbegriffe, `pageno` variieren |
| Screenshot leer/schwarz | Dark-Mode oder Canvas | `headers: {"Sec-CH-Prefers-Color-Scheme": "light"}` |
| Tailwind-Klassen statt CSS | Utility-first Framework | Compiled CSS suchen oder Klassen-Mapping erstellen |

## Application Triggers

Dieser Skill wird automatisch angewendet wenn:
- User nach "Website klonen/kopieren" fragt
- User "Farben/Fonts/Design extrahieren" möchte
- User "Design-System erstellen" basierend auf existierender Seite will
- User "visuell nachbauen" oder "UI reverse-engineeren" erwähnt
- User nach "CSS Variables" oder "Tailwind Config" von einer Website fragt
