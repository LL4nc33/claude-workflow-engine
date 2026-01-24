# How-To: Visual Website Cloner nutzen

Dieser Guide zeigt dir, wie du die visuelle Identitaet einer Website extrahierst und als CSS Variables, Tailwind Config oder Design Tokens ausgibst.

## Ziel

Nach diesem Guide hast du:

- Firecrawl und SearXNG konfiguriert
- Farben, Fonts, Spacing und Breakpoints einer Website extrahiert
- Eine nutzbare Design-Datei (CSS, Tailwind oder JSON) generiert

## Voraussetzungen

- Claude Workflow Engine ist installiert
- **Firecrawl** laeuft als self-hosted Instanz (Docker empfohlen)
- **SearXNG** laeuft als self-hosted Instanz (optional, fuer Multi-Page-Discovery)
- Node.js >= 18 (fuer `npx @toon-format/cli`)

### Services aufsetzen

Falls du Firecrawl und SearXNG noch nicht hast:

```bash
# Firecrawl (Docker)
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl && docker compose up -d
# Laeuft auf http://localhost:3002

# SearXNG (Docker)
git clone https://github.com/searxng/searxng-docker.git
cd searxng-docker && docker compose up -d
# Laeuft auf http://localhost:8080
```

---

## Schritt 1: Service-URLs konfigurieren

**Command:** `/workflow/clone-setup`

Beim ersten Aufruf wirst du interaktiv nach deinen Service-URLs gefragt:

```
> /workflow/clone-setup

Claude: Wie lautet die URL deiner Firecrawl-Instanz?
Du:     http://192.168.178.64:3002

Claude: Wie lautet die URL deiner SearXNG-Instanz?
Du:     https://search.example.com
```

Die URLs werden in `visual-clone.local.md` gespeichert (automatisch gitignored).

### Connectivity-Test

Der Setup-Command testet automatisch die Erreichbarkeit beider Services und meldet:

```
=== Firecrawl ===
true (erreichbar)

=== SearXNG ===
5 results (erreichbar)
```

Falls ein Service nicht erreichbar ist, kannst du die URL korrigieren oder trotzdem speichern.

---

## Schritt 2: Website visuell klonen

**Command:** `/workflow/visual-clone`

```
> /workflow/visual-clone

Claude: Welche Website moechtest du visuell klonen?
Du:     https://stripe.com

Claude: In welchem Format soll das Ergebnis ausgegeben werden?
Du:     CSS Variables

Claude: Wie verhaelt sich die Zielseite?
Du:     Standard (statisch/SSR)
```

### Was passiert

1. **Scraping** — Firecrawl laedt die Seite (HTML, Screenshot, Links)
2. **CSS-Analyse** — Farben, Fonts, Spacing, Breakpoints werden extrahiert
3. **Optional: Multi-Page** — SearXNG findet weitere Unterseiten fuer vollstaendigeres Design-System
4. **Output** — Dateien werden im gewaehlten Format generiert

### Beispiel-Output (CSS Variables)

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

## Output-Formate

| Format | Datei | Wann nutzen |
|--------|-------|-------------|
| CSS Variables | `variables.css` | Framework-agnostisch, universell |
| Tailwind Config | `tailwind.config.js` | Tailwind CSS Projekte |
| Design Tokens JSON | `tokens.json` | W3C Design Tokens Standard |
| Alle Formate | Alle drei Dateien | Wenn du flexibel bleiben willst |

---

## Token-Optimierung mit TOON

API-Responses werden automatisch in [TOON-Format](https://github.com/toon-format/toon) konvertiert bevor sie in den LLM-Kontext geladen werden. Das spart ~40% Tokens gegenueber JSON:

```
# JSON (~200 Tokens)
[{"title":"About","url":"https://example.com/about"},{"title":"Pricing","url":"..."}]

# TOON (~80 Tokens)
[2]{title,url}:
  About,https://example.com/about
  Pricing,https://example.com/pricing
```

Die Konvertierung passiert via `npx @toon-format/cli` — keine manuelle Aktion noetig.

---

## Tipps

- **SPA-Seiten:** Waehle "SPA (React/Vue/Angular)" im Site-Type-Dialog — Firecrawl wartet dann laenger und scrollt
- **Cookie-Banner:** Die Option "Cookie-Banner vorhanden" klickt automatisch gaengige Consent-Buttons
- **Dark Mode:** Wenn die Seite Dark Mode unterstuetzt, fuehre den Workflow zweimal aus (einmal light, einmal dark)
- **Google Fonts:** Font-URLs werden direkt aus dem HTML-Head extrahiert
- **Framework-Seiten:** Bei Tailwind/MUI wird die compiled CSS analysiert, nicht die Utility-Klassen

## Fehlerbehebung

| Problem | Loesung |
|---------|---------|
| Firecrawl nicht erreichbar | `/workflow/clone-setup` erneut ausfuehren |
| Leere rawHtml | "SPA"-Modus waehlen (wartet auf JS-Rendering) |
| Keine Fonts gefunden | Google Fonts Links im HTML-Head pruefen |
| Timeout | `onlyMainContent: true` verwenden |

---

## Weiterarbeiten

Nach dem Extrahieren kannst du:

- Die CSS Variables direkt in dein Projekt importieren
- Den Tailwind Config in `tailwind.config.js` mergen
- Design Tokens in ein Design-System-Tool (Figma Tokens, Style Dictionary) importieren
- `/workflow/visual-clone` erneut ausfuehren fuer weitere Seiten
