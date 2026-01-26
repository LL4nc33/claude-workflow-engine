# Design Token Standards

Design Tokens sind die atomaren Bausteine eines Design Systems - Farben, Typografie, Spacing, etc.

## Token-Struktur

```
workflow/standards/frontend/
├── design-tokens.md          # Dieses Dokument (Schema)
└── [projekt-spezifisch]/     # Generierte Token-Dateien
    └── tokens.json
```

## Token-Kategorien

### Colors

```json
{
  "color": {
    "primary": {
      "50": "#f0f9ff",
      "100": "#e0f2fe",
      "500": "#0ea5e9",
      "900": "#0c4a6e"
    },
    "neutral": {
      "0": "#ffffff",
      "50": "#f8fafc",
      "900": "#0f172a",
      "1000": "#000000"
    },
    "semantic": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  }
}
```

### Typography

```json
{
  "typography": {
    "fontFamily": {
      "sans": "Inter, system-ui, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem"
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "lineHeight": {
      "tight": "1.25",
      "normal": "1.5",
      "relaxed": "1.75"
    }
  }
}
```

### Spacing

```json
{
  "spacing": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "6": "1.5rem",
    "8": "2rem",
    "12": "3rem",
    "16": "4rem"
  }
}
```

### Border Radius

```json
{
  "borderRadius": {
    "none": "0",
    "sm": "0.125rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "full": "9999px"
  }
}
```

### Shadows

```json
{
  "shadow": {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1)"
  }
}
```

## Generierung via /workflow:visual-clone

Der Visual-Clone Workflow extrahiert Tokens aus bestehenden Websites:

1. URL analysieren (Firecrawl Screenshot + CSS)
2. Farben, Fonts, Spacing extrahieren
3. Token-JSON generieren
4. Optional: Als Standard speichern

### Output-Format

```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "source": "https://example.com",
  "extracted": "2025-01-26T12:00:00Z",
  "color": { ... },
  "typography": { ... },
  "spacing": { ... }
}
```

## CSS Custom Properties

Tokens werden als CSS Variables exportiert:

```css
:root {
  /* Colors */
  --color-primary-500: #0ea5e9;
  --color-neutral-900: #0f172a;

  /* Typography */
  --font-sans: Inter, system-ui, sans-serif;
  --font-size-base: 1rem;

  /* Spacing */
  --spacing-4: 1rem;
  --spacing-8: 2rem;
}
```

## Tailwind Integration

Bei Tailwind-Projekten werden Tokens in `tailwind.config.js` integriert:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
        }
      }
    }
  }
}
```

## Best Practices

1. **Semantische Namen** - `color.primary` statt `color.blue`
2. **Skalierbare Werte** - Nummerierte Skalen (50-900) fuer Flexibilitaet
3. **Single Source** - Tokens als JSON, generiere CSS/JS daraus
4. **Dokumentation** - Jeder Token mit Verwendungszweck
5. **Versionierung** - Token-Aenderungen tracken

## TODO

- [ ] Style Dictionary Integration
- [ ] Figma Token Sync
- [ ] Dark Mode Token Mapping
