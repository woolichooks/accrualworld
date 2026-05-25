#!/usr/bin/env python3
"""
Render the social-share image (1200x630) at OG dimensions, matching
the in-game title screen. Stays pixel-art crisp by using a 5x pixel
scale and integer coordinates throughout.

Usage:  python3 scripts/render-og.py
Output: public/og.png
"""

from __future__ import annotations
import math
import os
import random
from PIL import Image, ImageDraw

# ---- Palette: COBALT theme, indigo (night) slot (matches the cover) ----
P0 = (4, 8, 26)         # darkest sky
P1 = (14, 26, 58)       # mid
P2 = (58, 74, 138)      # mid-bright
P3 = (160, 184, 224)    # brightest

# ---- 3x5 bitmap font (subset of the in-game font) -----------------------
# Each glyph: 5 rows of 3 bits, bit 2 = leftmost column.
G = {
    'A': [0b010, 0b101, 0b111, 0b101, 0b101],
    'B': [0b110, 0b101, 0b110, 0b101, 0b110],
    'C': [0b011, 0b100, 0b100, 0b100, 0b011],
    'D': [0b110, 0b101, 0b101, 0b101, 0b110],
    'E': [0b111, 0b100, 0b110, 0b100, 0b111],
    'G': [0b011, 0b100, 0b101, 0b101, 0b011],
    'I': [0b111, 0b010, 0b010, 0b010, 0b111],
    'L': [0b100, 0b100, 0b100, 0b100, 0b111],
    'N': [0b101, 0b111, 0b111, 0b111, 0b101],
    'O': [0b010, 0b101, 0b101, 0b101, 0b010],
    'R': [0b110, 0b101, 0b110, 0b101, 0b101],
    'S': [0b011, 0b100, 0b010, 0b001, 0b110],
    'U': [0b101, 0b101, 0b101, 0b101, 0b111],
    'W': [0b101, 0b101, 0b111, 0b111, 0b101],
    '9': [0b010, 0b101, 0b011, 0b001, 0b110],
    ' ': [0, 0, 0, 0, 0],
}
GLYPH_W, GLYPH_H, KERN = 3, 5, 1

def draw_text(draw, text, x, y, color, scale):
    """Draw uppercase pixel text at the given scale. Returns end x."""
    cx = x
    for ch in text.upper():
        g = G.get(ch, G[' '])
        for row in range(GLYPH_H):
            bits = g[row]
            for col in range(GLYPH_W):
                if bits & (1 << (GLYPH_W - 1 - col)):
                    px = cx + col * scale
                    py = y + row * scale
                    draw.rectangle((px, py, px + scale - 1, py + scale - 1), fill=color)
        cx += (GLYPH_W + KERN) * scale
    return cx - KERN * scale

def text_width(text, scale):
    if not text:
        return 0
    return len(text) * (GLYPH_W + KERN) * scale - KERN * scale

# ---- Image setup --------------------------------------------------------
W, H = 1200, 630
img = Image.new('RGB', (W, H), P0)
draw = ImageDraw.Draw(img)

# Seeded star pattern so the OG image is stable across renders.
rng = random.Random(0xACC9)
for _ in range(220):
    sx = rng.randint(0, W - 1)
    sy = rng.randint(0, H - 220)
    bright = rng.random()
    color = P3 if bright > 0.85 else (P2 if bright > 0.5 else P1)
    size = 4 if bright > 0.92 else 2
    draw.rectangle((sx, sy, sx + size, sy + size), fill=color)

# ---- Horizon (jagged hills) --------------------------------------------
HORIZON_Y = H - 140
draw.rectangle((0, HORIZON_Y, W, H), fill=P1)
# Jagged crest of hills above the flat horizon.
for x in range(W):
    h = int(
        32
        + 16 * math.sin(x * 0.012)
        + 12 * math.sin(x * 0.037 + 1.3)
    )
    h = max(2, h)
    draw.rectangle((x, HORIZON_Y - h, x + 1, HORIZON_Y), fill=P0)

# ---- Biodome silhouette to the right ------------------------------------
DOME_X, DOME_Y = 820, HORIZON_Y - 36
# Stepped dome: 3 horizontal bands narrowing toward the top.
def band(x, y, w, h):
    draw.rectangle((x, y, x + w, y + h), fill=P2)
band(DOME_X,       DOME_Y + 28, 112, 28)
band(DOME_X + 18,  DOME_Y + 14, 76, 16)
band(DOME_X + 34,  DOME_Y,      44, 14)
# Tiny power LED on the dome
draw.rectangle((DOME_X + 52, DOME_Y - 4, DOME_X + 60, DOME_Y), fill=P3)

# ---- Title block -------------------------------------------------------
TITLE_SCALE = 10
SUB_SCALE = 6
title = 'ACCRUALWORLD'
sub = 'A LEDGER ON SOIL 9'

title_w = text_width(title, TITLE_SCALE)
sub_w = text_width(sub, SUB_SCALE)
title_x = (W - title_w) // 2
sub_x = (W - sub_w) // 2
title_y = 140
sub_y = title_y + GLYPH_H * TITLE_SCALE + 40

draw_text(draw, title, title_x, title_y, P3, TITLE_SCALE)
draw_text(draw, sub, sub_x, sub_y, P2, SUB_SCALE)

# ---- Output ------------------------------------------------------------
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'og.png')
out = os.path.abspath(out)
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out, 'PNG', optimize=True)
print(f'wrote {out}  ({W}x{H})')
