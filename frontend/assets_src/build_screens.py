from PIL import Image, ImageDraw, ImageFont
import os

SRC = "/app/frontend/assets_src"
STORE = "/app/store_assets"
SCR = os.path.join(STORE, "screenshots")
os.makedirs(SCR, exist_ok=True)
BG = (2, 8, 20)
ACCENT = (75, 243, 255)

def font(sz):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

logo = Image.open(os.path.join(STORE, "logo_wordmark_transparent.png")).convert("RGBA")

def glow_bg(W, H):
    canvas = Image.new("RGBA", (W, H), BG + (255,))
    for (ox, oy, r, col) in [(int(W*0.16), int(H*0.22), int(W*0.24), (75,243,255,30)),
                             (int(W*0.84), int(H*0.8), int(W*0.26), (255,61,240,26))]:
        glow = Image.new("RGBA", (W, H), (0,0,0,0))
        ImageDraw.Draw(glow).ellipse([ox-r, oy-r, ox+r, oy+r], fill=col)
        canvas.alpha_composite(glow)
    return canvas

def compose(raw_path, caption, W, H, logo_scale=0.22, cap_sz=None):
    canvas = glow_bg(W, H)
    raw = Image.open(raw_path).convert("RGBA")
    margin_x = int(W * 0.045)
    top = int(H * 0.15); bottom = int(H * 0.11)
    fw = W - margin_x * 2; fh = H - top - bottom
    rr = raw.resize((fw, int(fw * raw.height / raw.width)), Image.LANCZOS)
    if rr.height > fh:
        rr = raw.resize((int(fh * raw.width / raw.height), fh), Image.LANCZOS)
    fx = (W - rr.width)//2; fy = top + (fh - rr.height)//2
    canvas.alpha_composite(rr, (fx, fy))
    bd = Image.new("RGBA", (W, H), (0,0,0,0))
    ImageDraw.Draw(bd).rounded_rectangle([fx-6, fy-6, fx+rr.width+6, fy+rr.height+6], radius=18, outline=ACCENT+(190,), width=5)
    canvas.alpha_composite(bd)
    f = font(cap_sz or int(H*0.045))
    d = ImageDraw.Draw(canvas)
    tw = d.textlength(caption, font=f)
    d.text(((W-tw)//2, int(H*0.05)), caption, font=f, fill=(235,245,255,255))
    lw = int(W*logo_scale); lh = int(lw * logo.height / logo.width)
    canvas.alpha_composite(logo.resize((lw, lh), Image.LANCZOS), ((W-lw)//2, H - bottom - int(lh*0.15)))
    return canvas.convert("RGB")

def title_card(W, H):
    canvas = glow_bg(W, H)
    lw = int(W*0.44); lh = int(lw * logo.height / logo.width)
    canvas.alpha_composite(logo.resize((lw, lh), Image.LANCZOS), ((W-lw)//2, int(H*0.16)))
    d = ImageDraw.Draw(canvas)
    for txt, y, sz, col in [("NOTHING IS WHAT IT LOOKS LIKE", 0.60, 0.042, (180,220,255,255)),
                            ("42 handcrafted puzzle levels  \u2022  7 worlds", 0.69, 0.034, (120,160,210,255))]:
        f = font(int(H*sz)); tw = d.textlength(txt, font=f)
        d.text(((W-tw)//2, int(H*y)), txt, font=f, fill=col)
    return canvas.convert("RGB")

shots = [
    (SRC+"/gp_lasers.jpg",   "TIME THE LASER GATES"),
    (SRC+"/gp_gravity.jpg",  "FLIP GRAVITY TO SURVIVE"),
    (SRC+"/gp_steam.jpg",    "READ THE STEAM-JET RHYTHM"),
    (SRC+"/gp_firewall.jpg", "DODGE THE FIREWALL SWEEPS"),
]

# Phone 1920x1080
title_card(1920, 1080).save(os.path.join(SCR, "phone_01_title.png"))
for i, (raw, cap) in enumerate(shots, 2):
    compose(raw, cap, 1920, 1080, logo_scale=0.20, cap_sz=54).save(os.path.join(SCR, f"phone_{i:02d}.png"))

# Tablet 7-inch 2048x1200
title_card(2048, 1200).save(os.path.join(SCR, "tablet7_01_title.png"))
for i, (raw, cap) in enumerate(shots[:3], 2):
    compose(raw, cap, 2048, 1200, logo_scale=0.20, cap_sz=58).save(os.path.join(SCR, f"tablet7_{i:02d}.png"))

# Tablet 10-inch 2560x1600
title_card(2560, 1600).save(os.path.join(SCR, "tablet10_01_title.png"))
for i, (raw, cap) in enumerate(shots[:3], 2):
    compose(raw, cap, 2560, 1600, logo_scale=0.18, cap_sz=66).save(os.path.join(SCR, f"tablet10_{i:02d}.png"))

print("DONE")
for f in sorted(os.listdir(SCR)):
    print(f, Image.open(os.path.join(SCR, f)).size)
