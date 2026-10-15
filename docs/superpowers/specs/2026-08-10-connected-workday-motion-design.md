# Connected Workday Motion Design

## Goal

Turn the selected Connected Workday direction into a clearer, living product story while keeping Assistall's real workspace and real brand at the centre.

## Decisions already approved

- Use Option 2, **The Connected Workday**, as the page's signature visual direction.
- Section links and buttons that point inside the page glide to their destination instead of jumping.
- The workspace comparison must visibly progress through the real workspace; it must not read as a still image.

## Interaction design

1. Every internal hash link is marked with `data-scroll-link`. A small local script intercepts the click, calculates the sticky-header offset, and animates the document over 0.7–1.4 seconds with an ease-in-out curve. It updates the URL hash after arrival. With reduced motion enabled, the link still works but moves immediately.
2. The header and hero "Book a demo" buttons link to the final `#demo` section. The final action states plainly that it opens an email, rather than pretending to schedule a meeting in the browser.
3. The existing process section becomes a Connected Workday scene: identifiable input cards flow toward a real desktop-workspace capture and end at a visibly human review card. It uses one entrance sequence per visit to the section; it is not an infinite decorative loop.
4. The local workspace MP4 remains real product footage. A visible "Play workspace tour" control restarts it on demand. For ordinary motion settings it plays when it enters view; for reduced-motion settings the poster remains still until the visitor explicitly requests playback.

## Responsive and accessibility rules

- Keep the Connected Workday scene in three columns only while its text and workspace are readable. Collapse to a single narrative stack under 1024px.
- Keep the real workspace video available on mobile rather than replacing it with a static-only layout. The static comparison remains visible if a video cannot play.
- Use native buttons, visible focus indicators, meaningful labels, and `aria-pressed` for the video control.
- Do not add connector logos or integrations until the product connection inventory has been confirmed.
- No motion may be required to understand the page.

## Acceptance checks

- Clicking How it works, What it does, Workspace, Trust, See how it works, or a Book a demo section button results in a slow, header-aware glide in normal-motion settings.
- The three workspace-video frames at 0, 5, and 9 seconds visibly differ; playback is opt-in for reduced-motion users.
- At 1280px, 1024px, 820px, and 390px there is no horizontal overflow, no overlapping UI, and all navigation remains reachable.
