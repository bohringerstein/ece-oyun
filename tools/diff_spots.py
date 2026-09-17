"""Iki uzay panelini karsilastirip en belirgin 5 farkin merkezini bulur.
Cikti: levels.ts icine yapistirilacak normalize (0..1) koordinatlar."""
import numpy as np
from PIL import Image
from scipy import ndimage
import json, os

A = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\public\assets\fark\panel0.png"
B = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\public\assets\fark\panel1.png"

a = Image.open(A).convert("RGB")
b = Image.open(B).convert("RGB").resize(a.size)
W, H = a.size
aa = np.asarray(a).astype(int)
bb = np.asarray(b).astype(int)
diff = np.abs(aa - bb).sum(axis=2)
mask = diff > 60
mask = ndimage.binary_dilation(mask, iterations=6)
lbl, n = ndimage.label(mask)

blobs = []
for i in range(1, n + 1):
    ys, xs = np.where(lbl == i)
    if len(xs) < (W * H) * 0.0015:
        continue
    cx, cy = xs.mean() / W, ys.mean() / H
    blobs.append((len(xs), round(float(cx), 3), round(float(cy), 3)))

blobs.sort(reverse=True)
top = blobs[:5]
diffs = [{"x": cx, "y": cy} for _, cx, cy in top]
print("bulunan blob:", len(blobs), "-> secilen:", len(diffs))
print(json.dumps(diffs, ensure_ascii=False))
