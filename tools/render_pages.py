"""Her PDF/gorsel sayfasini yuksek cozunurlukte PNG'ye render eder.
Kirpma kalibrasyonu ve asset uretimi bu render'lardan yapilir."""
import pymupdf, os, glob, shutil

SRC = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\dosyalar"
OUT = r"C:\Users\KaderÖzcan\Desktop\ece öğrenme 2\oyun\tools\pages_render"
ZOOM = 2.5  # 595pt -> ~1488px

os.makedirs(OUT, exist_ok=True)

# kisa id -> kaynak dosya adi
def short_id(fname):
    base = os.path.splitext(fname)[0]
    # ilk sayi/anahtar kismini al
    return base

count = 0
for path in sorted(glob.glob(os.path.join(SRC, "*.pdf"))):
    name = os.path.basename(path)
    doc = pymupdf.open(path)
    page = doc[0]
    mat = pymupdf.Matrix(ZOOM, ZOOM)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    out = os.path.join(OUT, os.path.splitext(name)[0] + ".png")
    pix.save(out)
    print(f"{pix.width}x{pix.height}  {name}")
    doc.close()
    count += 1

# jpg/png kaynaklari da kopyala
for path in glob.glob(os.path.join(SRC, "*.jpg")) + glob.glob(os.path.join(SRC, "*.png")):
    name = os.path.basename(path)
    shutil.copy(path, os.path.join(OUT, name))
    print("copied", name)
    count += 1

print("TOPLAM", count)
