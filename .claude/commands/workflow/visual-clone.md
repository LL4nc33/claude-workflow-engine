# Visual Website Cloner

Extract the visual identity (colors, fonts, spacing, components) from any website and generate CSS Variables, Tailwind Config, or Design Tokens.

## Important Guidelines

- Always use AskUserQuestion tool for user interaction at each decision point
- Use Bash with curl/jq for all API calls — no SDKs needed
- Save all generated output files in the user's project directory
- Present extracted data before generating final output for user review

## Prerequisites

- Service URLs configured via `/workflow:clone-setup` (stored in `visual-clone.local.md`)
- Firecrawl instance (self-hosted)
- SearXNG instance (self-hosted, optional for multi-page discovery)

---

## Process

### Step 0: Load Configuration

Read `visual-clone.local.md` from the project root to get service URLs.

If the file doesn't exist, inform the user:
> "Bitte zuerst `/workflow:clone-setup` ausführen um die Service-URLs zu konfigurieren."

Then stop the workflow.

If it exists, parse the YAML frontmatter and store:
- `$FIRECRAWL_URL` — Firecrawl instance URL
- `$SEARXNG_URL` — SearXNG instance URL (may be empty)

---

### Step 1: Get Target URL

Ask the user for the target website and desired output format.

Use AskUserQuestion with:
- Question: "Welche Website möchtest du visuell klonen? Bitte gib die vollständige URL an (z.B. https://example.com)"
- Header: "Target URL"
- Options: Free text input expected

Then ask:
- Question: "In welchem Format soll das Ergebnis ausgegeben werden?"
- Header: "Output"
- Options:
  - "CSS Variables (Recommended)" — Universell, framework-agnostisch
  - "Tailwind Config" — Für Tailwind CSS Projekte
  - "Design Tokens JSON" — W3C Design Tokens Format
  - "Alle Formate" — CSS + Tailwind + JSON

Store the URL as `$TARGET_URL` and the format choice for Step 6.

---

### Step 2: Check SPA Behavior

Ask about the website's technical characteristics.

Use AskUserQuestion with:
- Question: "Wie verhält sich die Zielseite?"
- Header: "Site Type"
- Options:
  - "Standard (statisch/SSR)" — Normales HTML, kein JavaScript nötig
  - "SPA (React/Vue/Angular)" — JavaScript-gerendert, braucht Warten
  - "Cookie-Banner vorhanden" — Consent-Dialog muss erst geschlossen werden
  - "Unsicher" — Versuche Standard, dann SPA-Fallback

Based on the answer, configure the scrape parameters:
- **Standard:** `waitFor: 2000`, no actions
- **SPA:** `waitFor: 5000`, actions: `[{"type": "scroll", "direction": "down", "amount": 1000}]`
- **Cookie-Banner:** actions: `[{"type": "click", "selector": "[data-consent-accept], .cookie-accept, #accept-cookies, button:has-text('Accept'), button:has-text('Akzeptieren')"}, {"type": "wait", "milliseconds": 1000}]`
- **Unsicher:** Start with Standard, retry with SPA if rawHtml is sparse

---

### Step 3: Scrape Visual Identity

Execute the Firecrawl API call with the configured parameters.

```bash
RESPONSE=$(curl -s -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'$TARGET_URL'",
    "formats": ["rawHtml", "markdown", "screenshot", "links"],
    "onlyMainContent": false,
    "waitFor": '$WAIT_TIME'
    '$ACTIONS_JSON'
  }')

# Check success
echo "$RESPONSE" | jq '.success'

# Metadata + Links as TOON (token-optimized for LLM context)
echo "$RESPONSE" | jq '{metadata: .data.metadata, links: .data.links}' | npx @toon-format/cli

# rawHtml separately (plain string, not TOON)
RAW_HTML=$(echo "$RESPONSE" | jq -r '.data.rawHtml')
SCREENSHOT=$(echo "$RESPONSE" | jq -r '.data.screenshot')
```

Present to user:
- Confirmation of successful scrape
- Page title and metadata
- Number of links found
- Screenshot (if available, as base64 image)

If the scrape fails or returns empty content, inform the user and offer to retry with different settings.

---

### Step 4: Discover Additional Pages (Optional)

Ask if the user wants to analyze additional pages for a more complete design system.

Use AskUserQuestion with:
- Question: "Sollen weitere Unterseiten analysiert werden für ein vollständigeres Design-System?"
- Header: "Multi-Page"
- Options:
  - "Nein, nur die Hauptseite" — Schneller, reicht für die meisten Fälle
  - "Ja, wichtige Unterseiten finden" — SearXNG-Discovery für About, Pricing, etc.
  - "Ja, bestimmte URLs" — User gibt spezifische URLs an

If multi-page discovery is chosen:

```bash
# Find sub-pages via SearXNG — results as TOON table
DOMAIN=$(echo "$TARGET_URL" | sed 's|https\?://\([^/]*\).*|\1|')
curl -s "${SEARXNG_URL}/search?q=site:${DOMAIN}&format=json&categories=general" \
  | jq '[.results[:10] | .[] | {title, url}]' | npx @toon-format/cli
```

Scrape each additional page and merge the CSS analysis results.

---

### Step 5: Deep CSS Analysis

Analyze the rawHtml for visual design properties.

```bash
echo "=== CSS Custom Properties ==="
echo "$RAW_HTML" | grep -oP '(?<=--)[a-zA-Z0-9-]+\s*:\s*[^;]+' | sort -u

echo "=== Colors ==="
echo "$RAW_HTML" | grep -oP '#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)' | sort -u

echo "=== Font Families ==="
echo "$RAW_HTML" | grep -oP 'font-family:\s*[^;"}]+' | sed 's/font-family:\s*//' | sort -u

echo "=== Font Sizes ==="
echo "$RAW_HTML" | grep -oP 'font-size:\s*[^;"}]+' | sed 's/font-size:\s*//' | sort -u

echo "=== Spacing ==="
echo "$RAW_HTML" | grep -oP '(margin|padding|gap):\s*[^;"}]+' | sed 's/.*:\s*//' | sort -u

echo "=== Border Radius ==="
echo "$RAW_HTML" | grep -oP 'border-radius:\s*[^;"}]+' | sed 's/border-radius:\s*//' | sort -u

echo "=== Shadows ==="
echo "$RAW_HTML" | grep -oP 'box-shadow:\s*[^;"}]+' | sort -u

echo "=== Breakpoints ==="
echo "$RAW_HTML" | grep -oP '@media[^{]+' | grep -oP '\d+px' | sort -un

echo "=== Transitions/Animations ==="
echo "$RAW_HTML" | grep -oP '(transition|animation):\s*[^;"}]+' | sort -u

echo "=== Framework Detection ==="
echo "$RAW_HTML" | grep -q 'tailwindcss\|tw-' && echo "Tailwind CSS"
echo "$RAW_HTML" | grep -q 'bootstrap' && echo "Bootstrap"
echo "$RAW_HTML" | grep -q 'MuiBox\|css-[a-z0-9]\{5\}' && echo "Material UI"

echo "=== External Stylesheets ==="
echo "$RAW_HTML" | grep -oP 'href="[^"]*\.css[^"]*"' | sed 's/href="//;s/"//'

echo "=== Google Fonts ==="
echo "$RAW_HTML" | grep -oP 'fonts\.googleapis\.com/css2?\?[^"]+' | head -5
```

Present the analysis results grouped by category. Highlight:
- Primary and secondary colors (most frequently used)
- Font stack hierarchy
- Spacing scale pattern (e.g., 4px-based, 8px-based)
- Detected frameworks

---

### Step 6: Generate Output

Based on the format chosen in Step 1, generate the output files.

Use AskUserQuestion with:
- Question: "Wo sollen die generierten Dateien gespeichert werden?"
- Header: "Output Path"
- Options:
  - "./design-system/" — Eigener Ordner im Projekt-Root
  - "./src/styles/" — Im Source-Verzeichnis
  - Benutzerdefinierter Pfad

Generate the appropriate files based on the chosen format:

**CSS Variables:** `{output-path}/variables.css`
**Tailwind Config:** `{output-path}/tailwind.config.js`
**Design Tokens:** `{output-path}/tokens.json`

Use the templates from the visual-clone skill, populated with the extracted values.

After generating, present a summary:
- Files created with paths
- Number of design tokens extracted
- Any values that seem unusual or might need manual verification

---

### Step 7: Generate Design Token Standards (Optional)

After output generation, offer standards creation.

Use AskUserQuestion with:
- Question: "Möchtest du aus den extrahierten Tokens Frontend-Standards generieren?"
- Header: "Standards"
- Options:
  - "Ja" — Standards-Datei aus extrahierten Tokens erstellen
  - "Ja, mit bestehendem Standard mergen" — Bestehende design-tokens.md als Basis verwenden
  - "Nein" — Direkt zur Verifizierung

If "Nein", skip to Step 8.

#### Step 7a: Token-Cache aktualisieren

Append extracted tokens to `.design-tokens-cache.local.md` in the project root.

Format:
```markdown
---
sources:
  - url: $TARGET_URL
    scraped: YYYY-MM-DD
    tokens: <count>
---

## Source: $TARGET_URL (YYYY-MM-DD)

### Colors
| Token | Value | Context |
|-------|-------|---------|
| primary | #635bff | Most frequent brand color |
| secondary | #0a2540 | Headings, dark sections |
| ... | ... | ... |

### Typography
| Token | Value |
|-------|-------|
| font-family-primary | 'Inter', sans-serif |
| font-size-base | 1rem |
| ... | ... |

### Spacing
| Token | Value |
|-------|-------|
| space-sm | 0.5rem |
| space-md | 1rem |
| ... | ... |

### Borders
| Token | Value |
|-------|-------|
| radius-md | 8px |
| ... | ... |

### Shadows
| Token | Value |
|-------|-------|
| shadow-md | 0 4px 6px rgba(0,0,0,0.1) |
| ... | ... |
```

#### Step 7b: Intelligent Merge (if multi-source or existing standards)

If `.design-tokens-cache.local.md` contains multiple sources OR `workflow/standards/frontend/design-tokens.md` exists:

Load all available token data and apply the merge algorithm:

1. **Frequenz-Analyse**: Prefer values that appear more frequently across sources
2. **Semantischer Kontext**: CSS property names inform token roles (e.g., background-color → background token)
3. **Konsistenz**: If one source has a more systematic scale (4px/8px multiplier), prefer that system
4. **Komplementäre Werte**: Tokens unique to one source are included as additions
5. **Recency**: On tie-break, the newer extraction wins

Merge strategy per token:
- Same token, same value → keep as-is
- Same token, different value → AI picks best with reasoning
- New token in one source only → include as addition
- Conflicting scales → normalize to most consistent system

#### Step 7c: Category-by-category confirmation

For each category, present the AI's recommendation to the user and wait for confirmation.

**Order:** Colors → Typography → Spacing → Borders/Radius → Shadows → (Breakpoints, Transitions if found)

For each category, use AskUserQuestion-style presentation:
- Show the category name with emoji (🎨 Colors, 📝 Typography, 📐 Spacing, 🔲 Borders, 🌫️ Shadows)
- Show the recommended tokens as a formatted table
- If merging: show source attribution and merge reasoning for conflicting values
- Wait for user to confirm "ok" or provide corrections

If the user provides corrections, incorporate them into the final values.

#### Step 7d: Write Standards

After all categories are confirmed, write the standards file.

Write to `workflow/standards/frontend/design-tokens.md`:

```markdown
# Design Token Standards

> Generiert aus: [source URLs] am [date]

## Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Colors | `--color-` | `--color-primary` |
| Typography | `--font-` | `--font-family-primary` |
| Spacing | `--space-` | `--space-md` |
| Borders | `--radius-` | `--radius-md` |
| Shadows | `--shadow-` | `--shadow-md` |

## Color System

### Naming Rules
- Semantic: primary / secondary / accent / background / surface / text / text-muted
- Feedback: success / warning / error / info
- Scales: `--color-primary-50` bis `--color-primary-900`

### Values
[CSS :root block with extracted values]

## Typography System

### Scale: T-Shirt Sizes (xs → 3xl)
[Values from extraction]

## Spacing System

### Base: [4px|8px] Multiplier
[Values from extraction]

## Borders & Radius
[Values from extraction]

## Shadows
[Values from extraction]

## Usage Rules
- CSS Custom Properties verwenden, keine Hardcoded-Werte
- Tokens semantisch referenzieren
- Dark Mode: Werte in `[data-theme="dark"]` überschreiben
- Neue Farben müssen bestehende Rolle füllen oder neue definieren
```

Then update `workflow/standards/index.yml` — add the `design-tokens` entry under `frontend:` if not already present.

Confirm: "Standards geschrieben und im Index registriert."

#### Step 7e: Cache Cleanup

Use AskUserQuestion with:
- Question: "Token-Cache behalten für zukünftige Merges?"
- Header: "Cache"
- Options:
  - "Ja, behalten" — Cache bleibt für spätere Multi-Source-Merges
  - "Nein, löschen" — `.design-tokens-cache.local.md` wird entfernt

---

### Step 8: Pixel-Perfect Verification

Provide verification guidance and next steps.

Present to the user:
- Screenshot comparison reminder (original vs. generated styles applied)
- Font loading instructions (Google Fonts links or self-hosted font files)
- Any external assets discovered (images, icons, SVGs)

Use AskUserQuestion with:
- Question: "Wie möchtest du fortfahren?"
- Header: "Next Steps"
- Options:
  - "Fertig — Ergebnisse sind vollständig" — Workflow beenden
  - "Weitere Seite analysieren" — Zurück zu Step 1
  - "Output-Format anpassen" — Zurück zu Step 6
  - "Probleme beheben" — Troubleshooting starten

---

## Tips

- **Schnelltest:** `curl -s -X POST "${FIRECRAWL_URL}/v1/scrape" -H "Content-Type: application/json" -d '{"url":"https://example.com","formats":["markdown"]}' | jq '.success'` prüft Firecrawl
- **Große Seiten:** Bei Timeout `onlyMainContent: true` verwenden und CSS separat extrahieren
- **Dark Mode:** Wenn die Seite Dark-Mode unterstützt, beide Varianten separat scrapen
- **Google Fonts:** Die Font-URL direkt aus dem HTML-Head extrahieren und in die Output-Datei übernehmen
- **Framework-Seiten:** Bei Tailwind/MUI die compiled CSS analysieren, nicht die Utility-Klassen
- **Responsive:** Breakpoints aus Media-Queries extrahieren und in die Config übernehmen
