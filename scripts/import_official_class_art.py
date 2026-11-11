"""Import the eight transparent NCSOFT AION 2 promotional character layers.

The NCSOFT promotional renders are mirrored at aion2.online as separate
transparent class layers. They remain © NCSOFT, and are only used here as
identifying artwork in an unofficial AION 2 fan character planner.

Run: python -m pip install Pillow && python scripts/import_official_class_art.py
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = False

SOURCE = "https://aion2.online/wp-content/uploads/2025/08/class-layer-{}-char.png"
CLASSES = (
    "gladiator",
    "templar",
    "assassin",
    "ranger",
    "chanter",
    "cleric",
    "sorcerer",
    "spiritmaster",
)
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "class-renders"


def import_class(index: int, cls: str) -> None:
    url = SOURCE.format(index)
    request = Request(
        url,
        headers={
            "User-Agent": "DaevaArchitect-Art-Importer/1.0 (AION2 fan project)",
            "Accept": "image/png,image/*;q=0.8",
        },
    )
    with urlopen(request, timeout=40) as response:
        contents = response.read(12 * 1024 * 1024 + 1)
        if len(contents) > 12 * 1024 * 1024:
            raise ValueError(f"{cls}: source image exceeds 12 MiB")

    with Image.open(BytesIO(contents)) as original:
        if original.format != "PNG":
            raise ValueError(f"{cls}: expected transparent PNG, got {original.format}")
        width, height = original.size
        if not (600 <= width <= 3000 and 800 <= height <= 4000):
            raise ValueError(f"{cls}: unexpected source resolution {width}x{height}")
        image = original.convert("RGBA")
        min_alpha, max_alpha = image.getchannel("A").getextrema()
        if min_alpha != 0 or max_alpha != 255:
            raise ValueError(
                f"{cls}: source is not a correctly alpha-masked character render "
                f"(alpha range {min_alpha}-{max_alpha})"
            )
        # Lossless WebP preserves artwork details and transparent edges, avoids
        # all runtime third-party requests, and works in current modern browsers.
        DEST.mkdir(parents=True, exist_ok=True)
        target = DEST / f"{cls}.webp"
        image.save(target, "WEBP", lossless=True, method=6, exact=True)
        print(f"{cls:12} {width:4}x{height:<4} RGBA -> {target.relative_to(ROOT)} "
              f"({target.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    for idx, name in enumerate(CLASSES, start=1):
        import_class(idx, name)
