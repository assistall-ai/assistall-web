---
name: Assistall AI website
description: Quiet-authority landing page for Assistall AI. AI prepares the work, people approve it.
colors:
  deep-teal: "#0E3A3D"
  pale-limestone: "#F4EFE4"
  warm-ivory: "#FFFDF8"
  muted-brass: "#C8A25D"
  charcoal: "#172A2C"
  white: "#FFFFFF"
  hero-night: "#06191b"
  hero-gold-line: "#e8c77e"
  teal-soft: "color-mix(in srgb, #0E3A3D 8%, #FFFDF8)"
  rule: "color-mix(in srgb, #172A2C 14%, transparent)"
  muted: "color-mix(in srgb, #172A2C 66%, #FFFDF8)"
typography:
  hero-display:
    fontFamily: "Aptos, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(3.3rem, 6.5vw, 6.8rem)"
    fontWeight: 650
    lineHeight: 0.95
    letterSpacing: "-0.06em"
  section-headline:
    fontFamily: "Aptos, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(2.45rem, 5vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.055em"
  title:
    fontFamily: "Aptos, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.15
  lede:
    fontFamily: "Aptos, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Aptos, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.2vw, 1.09rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Aptos, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem)"
    fontWeight: 700
    letterSpacing: "0.09em"
rounded:
  control: "10px"
  sm: "12px"
  md: "18px"
  lg: "28px"
  pill: "999px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3rem)"
  section: "clamp(4.75rem, 9vw, 8.5rem)"
  measure: "62ch"
  page-max: "1296px"
  header: "76px"
components:
  button-primary:
    backgroundColor: "{colors.muted-brass}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.control}"
    padding: "0.82rem 1.3rem"
    height: "48px"
  button-outline:
    backgroundColor: "rgba(14,58,61,.42)"
    textColor: "{colors.warm-ivory}"
    rounded: "{rounded.control}"
    padding: "0.82rem 1.3rem"
    height: "48px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.deep-teal}"
    rounded: "{rounded.control}"
    padding: "0.82rem 1.3rem"
  card-outline:
    backgroundColor: "{colors.warm-ivory}"
    rounded: "{rounded.sm}"
    padding: "1rem"
  connector-card:
    backgroundColor: "{colors.pale-limestone}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.sm}"
    padding: "clamp(1.25rem, 2vw, 1.5rem)"
  product-window:
    backgroundColor: "{colors.pale-limestone}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.warm-ivory}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.control}"
    padding: "0.9rem 1rem"
---

# Design System: Assistall AI website

<!-- Scanned from the developed checkout (.worktrees/connector-workflow-evidence at b116222) on 14 October 2026:
     assets/brand.css, assets/page.css, assets/site.js, index.html. This records what the code does today; it is not a redesign.
     Palette matches assistall-app/branding/assistall_brand_tokens.json exactly. -->

## Overview

**Creative North Star: "Quiet Authority"**

A calm, premium operations brand for non-technical business owners. The page reads like a well-run office: deep teal and warm limestone surfaces, one brass accent, generous space, and plain, specific language. Confidence comes from restraint and real product evidence (recorded workflows with fictional data), never from hype, metrics or decoration.

The one deliberate exception is the hero. On the owner's repeated request (August 2026) it is a dark night-teal scene with glowing source cards, brass intake routes, an ivory "circuit" return charge and the Assistall box turning once on its Y-axis. That glow and depth belongs **only** to the hero; every section below it returns to flat, quiet surfaces.

Rhythm alternates surfaces down the page: dark hero, limestone story, ivory capabilities, teal connections, ivory product, limestone value, ivory trust, teal call to action and footer. Each band carries one idea.

**Key Characteristics:**
- Two-surface world: deep teal and warm light (ivory / limestone), with brass as the single accent.
- One system font stack (Aptos → Segoe UI → Arial); no webfonts.
- Large, tight, negatively tracked headlines over calm body copy capped at 62ch.
- Thin 1px rules and borders instead of shadows outside the hero.
- Motion is slow and purposeful, with full reduced-motion and no-JavaScript fallbacks.
- English only today (`lang="en"`); Arabic right-to-left is a standing brand requirement not yet built.

## Colors

A restrained teal-and-stone palette with one warm metal accent.

### Primary
- **Deep Teal** (deep-teal): headings on light surfaces, full dark sections (connections, call to action, footer), header bar at 88% opacity, the hero box inner face, and the "Ready" seal on the output document.

### Secondary
- **Muted Brass** (muted-brass): the single accent. Primary button fill, focus outlines, thin section rules ("operational current" line), active tab underline, active capability marker, borders on the demo form and outputs strip. Brass is a line-and-fill colour, not a text colour on light backgrounds (see the Brass Is Not Ink Rule).

### Tertiary (hero only)
- **Hero Night** (hero-night): the hero scene background and video letterbox.
- **Hero Gold Line** (hero-gold-line): the glowing intake routes in the hero animation. Do not reuse elsewhere.

### Neutral
- **Warm Ivory** (warm-ivory): page background, text on dark surfaces, form field fill.
- **Pale Limestone** (pale-limestone): alternate section background, connector cards, product-window frames, capability outcome tiles; also body text on teal sections.
- **Charcoal** (charcoal): body text on light surfaces and text on brass buttons.
- **Muted** (muted, derived 66% charcoal into ivory): secondary copy, ledes, card descriptions.
- **Rule** (rule, derived 14% charcoal): every hairline border and divider on light surfaces.
- **Teal Soft** (teal-soft): defined but barely used; available for very quiet tints.

### Named Rules
**The One Accent Rule.** Brass is the only accent. No new hues; any missing colour is a question for the owner, not a new token (brand.css says the same).

**The Brass Is Not Ink Rule.** Brass text passes contrast on teal (5.2:1) but fails on ivory (2.4:1) and limestone (2.1:1). Current eyebrows, step numbers and outcome labels on light surfaces break this; treat them as known defects, not as precedent.

**The Mixed, Not Invented Rule.** Tints are made with `color-mix()` from the six brand colours, never new hex values.

## Typography

**Display Font:** Aptos (with Segoe UI, Arial, sans-serif)
**Body Font:** the same stack
**Label Font:** the same stack, uppercase and tracked

**Character:** One humanist sans used at very different scales. Headlines are big, slightly heavy and tightly tracked; body copy is relaxed and readable. The fluid scale in brand.css is fixed: do not add in-between sizes.

### Hierarchy
- **Hero display** (650, clamp 3.3–6.8rem, line-height 0.95, tracking -0.06em, max 12ch): the hero H1 only.
- **Section headline** (600, clamp 2.45–5rem, line-height 1.02, tracking -0.055em): every section H2. The call-to-action H2 runs a touch larger (to 5.4rem).
- **Title** (600, step 1, 1.2–1.5rem): card and panel H3s.
- **Lede** (400, step 1, muted colour): the paragraph under a section headline.
- **Body** (400, step 0, 1–1.09rem, line-height 1.6, max 62ch).
- **Label** (700, step −1 or smaller, uppercase, 0.06–0.09em tracking): tab labels, window bars, outcome terms, and the eyebrows (see Don'ts).

### Named Rules
**The Fixed Scale Rule.** Only `--step--1` to `--step-4`, plus the two documented headline clamps. Small UI labels (0.7–0.9rem) exist inside components; keep them, do not multiply them.

## Layout

Single-column story on a centred container: `min(100% − 2 × gutter, 1296px)` (page.css overrides brand.css's 1180px). Gutter is fluid 1.25–3rem (1.2rem under 560px). Sections pad 4.75–8.5rem vertically (5rem under 560px). The fixed header is 76px (68px under 820px) and in-page links glide to targets offset by the header plus 16px.

Two-column splits use asymmetric grids (roughly 0.72fr / 1.28fr) for story, capabilities and the call to action; they stack to one column at 820px. Connectors run four across, two at 1060px, and become a horizontal snap-scrolling row under 560px. Breakpoints are 1060, 820 and 560px; the header nav becomes a dropdown at 1060px.

## Elevation & Depth

Flat by default. Light sections separate with tone (ivory vs. limestone) and 1px rules, not shadows. Three restrained shadows exist: a soft teal-tinted lift under product windows, a darker drop under the workflow panel and its video, and a hover lift on connector cards. All real glow lives in the hero.

### Shadow Vocabulary
- **Soft lift** (`0 24px 80px` teal at 15%): product windows on light sections.
- **Evidence drop** (`0 20px 54px rgba(0,0,0,.18)`, video `0 18px 38px rgba(0,0,0,.24)`): the dark Living Work Queue panel.
- **Hover lift** (`0 16px 34px rgba(0,0,0,.2)`): connector cards on hover/focus only, paired with a 4px rise.
- **Hero glow** (drop-shadow halos on routes, dots, cards, box and output document): hero only.

### Named Rules
**The Glow Stays Home Rule.** Gradients, glows and halos are approved for the hero scene alone. The brand token file says "no gradients, decorative shadows"; the hero is the owner-approved exception, not a licence for other sections.

## Shapes

Softly rounded, never pill-heavy. Controls 10px, cards and tiles 12px, framed product windows, trust cards and the demo form 18px, a 28px large radius reserved but unused. Pills (999px) appear only on the hero fallback chips and the "human work" list. Hairline borders (1px rule or brass) define most shapes. The hero box uses an 18% radius with an inner frame at 16%.

## Components

### Buttons
- **Shape:** gently rounded (10px), at least 48px tall, bold 700 label with slight negative tracking.
- **Primary:** brass fill, charcoal text, brass border. One per view: header "Book a demo", hero, and form submit.
- **Outline (on dark):** translucent teal fill, ivory text, 78% brass border.
- **Quiet (on light):** transparent with teal text and brass border (defined in brand.css, not currently used on the page).
- **Hover / Focus:** 2px rise and a lighter brass mix on hover; 3px brass focus outline with 2px offset.

### Cards / Containers
- **Step cards (workday list):** ivory at 90%, 1px rule border, 12px radius, number in brass; on hover they shift 6px right and the border turns brass.
- **Connector cards:** limestone on the teal section, 52px charcoal mark tile with a monochrome provider or format mark, name plus an honest status ("Setup-dependent" or "Imported source"). Hover: rise 4px, brass border, mark turns brass.
- **Trust cards:** 18px radius, rule border, short brass bar above the title.
- **Product window:** 18px radius frame with a teal title bar (uppercase label), real product screenshot inside.

### Tabs
- **Capability tabs:** full-width outlined buttons stacked in a column; the active one gets a limestone fill, brass border and brass marker. Only the summary text and labels change; the image stays the same.
- **Workflow tabs:** a flat strip on the dark panel; the selected tab is ivory with a 2px brass underline. Arrow, Home and End keys move between them.

### Inputs / Fields
- **Style:** ivory fill, charcoal text, 10px radius, no border at rest, ivory labels above in 0.82rem bold, on a near-black-teal form panel with a brass border.
- **Focus:** brass border plus a soft 3px brass ring at 30%.
- **Disabled:** submit at 55% opacity with a wait cursor while sending.

### Navigation
- Fixed translucent teal header with an 18px blur, ivory wordmark with brass "AI", 0.88rem semibold links at 82% ivory, and a brass "Book a demo" button. At 1060px and below, links collapse into a "Menu" dropdown panel (teal, brass border, 48px rows) that closes on link, outside click, Escape, focus leaving or resize. Without JavaScript the links stay visible.

### Hero animation (signature)
An 11.8-second loop generated in DOM/SVG/CSS by `assets/site.js`: named monochrome source cards sit above and beside the box, glide together into its top edge, an ivory charge returns along every route at once, the box spins once on its Y-axis, and a small "Ready" document descends and fades. Treat the whole build (markup, CSS, JS, tests) as one unit; refine it, never rebuild it.

- **Sources are spread from the measured page.** Above 820px, `planHeroSpread` measures the copy's text and the workspace, then spreads the cards from staggered rows with a light nudge (organised, with some asymmetry) over the free space: the strip above the copy, the area right of it, and around the workspace down to the middle of its sides (never lower). Cards keep a clear band below the header and never touch the copy or the workspace. Each screen uses the widest spacing that still fits its target: 14 sources from 1366px, 12–13 on smaller laptops and tablets, at least 10 above 820px. Phones (820px and below) keep the 8 compact cards in three fixed rows. Cards, routes, lights and charges share one set of coordinates.
- **Every route enters through the workspace's top edge and none cross** (hairline, soft glow). Sources beside the workspace rise slightly, arc over and drop straight down into the top; sources above glide across and drop in. Entry points along the top edge follow the order the sources sit around the workspace, and each route comes down its own spoke of a fan centred below the edge, so neighbours keep at least about 5px apart all the way in. Layouts whose routes would cross or touch are rejected, and no route cuts over the box (tests check every modelled size). Only the source cards travel the routes (no lead lights). Routes stay invisible until they start drawing and use square ends, so no dots appear at their tips. Routes are clipped at the workspace top edge, so nothing shows below it even mid-spin. Cards run the whole route, shrinking as they converge, then carry on a little way under the top edge, where the workspace hides them as they fade, so they visibly enter the logo. Routes draw once, lift slightly during intake and the return charge, then rest at 6% opacity and stay. The return charge is the brightest element (2.2 stroke, layered glow) and eases in as it leaves, once the fan has spread the charges apart. Routes do not use `vector-effect: non-scaling-stroke`: with the stretched 1200 × 700 stage it made dash lengths fall short, so lines stopped before the box.
- **Planning runs after first paint** (the copy shows at once) and re-plans 160ms after resizing settles. `?frame=<ms>` also skips the fade-in so review stills are full strength.
- **The whole animation sits lower** (stage offset 4.5–7rem on desktop, 3.5rem on phones) for clear headroom below the header.
- **The workspace is an embossed stamp:** a raised deep-teal tile with a bevelled rim, a recessed field and the three bars of the mark drawn as raised vectors (geometry measured from the official PNG) with a light catch on their top edges. The still frame uses the same stamp.
- **Static fallback** (reduced motion or no JavaScript) mirrors the opening frame: labelled chips at the same positions, the logo where the box sits, and "Ready for review" beneath it. On phones only the top chip row stays, and the logo and result sit side by side below the copy.
- **Source marks** are monochrome. Gmail, WhatsApp, Odoo, Zoho and JSON use their official logos (Simple Icons, CC0). Microsoft Office and Adobe PDF logos are not used (owner decision 16 October 2026: their owners withdrew them from icon libraries), so DOCX, XLSX, PPTX, PDF, CSV and TXT use precise page marks with a cut-out glyph (W, X, P, label band, grid, lines). Folder, voice and image marks are filled geometric icons. The Connections cards use the same marks.
- **Review aids:** `?motion=on|off` forces or stops the motion, and `?frame=<ms>` holds the loop at one moment for screenshots.

### Living Work Queue (signature)
A dark teal panel with three tabs, each pairing a muted, looping product recording (played at 0.65× speed, 11-second rotation, paused when off-screen or hovered) with a limestone note card and a "Replay workflow" button. Recordings use fictional data only.

## Do's and Don'ts

### Do:
- **Do** use only the six brand colours and `color-mix()` tints of them.
- **Do** keep brass for fills, borders, rules and focus; put text on brass in charcoal.
- **Do** keep body copy at 62ch or narrower and headlines balanced.
- **Do** give every motion a reduced-motion and no-JavaScript fallback, and keep `?motion=on|off` working for review.
- **Do** label connectors honestly ("Setup-dependent", "Imported source") and keep provider marks monochrome.
- **Do** bump the `?v=` marker on brand.css, page.css or site.js whenever they change.
- **Do** plan every new surface for Arabic right-to-left as well as English, and for WCAG AA contrast.

### Don't:
- **Don't** add new hues, webfonts or type sizes.
- **Don't** use brass as text on ivory or limestone (fails AA).
- **Don't** add more eyebrow labels above headings; the existing ones conflict with the owner's standing design rules and await a decision.
- **Don't** add coloured side-bars to cards or rows; the capability tab marker is an existing case awaiting the same decision.
- **Don't** spread the hero's glow, gradients or night background to other sections.
- **Don't** use provider brand colours, the old WadiH "W" marks, black-hole, orbit or printer imagery, or an x-axis spin in the hero.
- **Don't** publish invented metrics, testimonials, customer names or "fully autonomous" claims.
- **Don't** use gradient text, glass or blob decoration, nested cards or emoji as icons.
