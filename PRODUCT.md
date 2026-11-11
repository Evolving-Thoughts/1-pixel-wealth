# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Broad general public, arriving mostly via shared links and social media, often on a phone. They are curious, not experts, and want a felt sense of how extreme billionaire wealth is, not a data table.

## Product Purpose
1 Pixel Wealth is a scrollytelling page that visualizes wealth at true scale. Success is that a visitor leaves with an intuitive, physical sense of the size of billionaire fortunes compared with everyday amounts, by scrolling through them.

## Positioning
The scale is literal and constant: 1 square pixel = $1,000 (`DOLLARS_PER_PIXEL = 1000` in main.js). Bar height is `wealth / (barWidth * DOLLARS_PER_PIXEL)`, so scroll distance varies with the viewport-driven bar width while the area-to-dollar ratio never changes. The scroll distance itself conveys the magnitude, so no chart, tooltip or statistic can replace it.

## Operating Context
Vanilla HTML/CSS/JS with no framework, served statically. Story and comparison content comes from `data/story.json`. Wealth figures come from `data/billionaires.json`, a Forbes World's Billionaires snapshot refreshed with `npm run update:wealth`. Locally: `npm run serve` (http://localhost:8080/, /de/). There is a share button and a language menu.

## Capabilities and Constraints
- Segmented rendering of very tall bars; counters, ticker and comparisons in main.js.
- Bilingual: English at the root, German under `de/` (i18n.js, de/i18n_de.js). Both languages must stay equal in quality.
- Mobile first. Long messages are already split for readability on small screens.
- Social preview metadata exists (share image, titles).
- Open: no build step or framework is decided or needed.

## Brand Commitments
- **1 (square) pixel = $1,000 must never change.** It is the core of the product.
- The page credits its inspiration ("inspired by" link in the title screen).

## Evidence on Hand
- `data/billionaires.json`: Forbes 2026 snapshot (2026-03-10), top entries plus totals for all 3,428 billionaires.
- `data/story.json`: narrative and comparison definitions.
- No testimonials, press or usage numbers exist; do not invent any.

## Product Principles
- The scale is the message: nothing may distort or interrupt the true-scale scroll.
- Let the numbers speak; tone stays factual.
- Mobile first, German and English equal.
- Every figure traces back to a named source and snapshot date.

## Accessibility & Inclusion
Target WCAG AA: sufficient contrast, keyboard operability, and respect for reduced-motion preferences. Applies to both languages.
