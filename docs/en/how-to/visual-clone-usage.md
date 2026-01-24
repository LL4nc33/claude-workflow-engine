# How-To: Using the Visual Website Cloner

This guide shows you how to extract the visual identity of a website and output it as CSS Variables, Tailwind Config, or Design Tokens.

## Goal

After this guide you will have:

- Configured Firecrawl and SearXNG service URLs
- Extracted colors, fonts, spacing, and breakpoints from a website
- Generated a usable design file (CSS, Tailwind, or JSON)

## Prerequisites

- Claude Workflow Engine is installed
- **Firecrawl** running as a self-hosted instance (Docker recommended)
- **SearXNG** running as a self-hosted instance (optional, for multi-page discovery)
- Node.js >= 18 (for `npx @toon-format/cli`)

### Setting Up Services

If you don't have Firecrawl and SearXNG yet:

```bash
# Firecrawl (Docker)
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl && docker compose up -d
# Runs on http://localhost:3002

# SearXNG (Docker)
git clone https://github.com/searxng/searxng-docker.git
cd searxng-docker && docker compose up -d
# Runs on http://localhost:8080
```

---

## Step 1: Configure Service URLs

**Command:** `/workflow/clone-setup`

On first use, you'll be asked interactively for your service URLs:

```
> /workflow/clone-setup

Claude: What is the URL of your Firecrawl instance?
You:    http://192.168.178.64:3002

Claude: What is the URL of your SearXNG instance?
You:    https://search.example.com
```

URLs are saved in `visual-clone.local.md` (automatically gitignored).

### Connectivity Test

The setup command automatically tests service availability and reports:

```
=== Firecrawl ===
true (reachable)

=== SearXNG ===
5 results (reachable)
```

If a service is unreachable, you can correct the URL or save it anyway.

---

## Step 2: Clone a Website Visually

**Command:** `/workflow/visual-clone`

```
> /workflow/visual-clone

Claude: Which website do you want to clone visually?
You:    https://stripe.com

Claude: What output format do you want?
You:    CSS Variables

Claude: How does the target site behave?
You:    Standard (static/SSR)
```

### What Happens

1. **Scraping** — Firecrawl loads the page (HTML, screenshot, links)
2. **CSS Analysis** — Colors, fonts, spacing, breakpoints are extracted
3. **Optional: Multi-Page** — SearXNG finds sub-pages for a more complete design system
4. **Output** — Files are generated in the chosen format

### Example Output (CSS Variables)

```css
:root {
  --color-primary: #635bff;
  --color-secondary: #0a2540;
  --color-background: #ffffff;
  --font-family-primary: 'Inter', sans-serif;
  --font-size-base: 1rem;
  --radius-md: 8px;
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

---

## Output Formats

| Format | File | When to Use |
|--------|------|-------------|
| CSS Variables | `variables.css` | Framework-agnostic, universal |
| Tailwind Config | `tailwind.config.js` | Tailwind CSS projects |
| Design Tokens JSON | `tokens.json` | W3C Design Tokens standard |
| All Formats | All three files | When you want flexibility |

---

## Token Optimization with TOON

API responses are automatically converted to [TOON format](https://github.com/toon-format/toon) before loading into the LLM context. This saves ~40% tokens compared to JSON:

```
# JSON (~200 tokens)
[{"title":"About","url":"https://example.com/about"},{"title":"Pricing","url":"..."}]

# TOON (~80 tokens)
[2]{title,url}:
  About,https://example.com/about
  Pricing,https://example.com/pricing
```

Conversion happens via `npx @toon-format/cli` — no manual action needed.

---

## Tips

- **SPA Sites:** Choose "SPA (React/Vue/Angular)" in the site type dialog — Firecrawl will wait longer and scroll
- **Cookie Banners:** The "Cookie banner present" option automatically clicks common consent buttons
- **Dark Mode:** If the site supports dark mode, run the workflow twice (once light, once dark)
- **Google Fonts:** Font URLs are extracted directly from the HTML head
- **Framework Sites:** For Tailwind/MUI, the compiled CSS is analyzed, not utility classes

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Firecrawl unreachable | Run `/workflow/clone-setup` again |
| Empty rawHtml | Choose "SPA" mode (waits for JS rendering) |
| No fonts found | Check Google Fonts links in HTML head |
| Timeout | Use `onlyMainContent: true` |

---

## Next Steps

After extraction you can:

- Import CSS Variables directly into your project
- Merge the Tailwind Config into your `tailwind.config.js`
- Import Design Tokens into a design system tool (Figma Tokens, Style Dictionary)
- Run `/workflow/visual-clone` again for additional pages
