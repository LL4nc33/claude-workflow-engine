---
description: MUSS VERWENDET WERDEN wenn User eine PDF-Datei lesen, analysieren oder Text daraus extrahieren will. Konvertiert PDF-Seiten zu Bildern via Stirling PDF API und liest sie visuell.
allowed-tools: ["Bash", "Read"]
---

# CWE PDF Reader

Liest PDF-Dateien durch Konvertierung zu Bildern via [Stirling PDF API](https://github.com/Stirling-Tools/Stirling-PDF). Funktioniert auch mit gescannten PDFs ohne OCR — Claude liest die Bilder direkt.

**Usage:** `/cwe:pdf <dateipfad> [seitenzahlen]`

Beispiele:
- `/cwe:pdf /path/to/dokument.pdf` — alle Seiten
- `/cwe:pdf /path/to/dokument.pdf 1-5` — nur Seite 1-5
- `/cwe:pdf /path/to/dokument.pdf 3` — nur Seite 3

## Konfiguration

Lies die Stirling-URL aus `.claude/cwe-settings.yml` (Schlüssel: `stirling_pdf_url`). Fällt sie auf `http://localhost:8080` zurück wenn nicht gesetzt.

```bash
STIRLING_URL=$(grep '^stirling_pdf_url:' .claude/cwe-settings.yml 2>/dev/null | sed 's/^stirling_pdf_url:\s*//' | tr -d '"')
STIRLING_URL=${STIRLING_URL:-http://localhost:8080}
```

Wenn kein Stirling-Server verfügbar ist, informiere den User und verweise auf [Stirling-PDF Setup](https://docs.stirlingpdf.com/) oder `docker run -p 8080:8080 stirlingtools/stirling-pdf`.

## Schritte

1. **Dateipfad und Seitenbereich parsen** aus den ARGUMENTS. Wenn kein Seitenbereich angegeben, alle Seiten lesen. Prüfe ob die Datei existiert.

2. **Seitenanzahl ermitteln** — Lade die PDF-Info über die Stirling API:

```bash
PAGE_COUNT=$(curl -s -X POST "$STIRLING_URL/api/v1/security/get-info-on-pdf" \
  -F "fileInput=@DATEIPFAD" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('basicInfo',{}).get('Number of pages','0'))" 2>/dev/null)
echo "Seiten: $PAGE_COUNT"
```

3. **PDF zu Bildern konvertieren** via Stirling API:

```bash
mkdir -p /tmp/cwe-pdf
curl -s -X POST "$STIRLING_URL/api/v1/convert/pdf/img" \
  -F 'fileInput=@DATEIPFAD' \
  -F 'imageFormat=jpeg' \
  -F 'singleOrMultiple=multiple' \
  -F 'dpi=200' \
  -o /tmp/cwe-pdf/pages.zip
```

4. **ZIP entpacken**:

```bash
cd /tmp/cwe-pdf && python3 -c "import zipfile; zipfile.ZipFile('pages.zip').extractall('pages/')"
ls /tmp/cwe-pdf/pages/ | sort
```

5. **Seiten lesen** — Lies jede Bild-Datei mit dem Read-Tool. Bei vielen Seiten (>20) nur den angegebenen Seitenbereich lesen. Fasse den Inhalt zusammen und beziehe dich auf den Kontext der Konversation.

   - Bei **Seitenbereich** (z.B. `1-5`): Nur die entsprechenden Dateien lesen
   - Bei **allen Seiten**: Maximal 20 Seiten auf einmal lesen, bei mehr den User fragen
   - **Parallel lesen**: Lies bis zu 5 Seiten gleichzeitig mit parallelen Read-Aufrufen

6. **Cleanup**: Nach der Analyse temporaere Dateien entfernen:

```bash
rm -rf /tmp/cwe-pdf
```

## Tipps

- Funktioniert mit allen PDF-Typen: Text-PDFs, gescannte Dokumente, gemischt
- Gescannte PDFs werden als Bilder gelesen — kein OCR noetig da Claude multimodal ist
- Bei grossen PDFs (50+ Seiten) immer einen Seitenbereich angeben
