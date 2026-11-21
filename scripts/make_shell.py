"""Run: python3 scripts/make_shell.py src/assets/shell.svg

Generates src/assets/shell.svg: a navy glitter egg handheld modelled on the
user's Tamagotchi photo (gold starburst bezel, moon, stars, shooting-star
streaks, ball chain). Coordinates are in a 800x1040 viewBox; App.css positions
the screen/buttons with the same numbers as percentages."""
import math, random, sys

random.seed(6101)
W, H = 800, 1040
EGG = "M400 100 C 612 100 768 305 776 600 C 784 850 640 1012 400 1012 C 160 1012 16 850 24 600 C 32 305 188 100 400 100 Z"
# Screen window (keep in sync with .screen in App.css)
SX, SY, SW, SH = 200, 400, 400, 390

def star(cx, cy, r, rot=-90):
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.45
        a = math.radians(rot + i * 36)
        pts.append(f"{cx + rr*math.cos(a):.1f},{cy + rr*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="url(#gold)"/>'

def streaks(x, y, n=4, length=70, gap=14, angle=-35):
    a = math.radians(angle)
    dx, dy = math.cos(a) * length, math.sin(a) * length
    px, py = -math.sin(a) * gap, math.cos(a) * gap
    out = []
    for i in range(n):
        sx, sy = x + px * i, y + py * i
        l = 1 - 0.18 * (i % 2)
        out.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{sx+dx*l:.1f}" y2="{sy+dy*l:.1f}"/>')
    return f'<g stroke="#d8b35c" stroke-width="5" stroke-linecap="round">{"".join(out)}</g>'

def in_egg(x, y):
    # Ellipse approximation of the egg, good enough for scattering glitter.
    cy = 590 if y > 590 else 590
    ry = 490 if y < 590 else 422
    rx = 376 * (0.82 + 0.18 * min(1, max(0, (y - 100) / 490))) if y < 590 else 376
    return ((x - 400) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1

def in_bezel(x, y):
    return SX - 70 < x < SX + SW + 70 and SY - 70 < y < SY + SH + 70

glitter = []
while len(glitter) < 520:
    x, y = random.uniform(20, 780), random.uniform(100, 1010)
    if not in_egg(x, y) or in_bezel(x, y):
        continue
    c = random.choices(["#f6d77e", "#ffffff", "#8fe0ff", "#ffb6f0"], [6, 3, 2, 1])[0]
    r = random.choice([0.9, 1.2, 1.5, 2.0, 2.6])
    glitter.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{c}" opacity="{random.uniform(.45, 1):.2f}"/>')

# Gold "dust" dots, bigger and fewer, like the printed dots on the shell.
dots = []
while len(dots) < 46:
    x, y = random.uniform(40, 760), random.uniform(160, 990)
    if in_egg(x, y) and not in_bezel(x, y) and not (240 < y < 350 and 150 < x < 650) and not (880 < y and 240 < x < 560):
        dots.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.choice([3, 4, 5])}" fill="#d8b35c"/>')

# Starburst bezel: corners pushed out, with spiky points along each edge.
def bezel_points():
    o = 32
    x0, y0, x1, y1 = SX - o, SY - o, SX + SW + o, SY + SH + o
    top = [(x0, y0), (x0 + 70, y0 - 22), (x0 + 150, y0 + 4), (400, y0 - 34), (x1 - 150, y0 + 4), (x1 - 70, y0 - 22)]
    right = [(x1, y0), (x1 + 30, y0 + 90), (x1 + 8, y0 + 170), (x1 + 46, 595), (x1 + 8, y1 - 170), (x1 + 30, y1 - 90)]
    bottom = [(x1, y1), (x1 - 70, y1 + 24), (x1 - 150, y1 - 2), (400, y1 + 36), (x0 + 150, y1 - 2), (x0 + 70, y1 + 24)]
    left = [(x0, y1), (x0 - 30, y1 - 90), (x0 - 8, y1 - 170), (x0 - 46, 595), (x0 - 8, y0 + 170), (x0 - 30, y0 + 90)]
    return " ".join(f"{x},{y}" for x, y in top + right + bottom + left)

chain = []
for side in (-1, 1):
    for i in range(9):
        x = 400 + side * (16 + i * 21)
        y = 66 - i * 9 - (i * i) * 0.4
        chain.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9.5" fill="url(#chrome)"/>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
<defs>
  <radialGradient id="body" cx="38%" cy="30%" r="80%">
    <stop offset="0" stop-color="#3a6bdc"/><stop offset=".45" stop-color="#1f3fae"/>
    <stop offset=".85" stop-color="#132a80"/><stop offset="1" stop-color="#0b1a5c"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f1d58b"/><stop offset=".5" stop-color="#c9a24c"/><stop offset="1" stop-color="#9c7a30"/>
  </linearGradient>
  <radialGradient id="chrome" cx="35%" cy="30%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b9bec6"/><stop offset="1" stop-color="#5f656e"/>
  </radialGradient>
  <radialGradient id="rim" cx="50%" cy="50%" r="50%">
    <stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050c35" stop-opacity=".55"/>
  </radialGradient>
  <clipPath id="egg"><path d="{EGG}"/></clipPath>
</defs>
{"".join(chain)}
<ellipse cx="400" cy="78" rx="20" ry="26" fill="none" stroke="url(#chrome)" stroke-width="9"/>
<rect x="378" y="88" width="44" height="26" rx="12" fill="#1d3a9e"/>
<path d="{EGG}" fill="url(#body)"/>
<g clip-path="url(#egg)">
  <path d="{EGG}" fill="url(#rim)"/>
  <path d="M60 620 C 150 600 240 660 300 700 L 300 760 C 220 720 140 680 40 690 Z" fill="#5d8cff" opacity=".18"/>
  <path d="M520 860 C 600 830 690 760 760 700 L 770 780 C 700 840 620 900 540 920 Z" fill="#5d8cff" opacity=".16"/>
  {"".join(glitter)}
  {"".join(dots)}
  <ellipse cx="250" cy="215" rx="150" ry="70" transform="rotate(-28 250 215)" fill="#fff" opacity=".13"/>
  <ellipse cx="205" cy="200" rx="58" ry="16" transform="rotate(-32 205 200)" fill="#fff" opacity=".35"/>
</g>
{streaks(96, 380, n=4, length=56, gap=13, angle=-28)}
{streaks(660, 420, n=3, length=60, gap=14, angle=-38)}
{streaks(690, 680, n=3, length=58, gap=14, angle=-38)}
{streaks(70, 860, n=4, length=64, gap=14, angle=-38)}
{streaks(585, 985, n=3, length=60, gap=13, angle=-38)}
{star(170, 268, 18)}
{star(712, 590, 20, -70)}
{star(105, 900, 26, -100)}
{star(150, 960, 14)}
{star(650, 905, 30, -80)}
<mask id="moon"><circle cx="92" cy="585" r="56" fill="#fff"/><circle cx="118" cy="568" r="48" fill="#000"/></mask><circle cx="92" cy="585" r="56" fill="url(#gold)" mask="url(#moon)"/>
<polygon points="{bezel_points()}" fill="url(#gold)" stroke="#8a6a24" stroke-width="3" stroke-linejoin="round"/>
<rect x="{SX-12}" y="{SY-12}" width="{SW+24}" height="{SH+24}" rx="18" fill="#2a2d22"/>
<path d="{EGG}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
</svg>'''
open(sys.argv[1], "w").write(svg)
print(len(svg), "bytes")
