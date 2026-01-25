# Visual Website Cloner

Extract the visual identity (colors, fonts, spacing, components) from any website and generate CSS Variables, Tailwind Config, or Design Tokens.

## Important Guidelines

- Always use AskUserQuestion tool for user interaction at each decision point
- Use Bash with curl/jq for all API calls — no SDKs needed
- Save all generated output files in the user's project directory
- Present extracted data before generating final output for user review

## Prerequisites

- Service URLs configured via `/workflow:web-setup` (stored in `web-services.local.md`)
- Firecrawl instance (self-hosted)
- SearXNG instance (self-hosted, optional for multi-page discovery)

---

## Process

### Step 0: Load Configuration

Read `web-services.local.md` from the project root to get service URLs.

If the file doesn't exist, inform the user:
> "Bitte zuerst `/workflow:web-setup` ausfuehren um die Service-URLs zu konfigurieren."

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

### Step 7: Pixel-Perfect Verification

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
