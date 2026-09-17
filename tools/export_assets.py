"""Secili resimsel sayfalari segmentleyip kirpilan PNG'leri
public/assets/<level-id>/ altina numarali olarak kopyalar.
'fark' (uzay) sayfasi icin iki panel sabit bolgeden kirpilir."""
import os, glob, shutil
import numpy as np
from PIL import Image
from scipy import ndimage
import segment  # ayni klasordeki segment.py

RENDER = segment.RENDER
SEG = segment.OUT
ASSETS = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\public\assets"

# level-id -> kaynak dosya adindaki anahtar parca
CROP_PAGES = {
    "golge-esle": "1-golgeleri",
    "meyve-sira": "10-elma",
    "fazla": "2-hangisi-fazla",
    "buyuk": "9-hangisi-daha-buyuk",
    "kisa": "40-hangisi-uzun-kisa",
    "davranis": "54-dogru",
}

def find_render(key):
    for p in glob.glob(os.path.join(RENDER, "*.png")):
        if key in os.path.basename(p):
            return p
    raise FileNotFoundError(key)

def export_standard():
    for level_id, key in CROP_PAGES.items():
        path = find_render(key)
        name, n = segment.process(path)
        srcdir = os.path.join(SEG, name)
        dstdir = os.path.join(ASSETS, level_id)
        os.makedirs(dstdir, exist_ok=True)
        # eski temizle
        for f in glob.glob(os.path.join(dstdir, "*.png")):
            os.remove(f)
        for f in sorted(glob.glob(os.path.join(srcdir, "*.png"))):
            shutil.copy(f, os.path.join(dstdir, os.path.basename(f)))
        print(f"  -> {level_id}: {n} PNG kopyalandi")

def export_fark():
    """Uzay sahnesi: iki panel (ust/alt) sabit oranlarla kirpilir."""
    path = find_render("25-bes-farki")
    img = Image.open(path).convert("RGB")
    W, H = img.size
    dstdir = os.path.join(ASSETS, "fark")
    os.makedirs(dstdir, exist_ok=True)
    for f in glob.glob(os.path.join(dstdir, "*.png")):
        os.remove(f)
    # panel bolgeleri (gorsel okumadan): ust ~0.24-0.44, alt ~0.55-0.75
    panels = {"panel0.png": (0.02, 0.235, 0.98, 0.445),
              "panel1.png": (0.02, 0.545, 0.98, 0.755)}
    for fn, (a, b, c, d) in panels.items():
        crop = img.crop((int(W*a), int(H*b), int(W*c), int(H*d)))
        crop.save(os.path.join(dstdir, fn))
    print("  -> fark: 2 panel kopyalandi")

if __name__ == "__main__":
    os.makedirs(ASSETS, exist_ok=True)
    export_standard()
    export_fark()
    print("BITTI")
