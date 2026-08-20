# Assistall AI — Real Workflow Evidence and Hero Motion

## Purpose

Replace the remaining static product-evidence fallback with short, genuine Assistall AI workflow recordings built from local synthetic data. Restore the landing hero to the earlier work-flow concept while preserving every later visual correction.

The page should show one believable story: work arrives, Assistall prepares it, a person reviews it, and the business can move forward.

## Scope

This work contains three independently releasable website changes:

1. A refined hero-motion scene.
2. Three real product workflow recordings and static posters.
3. A Living Work Queue that plays those recordings when the associated workflow is visible and selected.

Production cloud configuration, form secrets, and public deployment remain separate launch-gate work. No customer workspace, customer data, credentials, or live connected account will be used in recordings.

## Hero motion

### Visual rules

- Use the official Assistall mark from the supplied branding assets, not a recreated logo.
- Keep the hero background deep teal with a translucent teal readability film over the animation.
- Use eight to ten neutral, monochrome work signals drawn only from supported work: business email, WhatsApp export, local folder, PDF, Word, Excel, CSV, PowerPoint, image, calendar file, Odoo and Zoho.
- Do not use provider-brand colours, generic social-media marks, a black hole, orbit ring, printer form, or an angled 3D object.
- The logo surface remains centred and flat to the background. It is lightly translucent, but remains legible as the official mark.
- One luminous, indistinct finished document is centred directly below the logo surface. It emerges from the bottom edge rather than a front slot.

### Motion loop

1. Signals drift in different, quiet trajectories around the scene.
2. At staggered intervals, each signal gives a small shiver and moves directly into the top edge of the logo surface, leaving a brief neutral/copper trail.
3. After a short batch of inputs lands, the logo surface performs one fast, complete rotation around its own **x-axis**. This is a true horizontal-axis rotation, not a side-to-side tilt. Perspective remains restrained so the mark never reads as a printer or a thick cube.
4. The surface settles flat. The completed document emits from the exact centre of the bottom edge with a copper-ivory glow, slows slightly as it clears the mark, then fades away.
5. The loop returns to drifting signals without a hard reset.

The sequence runs only while the hero is visible and motion is enabled. Reduced-motion visitors see the flat official mark, a still finished document, and no moving signals.

## Real product evidence

Record 4–6 second, silent, loopable desktop clips from the local Assistall app using synthetic **Demo Trading LLC** fixture data. The capture is an honest visual demonstration, not a claim that automation sends or decides without people.

| Queue item | Real screen path | Visible story |
| --- | --- | --- |
| Contract change review | Contracts & Renewals | Agreement/version source → highlighted change/renewal information → ready for human review |
| Shipment status review | Shipments | Imported movement record → changed delivery status or exception → focused record needing attention |
| Report preparation | Reports | Operational spreadsheet/report → extracted summary and flag → approved export choice |

Each item has a first-frame PNG poster sourced from that recording. Footage uses fictional company names, email domains and operational records only. Sensitive values, file paths, local usernames, secrets and system notifications must not be visible.

## Living Work Queue behaviour

- Keep the semantic tabs for Contract, Shipment and Report.
- Selecting a tab shows its matching video immediately when motion is allowed.
- When the whole queue enters view, auto-advance one item every seven seconds; pause on pointer hover, keyboard focus, hidden tab, or reduced motion.
- Each video is muted, loopable and plays only while its panel is active and visible. It has a labelled replay control.
- Reduced-motion and no-JavaScript states show the corresponding poster and textual source → preparation → review explanation.
- At 820px and above, retain a horizontal evidence frame; at 390px and 360px, stack text and media without overflow or clipped controls.

## Asset and implementation boundaries

- Store recordings and posters under `assets/media/workflows/`.
- Update HTML, CSS, site JavaScript and motion/accessibility tests only as needed for the new evidence surface.
- Retain the existing official icon assets and neutral connector sprite.
- Do not reintroduce the retired theme-comparison videos, Cobalt theme image, or provider-colour marketing treatment.

## Validation

- Test the hero source contract: official mark, top-edge intake, x-axis rotation, centred bottom output, and reduced-motion fallback.
- Test that each queue item maps to one local video and poster, and that selected/visible playback cannot run for inactive panels.
- Test keyboard selection, pause behaviour, replay, reduced motion and no-JavaScript fallbacks.
- Capture visual QA at 1920, 1440, 1024, 820, 390 and 360px: no overlap, clipping or horizontal overflow.
- Run the full Node suite, static verifier, whitespace check and graph update before every commit.

## Production boundary

Do not deploy while the real workflow media is unreviewed. Deployment remains blocked pending:

- Supabase CLI/Deno checks and a staged Edge Function invocation.
- Supabase secret configuration, migration/state verification and Security Advisor review.
- Turnstile live keys and server-side validation tests.
- Cloudflare proxy, WAF/rate-limit/SSL/origin protection configuration.
- cPanel secret file, PHP/cURL check and staging form verification.
