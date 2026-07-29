#!/usr/bin/env python3
"""
Generate iOS AppIcon and Splash assets from assets/icon.png for the Capacitor iOS project.
Run after `bunx cap add ios` (or any time the icon changes).
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icon.png"
IOS_ASSETS = ROOT / "ios" / "App" / "App" / "Assets.xcassets"
ICON_SET = IOS_ASSETS / "AppIcon.appiconset"
SPLASH_SET = IOS_ASSETS / "Splash.imageset"
BG = "#0F172A"  # matches the dark theme background


def ensure_square(src: Image.Image, bg: str) -> Image.Image:
    w, h = src.size
    if w == h:
        return src.convert("RGBA")
    size = max(w, h)
    out = Image.new("RGBA", (size, size), bg)
    out.paste(src.convert("RGBA"), ((size - w) // 2, (size - h) // 2), src.convert("RGBA")
    )
    return out


# iOS AppIcon sizes (pt -> px at scale). 1024 is the App Store icon.
APP_ICON_SIZES = [
    # iPhone Notification
    (20, 2, "20@2x"),
    (20, 3, "20@3x"),
    # iPhone Settings
    (29, 2, "29@2x"),
    (29, 3, "29@3x"),
    # iPhone Spotlight
    (40, 2, "40@2x"),
    (40, 3, "40@3x"),
    # iPhone App
    (60, 2, "60@2x"),
    (60, 3, "60@3x"),
    # iPad Notification
    (20, 1, "20@1x"),
    (20, 2, "20@2x-ipad"),
    # iPad Settings
    (29, 1, "29@1x"),
    (29, 2, "29@2x-ipad"),
    # iPad Spotlight
    (40, 1, "40@1x"),
    (40, 2, "40@2x-ipad"),
    # iPad App
    (76, 1, "76@1x"),
    (76, 2, "76@2x"),
    (83.5, 2, "83.5@2x"),
    # App Store
    (1024, 1, "1024@1x"),
]


def generate_icons():
    if not SRC.exists():
        raise FileNotFoundError(f"Missing source icon at {SRC}")
    src = ensure_square(Image.open(SRC), BG)
    ICON_SET.mkdir(parents=True, exist_ok=True)

    # Remove old icons (keep Contents.json)
    for f in ICON_SET.glob("*.png"):
        f.unlink()

    images = []
    for pt, scale, label in APP_ICON_SIZES:
        px = int(pt * scale)
        filename = f"AppIcon-{label}.png"
        icon = src.resize((px, px), Image.Resampling.LANCZOS)
        # iOS App Store icons must be opaque (no transparency)
        bg = Image.new("RGBA", (px, px), BG)
        bg.paste(icon, (0, 0), icon)
        bg.convert("RGB").save(ICON_SET / filename, "PNG")
        images.append({
            "filename": filename,
            "idiom": "universal",
            "platform": "ios",
            "size": f"{pt}x{pt}",
            "scale": f"{scale}x",
        })

    (ICON_SET / "Contents.json").write_text(
        json.dumps({"images": images, "info": {"author": "xcode", "version": 1}}, indent=2),
        encoding="utf-8",
    )
    print(f"Generated {len(images)} iOS app icons in {ICON_SET}")


def generate_splash():
    if not SRC.exists():
        return
    src = ensure_square(Image.open(SRC), BG)
    SPLASH_SET.mkdir(parents=True, exist_ok=True)

    for f in SPLASH_SET.glob("*.png"):
        f.unlink()

    size = 2732
    canvas = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(canvas)

    # Center the icon at 40% of the splash width
    icon_size = int(size * 0.4)
    icon = src.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    # Convert transparent background to dark
    icon_bg = Image.new("RGBA", (icon_size, icon_size), BG)
    icon_bg.paste(icon, (0, 0), icon)
    icon = icon_bg.convert("RGB")

    x = (size - icon_size) // 2
    y = (size - icon_size) // 2 - 120
    canvas.paste(icon, (x, y))

    # Apple requires 1x/2x/3x variants. For a storyboard, all point to the same logical size.
    for i, scale in enumerate(["1x", "2x", "3x"]):
        suffix = "-2" if i == 2 else "-1" if i == 1 else ""
        filename = f"splash-2732x2732{suffix}.png"
        canvas.save(SPLASH_SET / filename, "PNG")

    (SPLASH_SET / "Contents.json").write_text(
        json.dumps({
            "images": [
                {"filename": "splash-2732x2732-2.png", "idiom": "universal", "scale": "1x"},
                {"filename": "splash-2732x2732-1.png", "idiom": "universal", "scale": "2x"},
                {"filename": "splash-2732x2732.png", "idiom": "universal", "scale": "3x"},
            ],
            "info": {"author": "xcode", "version": 1},
        }, indent=2),
        encoding="utf-8",
    )
    print(f"Generated splash screen in {SPLASH_SET}")


if __name__ == "__main__":
    generate_icons()
    generate_splash()
