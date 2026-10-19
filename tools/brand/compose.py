"""
Compone el logo de MorphiqChess a partir del logo original de Morphiq.

Parte de design/originales/Morphiq_logo_completo.png y:
  1. quita el lema original,
  2. cambia el punto de la «i» por un mini tablero 2x2,
  3. redibuja el cuadrado de la «M» en plata,
  4. agrega la fila inferior: tiras de tablero + la palabra CHESS (Michroma).

Uso (desde la raíz del repositorio):
  npm install --no-save @fontsource/michroma
  pip install -r tools/brand/requirements.txt
  python3 tools/brand/compose.py

Escribe design/morphiqchess-logo-maestro.png (RGBA, tamaño completo) y una vista previa sobre fondo azul noche.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from bevel import *

SRC = ROOT / 'design' / 'originales' / 'Morphiq_logo_completo.png'
FONT = Path(os.environ.get(
    'MICHROMA_FONT',
    ROOT / 'node_modules' / '@fontsource' / 'michroma' / 'files' / 'michroma-latin-400-normal.woff',
))
OUT_MASTER = ROOT / 'design' / 'morphiqchess-logo-maestro.png'
OUT_PREVIEW = ROOT / 'design' / 'morphiqchess-logo-vista-previa.png'

def glow(img, color, radius, strength):
    a = np.array(img)[:, :, 3].astype(np.float32) / 255
    g = cv2.GaussianBlur(a, (0, 0), radius) * strength
    out = np.zeros(a.shape + (4,), np.uint8)
    out[:, :, :3] = color
    out[:, :, 3] = np.clip(g * 255, 0, 255)
    return Image.fromarray(out, 'RGBA')

def text_mask(text, size_px, tracking_px, stroke=0):
    """Máscara (float 0..1) a resolución SS del texto con tracking manual. Devuelve (mask, cap_h, width) en px finales."""
    font = ImageFont.truetype(str(FONT), int(size_px * SS))
    # medir
    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + tracking_px * SS * (len(text) - 1)
    asc, desc = font.getmetrics()
    W = int(total) + 8 * SS; H = int(asc + desc) + 8 * SS
    img = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(img)
    x = 4 * SS
    for ch, w in zip(text, widths):
        d.text((x, 4 * SS), ch, font=font, fill=255, stroke_width=int(stroke * SS), stroke_fill=255)
        x += w + tracking_px * SS
    m = np.array(img).astype(np.float32) / 255
    ys, xs = np.where(m > 0.5)
    m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return m, m.shape[0] / SS, m.shape[1] / SS

def checker_strip(cols, rows, tile_px, gap_px, start_light):
    """Tira de tablero: devuelve imagen RGBA con `rows` filas y `cols` columnas de casillas biseladas."""
    pad = 3
    pitch = tile_px + gap_px
    W = cols * pitch - gap_px + 2 * pad; H = rows * pitch - gap_px + 2 * pad
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            light = ((r + c) % 2 == 0) == start_light
            t = tile(tile_px, tile_px, 'silver' if light else 'blue', pad=pad, bevel_px=2.0, noise=0.18, seed=r * 31 + c)
            out.alpha_composite(t, (c * pitch, r * pitch))
    return out

def build():
    orig = Image.open(SRC).convert('RGBA')
    arr = np.array(orig)
    # RGB basura en zonas transparentes -> 0
    arr[arr[:, :, 3] < 4] = 0
    # 1) quitar el lema original (debajo del wordmark, a la derecha del divisor)
    arr[624:700, 470:1530] = 0
    # 2) quitar el punto de la i (se conserva el aro oscuro superior del tallo en y>=437)
    arr[386:437, 1296:1366] = 0
    # 3) quitar el cuadrado B del monograma (se redibuja en plata)
    arr[338:375, 345:381] = np.where(arr[338:375, 345:381, 3:4] > 0, 0, arr[338:375, 345:381])  # solo si alfa
    img = Image.fromarray(arr, 'RGBA')

    # B en plata (mismo tamaño y posición que el original: x347..378, y340..372)
    b = tile(32, 33, 'silver', pad=3, bevel_px=2.6, noise=0.30, seed=7)
    img.alpha_composite(glow(b, (200, 215, 240), 3, 0.35).crop((0, 0, b.width, b.height)), (347 - 3, 340 - 3))
    img.alpha_composite(b, (347 - 3, 340 - 3))

    # punto de la i como mini-tablero 2x2 (claras = plata, oscuras = azul)
    dot = checker_strip(2, 2, 17, 2, start_light=True)
    dx = 1329 - dot.width // 2; dy = 413 - dot.height // 2
    img.alpha_composite(dot, (dx, dy))

    # 4) fila inferior: tiras de tablero + CHESS
    mask, cap_h, text_w = text_mask('CHESS', 58, 22, stroke=1.5)
    txt = Image.fromarray(downsample(shade(np.pad(mask, (6 * SS, 6 * SS)), PALETTES['silver'], bevel_px=2.2, rim_px=1.0, noise=0.12)), 'RGBA')
    cx = 1000
    ty = 666 - txt.height // 2
    tx = int(cx - txt.width / 2)
    img.alpha_composite(glow(txt, (180, 200, 235), 4, 0.35), (tx, ty))
    img.alpha_composite(txt, (tx, ty))
    # tiras laterales: de x=495 a tx-34 y de tx+w+34 a 1512
    pitch = 24; tile_px = 21
    left_w = tx - 40 - 500
    cols = int((left_w + 3) // pitch)
    strip_l = checker_strip(cols, 2, tile_px, 3, start_light=True)
    right_start = tx + txt.width + 40
    cols_r = cols  # tiras simétricas
    strip_r = checker_strip(cols_r, 2, tile_px, 3, start_light=((cols - 1) % 2 == 0))
    ys = 666 - strip_l.height // 2
    img.alpha_composite(strip_l, (tx - 40 - strip_l.width + 3, ys))
    img.alpha_composite(strip_r, (right_start - 3, ys))
    return img

if __name__ == '__main__':
    img = build()
    img.save(OUT_MASTER)
    bg = Image.new('RGBA', img.size, (5, 10, 20, 255)); bg.alpha_composite(img)
    bg.crop((0, 250, 1536, 740)).convert('RGB').save(OUT_PREVIEW)
    print('ok', img.size, '->', OUT_MASTER.relative_to(ROOT))
