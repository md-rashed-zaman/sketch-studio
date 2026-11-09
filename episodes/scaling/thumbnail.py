"""Writes the scaling thumbnails as HTML in Day Paper: "1K -> 1M USERS, STEP BY STEP", a staircase the system climbs.
thumbnail.html (main): the system grows on each step (1 server; load balancer, 2 servers, database; the full map).
thumbnail-test-b.html (Test & compare): one new piece per step (database, bigger server, load balancer, cache, replicas).
Render each at 1920x1080, then scale to out/*.png (1280x720)."""
from pathlib import Path

# Day Paper tokens (design/tokens.json, themes.day)
CANVAS, RAISED, GRID, INK, GRAPHITE = '#F5F0E6', '#FFFDF9', '#DED5C5', '#1F1B16', '#958C7F'
COBALT, PEN_TEXT = '#2E5FE6', '#A85A00'
PEN = '#F08C00'

# Lucide icons (outline), 24x24 viewBox
USERS = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
SERVER = '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01M6 18h.01"/>'
DB = '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>'
CACHE = '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'
LB = '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>'


def icon(paths, size, color, stroke=1.6):
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>'


def page(body):
    return f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@600;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>html,body{{margin:0}} .st{{position:relative;width:1920px;height:1080px;overflow:hidden;background:{CANVAS};
background-image:radial-gradient({GRID} 2.4px,transparent 2.6px);background-size:48px 48px;background-position:24px 24px}}
.a{{position:absolute}} .hl{{font:700 172px/.92 "Space Grotesk";letter-spacing:-6px;color:{INK};white-space:nowrap}}
.chip{{border-radius:999px;font:800 50px Inter;white-space:nowrap;padding:2px 24px}}
.lab{{font:600 58px Inter;color:{INK};text-align:center}}</style></head><body><div class="st">{body}</div></body></html>'''


HEADLINE = f'<div class="a hl" style="left:80px;top:40px">1K → 1M USERS<br><span style="color:{COBALT}">STEP BY STEP</span></div>'


def note(x, y):
    return f'<div class="a" style="left:{x}px;top:{y}px;font:700 92px Caveat;color:{PEN_TEXT};transform:rotate(-4deg);white-space:nowrap">only when it breaks</div>'


def svg(inner):
    return f'<svg class="a" style="left:0;top:0" width="1920" height="1080">{inner}</svg>'


def at(x, y, s, paths, col=INK, w=1.7):
    return f'<div class="a" style="left:{x}px;top:{y}px">{icon(paths, s, col, w)}</div>'


def server(x, y, w, h, col=INK, s=None):
    tint = f'color-mix(in srgb, {col} 12%, {RAISED})' if col != INK else RAISED
    return (f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;box-sizing:border-box;border:5px solid {col};border-radius:16px;'
            f'background:{tint};display:flex;align-items:center;justify-content:center">{icon(SERVER, s or int(h * 0.62), col, 1.8)}</div>')


def line(pts, col=COBALT, w=7, dash=True):
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in pts)
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" {"stroke-dasharray=\"3 18\"" if dash else ""} stroke-linecap="round" stroke-linejoin="round"/>'


def chip(cx, y, text, strong=False):
    style = f'background:{COBALT};border:4px solid {COBALT};color:#fff' if strong else f'background:{RAISED};border:4px solid {GRAPHITE};color:{INK}'
    return f'<div class="a" style="left:{cx - 200}px;top:{y}px;width:400px;display:flex;justify-content:center"><div class="chip" style="{style}">{text}</div></div>'


def growing_map():
    """Three treads, each holding the system at that size; the last one, the full map, in cobalt."""
    t1, t2, t3 = 996, 828, 668
    stair = line([(40, t1), (590, t1), (590, t2), (1150, t2), (1150, t3), (1880, t3)], INK, 9, False)
    step1 = at(70, 860, 100, USERS) + server(300, 830, 200, 140, s=92)
    wires1 = line([(185, 905), (290, 905)], w=8)
    step2 = at(600, 655, 86, USERS) + at(730, 655, 86, LB) + server(870, 590, 120, 82) + server(870, 712, 120, 82) + at(1040, 655, 86, DB)
    wires2 = (line([(690, 698), (722, 698)]) + line([(822, 698), (846, 698), (846, 631), (864, 631)]) + line([(846, 698), (846, 753), (864, 753)]) +
              line([(996, 631), (1014, 631), (1014, 753), (996, 753)]) + line([(1014, 698), (1034, 698)]))
    step3 = (at(1170, 455, 76, USERS) + at(1290, 455, 76, LB, COBALT) +
             ''.join(server(1420, y, 112, 74, COBALT) for y in (340, 456, 572)) +
             at(1590, 330, 72, CACHE, COBALT) + ''.join(at(x, 455, 72, DB, COBALT) for x in (1590, 1700, 1790)))
    wires3 = (line([(1250, 493), (1284, 493)]) + line([(1370, 493), (1395, 493), (1395, 377), (1414, 377)]) + line([(1395, 493), (1414, 493)]) +
              line([(1395, 493), (1395, 609), (1414, 609)]) + line([(1538, 377), (1584, 366)]) + line([(1538, 493), (1584, 491)]) +
              line([(1665, 491), (1694, 491)], GRAPHITE, 6) + line([(1775, 491), (1786, 491)], GRAPHITE, 6))
    return page(HEADLINE + svg(stair + wires1 + wires2 + wires3) + step1 + step2 + step3 +
                chip(315, t1 + 8, '1K users') + chip(870, t2 + 8, '100K users') + chip(1515, t3 + 8, '1M users', strong=True) + note(1240, 190))


def piece_per_step():
    """Five treads, each with the one piece that milestone needed; the last (replicas, 1M) in cobalt."""
    steps = [('10K', [DB]), ('50K', [SERVER]), ('100K', [LB]), ('300K', [CACHE]), ('1M', [DB, DB])]
    x0, y0, dx, dy, tread, size = 330, 960, 310, 108, 240, 104
    path, out = f'M{x0 - 60} {y0}', []
    for i, (n, icons) in enumerate(steps):
        x, y = x0 + i * dx, y0 - i * dy
        last = i == len(steps) - 1
        path += f' H{x + tread}' + ('' if last else f' V{y - dy}')
        col = COBALT if last else INK
        out.append(f'<div class="a" style="left:{x}px;top:{y - size - 14}px;width:{tread}px;display:flex;justify-content:center;gap:6px">{"".join(icon(p, size, col) for p in icons)}</div>')
        out.append(chip(x + tread / 2, y + 14, n, strong=last))
    start = f'<div class="a" style="left:40px;top:760px;width:240px;display:flex;flex-direction:column;align-items:center">{icon(USERS, 120, INK)}<div class="lab">1K users</div></div>'
    arrow = svg(f'<path d="M1330 330 C 1480 300, 1560 360, 1560 470" fill="none" stroke="{PEN}" stroke-width="11" stroke-linecap="round"/>'
                f'<path d="M1528 440 L1560 478 L1588 436" fill="none" stroke="{PEN}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>')
    return page(HEADLINE + start + svg(f'<path d="{path}" fill="none" stroke="{INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>') +
                ''.join(out) + arrow + note(1150, 215))


here = Path(__file__).parent
for out, html in [('thumbnail', growing_map()), ('thumbnail-test-b', piece_per_step())]:
    (here / (out + '.html')).write_text(html)
