#!/usr/bin/env python3
"""Head swap via MagicHour API."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _media_lib import (
    load_keys, require_key, resolve_output, extract_flag,
    magichour_post, magichour_poll, download_result, json_ok, json_err
)

def main():
    args = sys.argv[1:]

    keys = load_keys()
    api_key = require_key(keys, "MAGICHOUR_API_KEY")

    source, args = extract_flag(args, "--source")
    head, args = extract_flag(args, "--head")

    if not source or not head:
        json_err(
            "Beide --source und --head sind erforderlich",
            "Usage: magichour_headswap.py --source foto.jpg --head kopf.jpg"
        )

    if not Path(source).exists():
        json_err(f"Source nicht gefunden: {source}")
    if not Path(head).exists():
        json_err(f"Head nicht gefunden: {head}")

    output_path = resolve_output(args, "png")

    resp = magichour_post("head-swap", {
        "assets": {
            "source_image_url": str(Path(source).resolve()),
            "swap_image_url": str(Path(head).resolve()),
        }
    }, api_key)

    job_id = resp.get("id")
    if not job_id:
        json_err("Kein Job-ID erhalten", str(resp)[:300])

    result = magichour_poll(job_id, api_key)

    downloads = result.get("downloads", [])
    if not downloads:
        json_err("Kein Download-Link", str(result)[:300])

    download_result(downloads[0].get("url", ""), output_path)
    json_ok(output_path)


if __name__ == "__main__":
    main()
