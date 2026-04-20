---
description: MUSS VERWENDET WERDEN wenn User eine URL teilt (YouTube, Instagram, TikTok, Podcast, etc.) oder ein Video/Audio-Transkript braucht. Transkribiert via TScribe (self-hosted faster-whisper) oder Fallback tubetranscript.
allowed-tools: ["Bash", "Read"]
---

# Transcribe

Transkribiert Audio/Video von jeder URL: YouTube, Instagram Reels, TikTok, Podcasts, direkte Media-Links. Nutzt eine [TScribe](https://github.com/transcribe-tools/tscribe)-kompatible API (self-hosted faster-whisper) als Primary, tubetranscript als YouTube-Fallback.

**Usage:** `/cwe:transcript <url>`

## Konfiguration

Lies die TScribe-URL aus `.claude/cwe-settings.yml` (Schlüssel: `tscribe_url`). Wenn nicht gesetzt, nur YouTube-Fallback verfügbar.

```bash
TSCRIBE_URL=$(grep '^tscribe_url:' .claude/cwe-settings.yml 2>/dev/null | sed 's/^tscribe_url:\s*//' | tr -d '"')
```

Wenn kein TScribe-Server konfiguriert ist und die URL keine YouTube-URL ist, informiere den User und verweise auf Setup-Optionen:
- Self-hosted TScribe via Docker
- Whisper lokal via `whisper-cli`
- Andere faster-whisper-API-Services

## Schritte

### 1. URL erkennen und Methode waehlen

- **YouTube** (`youtube.com`, `youtu.be`, `youtube.com/shorts/`): TScribe primary (falls konfiguriert), tubetranscript Fallback
- **Instagram** (`instagram.com/reel/`, `instagram.com/p/`): TScribe (erfordert Konfiguration)
- **TikTok** (`tiktok.com`): TScribe (erfordert Konfiguration)
- **Alles andere** (Podcasts, direkte MP3/MP4 URLs): TScribe (erfordert Konfiguration)

### 2. TScribe API (Primary, wenn konfiguriert)

```bash
# Job erstellen
RESULT=$(curl -s -X POST "$TSCRIBE_URL/api/jobs/" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"URL_HERE\"}")

JOB_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
echo "Job: $JOB_ID"
```

Dann pollen bis fertig:

```bash
# Pollen (max 60 Versuche, alle 5 Sekunden = 5 Minuten)
for i in $(seq 1 60); do
  sleep 5
  RESULT=$(curl -s "$TSCRIBE_URL/api/jobs/$JOB_ID")
  STATUS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
  PROGRESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('progress',0))" 2>/dev/null)
  echo "Poll $i: status=$STATUS progress=$PROGRESS"
  if [ "$STATUS" = "done" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
done
```

Ergebnis auslesen:

```bash
echo "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"Titel: {d.get('title', '?')}\")
print(f\"Sprache: {d.get('detected_language', '?')}\")
print(f\"Dauer: {d.get('duration_seconds', 0):.0f}s\")
print(f\"---TRANSKRIPT---\")
print(d.get('result_text', 'FEHLER: ' + str(d.get('error', 'unbekannt'))))
"
```

### 3. Ergebnis praesentieren

- Titel, Sprache, Dauer
- Transkript-Zusammenfassung (bei langen Videos die wichtigsten Punkte)

### 4. Fallback: tubetranscript (nur YouTube, kein TScribe nötig)

Falls TScribe nicht konfiguriert/erreichbar ist UND es eine YouTube-URL ist, nutze das Hook-Script:

```bash
echo "{\"message\":\"URL_HERE\"}" | bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/transcript.sh
```

## Tipps

- TScribe nutzt faster-whisper auf GPU — transkribiert auch Videos OHNE Untertitel
- Funktioniert mit allem was yt-dlp laden kann (YouTube, IG, TikTok, Vimeo, Twitter/X, etc.)
- Instagram/TikTok brauchen manchmal 10-20 Sekunden laenger (Download + Transkription)
- Bei langen Videos (>30 Min) kann es bis zu 2-3 Minuten dauern
- TScribe erkennt die Sprache automatisch
