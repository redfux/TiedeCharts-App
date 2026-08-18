#!/usr/bin/env python3
"""Generate the PWA icon set without external dependencies.

thought up by human, coded by ai

Pillow is deliberately not used: the project must stay buildless and free of
package management. The icons are drawn analytically (gradient background plus
three antialiased wave strokes) and written as raw PNG via zlib.

Usage: python3 scripts/make_icons.py
"""

import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")

# Deep water gradient and wave colour, matching the design tokens.
TOP = (0, 43, 66)
BOTTOM = (0, 101, 143)
WAVE = (188, 227, 245)


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def rounded_alpha(x, y, size, radius):
    """Coverage of a rounded square, antialiased at the corners."""
    cx = min(max(x, radius), size - radius)
    cy = min(max(y, radius), size - radius)
    dx, dy = x - cx, y - cy
    if dx == 0 and dy == 0:
        return 1.0
    d = math.hypot(dx, dy)
    return max(0.0, min(1.0, radius - d + 0.5))


def wave_alpha(x, y, size, art_scale):
    """Coverage of three sine strokes centred in the icon."""
    art = size * art_scale
    origin = (size - art) / 2.0
    u = (x - origin) / art
    v = (y - origin) / art
    if u < -0.05 or u > 1.05:
        return 0.0

    amplitude = 0.075
    wavelength = 0.62
    stroke = 0.085
    best = 0.0
    for index, baseline in enumerate((0.24, 0.5, 0.76)):
        phase = index * 0.55
        curve = baseline + amplitude * math.sin(2 * math.pi * u / wavelength + phase)
        slope = (2 * math.pi / wavelength) * amplitude * math.cos(2 * math.pi * u / wavelength + phase)
        # Perpendicular distance from the vertical distance.
        distance = abs(v - curve) / math.hypot(1.0, slope)
        edge = (distance - stroke / 2) * art
        best = max(best, max(0.0, min(1.0, 1.0 - edge)))
    return best


def render(size, maskable):
    """Return RGBA rows for one icon."""
    radius = 0.0 if maskable else size * 0.22
    art_scale = 0.56 if maskable else 0.78
    rows = []
    for y in range(size):
        row = bytearray()
        gradient = lerp(TOP, BOTTOM, y / max(1, size - 1))
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            bg_alpha = 1.0 if maskable else rounded_alpha(px, py, size, radius)
            if bg_alpha <= 0.0:
                row += b"\x00\x00\x00\x00"
                continue
            w = wave_alpha(px, py, size, art_scale)
            colour = lerp(gradient, WAVE, w)
            row += bytes((colour[0], colour[1], colour[2], round(bg_alpha * 255)))
        rows.append(bytes(row))
    return rows


def write_png(path, size, rows):
    """Write 8 bit RGBA PNG with filter type 0."""
    raw = b"".join(b"\x00" + row for row in rows)

    def chunk(tag, data):
        payload = tag + data
        return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as handle:
        handle.write(png)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-180.png", 180, False),
        ("icon-maskable-512.png", 512, True),
    ]
    for name, size, maskable in targets:
        path = os.path.join(OUT_DIR, name)
        write_png(path, size, render(size, maskable))
        print(f"{name}: {os.path.getsize(path)} Bytes")


if __name__ == "__main__":
    main()
