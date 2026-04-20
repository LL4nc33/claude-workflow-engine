#!/usr/bin/env python3
"""Face swap via MagicHour API. Supports photo and video sources."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _media_lib import (
    load_keys, require_key, resolve_output, extract_flag,
    magichour_post, magichour_poll, magichour_poll_video,
    download_result, json_ok, json_err
)

VIDEO_EXTS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}

def main():
    args = sys.argv[1:]

    keys = load_keys()
    api_key = require_key(keys, "MAGICHOUR_API_KEY")

    source, args = extract_flag(args, "--source")
    face, args = extract_flag(args, "--face")

    if not source or not face:
        json_err(
            "Beide --source und --face sind erforderlich",
            "Usage: magichour_faceswap.py --source foto.jpg --face gesicht.jpg"
        )

    source_path = Path(source)
    face_path = Path(face)

    if not source_path.exists():
        json_err(f"Source nicht gefunden: {source}")
    if not face_path.exists():
        json_err(f"Face nicht gefunden: {face}")

    is_video = source_path.suffix.lower() in VIDEO_EXTS

    if is_video:
        output_path = resolve_output(args, "mp4")
        resp = magichour_post("face-swap-video", {
            "assets": {
                "source_video_url": str(source_path.resolve()),
                "target_image_url": str(face_path.resolve()),
            }
        }, api_key)

        job_id = resp.get("id")
        if not job_id:
            json_err("Kein Job-ID erhalten", str(resp)[:300])

        result = magichour_poll_video(job_id, api_key)
    else:
        output_path = resolve_output(args, "png")
        resp = magichour_post("face-swap", {
            "assets": {
                "source_image_url": str(source_path.resolve()),
                "target_image_url": str(face_path.resolve()),
            }
        }, api_key)

        job_id = resp.get("id")
        if not job_id:
            json_err("Kein Job-ID erhalten", str(resp)[:300])

        result = magichour_poll(job_id, api_key)

    downloads = result.get("downloads", [])
    if not downloads:
        json_err("Kein Download-Link im Ergebnis", str(result)[:300])

    result_url = downloads[0].get("url", "")
    if not result_url:
        json_err("Leerer Download-Link", str(downloads)[:300])

    download_result(result_url, output_path)
    json_ok(output_path, type="video" if is_video else "photo")


if __name__ == "__main__":
    main()
