#!/usr/bin/env python3
"""Generate images via Gemini models on OpenRouter."""

import base64
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _media_lib import (
    load_keys, require_key, resolve_output, extract_flag, get_prompt,
    openrouter_chat, json_ok, json_err
)

MODELS = {
    "flash": "google/gemini-2.5-flash-image",
    "3.1": "google/gemini-3.1-flash-image-preview",
    "pro": "google/gemini-3-pro-image-preview",
}

def main():
    args = sys.argv[1:]
    if not args:
        json_err("Kein Prompt angegeben", 'Usage: gemini_image.py "prompt" [--input bild.jpg] [--output out.png] [--model flash|3.1|pro]')

    keys = load_keys()
    api_key = require_key(keys, "OPENROUTER_API_KEY")

    model_name, args = extract_flag(args, "--model", "flash")
    model_id = MODELS.get(model_name)
    if not model_id:
        json_err(f"Unbekanntes Modell: {model_name}", f"Verfuegbar: {', '.join(MODELS.keys())}")

    input_path, args = extract_flag(args, "--input")
    output_path = resolve_output(args, "png")
    prompt = get_prompt(args)

    if not prompt:
        json_err("Kein Prompt angegeben")

    # Build messages
    content = [{"type": "text", "text": prompt}]

    if input_path:
        img_path = Path(input_path)
        if not img_path.exists():
            json_err(f"Input-Bild nicht gefunden: {input_path}")
        with open(img_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        suffix = img_path.suffix.lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(suffix, "image/png")
        content.insert(0, {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}})

    messages = [{"role": "user", "content": content}]

    # Call API
    resp = openrouter_chat(model_id, messages, api_key)

    # Extract image from response
    choices = resp.get("choices", [])
    if not choices:
        json_err("Keine Antwort von Gemini", str(resp)[:300])

    message = choices[0].get("message", {})

    # OpenRouter returns images in message.images[] for Gemini image models
    images = message.get("images", [])
    for img in images:
        url = img.get("image_url", {}).get("url", "")
        if url.startswith("data:"):
            b64_data = url.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_data)
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(img_bytes)
            json_ok(output_path, model=model_id)

    # Fallback: check content parts
    content_parts = message.get("content", "")
    if isinstance(content_parts, list):
        for part in content_parts:
            if isinstance(part, dict):
                inline = part.get("inline_data") or part.get("image_url", {})
                if inline:
                    b64_data = inline.get("data") or inline.get("url", "")
                    if b64_data.startswith("data:"):
                        b64_data = b64_data.split(",", 1)[1]
                    if b64_data:
                        img_bytes = base64.b64decode(b64_data)
                        output_path = Path(output_path)
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        output_path.write_bytes(img_bytes)
                        json_ok(output_path, model=model_id)

    json_err("Kein Bild in der Antwort gefunden", f"Response: {str(resp)[:500]}")


if __name__ == "__main__":
    main()
