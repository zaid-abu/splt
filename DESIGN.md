---
name: Splt (Coral Ledger System)
description: Crisp, modern financial ledger design system for shared expense management.
colors:
  coral: "#F0584B"
  coral-strong: "#9A342D"
  coral-soft: "#FFDCD6"
  ink: "#101B29"
  navy: "#122237"
  mineral-canvas: "#EFF6FD"
  mineral-surface: "#F9FCFF"
  control: "#FFFFFF"
  border: "#C9D6E2"
  muted: "#536272"
  emerald-positive: "#006D3A"
  emerald-soft: "#D0F2DC"
  crimson-negative: "#A81130"
  crimson-soft: "#FFE1E1"
  amber-warning: "#765300"
  amber-soft: "#FFF0BF"
typography:
  display:
    fontFamily: "InstrumentSans_600SemiBold"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "InstrumentSans_600SemiBold"
    fontSize: "18px"
    fontWeight: 600
  body:
    fontFamily: "InstrumentSans_400Regular"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  mono:
    fontFamily: "IBMPlexMono_500Medium"
    fontSize: "14px"
    fontWeight: 500
rounded:
  control: "14px"
  card: "16px"
  sheet: "24px"
  pill: "9999px"
components:
  circle-dock:
    backgroundColor: "color-mix(surface 88%)"
    borderRadius: "20px"
    shadow: "0 6px 14px rgba(18, 34, 55, 0.16)"
    centerButtonColor: "{colors.coral}"
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
  card-surface:
    backgroundColor: "{colors.mineral-surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.card}"
---

# Design System: Splt (Coral Ledger)

## 1. Overview
Splt uses the **Coral Ledger** design system, an inspectable, modern financial layout built for clarity and light interaction. It centers around:
- **Circle Dock Navigation**: Floating glassmorphic dock with active route indicators and a prominent central coral add action (`+`).
- **Clear Financial Language**: Distinct visual treatments for "You lent", "You borrowed", "Owes you", "You owe", "Review", and "Total".
- **Coral Visual Palette**: Mineral canvas tones (`#EFF6FD`), crisp surface cards (`#F9FCFF`), high-contrast ink (`#101B29`), vibrant coral accents (`#F0584B`), and clear semantic colors (Emerald green, Crimson red, Amber yellow).

## 2. Typography
- **UI Text**: `Instrument Sans` (`400Regular`, `500Medium`, `600SemiBold`).
- **Numeric & Financial Data**: `IBM Plex Mono` (`500Medium`, `600SemiBold`).

## 3. Platform Adaptations
- **iOS**: Soft circular controls, 44pt touch targets, subtle backdrop blur.
- **Android**: Material-aligned 48dp touch targets, opaque chrome, rounded rectangles.
