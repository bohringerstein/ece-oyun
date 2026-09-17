"""Basit, cocuk dostu uygulama ikonu uretir (gokkusagi + gunes)."""
from PIL import Image, ImageDraw

OUT = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\public"

def make(size):
    img = Image.new("RGB", (size, size), "#a8e6ff")
    d = ImageDraw.Draw(img)
    s = size / 512.0
    # gokkusagi kemerleri
    colors = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"]
    cx, cy = size * 0.5, size * 0.82
    r0 = size * 0.52
    tw = int(26 * s)
    for i, c in enumerate(colors):
        r = r0 - i * tw
        d.arc([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=c, width=tw)
    # gunes
    sr = size * 0.13
    sx, sy = size * 0.80, size * 0.24
    d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill="#ffd43b")
    # bulut
    for (bx, by, br) in [(0.20, 0.30, 0.09), (0.28, 0.28, 0.11), (0.36, 0.31, 0.08)]:
        d.ellipse([size*bx-size*br, size*by-size*br, size*bx+size*br, size*by+size*br], fill="#ffffff")
    img.save(f"{OUT}/icon-{size}.png")
    print("yazildi", f"icon-{size}.png")

make(192)
make(512)
