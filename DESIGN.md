---
version: 1.0.0
name: UP Match
description: Authentic campus dating and friend-finding platform for University of Phayao students.
colors:
  ground: "#F8FAFC"       # Clean, bright slate-50 ground surface
  surface: "#FFFFFF"      # Crisp solid white cards
  ink: "#0F172A"          # Deep slate-900 text (high contrast, 12:1+)
  muted: "#475569"        # Slate-600 secondary text (5.5:1 contrast, passes WCAG AA)
  primary: "#6B21A8"      # Deep Royal Phayao Purple (solid, no gradients)
  primary-hover: "#581C87"# Darker iris purple for active/hover states
  like: "#E11D48"         # Coral Rose for Likes & Matches
  pass: "#64748B"         # Cool Slate for Pass/Skip
  superlike: "#D97706"    # Marigold Amber for Superlikes & UP badges
  border: "#E2E8F0"       # Precise hairline border
typography:
  display:
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontWeight: "800"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    lineHeight: "1.5"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
---

## Overview

UP Match connects University of Phayao students for meals, study sessions, and dating. The design draws from campus vibrancy, Kwan Phayao lakeside tranquility, and authentic student culture. It deliberately rejects generic "AI slop" clichés: no purple-to-pink neon gradients, no `bg-clip-text` headline gradients, no indiscriminate glassmorphism on opaque surfaces, no colored glowing shadows, and no generic sparkle emojis.

## Colors

- **Ground (`#F8FAFC`):** Slate-50 ground gives content breathing room without the dullness of flat white or the cliché of warm-cream terracotta.
- **Surface (`#FFFFFF`):** High-clarity white cards with clean borders (`#E2E8F0`) ensure photos and profiles stand out naturally.
- **Ink (`#0F172A`):** Deep slate-900 provides crisp legibility and authority.
- **Muted (`#475569`):** Slate-600 ensures secondary details and timestamps pass WCAG AA standards.
- **Primary Brand (`#6B21A8`):** Authentic Royal Phayao Purple used as a solid, decisive accent rather than a blurry gradient.
- **Like / Match (`#E11D48`):** Clean coral rose for hearts and match celebrations.
- **Superlike (`#D97706`):** Marigold gold representing UP pride and special compliments.

## Typography

- **Headlines:** Solid `#0F172A` with strong weight (`font-extrabold`), tight tracking, and zero text gradient masking.
- **Subtitles & Badges:** Clear `#475569` or solid tinted tags (`bg-purple-50 text-purple-800 border-purple-200`).
- **No highlighted single words:** Headings read as complete, cohesive thoughts without artificial two-tone words.

## Elevation & Depth

- Surfaces stay flat with hairline borders (`border border-slate-200/90`).
- Elevation is reserved for floating action buttons (`shadow-md shadow-slate-900/10`) and modaled sheets.
- No saturated colored glow shadows (`shadow-purple-500/30` is prohibited).

## Shapes & Radius

- **Cards & Sheets:** `rounded-2xl` (16px) with precise borders.
- **Action Buttons & Chips:** `rounded-full` (pill) for tactile thumb-friendly interaction on swipe controls and filter pills.
- **Inputs & Small Buttons:** `rounded-xl` (12px) for structured forms.

## Component Language

- **Navbar:** Clean solid white with subtle border and crisp badge indicators.
- **Swipe Cards:** Clean photo aspect ratio with bottom dark gradient scrim only where text readability over photos is required.
- **Chat:** High-contrast message bubbles (User: `#6B21A8`, Partner: `#F1F5F9`).

## Do's and Don'ts

- **Do:** Use solid, high-contrast colors and crisp borders.
- **Do:** Ensure all text passes WCAG AA contrast.
- **Do:** Use meaningful SVG icons (Heart, MessageCircle, ShieldCheck, MapPin).
- **Don't use (SD1):** Cream ground + terracotta accent (generic Claude look).
- **Don't use (C1 / C6):** Purple-to-pink gradient backgrounds and `bg-clip-text` gradient headlines.
- **Don't use (K3):** Reflexive `backdrop-blur-md` on static cards with nothing scrolling underneath.
- **Don't use (I3):** Generic Sparkles icon next to headings or buttons.
- **Don't use (C5):** Saturated neon glow shadows.
