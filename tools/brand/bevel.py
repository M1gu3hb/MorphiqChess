"""Biselado procedural para elementos nuevos del logo (estilo metálico, luz arriba-izquierda)."""
import numpy as np, cv2
from PIL import Image

SS = 4  # supersampling

PALETTES = {
    # cara: (arriba, abajo) ; luz/sombra de bisel
    'blue': dict(face_top=(0, 104, 232), face_bot=(0, 50, 150), hi=(170, 226, 255), mid_hi=(40, 150, 255),
                 lo=(1, 14, 40), rim=(2, 8, 22), glow=(20, 110, 255)),
    'silver': dict(face_top=(240, 243, 247), face_bot=(118, 124, 134), hi=(255, 255, 255), mid_hi=(236, 240, 246),
                   lo=(26, 30, 38), rim=(8, 10, 14), glow=(200, 215, 240)),
}

def lerp(a, b, t):
    return a + (b - a) * t

def shade(mask_hi, pal, bevel_px=2.6, rim_px=1.1, vgrad=None, noise=0.0, seed=1):
    """mask_hi: float 0..1 a resolución SS. Devuelve RGBA float (0..255) a resolución SS."""
    h, w = mask_hi.shape
    inside = (mask_hi > 0.5).astype(np.uint8)
    dist = cv2.distanceTransform(inside, cv2.DIST_L2, 5).astype(np.float32) / SS  # px finales
    # altura del bisel
    hgt = np.clip(dist / bevel_px, 0, 1)
    hgt = cv2.GaussianBlur(hgt, (0, 0), 0.6 * SS)
    gy, gx = np.gradient(hgt)
    gx *= SS; gy *= SS  # por px final
    s = (gx + gy) / np.sqrt(2) * bevel_px  # ~ -1..1
    s = np.clip(s * 1.6, -1, 1)
    # cara con degradado vertical
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None] if vgrad is None else vgrad
    ft = np.array(pal['face_top'], np.float32); fb = np.array(pal['face_bot'], np.float32)
    face = lerp(ft[None, None, :], fb[None, None, :], ys[:, :, None] * np.ones((1, w, 1), np.float32))
    if noise > 0:
        rng = np.random.default_rng(seed)
        n = rng.normal(0, 1, (h, w)).astype(np.float32)
        n = cv2.GaussianBlur(n, (0, 0), 1.2 * SS)  # trazos suaves
        n = cv2.GaussianBlur(n, (0, 0), 0.3 * SS)
        face = face + (n * noise)[:, :, None] * 40
    rgb = face.copy()
    hi = np.array(pal['hi'], np.float32); mh = np.array(pal['mid_hi'], np.float32); lo = np.array(pal['lo'], np.float32)
    pos = np.clip(s, 0, 1)[:, :, None]; neg = np.clip(-s, 0, 1)[:, :, None]
    edge_w = (1 - hgt)[:, :, None]  # solo cerca del borde
    rgb = rgb * (1 - pos * edge_w) + (hi * 0.7 + mh * 0.3) * pos * edge_w
    rgb = rgb * (1 - neg * edge_w) + lo * neg * edge_w
    # aro oscuro exterior
    rim = np.array(pal['rim'], np.float32)
    rim_a = np.clip(1 - dist / rim_px, 0, 1)[:, :, None]
    rgb = rgb * (1 - rim_a * 0.85) + rim * rim_a * 0.85
    a = np.clip(mask_hi, 0, 1)
    out = np.concatenate([np.clip(rgb, 0, 255), (a * 255)[:, :, None]], axis=2)
    return out

def downsample(rgba_hi):
    """Reduce SS veces con alfa premultiplicado."""
    h, w = rgba_hi.shape[:2]
    a = rgba_hi[:, :, 3:4] / 255.0
    pre = np.concatenate([rgba_hi[:, :, :3] * a, rgba_hi[:, :, 3:4]], axis=2).astype(np.float32)
    small = cv2.resize(pre, (w // SS, h // SS), interpolation=cv2.INTER_AREA)
    alpha = small[:, :, 3:4]
    rgb = np.where(alpha > 0.5, small[:, :, :3] / np.maximum(alpha / 255.0, 1e-4), 0)
    return np.clip(np.concatenate([rgb, alpha], axis=2), 0, 255).astype(np.uint8)

def tile(w_px, h_px, kind, pad=3, **kw):
    """Cuadrado biselado de w_px x h_px (+ margen transparente `pad`)."""
    W, H = (w_px + 2 * pad) * SS, (h_px + 2 * pad) * SS
    m = np.zeros((H, W), np.float32)
    m[pad * SS:(pad + h_px) * SS, pad * SS:(pad + w_px) * SS] = 1
    return Image.fromarray(downsample(shade(m, PALETTES[kind], **kw)), 'RGBA')
