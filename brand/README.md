# Eigenbit channel brand

The finalized channel identity. Colors come from the Night Paper tokens in `design/tokens.json`.

| Item | Value |
|---|---|
| Channel name | Eigenbit |
| Handle | @Eigenbit |
| Slogan | Let's learn it, one bit at a time. |
| Topics | System design / Problem solving / AI coding |
| Logo | A hand-drawn prism splits one white beam into the 4 video colors (coral, mint, cobalt, violet): complex in, clear parts out |

"Eigen" (German: own, essential) is the eigenvector idea: the part that stays true while everything else changes. Each video finds that essential bit.

## Files

- `logo/logo.svg`: the logo source; `logo/logo-800.png` is the 800x800 profile picture
- `banner/make.py`: writes `banner/banner.html`; `banner/banner.png` is the 2560x1440 channel banner

## Rebuild

```bash
python3 brand/banner/make.py
chrome --headless --hide-scrollbars --virtual-time-budget=6000 --window-size=2560,1440 --screenshot=brand/banner/banner.png brand/banner/banner.html
chrome --headless --hide-scrollbars --window-size=800,800 --screenshot=brand/logo/logo-800.png brand/logo/logo.svg
```

`chrome` is any Chromium build (here: `~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`). Use absolute `file://` paths if your Chromium needs them.

## Channel description

```
Let's learn it, one bit at a time.

Software is complicated. Understanding it shouldn't be. Eigenbit breaks down software engineering, computer science, AI coding, algorithms, and system design through clear visuals, practical examples, and evidence.
```
