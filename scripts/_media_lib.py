#!/usr/bin/env python3
"""Shared library for CWE media tools. Auth, API calls, polling, output."""

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# JSON Output
# ---------------------------------------------------------------------------

def json_ok(path, **meta):
    """Print success JSON and exit 0."""
    result = {"success": True, "path": str(path)}
    result.update(meta)
    print(json.dumps(result))
    sys.exit(0)


def json_err(error, hint=""):
    """Print error JSON and exit 1."""
    result = {"success": False, "error": error}
    if hint:
        result["hint"] = hint
    print(json.dumps(result))
    sys.exit(1)


# ---------------------------------------------------------------------------
# API Keys
# ---------------------------------------------------------------------------

def load_keys():
    """Load API keys from media-keys.sh by parsing exported lines only.

    Does NOT source the file or dump shell env — only reads the file
    line-by-line and extracts the two known keys. This prevents leaking
    unrelated secrets from the user's environment.
    """
    keys_file = Path(__file__).parent / "media-keys.sh"
    if not keys_file.exists():
        json_err(
            "media-keys.sh nicht gefunden",
            f"Erstelle {keys_file} mit OPENROUTER_API_KEY und MAGICHOUR_API_KEY"
        )

    allowed = ("OPENROUTER_API_KEY", "MAGICHOUR_API_KEY")
    # Match: export VAR="value" | export VAR='value' | export VAR=value
    pattern = re.compile(
        r'^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*'
        r'(?:"([^"]*)"|\'([^\']*)\'|([^\s#]*))\s*(?:#.*)?$'
    )

    parsed = {}
    try:
        with open(keys_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.rstrip("\n")
                if not line or line.lstrip().startswith("#"):
                    continue
                m = pattern.match(line)
                if not m:
                    continue
                name = m.group(1)
                if name not in allowed:
                    continue
                value = m.group(2) if m.group(2) is not None else (
                    m.group(3) if m.group(3) is not None else (m.group(4) or "")
                )
                parsed[name] = value
    except OSError as e:
        json_err("media-keys.sh konnte nicht gelesen werden", str(e))

    return {
        "OPENROUTER_API_KEY": parsed.get("OPENROUTER_API_KEY", ""),
        "MAGICHOUR_API_KEY": parsed.get("MAGICHOUR_API_KEY", ""),
    }


def require_key(keys, name):
    """Check that a key is set, exit with error if not."""
    if not keys.get(name):
        json_err(
            f"{name} ist leer",
            f"Trage deinen Key in scripts/media-keys.sh ein"
        )
    return keys[name]


# ---------------------------------------------------------------------------
# Asset URL resolution
# ---------------------------------------------------------------------------

def resolve_asset_url(path_or_url):
    """Return a URL suitable for MagicHour's *_url asset fields.

    MagicHour requires publicly reachable HTTPS URLs. If the caller already
    supplied an http(s) URL, pass it through. If it's a local filesystem
    path, fail cleanly with a clear hint — MagicHour cannot fetch localhost
    paths, and the proper upload-endpoint flow is not implemented here.
    """
    if path_or_url is None:
        json_err(
            "Kein Asset-Pfad/URL angegeben",
            "Erwartet: öffentliche https-URL"
        )

    s = str(path_or_url).strip()
    low = s.lower()
    if low.startswith("http://") or low.startswith("https://"):
        return s

    json_err(
        "Lokale Pfade werden von MagicHour nicht unterstützt",
        "Local paths require upload — please host the file at a public "
        "HTTPS URL and retry. (Got: " + s + ")"
    )


# ---------------------------------------------------------------------------
# Output Path
# ---------------------------------------------------------------------------

def resolve_output(args, default_ext="png"):
    """Resolve output path from --output flag or generate default."""
    if "--output" in args:
        idx = args.index("--output")
        if idx + 1 < len(args):
            return Path(args[idx + 1])

    out_dir = Path("./generated")
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    return out_dir / f"media_{ts}.{default_ext}"


def extract_flag(args, flag, default=None):
    """Extract --flag value from args list. Returns value and cleaned args."""
    cleaned = list(args)
    if flag in cleaned:
        idx = cleaned.index(flag)
        if idx + 1 < len(cleaned):
            val = cleaned[idx + 1]
            del cleaned[idx:idx + 2]
            return val, cleaned
        else:
            del cleaned[idx]
    return default, cleaned


def get_prompt(args):
    """Get the prompt text from remaining args (after flags extracted)."""
    prompt_parts = []
    skip_next = False
    for i, a in enumerate(args):
        if skip_next:
            skip_next = False
            continue
        if a.startswith("--"):
            skip_next = True
            continue
        prompt_parts.append(a)
    return " ".join(prompt_parts)


# ---------------------------------------------------------------------------
# HTTP helpers (using requests)
# ---------------------------------------------------------------------------

try:
    import requests
except ImportError:
    json_err(
        "requests library nicht installiert",
        "pip install requests"
    )


def openrouter_chat(model, messages, api_key):
    """Send chat completion to OpenRouter. Returns response dict."""
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={"model": model, "messages": messages},
        timeout=120,
    )
    if resp.status_code != 200:
        json_err(f"OpenRouter API Fehler {resp.status_code}", resp.text[:300])
    return resp.json()


def magichour_post(endpoint, payload, api_key):
    """POST to MagicHour API. Returns response dict (contains id for polling)."""
    resp = requests.post(
        f"https://api.magichour.ai/v1/{endpoint}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    if resp.status_code not in (200, 201):
        json_err(f"MagicHour API Fehler {resp.status_code}", resp.text[:300])
    return resp.json()


def magichour_poll(job_id, api_key, timeout=300):
    """Poll MagicHour image job until complete/failed. Returns result dict."""
    url = f"https://api.magichour.ai/v1/image-projects/{job_id}"
    start = time.time()
    while time.time() - start < timeout:
        resp = requests.get(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30,
        )
        if resp.status_code != 200:
            json_err(f"MagicHour Poll Fehler {resp.status_code}", resp.text[:300])
        data = resp.json()
        status = data.get("status", "")
        if status == "complete":
            return data
        if status in ("failed", "error"):
            json_err("MagicHour Job fehlgeschlagen", json.dumps(data.get("error", {})))
        time.sleep(5)
    json_err("MagicHour Timeout", f"Job {job_id} nicht fertig nach {timeout}s")


def magichour_poll_video(job_id, api_key, timeout=300):
    """Poll MagicHour video job. Returns result dict."""
    url = f"https://api.magichour.ai/v1/video-projects/{job_id}"
    start = time.time()
    while time.time() - start < timeout:
        resp = requests.get(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30,
        )
        if resp.status_code != 200:
            json_err(f"MagicHour Poll Fehler {resp.status_code}", resp.text[:300])
        data = resp.json()
        status = data.get("status", "")
        if status == "complete":
            return data
        if status in ("failed", "error"):
            json_err("MagicHour Job fehlgeschlagen", json.dumps(data.get("error", {})))
        time.sleep(5)
    json_err("MagicHour Timeout", f"Job {job_id} nicht fertig nach {timeout}s")


def download_result(url, output_path):
    """Download file from URL to output_path."""
    resp = requests.get(url, timeout=120, stream=True)
    if resp.status_code != 200:
        json_err(f"Download fehlgeschlagen ({resp.status_code})", url)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(8192):
            f.write(chunk)
    return output_path
