"""Writes the caching thumbnails as HTML: an incident graph (page load 8 ms -> 3 s, site down) with a curiosity headline.
thumbnail.html is the main one; thumbnail-test-b.html is the Test & compare variant. Render each at 1920x1080, then scale to out/*.png (1280x720)."""
import random

def thumb(headline, note, out):
    random.seed(3)
    calm = []; x = 140
    while x < 1060: calm.append((x, 930 + random.randint(-12, 12))); x += 26
    hot = [calm[-1], (1075, 900), (1088, 600), (1100, 440), (1120, 420)]; x = 1146
    while x < 1830: hot.append((x, 430 + random.randint(-30, 30))); x += 26
    path = lambda pts: 'M' + ' L'.join(f'{a} {b}' for a, b in pts)
    fill = path(hot) + f' L{hot[-1][0]} 990 L{hot[0][0]} 990 Z'
    return out, f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@500;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>html,body{{margin:0}} .st{{position:relative;width:1920px;height:1080px;overflow:hidden;background:#14120F}} .a{{position:absolute}}
.hl{{font:700 178px/.9 "Space Grotesk";letter-spacing:-5px;color:#F4EFE6;white-space:nowrap}}</style></head><body><div class="st">
<div class="a" style="left:30px;top:250px;width:1860px;height:800px;background:#1f232a;border:3px solid #39404a;border-radius:14px"></div>
<div class="a" style="left:80px;top:276px;font:600 48px Inter;color:#c9c9d6">Page load time</div>
<div class="a" style="left:1440px;top:268px;padding:8px 26px;border-radius:10px;background:#f2495c;color:#fff;font:800 44px Inter">⚠ SITE DOWN</div>
<svg class="a" style="left:0;top:0" width="1920" height="1080">
  <path d="M140 430 H1840 M140 990 H1840" stroke="#2c3235" stroke-width="3"/>
  
  <path d="{fill}" fill="#f2495c" opacity=".5"/>
  <path d="{path(calm)}" fill="none" stroke="#73bf69" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="{path(hot)}" fill="none" stroke="#ff5a6e" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M990 640 C 950 500, 1010 380, 1110 375 C 1220 370, 1250 540, 1215 650 C 1185 750, 1060 770, 1010 700 C 984 664, 970 610, 972 530" fill="none" stroke="#FFB547" stroke-width="13" stroke-linecap="round"/>
</svg>
<div class="a" style="left:160px;top:790px;padding:6px 26px;border-radius:999px;background:#3FD39B;color:#14120F;font:800 64px Inter">✓ 8 ms</div>
<div class="a" style="left:1500px;top:500px;padding:6px 26px;border-radius:999px;background:#FF6F59;color:#14120F;font:800 64px Inter">✕ 3 s</div>
<div class="a" style="left:330px;top:560px;font:700 96px Caveat;color:#FFB547;transform:rotate(-6deg);white-space:nowrap">{note}</div>
<div class="a hl" style="left:50px;top:40px">{headline}</div>
</div></body></html>'''

A = '<span style="color:#FFB547">CACHE</span>'
from pathlib import Path
here = Path(__file__).parent
for out, html in [
    thumb(f'IT WAS THE {A}.', '', 'thumbnail'),  # names the culprit, never the how
    thumb('WHY DID IT <span style="color:#FFB547">SPIKE?</span>', '', 'thumbnail-test-b'),  # the question stays unanswered
]:
    (here / (out + '.html')).write_text(html)
