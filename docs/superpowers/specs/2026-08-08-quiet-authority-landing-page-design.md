# Assistall AI landing page — quiet authority direction

**Status:** approved for implementation.

## Purpose

Rebuild the static `assistall.ai` landing page so that a non-technical business owner can quickly understand that Assistall AI receives operational work, prepares it for review, and keeps people in control. The page should feel current and premium without reading as a flashy generic AI site.

The site remains plain HTML and CSS, with no framework, external requests, or build step. It must work without JavaScript; any motion is progressive enhancement only.

## Chosen visual direction: quiet authority

The page will use a small number of decisive visual moments instead of decorative effects:

1. **Dark, assured opening.** A deep teal hero with a large plain-English promise, a brass primary action, the genuine Assistall three-bar mark, and a cropped real application view. The hero has one focal point: operational work becoming reviewed action.
2. **A calm operational story.** The next sections show a short sequence—work arrives, Assistall organises it, a person reviews it, the business moves forward. This replaces long card grids and makes the product understandable before the visitor reaches the detailed capability list.
3. **Real product evidence.** Application imagery will be captured from an isolated local workspace, never from a client workspace. Screens will be used as product surfaces, labelled clearly and cropped so the interface remains readable rather than becoming a generic dashboard illustration.
4. **Human capacity as the payoff.** A warm limestone section explains the benefit: fewer repeat tasks, more attention for customers, judgment, and real work. It will use people-centred language but not stock photography or unverified figures.
5. **A controlled close.** The final teal CTA repeats the brand mark and brass action, ending with confidence rather than hype.

The public site itself remains anchored to the approved Assistall Limestone palette: deep teal, limestone, ivory, charcoal, white, and muted brass. Cobalt will not recolour the public brand.

## Application-theme comparison section

One product section will show that the actual desktop application lets a workspace select a colour theme while keeping the workflow and layout familiar.

- The section will contain two real, matching application captures side by side: **Assistall Limestone** and **Cobalt Blue**.
- A small label will explain the benefit in plain English: the workspace can choose a look that suits its team while Assistall works the same way.
- Assistall Limestone will be visually first and marked as the Assistall brand look.
- Cobalt is evidence of in-product personalisation only; it is not a second marketing palette and will be contained inside the screenshot surface.
- At narrow widths the two views will stack in a fixed order, with no horizontal carousel or clipped content.
- Captures will use a temporary, isolated account and contain no customer, email, or live business records. The capture crop will avoid exposing the temporary account name.

### Scrolling workspace comparison clip

The theme section will also include a short, silent looping comparison clip made from the actual desktop workspace.

- The left half shows the workspace in Assistall Limestone and the right half shows the same workspace in Cobalt Blue.
- Both halves follow the same gentle vertical scroll through the overview, so a visitor can compare the change without needing to imagine it.
- The clip begins with the full workspace view, pauses briefly, scrolls through the shared workflow layout, and ends with both theme names visible. It will run for approximately 10 seconds at a calm pace.
- The clip will be captured from the isolated local workspace, cropped before the temporary profile area, and encoded as a local muted MP4 asset. It will not be uploaded to a third party.
- A static side-by-side comparison image will be the poster and no-motion fallback. The page remains understandable if video cannot autoplay or if reduced motion is enabled.

## Copy approach

The existing approved copy remains the factual source of truth. Its product claims, safeguards, modules, and industries will be preserved, but the page will receive a separate plain-English writing pass.

- Use short sentences and concrete verbs.
- Describe what happens, not abstract categories: receive work, find files, read reports, prepare a reply, ask for review.
- Preserve the differentiators: local data, on-device speech recognition, and human review before writing or sending.
- Keep the product promise visible throughout: Assistall helps keep the business moving; people remain responsible for final decisions.
- Do not publish an hours-saved number until Assistall has measured and approved that claim.
- Avoid ambiguous phrases such as “operational layer,” “operational drag,” and “generic automation” in prominent customer-facing copy.

## Page architecture

1. **Header** — genuine mark + wordmark, concise navigation, one brass “Book a Demo” action. It remains legible on dark teal at every size.
2. **Hero** — plain-language core promise, supporting explanation, brass action, quiet secondary action, and a real application capture.
3. **Work moves forward** — four-step visual story of incoming work, organised information, review, and next action.
4. **What Assistall helps with** — focused capability groups for reports, documents, approvals, contracts, and connected shipment work. Each group will remain within verified product scope.
5. **Your workspace, your view** — Assistall Limestone and Cobalt Blue application comparison using real captures.
6. **Time for the work only people can do** — a human-first value section with no invented time or revenue claim.
7. **Trust and control** — local computer, on-device speech recognition, and human review safeguards.
8. **Why Assistall exists** — concise business purpose.
9. **Final CTA and footer** — direct contact path, mark, privacy link, and short tagline.

## Motion and interaction

Motion will communicate hierarchy, not simulate an AI effect.

- Hero product surface enters with a short fade-and-rise.
- The four-step story reveals one stage at a time as it enters the viewport.
- Theme comparison uses a subtle divider movement or cross-fade to signal a change of appearance, while both screenshots remain visible and understandable with motion disabled.
- The scrolling workspace comparison clip is muted, looped, and optional. It is replaced by the static comparison under `prefers-reduced-motion`.
- Buttons and cards receive only a small hover lift and colour transition.
- No gradients, particle fields, parallax, glowing blobs, spinning 3D objects, or automatic carousels.
- All transitions will be disabled under `prefers-reduced-motion`.

## Responsive and accessibility requirements

- Test at 1280px, 1024px, 820px, and 390px with no horizontal overflow.
- At desktop widths, the hero uses text and product evidence side by side; at 1024px and below they stack.
- The theme comparison is two columns only when both captures are legible. It stacks vertically at tablet and phone widths.
- The mobile page is a responsive public website, not a claim that the Windows desktop application is a native phone product.
- Header navigation remains keyboard reachable at every width. A CSS-only stacked navigation is acceptable if it is clearer than a hidden control.
- Use semantic landmarks, one `h1`, visible focus styles, descriptive image alternatives, and WCAG AA contrast.

## Technical boundaries and verification

- Maintain the existing static HTML/CSS architecture in `index.html`, `assets/brand.css`, and `assets/page.css`.
- Use only the approved palette for the public page; Cobalt appears inside real application image content only.
- Do not add a package manager, framework, tracker, external font, CDN, or external image request.
- Keep all product screenshots as local static assets after capture and review.
- Validate HTML, search source for unintended colours and external requests, and inspect the final page visually in the browser at all four required widths.
- Check that no temporary account name, customer data, email address, or unverified metric reaches the public site.
