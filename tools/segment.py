"""Render edilmis sayfa PNG'lerinden beyaz zemindeki nesneleri otomatik keser.
- Bagli-bilesen analizi ile her nesnenin bbox'ini bulur.
- Kenardan flood-fill ile arka plani seffaflastirir (nesne icindeki beyazlar korunur).
- Her sayfa icin: kesilmis PNG'ler + numarali dogrulama overlay'i uretir.
"""
import os, json, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

RENDER = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\tools\pages_render"
OUT = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\tools\segments"
os.makedirs(OUT, exist_ok=True)

# Varsayilan parametreler
DEF = dict(top=0.085, bot=0.05, left=0.035, right=0.035, thr=238, dilate=7,
           min_area=0.004, min_w=0.04, min_h=0.04, max_frac=0.85,
           min_fill=0.12, max_span=0.9)

# Sayfa bazli override'lar (dosya adinin bir parcasi -> ayarlar)
OVERRIDES = {
    # ornekler ilk turdan sonra eklenecek
}

def settings_for(name):
    s = dict(DEF)
    for key, ov in OVERRIDES.items():
        if key in name:
            s.update(ov)
    return s

def near_white(arr, thr):
    # arr: HxWx3 ; True = beyaza yakin (arka plan)
    return (arr[:, :, 0] >= thr) & (arr[:, :, 1] >= thr) & (arr[:, :, 2] >= thr)

def make_alpha(crop_rgb, thr):
    """Kenardan flood-fill ile arka plan beyazini seffaf yapar."""
    arr = np.asarray(crop_rgb).astype(np.uint8)
    bg = near_white(arr, thr)
    # arka plan beyazlarini etiketle; kenara degen bilesenler = gercek arka plan
    lbl, n = ndimage.label(bg)
    border = set(np.unique(np.concatenate([
        lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]])))
    border.discard(0)
    transparent = np.isin(lbl, list(border)) if border else np.zeros_like(bg)
    alpha = np.where(transparent, 0, 255).astype(np.uint8)
    out = np.dstack([arr, alpha])
    return Image.fromarray(out, "RGBA")

def process(path):
    name = os.path.splitext(os.path.basename(path))[0]
    img = Image.open(path).convert("RGB")
    W, H = img.size
    s = settings_for(name)
    x0, y0 = int(W * s["left"]), int(H * s["top"])
    x1, y1 = int(W * (1 - s["right"])), int(H * (1 - s["bot"]))
    region = img.crop((x0, y0, x1, y1))
    rw, rh = region.size
    arr = np.asarray(region).astype(np.uint8)

    fg = ~near_white(arr, s["thr"])
    fg = ndimage.binary_dilation(fg, iterations=s["dilate"])
    lbl, n = ndimage.label(fg)

    comps = []
    min_area = s["min_area"] * rw * rh
    for i in range(1, n + 1):
        ys, xs = np.where(lbl == i)
        area = len(xs)
        if area < min_area:
            continue
        bx0, bx1 = xs.min(), xs.max()
        by0, by1 = ys.min(), ys.max()
        bw, bh = bx1 - bx0 + 1, by1 - by0 + 1
        if bw < s["min_w"] * rw or bh < s["min_h"] * rh:
            continue
        if bw > s["max_frac"] * rw and bh > s["max_frac"] * rh:
            continue
        # ince cerceve/cizgi ret: sayfa boyu/eni kadar uzayan
        if bw > s["max_span"] * rw or bh > s["max_span"] * rh:
            continue
        # doluluk orani dusukse (cerceve/kutu kenari) ret
        if area / float(bw * bh) < s["min_fill"]:
            continue
        comps.append([int(bx0), int(by0), int(bx1), int(by1)])

    # satir-once sirala (once y kabaca, sonra x)
    rowtol = rh * 0.06
    comps.sort(key=lambda b: (round(b[1] / rowtol), b[0]))

    outdir = os.path.join(OUT, name)
    os.makedirs(outdir, exist_ok=True)
    overlay = region.convert("RGB")
    draw = ImageDraw.Draw(overlay)
    try:
        font = ImageFont.truetype("arial.ttf", 46)
    except Exception:
        font = ImageFont.load_default()

    meta = []
    for idx, (bx0, by0, bx1, by1) in enumerate(comps):
        pad = 4
        cb = (max(0, bx0 - pad), max(0, by0 - pad),
              min(rw, bx1 + pad), min(rh, by1 + pad))
        crop = region.crop(cb)
        rgba = make_alpha(crop, s["thr"])
        fn = f"{idx:02d}.png"
        rgba.save(os.path.join(outdir, fn))
        meta.append(dict(index=idx, file=fn, bbox=[cb[0], cb[1], cb[2], cb[3]],
                         cx=(bx0 + bx1) // 2, cy=(by0 + by1) // 2))
        draw.rectangle([bx0, by0, bx1, by1], outline=(255, 0, 0), width=4)
        draw.text((bx0 + 6, by0 + 6), str(idx), fill=(255, 0, 0), font=font)

    overlay.save(os.path.join(OUT, name + "__overlay.png"))
    with open(os.path.join(outdir, "_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(f"{name}: {len(comps)} nesne")
    return name, len(comps)

if __name__ == "__main__":
    import sys
    targets = sys.argv[1:]
    files = sorted(glob.glob(os.path.join(RENDER, "*.png")))
    for path in files:
        name = os.path.basename(path)
        if targets and not any(t in name for t in targets):
            continue
        process(path)
