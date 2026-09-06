from PIL import Image, ImageDraw
import os

CAP = "/app/frontend/assets"
KIT = "/app/frontend/android-icon-kit/res"
BG_COLOR = (11, 16, 38)  # #0b1026 adaptive background

fg_master = Image.open(os.path.join(CAP, "icon-foreground.png")).convert("RGBA")   # transparent emblem, centred ~62%
bg_master = Image.open(os.path.join(CAP, "icon-background.png")).convert("RGBA")    # dark cyber tile

# opaque legacy icon master = emblem over bg tile (emblem a touch bigger for legacy)
legacy_master = bg_master.resize((1024, 1024), Image.LANCZOS).copy()
# scale foreground emblem to ~72% for legacy square
emb = fg_master
ratio = emb.width / emb.height
nw = int(1024 * 0.78); nh = int(nw / ratio)
legacy_master.alpha_composite(emb.resize((nw, nh), Image.LANCZOS), ((1024 - nw)//2, (1024 - nh)//2))

def circ(img):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, img.size[0]-1, img.size[1]-1], fill=255)
    out = img.convert("RGBA")
    out.putalpha(m)
    return out

legacy_px = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
fg_px     = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

for dens, px in legacy_px.items():
    d = os.path.join(KIT, f"mipmap-{dens}")
    os.makedirs(d, exist_ok=True)
    sq = legacy_master.resize((px, px), Image.LANCZOS)
    sq.convert("RGB").save(os.path.join(d, "ic_launcher.png"))          # square legacy
    circ(sq).save(os.path.join(d, "ic_launcher_round.png"))            # round legacy
    # adaptive foreground (transparent emblem on 108dp canvas)
    fpx = fg_px[dens]
    canvas = Image.new("RGBA", (fpx, fpx), (0, 0, 0, 0))
    e = fg_master.resize((fpx, fpx), Image.LANCZOS)
    canvas.alpha_composite(e)
    canvas.save(os.path.join(d, "ic_launcher_foreground.png"))

# adaptive-icon xml + background color
anydpi = os.path.join(KIT, "mipmap-anydpi-v26"); os.makedirs(anydpi, exist_ok=True)
adaptive_xml = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '    <background android:drawable="@color/ic_launcher_background"/>\n'
    '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
    '</adaptive-icon>\n'
)
open(os.path.join(anydpi, "ic_launcher.xml"), "w").write(adaptive_xml)
open(os.path.join(anydpi, "ic_launcher_round.xml"), "w").write(adaptive_xml)

values = os.path.join(KIT, "values"); os.makedirs(values, exist_ok=True)
open(os.path.join(values, "ic_launcher_background.xml"), "w").write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    f'    <color name="ic_launcher_background">#{BG_COLOR[0]:02X}{BG_COLOR[1]:02X}{BG_COLOR[2]:02X}</color>\n'
    '</resources>\n'
)

# Play Store 512 (already in store_assets) + a hi-res 1024 legacy here for reference
os.makedirs(os.path.join(KIT, ".."), exist_ok=True)
legacy_master.convert("RGB").resize((512, 512), Image.LANCZOS).save("/app/frontend/android-icon-kit/playstore-icon-512.png")

print("ANDROID ICON KIT DONE")
for root, _, files in os.walk("/app/frontend/android-icon-kit"):
    for f in sorted(files):
        print(os.path.relpath(os.path.join(root, f), "/app/frontend/android-icon-kit"))
