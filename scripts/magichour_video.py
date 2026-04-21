#!/usr/bin/env python3
"""Video generation via MagicHour API. Text-to-Video or Image-to-Video."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _media_lib import (
    load_keys, require_key, resolve_output, extract_flag, get_prompt,
    magichour_post, magichour_poll_video, download_result, json_ok, json_err,
    resolve_asset_url
)

def _is_url(s):
    low = str(s).lower()
    return low.startswith("http://") or low.startswith("https://")

def main():
    args = sys.argv[1:]

    keys = load_keys()
    api_key = require_key(keys, "MAGICHOUR_API_KEY")

    input_path, args = extract_flag(args, "--input")
    duration, args = extract_flag(args, "--duration", "5")
    output_path = resolve_output(args, "mp4")
    prompt = get_prompt(args)

    if not prompt and not input_path:
        json_err(
            "Prompt oder --input erforderlich",
            'Usage: magichour_video.py "prompt" [--input bild.jpg] [--duration 5] [--output video.mp4]'
        )

    if input_path:
        if not _is_url(input_path) and not Path(input_path).exists():
            json_err(f"Input-Bild nicht gefunden: {input_path}")

        payload = {
            "assets": {
                "image_url": resolve_asset_url(input_path),
            },
            "end_seconds": float(duration),
        }
        if prompt:
            payload["style"] = {"prompt": prompt}

        resp = magichour_post("image-to-video", payload, api_key)
    else:
        payload = {
            "style": {"prompt": prompt},
            "end_seconds": float(duration),
        }
        resp = magichour_post("text-to-video", payload, api_key)

    job_id = resp.get("id")
    if not job_id:
        json_err("Kein Job-ID erhalten", str(resp)[:300])

    result = magichour_poll_video(job_id, api_key, timeout=600)

    downloads = result.get("downloads", [])
    if not downloads:
        json_err("Kein Download-Link", str(result)[:300])

    download_result(downloads[0].get("url", ""), output_path)
    json_ok(output_path, duration=float(duration))


if __name__ == "__main__":
    main()
