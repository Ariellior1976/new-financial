#!/usr/bin/env python3
"""
Cinema-quality slideshow video from challah baking images.
Uses Ken Burns pan/zoom, cross-dissolve transitions, and cinematic color grade.
"""

import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import imageio_ffmpeg
import subprocess
import tempfile
import shutil

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# ─── CONFIG ───────────────────────────────────────────────────────────────────
UPLOAD_DIR = "/root/.claude/uploads/d94ae300-1ebb-4793-a27a-5f6e684d0135"
OUTPUT_FILE = "/home/user/new-financial/challah_cinema.mp4"

# Ordered story: mix → strands → oven → finished → proud baker × 2
IMAGE_ORDER = [
    "c8be53fb-1000300369.jpg",   # 1. dough mixing
    "93c72718-1000300399.jpg",   # 2. rolled strands
    "c391f9be-1000300411.jpg",   # 3. in the oven
    "1a205feb-1000300412.jpg",   # 4. golden challah on tray
    "8dda055e-1000300442.jpg",   # 5. baker closeup A
    "8bd9e6e1-1000300439.jpg",   # 6. baker closeup B
]

W, H = 1920, 1080          # output resolution
FPS  = 30
HOLD_SEC   = 3.5           # seconds each image is "held"
FADE_SEC   = 0.8           # cross-dissolve duration (seconds)
ZOOM_RANGE = (1.0, 1.08)   # subtle Ken Burns zoom

# Ken Burns motion plan: (start_cx, start_cy, end_cx, end_cy) in 0-1 coords
MOTIONS = [
    (0.5,  0.5,  0.55, 0.52),   # mixer – drift right
    (0.5,  0.55, 0.5,  0.45),   # strands – drift up
    (0.52, 0.5,  0.48, 0.5 ),   # oven – drift left
    (0.5,  0.52, 0.5,  0.48),   # challah – subtle up
    (0.48, 0.5,  0.52, 0.5 ),   # baker A – drift right
    (0.5,  0.55, 0.5,  0.5 ),   # baker B – settle
]

# Cinematic colour LUT applied to every frame (lift/gamma/gain)
def color_grade(arr: np.ndarray) -> np.ndarray:
    """Warm, slightly desaturated cinematic look."""
    f = arr.astype(np.float32) / 255.0
    # Lift shadows slightly (teal-shadow trick)
    f[..., 2] = np.clip(f[..., 2] * 0.92 + 0.03, 0, 1)   # blue: lower
    f[..., 0] = np.clip(f[..., 0] * 1.04 + 0.01, 0, 1)   # red: lift warm
    f[..., 1] = np.clip(f[..., 1] * 1.00 + 0.005, 0, 1)  # green: neutral
    # Slight contrast S-curve
    f = np.clip(f * 1.08 - 0.04, 0, 1)
    # Vignette
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W / 2, H / 2
    dist = np.sqrt(((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2)
    vignette = np.clip(1 - dist * 0.35, 0.75, 1)[..., None]
    f = f * vignette
    return (np.clip(f, 0, 1) * 255).astype(np.uint8)


def load_and_fit(path: str) -> np.ndarray:
    """Load image, auto-rotate via EXIF, cover-fit to W×H."""
    img = Image.open(path)
    # EXIF rotation
    try:
        from PIL import ExifTags
        exif = img._getexif()
        if exif:
            for tag, val in exif.items():
                if ExifTags.TAGS.get(tag) == "Orientation":
                    rotations = {3: 180, 6: 270, 8: 90}
                    if val in rotations:
                        img = img.rotate(rotations[val], expand=True)
                    break
    except Exception:
        pass
    img = img.convert("RGB")
    iw, ih = img.size
    scale = max(W / iw, H / ih) * 1.12   # 12 % overscan for Ken Burns
    nw, nh = int(iw * scale), int(ih * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    return np.array(img)


def ken_burns_frame(base: np.ndarray, t: float,
                    sx, sy, ex, ey) -> np.ndarray:
    """
    Produce a single W×H frame from `base` using pan+zoom at time t ∈ [0,1].
    sx,sy = start centre (0-1); ex,ey = end centre (0-1).
    """
    bh, bw = base.shape[:2]
    zoom = ZOOM_RANGE[0] + (ZOOM_RANGE[1] - ZOOM_RANGE[0]) * t
    crop_w = int(W / zoom)
    crop_h = int(H / zoom)

    cx = int((sx + (ex - sx) * t) * bw)
    cy = int((sy + (ey - sy) * t) * bh)

    x0 = np.clip(cx - crop_w // 2, 0, bw - crop_w)
    y0 = np.clip(cy - crop_h // 2, 0, bh - crop_h)

    cropped = base[y0:y0 + crop_h, x0:x0 + crop_w]
    frame_img = Image.fromarray(cropped).resize((W, H), Image.LANCZOS)
    return np.array(frame_img)


def cross_dissolve(a: np.ndarray, b: np.ndarray, alpha: float) -> np.ndarray:
    return (a * (1 - alpha) + b * alpha).astype(np.uint8)


def build_text_overlay(text: str, sub: str = "") -> np.ndarray:
    """Create a transparent RGBA overlay with title text."""
    from PIL import ImageDraw, ImageFont
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Try to load a decent font; fall back to default
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        font_sub   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 38)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub   = font_title

    # Shadow
    draw.text((W // 2 + 3, H - 180 + 3), text, font=font_title,
              fill=(0, 0, 0, 160), anchor="mm")
    draw.text((W // 2, H - 180), text, font=font_title,
              fill=(255, 245, 210, 220), anchor="mm")
    if sub:
        draw.text((W // 2, H - 115), sub, font=font_sub,
                  fill=(220, 210, 180, 180), anchor="mm")
    return np.array(overlay)


CAPTIONS = [
    ("לישת הבצק",    "Morphy Richards Artisan Max"),
    ("גלגול הגדילים","מוכן לקליעה"),
    ("בתנור",        "הזהבה מושלמת"),
    ("יצאה מושלמת", "חלה ביתית"),
    ("מגישים בגאווה","שבת שלום!"),
    ("שבת שלום!",    ""),
]


def blend_overlay(frame_rgb: np.ndarray, overlay_rgba: np.ndarray,
                  alpha_scale: float = 1.0) -> np.ndarray:
    bg = Image.fromarray(frame_rgb).convert("RGBA")
    ov = Image.fromarray(overlay_rgba)
    if alpha_scale < 1.0:
        r, g, b, a = ov.split()
        a = a.point(lambda x: int(x * alpha_scale))
        ov = Image.merge("RGBA", (r, g, b, a))
    combined = Image.alpha_composite(bg, ov)
    return np.array(combined.convert("RGB"))


def make_frames():
    """Generator: yields (frame_np) for every frame of the movie."""
    images = []
    for fname in IMAGE_ORDER:
        path = os.path.join(UPLOAD_DIR, fname)
        print(f"  Loading {fname}...")
        images.append(load_and_fit(path))

    hold_frames = int(HOLD_SEC * FPS)
    fade_frames = int(FADE_SEC * FPS)
    n = len(images)

    for i, base in enumerate(images):
        sx, sy, ex, ey = MOTIONS[i]

        caption_title, caption_sub = CAPTIONS[min(i, len(CAPTIONS) - 1)]
        overlay = build_text_overlay(caption_title, caption_sub)

        for f in range(hold_frames):
            t = f / max(hold_frames - 1, 1)
            frame = ken_burns_frame(base, t, sx, sy, ex, ey)
            frame = color_grade(frame)

            # Caption fade in (first 0.5 s) and fade out (last 0.5 s)
            cap_alpha = min(f / (0.5 * FPS), 1.0, (hold_frames - f) / (0.5 * FPS))
            frame = blend_overlay(frame, overlay, cap_alpha)

            # Cross-dissolve out at end (into next image)
            if i < n - 1 and f >= hold_frames - fade_frames:
                alpha_out = (f - (hold_frames - fade_frames)) / fade_frames
                t_next = 0.0
                next_frame = ken_burns_frame(images[i + 1], t_next,
                                             *MOTIONS[i + 1])
                next_frame = color_grade(next_frame)
                frame = cross_dissolve(frame, next_frame, alpha_out)

            yield frame


def render_video():
    tmp_dir = tempfile.mkdtemp()
    pipe_path = os.path.join(tmp_dir, "frames.raw")
    print(f"Rendering frames (this takes a minute)...")

    hold_frames = int(HOLD_SEC * FPS)
    total = hold_frames * len(IMAGE_ORDER)
    print(f"  Total frames: {total}")

    # Write raw RGB frames to a pipe into ffmpeg
    cmd = [
        FFMPEG, "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}",
        "-r", str(FPS),
        "-i", "pipe:0",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        OUTPUT_FILE,
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.PIPE)

    for idx, frame in enumerate(make_frames()):
        if idx % 60 == 0:
            pct = idx / total * 100
            print(f"  [{pct:5.1f}%] frame {idx}/{total}", flush=True)
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        print("ffmpeg error", file=sys.stderr)
        sys.exit(1)
    shutil.rmtree(tmp_dir)
    print(f"\nDone! Video saved to: {OUTPUT_FILE}")
    size_mb = os.path.getsize(OUTPUT_FILE) / 1024 / 1024
    print(f"File size: {size_mb:.1f} MB")


if __name__ == "__main__":
    render_video()
