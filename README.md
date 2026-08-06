# assistall.ai

The public website for **Assistall AI** — operational AI for busy teams.

Static HTML and CSS. No build step, no framework, no dependencies.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | The page |
| `assets/brand.css` | Brand tokens: palette, type scale, spacing, buttons |
| `assets/page.css` | Page-specific layout |
| `assets/` | Favicons and web manifest |
| `.cpanel.yml` | Deployment tasks |

## Deploying

Deployed via cPanel Git Version Control. `.cpanel.yml` copies `index.html` and `assets/`
into `public_html`. Nothing else is published.

## Constraints

These are deliberate; please keep to them.

- **No external requests.** No CDN, web fonts, analytics or trackers. The product's claim
  is that customer data stays on the customer's machine — the website should not
  contradict it.
- **No build step.** Files are copied verbatim.
- **Palette only:** deep teal `#0E3A3D`, pale limestone `#F4EFE4`, warm ivory `#FFFDF8`,
  muted brass `#C8A25D`, charcoal `#172A2C`, white.
- **Works without JavaScript.** Any script is progressive enhancement only.
- **No unverified claims.** No invented metrics, customer names or testimonials.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8080
```

## Known gaps

- `/privacy.html` is linked from the footer but not yet written.
- No `og:image` for social sharing.

## What changed

- **2026-08-06** — First landing page build: all sections, responsive layout,
  page-specific CSS, favicons.
- **2026-08-04** — Repository created with brand tokens and deployment config.
