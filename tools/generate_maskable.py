"""Maskable (kenar-guvenlikli) ikon: icerik merkezde %72'ye kucultulur, arka plan
tam kenari doldurur. Android adaptive-icon maskesi kenarlari kirpsa bile onemli
kisimlar (gokkusagi/gunes) guvenli bolgede kalir."""
from PIL import Image, ImageDraw

OUT = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\public"
F = 0.72  # icerik olcegi (guvenli bolge)


def make_maskable(size):
    img = Image.new("RGB", (size, size), "#a8e6ff")
    d = ImageDraw.Draw(img)
    c = size / 2.0

    def m(p):
        return c + (p - c) * F

    s = size / 512.0
    colors = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"]
    cx, cy = size * 0.5, size * 0.82
    r0 = size * 0.52
    step = 26 * s
    tw = max(1, int(step * F))
    for i, col in enumerate(colors):
        r = (r0 - i * step) * F
        mcx, mcy = m(cx), m(cy)
        d.arc([mcx - r, mcy - r, mcx + r, mcy + r], 180, 360, fill=col, width=tw)
    # gunes
    sr = size * 0.13 * F
    sx, sy = m(size * 0.80), m(size * 0.24)
    d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill="#ffd43b")
    # bulut
    for (bx, by, br) in [(0.20, 0.30, 0.09), (0.28, 0.28, 0.11), (0.36, 0.31, 0.08)]:
        orr = size * br * F
        mx, my = m(size * bx), m(size * by)
        d.ellipse([mx - orr, my - orr, mx + orr, my + orr], fill="#ffffff")
    img.save(f"{OUT}/icon-maskable-{size}.png")
    print("yazildi", f"icon-maskable-{size}.png")


make_maskable(512)
make_maskable(192)
