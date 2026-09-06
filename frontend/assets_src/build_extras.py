from PIL import Image, ImageDraw, ImageFont, ImageOps
import os

SRC = "/app/frontend/assets_src"
STORE = "/app/store_assets"
SCR = os.path.join(STORE, "screenshots")
BG = (2, 8, 20)
CYAN = (75, 243, 255)

def font(sz):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

logo = Image.open(os.path.join(STORE, "logo_wordmark_transparent.png")).convert("RGBA")

# ---- 1. Feature graphic with tagline ----
feat = Image.open(os.path.join(SRC, "feature.jpg")).convert("RGBA")
tr = 1024 / 500
w, h = feat.size
ch = int(w / tr)
top = max(0, (h - ch)//2 - 20)
fg = feat.crop((0, top, w, top+ch)).resize((1024, 500), Image.LANCZOS)
# subtle dark scrim on the left for legibility
scrim = Image.new("RGBA", (1024, 500), (0,0,0,0))
ImageDraw.Draw(scrim).rectangle([0,0,560,500], fill=(2,8,20,120))
fg.alpha_composite(scrim)
lw = 470; lh = int(lw * logo.height / logo.width)
fg.alpha_composite(logo.resize((lw, lh), Image.LANCZOS), (40, 90))
d = ImageDraw.Draw(fg)
d.text((52, 90+lh+6), "THINK FIRST, THEN SHIFT", font=font(40), fill=(230,245,255,255))
d.text((54, 90+lh+58), "42 puzzle levels \u2022 7 neon worlds", font=font(26), fill=(150,190,235,255))
fg.convert("RGB").save(os.path.join(STORE, "feature_graphic_1024x500.png"))

# ---- 2. Adaptive icon preview (circle + squircle) ----
icon = Image.open(os.path.join(STORE, "app_icon_1024.png")).convert("RGBA")
# circle
cm = Image.new("L", icon.size, 0)
ImageDraw.Draw(cm).ellipse([0,0,1023,1023], fill=255)
circ = icon.copy(); circ.putalpha(cm); circ.save(os.path.join(STORE, "icon_preview_circle.png"))
# squircle (rounded rect ~24% radius)
sm = Image.new("L", icon.size, 0)
ImageDraw.Draw(sm).rounded_rectangle([0,0,1023,1023], radius=246, fill=255)
sq = icon.copy(); sq.putalpha(sm); sq.save(os.path.join(STORE, "icon_preview_squircle.png"))

# ---- 3. Promo GIF slideshow ----
frames = []
order = ["phone_01_title.png","phone_02.png","phone_03.png","phone_04.png","phone_05.png"]
GW, GH = 900, 506
for i, name in enumerate(order):
    p = os.path.join(SCR, name)
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB").resize((GW, GH), Image.LANCZOS)
    # hold ~1.1s each -> 6 frames of 180ms; add a gentle zoom
    for z in range(6):
        s = 1.0 + z * 0.012
        nw, nh = int(GW*s), int(GH*s)
        zi = im.resize((nw, nh), Image.LANCZOS)
        crop = zi.crop(((nw-GW)//2, (nh-GH)//2, (nw-GW)//2+GW, (nh-GH)//2+GH))
        frames.append(crop)
if frames:
    frames[0].save(os.path.join(STORE, "promo.gif"), save_all=True, append_images=frames[1:],
                   duration=180, loop=0, optimize=True)

print("EXTRAS DONE")
for f in ["feature_graphic_1024x500.png","icon_preview_circle.png","icon_preview_squircle.png","promo.gif"]:
    print(f, os.path.getsize(os.path.join(STORE, f)))
