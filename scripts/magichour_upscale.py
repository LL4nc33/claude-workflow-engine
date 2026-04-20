#!/usr/bin/env python3
"""Image upscaling via MagicHour API."""

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

    scale, args = extract_flag(args, "--scale", "2")

    input_path = None
    remaining = []
    for a in args:
        if not a.startswith("--") and input_path is None:
            input_path = a
        else:
            remaining.append(a)
    args = remaining

    if not input_path:
        json_err("Kein Input-Bild angegeben", "Usage: magichour_upscale.py bild.png [--scale 2|4] [--output pfad]")

    if not Path(input_path).exists():
        json_err(f"Bild nicht gefunden: {input_path}")

    output_path = resolve_output(args, "png")

    resp = magichour_post("image-upscaler", {
        "assets": {
            "image_url": str(Path(input_path).resolve()),
        },
        "scale_factor": int(scale),
    }, api_key)

    job_id = resp.get("id")
    if not job_id:
        json_err("Kein Job-ID erhalten", str(resp)[:300])

    result = magichour_poll(job_id, api_key)

    downloads = result.get("downloads", [])
    if not downloads:
        json_err("Kein Download-Link", str(result)[:300])

    download_result(downloads[0].get("url", ""), output_path)
    json_ok(output_path, scale=int(scale))


if __name__ == "__main__":
    main()
