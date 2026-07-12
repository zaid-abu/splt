# App Assets Redesign — Split Bars Mark

**Date:** 2026-07-12
**Status:** Approved

## Summary

Redesign all app assets (icon, splash, adaptive icon, favicon) using a new abstract geometric mark called "Split Bars" — two tall rounded rectangles side by side, one filled charcoal, one outlined taupe — replacing the previous simple letter "S" icon.

## Design System Reference

Follows DESIGN.md palette:

- Canvas warm: `#F7F6F1`
- Charcoal ink: `#1A1A1A`
- Brand taupe: `#8C7A6B`

## Assets

### 1. App Icon (`icon.svg` / `icon.png`)

- 1024×1024, iOS rounded square (rx=224), fill `#F7F6F1`
- Two vertical bars centered: 140w × 320h each, rx=40, 20px gap
- Left bar: solid `#1A1A1A`, Right bar: outline `#8C7A6B` stroke=10
- Readable at all icon sizes

### 2. Splash Icon (`splash-icon.svg` / `splash-icon.png`)

- 1024×1024, fill `#F7F6F1`
- Same split-bars mark (140w × 320h), positioned at y=290
- "splt." in Sora SemiBold 72px, `#1A1A1A`, centered at y=680
- Taupe dot (r=6, `#8C7A6B`) at y=730

### 3. Adaptive Icon (`adaptive-icon.svg` / `adaptive-icon.png`)

- 1024×1024 canvas, mark on 360×360 cream foreground (rx=56), centered
- Background color `#F7F6F1` set in app.json
- Android applies device-specific mask

### 4. Favicon (`favicon.svg` / `favicon.png`)

- 128×128, rx=28 cream background
- Scaled bars: 38w × 52h, rx=12, 6px gap

## Implementation

- Update all SVG source files in `assets/images/`
- Regenerate PNGs from SVGs
- No app.json changes needed (colors match current config)
