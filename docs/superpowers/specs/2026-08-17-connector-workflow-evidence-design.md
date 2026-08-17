# Connector Ecosystem and Workflow Evidence Design

**Date:** 2026-08-17
**Status:** Approved design awaiting written-spec review

## Purpose

Replace two weak areas of the Assistall AI landing page with concrete product evidence:

1. Make the connector ecosystem immediately recognizable without turning the page into a collection of competing provider colours.
2. Replace theme and colour-palette demonstrations with clear, truthful examples of work Assistall can prepare for a person to review.

The page should answer two practical questions: “Can Assistall work with the tools and files my business already uses?” and “What work will it actually help me complete?”

## Scope

This iteration changes only the connector ecosystem and product-evidence sections, plus the styles, scripts, assets and tests required by those changes. It does not redesign the hero, alter the demo-request security architecture, create new application capabilities or claim that setup-dependent integrations are already live.

## Connector ecosystem

### Content

The section retains these eight connector groups:

- Microsoft 365 and Outlook — setup-dependent
- Gmail and standard business email — setup-dependent
- WhatsApp exports and approved business messages — imported source
- Odoo — setup-dependent
- Zoho Books — setup-dependent
- Local folders and selected files — imported source
- Outlook and portable calendar files — imported source
- PDF, Word, Excel, CSV and additional supported files — imported source

### Visual treatment

- Use recognizable provider and file-format silhouettes, rendered locally as monochrome vector assets.
- Default logo colours are limestone and charcoal. Copper is reserved for hover, focus and selected states.
- Provider brand colours do not appear in this marketing section.
- Local folders and calendar files receive purpose-built icons that match the weight and geometry of the provider marks.
- The combined file-format card shows separate PDF, Word, Excel and CSV marks rather than one generic document icon.
- Every card preserves the honest capability label, so imported sources and setup-dependent ecosystems cannot be mistaken for live integrations.

### Responsive layout

- Desktop uses a four-column grid.
- Tablet uses a two-column grid.
- Mobile uses a horizontally scrollable row with enough of the next card visible to signal that more cards are available.
- The row supports touch, trackpad and keyboard access and must not create page-level horizontal overflow.
- Cards use the same border, radius, surface and typography system as the surrounding landing page.

## Product evidence: Living Work Queue

### Section structure

Remove the Limestone/Cobalt palette captures, theme-comparison media and their playback controls from this section. Replace them with one shared Assistall workspace frame containing three selectable workflows:

1. Contract review
2. Shipment tracking
3. Prepared reply

Each workflow follows the same visual grammar:

```text
Source received → Assistall prepares and shows evidence → Ready for human review
```

The three stages remain within one continuous frame. Changing workflows changes the contents of that frame; it must not feel like navigating to a separate page or loading an unrelated card collection.

### Workflow content

#### Contract review

- Source: a contract PDF or Word document.
- Preparation: extracted parties, renewal date, important clauses, changed terms and source evidence.
- Human result: review the evidence, edit if required and approve the contract record.

#### Shipment tracking

- Source: a shipment or delivery record.
- Preparation: current status, promised date, latest detected change and related delivery evidence.
- Human result: verify the change and decide the next customer or vendor action.

#### Prepared reply

- Source: a business email and its supporting files or records.
- Preparation: a concise proposed response with visible supporting evidence.
- Human result: approve, edit or reject the reply. Nothing is represented as being sent automatically.

All examples must be based on capabilities represented by the existing Assistall application. Names and document contents are illustrative, fictional and free of customer data. No unsupported performance figures or automation claims may be introduced.

## Motion and interaction

- The active workflow advances every seven seconds only while the section is visible.
- Selecting a workflow tab immediately makes it active and resets the rotation timer.
- Hovering the workspace or focusing an interactive element pauses rotation.
- A thin copper operational current travels from the source stage, through Assistall’s preparation, to the review stage.
- Workflow changes use a short crossfade with a small directional translation. Motion should support comprehension and must not resemble a carousel advertisement.
- Arrow keys move between tabs; Home and End move to the first and last tab.
- Tab semantics, focus states and accessible labels are required.
- With reduced motion enabled, the travelling current is static and workflow changes use no translation.
- Without JavaScript, the contract workflow remains fully visible and understandable.

## Responsive behaviour

- Desktop shows the three workflow stages horizontally inside the shared workspace.
- Tablet may reduce secondary metadata but retains the complete source, preparation and decision story.
- Mobile stacks the three stages vertically in reading order beneath a horizontally scrollable tab list.
- Text wraps naturally; no absolute-positioned content may determine the height of a workflow panel.
- Controls and evidence labels remain readable at 200% zoom and at a 360-pixel viewport.

## Component boundaries

- `ConnectorCard` owns one logo group, connector name, description and capability label.
- `WorkflowTabs` owns selection, keyboard navigation and autoplay pause state.
- `WorkflowPanel` owns the three-stage presentation for one workflow.
- `OperationalCurrent` is decorative and hidden from assistive technology.
- Existing navigation and section-reveal behaviour remain independent of workflow rotation.

The production site may implement these boundaries with existing HTML, CSS and JavaScript rather than introducing a framework. Data attributes should connect tabs to panels so content can remain semantic and usable before JavaScript enhancement.

## Failure and fallback behaviour

- Missing logo assets fall back to a styled text abbreviation without collapsing the card.
- If JavaScript fails, the first workflow is visible and the other panels do not overlap it.
- If `IntersectionObserver` is unavailable, manual workflow selection still works and automatic rotation remains disabled.
- Hidden workflow panels are removed from keyboard and accessibility navigation.

## Verification

Automated tests must verify:

- All eight connector groups have recognizable local logo or icon markup and accurate capability labels.
- Theme captures, theme comparison videos and their controls are absent from the product-evidence section.
- All three workflow tabs and panels exist with correct accessibility relationships.
- Keyboard selection, timer reset, visibility pausing and reduced-motion behaviour work as specified.
- The no-JavaScript contract workflow remains meaningful.

Browser QA must cover 1920, 1440, 1024, 820, 390 and 360-pixel widths and confirm:

- No clipping, overlap, horizontal page overflow or unreadable text.
- Connector cards remain navigable by touch and keyboard.
- Each workflow can be selected and shows the correct evidence.
- Real motion is visible at multiple timestamps when enabled.
- Hover/focus pause and reduced-motion fallbacks work.

## Out of scope

- New live integrations or connector authentication.
- Fabricated customer data, testimonials or hours-saved figures.
- Reintroducing the theme comparison elsewhere in this iteration.
- Changes to Cloudflare, cPanel or Supabase configuration; those remain part of the separate launch-security workstream.
