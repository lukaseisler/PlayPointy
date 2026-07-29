"""Generate JPEG Open Graph images from RGBA WebP cards (WhatsApp-safe)."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
cards = json.loads((ROOT / "public" / "cards.json").read_text(encoding="utf-8"))
out = ROOT / "public" / "og"
out.mkdir(exist_ok=True)

wrote = 0
for c in cards:
    src = ROOT / "public" / c["image"]
    if not src.exists():
        print("missing", src)
        continue
    im = Image.open(src).convert("RGBA")
    hexcol = c.get("hex", "#171717").lstrip("#")
    rgb = tuple(int(hexcol[i : i + 2], 16) for i in (0, 2, 4))
    bg = Image.new("RGB", im.size, rgb)
    bg.paste(im, mask=im.split()[3])
    dest = out / f"{c['id']}.jpg"
    bg.save(dest, "JPEG", quality=85, optimize=True)
    wrote += 1

total = sum(p.stat().st_size for p in out.glob("*.jpg"))
print(f"wrote {wrote} jpgs, {total / 1024 / 1024:.2f} MB")
