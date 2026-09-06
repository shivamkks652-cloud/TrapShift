from PIL import Image, ImageFilter
import os

SRC = "/app/frontend/assets_src"
STORE = "/app/store_assets"
CAP = "/app/frontend/assets"          # @capacitor/assets input folder
os.makedirs(STORE, exist_ok=True)
os.makedirs(CAP, exist_ok=True)

BG = (2, 8, 20)  # #020814

def load(name):
    return Image.open(os.path.join(SRC, name)).convert("RGB")

def key_dark_to_alpha(img, lo=22, hi=90):
    """Neon-on-dark -> RGBA: dark bg becomes transparent, bright strokes opaque, glow soft."""
    img = img.convert("RGB")
    gray = img.convert("L")
    px = gray.load()
    a = Image.new("L", img.size, 0)
    ap = a.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            g = px[x, y]
            if g <= lo:
                ap[x, y] = 0
            elif g >= hi:
                ap[x, y] = 255
            else:
                ap[x, y] = int((g - lo) / (hi - lo) * 255)
    out = img.convert("RGBA")
    out.putalpha(a)
    return out

def paste_center(canvas, img, scale_w):
    w, h = canvas.size
    ratio = img.width / img.height
    nw = int(w * scale_w)
    nh = int(nw / ratio)
    im = img.resize((nw, nh), Image.LANCZOS)
    canvas.alpha_composite(im, ((w - nw) // 2, (h - nh) // 2))

# ---------- source pieces ----------
icon_fg_raw = load("icon_fg.jpg")
icon_bg = load("icon_bg.jpg")
logo_t = key_dark_to_alpha(load("logo.jpg"), lo=26, hi=100)
feature = load("feature.jpg")
splash_art = load("splash.jpg")

# transparent emblem (for adaptive foreground / overlays) — high threshold so only
# the bright neon strokes+glow survive and the jpeg's dark haze is cut cleanly.
emblem = key_dark_to_alpha(icon_fg_raw, lo=52, hi=140)
# radial mask: keep the centred emblem+glow, zero out stray edge/corner haze.
import math
from PIL import ImageChops
_mw, _mh = emblem.size
_mask = Image.new("L", emblem.size, 0)
_mp = _mask.load()
_cx, _cy = _mw / 2, _mh / 2
_full, _fade = 0.42 * _mw, 0.56 * _mw
for _y in range(_mh):
    for _x in range(_mw):
        _d = math.hypot(_x - _cx, _y - _cy)
        if _d <= _full:
            _mp[_x, _y] = 255
        elif _d >= _fade:
            _mp[_x, _y] = 0
        else:
            _mp[_x, _y] = int((_fade - _d) / (_fade - _full) * 255)
emblem.putalpha(ImageChops.multiply(emblem.split()[3], _mask))
emblem.save(os.path.join(STORE, "logo_emblem_transparent.png"))
logo_t.save(os.path.join(STORE, "logo_wordmark_transparent.png"))

# ---------- @capacitor/assets inputs ----------
# icon-background (1024 opaque)
icon_bg.resize((1024, 1024), Image.LANCZOS).convert("RGB").save(os.path.join(CAP, "icon-background.png"))
# icon-foreground (1024 transparent, emblem centred in adaptive safe zone ~62%)
fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
paste_center(fg, emblem, 0.62)
fg.save(os.path.join(CAP, "icon-foreground.png"))
# icon.png (opaque legacy = emblem over bg)
legacy = icon_bg.resize((1024, 1024), Image.LANCZOS).convert("RGBA")
paste_center(legacy, emblem, 0.70)
legacy.convert("RGB").save(os.path.join(CAP, "icon.png"))
legacy.convert("RGB").save(os.path.join(CAP, "icon-only.png"))

# splash 2732 square (logo centred on dark bg) + dark variant
def build_splash():
    c = Image.new("RGBA", (2732, 2732), BG + (255,))
    # subtle glow bg from icon_bg
    glow = icon_bg.resize((2732, 2732), Image.LANCZOS).convert("RGBA")
    glow.putalpha(90)
    c.alpha_composite(glow)
    paste_center(c, logo_t, 0.58)
    return c.convert("RGB")
sp = build_splash()
sp.save(os.path.join(CAP, "splash.png"))
sp.save(os.path.join(CAP, "splash-dark.png"))

# ---------- Play Store deliverables ----------
# 512 store icon (opaque)
legacy.convert("RGB").resize((512, 512), Image.LANCZOS).save(os.path.join(STORE, "app_icon_512.png"))
# 1024 hi-res icon
legacy.convert("RGB").save(os.path.join(STORE, "app_icon_1024.png"))

# feature graphic 1024x500 (crop key art + logo top-left)
target_ratio = 1024 / 500
w, h = feature.size
crop_h = int(w / target_ratio)
top = max(0, (h - crop_h) // 2 - 20)
fg_crop = feature.crop((0, top, w, top + crop_h)).resize((1024, 500), Image.LANCZOS).convert("RGBA")
# darken left area a touch for logo legibility
overlay = Image.new("RGBA", (1024, 500), (0, 0, 0, 0))
paste = logo_t.resize((int(500 * (logo_t.width / logo_t.height) * 0.72), int(500 * 0.72)), Image.LANCZOS) if False else None
lw = int(520)
lh = int(lw / (logo_t.width / logo_t.height))
logo_small = logo_t.resize((lw, lh), Image.LANCZOS)
fg_crop.alpha_composite(logo_small, (40, (500 - lh) // 2))
fg_crop.convert("RGB").save(os.path.join(STORE, "feature_graphic_1024x500.png"))

# splash preview (portrait art with logo) for store/marketing
prev = Image.new("RGBA", (1080, 1920), BG + (255,))
art = splash_art.resize((1080, int(1080 * splash_art.height / splash_art.width)), Image.LANCZOS).convert("RGBA")
prev.alpha_composite(art, (0, (1920 - art.height) // 2))
paste_center(prev, logo_t, 0.72)
prev.convert("RGB").save(os.path.join(STORE, "splash_preview_1080x1920.png"))

print("STATIC ASSETS DONE")
for f in sorted(os.listdir(STORE)):
    print("STORE", f, Image.open(os.path.join(STORE, f)).size)
for f in sorted(os.listdir(CAP)):
    print("CAP  ", f, Image.open(os.path.join(CAP, f)).size)
