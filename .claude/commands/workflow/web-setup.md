---
description: Web-Access-Layer konfigurieren (Firecrawl, SearXNG, Captcha)
interactive: true
---

# Web Services — Setup

Configure service URLs for the Web-Access-Layer (SearXNG, Firecrawl, Captcha-Solver).

## Important Guidelines

- Always use AskUserQuestion tool for user interaction
- Store configuration in `web-services.local.md` (automatically gitignored via `*.local.md` pattern)
- Validate connectivity before saving
- Migrate existing `visual-clone.local.md` if present

---

## Process

### Step 0: Migration Check

Check if `visual-clone.local.md` exists in the project root.

If it exists AND `web-services.local.md` does NOT exist:
- Parse existing URLs from `visual-clone.local.md`
- Pre-fill these values for the setup steps below
- Inform user: "Bestehende Konfiguration aus `visual-clone.local.md` gefunden. Werte werden uebernommen."

---

### Step 1: Check Existing Configuration

Read `web-services.local.md` from the project root. If it exists, show current configuration and ask:

- Question: "Es existiert bereits eine Web-Services-Konfiguration. Was moechtest du tun?"
- Header: "Config"
- Options:
  - "Neu konfigurieren" — Alle URLs neu eingeben
  - "Nur testen" — Bestehende Konfiguration auf Erreichbarkeit pruefen
  - "Erweitern" — Nur fehlende Services hinzufuegen
  - "Abbrechen" — Nichts aendern

If "Nur testen": Jump to Step 5 (Connectivity Test).
If "Erweitern": Skip already-configured services in Steps 2-4.
If the file doesn't exist, proceed directly to Step 2.

---

### Step 2: Firecrawl URL

Use AskUserQuestion with:
- Question: "Wie lautet die URL deiner Firecrawl-Instanz? (JS-Rendering, Screenshots, Scraping)"
- Header: "Firecrawl"
- Options:
  - "http://localhost:3002" — Standard Docker-Setup (localhost)
  - "http://192.168.x.x:3002" — LAN-Server (IP manuell eingeben)
  - "Keine (ueberspringen)" — Firecrawl nicht konfigurieren

Store the answer as `$FIRECRAWL_URL` (or empty if skipped).

---

### Step 3: SearXNG URL

Use AskUserQuestion with:
- Question: "Wie lautet die URL deiner SearXNG-Instanz? (Private Suche, kein Tracking)"
- Header: "SearXNG"
- Options:
  - "http://localhost:8080" — Standard Docker-Setup (localhost)
  - "https://search.example.com" — Eigene Domain mit HTTPS
  - "Keine (ueberspringen)" — Nur Firecrawl nutzen, keine Suche

Store the answer as `$SEARXNG_URL` (or empty if skipped).

---

### Step 4: Captcha-Solver (Optional)

Use AskUserQuestion with:
- Question: "Moechtest du einen Captcha-Solver konfigurieren? (Fuer geschuetzte Seiten)"
- Header: "Captcha"
- Options:
  - "Ja, SolveCaptcha" — Pay-per-solve Service konfigurieren
  - "Nein (ueberspringen)" — Captcha-Solving nicht einrichten

If "Ja":
- Ask for API-Key:
  - Question: "Wie lautet dein SolveCaptcha API-Key?"
  - Header: "API Key"
  - Options: Free text input expected

Store as `$CAPTCHA_API_KEY`.

Optional: Balance-Check ausfuehren:
```bash
BALANCE=$(curl -s "https://api.solvecaptcha.com/res.php?key=${CAPTCHA_API_KEY}&action=getbalance")
echo "Aktuelles Guthaben: $BALANCE USD"
```

Ask for advanced settings:
- Question: "Erweiterte Captcha-Einstellungen anpassen?"
- Header: "Advanced"
- Options:
  - "Standard (Timeout: 120s, Polling: 10s)" — Empfohlene Werte
  - "Anpassen" — Timeout und Polling-Intervall manuell setzen

If "Anpassen":

Use AskUserQuestion with:
- Question: "Wie lange soll maximal auf eine Captcha-Loesung gewartet werden (in Sekunden)?"
- Header: "Timeout"
- Options:
  - "120" — Standard (2 Minuten, empfohlen)
  - "60" — Schneller Abbruch (1 Minute)
  - "180" — Laenger warten (3 Minuten)

Store as `$CAPTCHA_TIMEOUT`.

Use AskUserQuestion with:
- Question: "In welchem Intervall soll der Solver-Status abgefragt werden (in Sekunden)?"
- Header: "Polling"
- Options:
  - "10" — Standard (alle 10 Sekunden, empfohlen)
  - "5" — Haeufiger pruefen (mehr API-Calls)
  - "15" — Seltener pruefen (weniger API-Calls)

---

### Step 5: Connectivity Test

Test all configured services:

```bash
echo "=== Firecrawl ==="
if [ -n "$FIRECRAWL_URL" ]; then
  curl -s --connect-timeout 5 -X POST "${FIRECRAWL_URL}/v1/scrape" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com","formats":["markdown"]}' \
    | jq '.success // "Connection failed"'
else
  echo "Nicht konfiguriert"
fi

echo "=== SearXNG ==="
if [ -n "$SEARXNG_URL" ]; then
  curl -s --connect-timeout 5 "${SEARXNG_URL}/search?q=test&format=json" \
    | jq '.results | length | tostring + " Ergebnisse"' 2>/dev/null || echo "Nicht erreichbar"
else
  echo "Nicht konfiguriert"
fi

echo "=== Captcha-Solver ==="
if [ -n "$CAPTCHA_API_KEY" ]; then
  BALANCE=$(curl -s --connect-timeout 5 "https://api.solvecaptcha.com/res.php?key=${CAPTCHA_API_KEY}&action=getbalance")
  echo "Guthaben: $BALANCE USD"
else
  echo "Nicht konfiguriert"
fi
```

Present results. If a service is not reachable, ask:
- Question: "Service nicht erreichbar. Was tun?"
- Header: "Retry"
- Options:
  - "URL korrigieren" — Zurueck zum entsprechenden Step
  - "Trotzdem speichern" — URL speichern, spaeter testen
  - "Service ueberspringen" — Ohne diesen Service fortfahren

---

### Step 6: Save Configuration

Write `web-services.local.md` in the project root:

```markdown
---
firecrawl_url: "${FIRECRAWL_URL}"
searxng_url: "${SEARXNG_URL}"
captcha_provider: solvecaptcha
captcha_api_key: "${CAPTCHA_API_KEY}"
captcha_timeout: ${CAPTCHA_TIMEOUT:-120}
captcha_polling: ${CAPTCHA_POLLING:-10}
---

# Web Services Configuration

Configured on [DATE].

## Services
- Firecrawl: ${FIRECRAWL_URL} (JS-rendering, screenshots, scraping)
- SearXNG: ${SEARXNG_URL} (private search, no tracking)
- Captcha Solver: SolveCaptcha (pay-per-solve, only when needed)

## ENV Fallbacks
- $FIRECRAWL_URL
- $SEARXNG_URL
- $SOLVECAPTCHA_API_KEY
```

Only include services that were actually configured (omit empty values from YAML).

---

### Step 7: Migration Cleanup

If `visual-clone.local.md` existed in Step 0:

Use AskUserQuestion with:
- Question: "Die alte `visual-clone.local.md` kann geloescht werden (Werte wurden uebernommen). Loeschen?"
- Header: "Cleanup"
- Options:
  - "Ja, loeschen" — Alte Config-Datei entfernen
  - "Nein, behalten" — Fuer Backward-Compatibility behalten

---

### Step 8: Summary

Present final summary:
- Configuration saved to `web-services.local.md`
- File is gitignored (GDPR-compliant, no credentials in repo)
- Available services and their URLs
- Ready to use via Web-Access-Skill in allen Agents
- Hinweis: `/workflow:visual-clone` nutzt jetzt automatisch diese Config

---

## Tips

- **Docker-Compose:** Firecrawl und SearXNG lassen sich mit Docker Compose schnell aufsetzen
- **LAN-Zugriff:** Wenn der Service auf einem anderen Rechner laeuft, die LAN-IP verwenden (nicht localhost)
- **HTTPS:** Fuer oeffentlich erreichbare Instanzen immer HTTPS verwenden
- **ENV-Variablen:** In CI/CD-Umgebungen ENV statt Config-Datei nutzen ($FIRECRAWL_URL, $SEARXNG_URL, $SOLVECAPTCHA_API_KEY)
- **Neustart:** Bei URL-Aenderung einfach `/workflow:web-setup` erneut ausfuehren
- **Captcha-Kosten:** SolveCaptcha berechnet pro geloestem Captcha (~$2-3/1000 Stueck)
