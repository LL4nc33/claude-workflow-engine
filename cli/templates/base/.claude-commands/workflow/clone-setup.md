# Visual Clone — Setup

Configure the service URLs for the Visual Website Cloner workflow.

## Important Guidelines

- Always use AskUserQuestion tool for user interaction
- Store configuration in `visual-clone.local.md` (automatically gitignored via `*.local.md` pattern)
- Validate connectivity before saving

---

## Process

### Step 1: Check Existing Configuration

Read `visual-clone.local.md` from the project root. If it exists, show current configuration and ask:

- Question: "Es existiert bereits eine Konfiguration. Was möchtest du tun?"
- Header: "Config"
- Options:
  - "Neu konfigurieren" — Alle URLs neu eingeben
  - "Nur testen" — Bestehende Konfiguration auf Erreichbarkeit prüfen
  - "Abbrechen" — Nichts ändern

If the file doesn't exist, proceed directly to Step 2.

---

### Step 2: Firecrawl URL

Use AskUserQuestion with:
- Question: "Wie lautet die URL deiner Firecrawl-Instanz?"
- Header: "Firecrawl"
- Options:
  - "http://localhost:3002" — Standard Docker-Setup (localhost)
  - "http://192.168.x.x:3002" — LAN-Server (IP manuell eingeben)
  - "https://firecrawl.example.com" — Eigene Domain mit HTTPS

Store the answer as `$FIRECRAWL_URL`.

---

### Step 3: SearXNG URL

Use AskUserQuestion with:
- Question: "Wie lautet die URL deiner SearXNG-Instanz?"
- Header: "SearXNG"
- Options:
  - "http://localhost:8080" — Standard Docker-Setup (localhost)
  - "https://search.example.com" — Eigene Domain mit HTTPS
  - "Keine (überspringen)" — Nur Firecrawl nutzen, kein Multi-Page-Discovery

Store the answer as `$SEARXNG_URL` (or empty if skipped).

---

### Step 4: Connectivity Test

Test both services:

```bash
echo "=== Firecrawl ==="
curl -s --connect-timeout 5 -X POST "${FIRECRAWL_URL}/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","formats":["markdown"]}' \
  | jq '.success // "Connection failed"'

echo "=== SearXNG ==="
curl -s --connect-timeout 5 "${SEARXNG_URL}/search?q=test&format=json" \
  | jq '.results | length | tostring + " results"' 2>/dev/null || echo "Not configured or unreachable"
```

Present results:
- Firecrawl: OK / Nicht erreichbar (mit Fehlerdetails)
- SearXNG: OK (X Ergebnisse) / Nicht erreichbar / Nicht konfiguriert

If a service is not reachable, ask:
- Question: "Service nicht erreichbar. Was tun?"
- Header: "Retry"
- Options:
  - "URL korrigieren" — Zurück zum entsprechenden Step
  - "Trotzdem speichern" — URL speichern, später testen
  - "Abbrechen" — Setup ohne Speichern beenden

---

### Step 5: Save Configuration

Write `visual-clone.local.md` in the project root:

```markdown
---
firecrawl_url: "${FIRECRAWL_URL}"
searxng_url: "${SEARXNG_URL}"
---

# Visual Clone Configuration

Services configured on [DATE].

- Firecrawl: ${FIRECRAWL_URL}
- SearXNG: ${SEARXNG_URL}
```

Confirm to user:
- Configuration saved to `visual-clone.local.md`
- File is gitignored (GDPR-compliant, no credentials in repo)
- Ready to use via `/workflow:visual-clone`

---

## Tips

- **Docker-Compose:** Firecrawl und SearXNG lassen sich mit Docker Compose schnell aufsetzen
- **LAN-Zugriff:** Wenn der Service auf einem anderen Rechner läuft, die LAN-IP verwenden (nicht localhost)
- **HTTPS:** Für öffentlich erreichbare Instanzen immer HTTPS verwenden
- **Neustart:** Bei URL-Änderung einfach `/workflow:clone-setup` erneut ausführen
