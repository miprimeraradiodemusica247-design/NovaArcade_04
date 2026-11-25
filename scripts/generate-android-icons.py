#!/usr/bin/env python3
"""Generate Android launcher icons from the canonical NOVA ARCADE SVG."""
from pathlib import Path
import io

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "public" / "icons" / "nova-arcade.svg"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
SVG = SVG_PATH.read_text(encoding="utf-8")
OUTER_BACKGROUND = '<rect width="512" height="512" rx="112" fill="#0B1015"/>'

if OUTER_BACKGROUND not in SVG:
    raise SystemExit("El SVG no contiene el fondo esperado; se cancela la generación.")

def render(svg: str, size: int) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")

# Iconos clásicos: compatibles con versiones Android anteriores a los adaptive icons.
for density, size in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
    folder = RES / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    image = render(SVG, size)
    image.save(folder / "ic_launcher.png", optimize=True)
    image.save(folder / "ic_launcher_round.png", optimize=True)

# Adaptive icon Android 8+: fondo sólido y el mismo arte como primer plano transparente.
foreground_svg = SVG.replace(OUTER_BACKGROUND, "", 1)
foreground = render(foreground_svg, 432)
foreground_dir = RES / "drawable-nodpi"
foreground_dir.mkdir(parents=True, exist_ok=True)
foreground.save(foreground_dir / "ic_launcher_foreground.png", optimize=True)

(RES / "values").mkdir(parents=True, exist_ok=True)
(RES / "values" / "ic_launcher_background.xml").write_text(
    """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B1015</color>
</resources>
""",
    encoding="utf-8",
)
adaptive_dir = RES / "mipmap-anydpi-v26"
adaptive_dir.mkdir(parents=True, exist_ok=True)
adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
'''
for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
    (adaptive_dir / name).write_text(adaptive_xml, encoding="utf-8")

print("Iconos Android generados desde public/icons/nova-arcade.svg")
