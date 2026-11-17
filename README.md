# Pixel Wealth

A scrollytelling web experience that visualizes wealth at true scale: one pixel is $1,000.

**Live:** https://evolving-thoughts.github.io/pixel-wealth/ ([German version](https://evolving-thoughts.github.io/pixel-wealth/de/))

Inspired by "1 Pixel Wealth" by [Matt Korostoff](https://github.com/mkorostoff).

The page combines static markup, CSS, and vanilla JavaScript with story/content data from JSON files. There is no build step and there are no dependencies.

## Features

- True-scale wealth bars with segmented rendering for very large heights
- Story rendered from data/story.json, with a small picture for most comparisons
- Chapters that show which share of all billionaire wealth the causes so far would cost
- Death ticker that counts, in real time, the deaths from the causes on the page while you read
- Data date on the start screen
- Sources page with every figure, its source and an explanation of any extrapolation
- English and German versions
- Dark mode (follows the system setting by default, with a switch on the start screen)
- Respects reduced motion settings

## Project Structure

- index.html: Main page shell
- main.js: Rendering, data loading, comparisons, counters, ticker and theme logic
- main.css: Layout and visual styling, including dark mode
- viz.js: Pictures for the individual comparisons
- data/story.json: Story narrative, comparison/cause definitions and calculation notes
- data/billionaires.json: Wealth data used for the bars and totals
- sources.html, sources.js: Sources page, built from data/story.json
- privacy.html, de/datenschutz.html: Privacy policy
- de/index.html, de/sources.html: German entry pages
- de/i18n_de.js: German translation dictionary
- i18n.js: Locale page translation loader
- fonts/: Archivo, self-hosted (SIL Open Font License, see fonts/OFL.txt)
- img/, de/img/: Preview images for sharing
- scripts/fetch-billionaires.mjs: Script to refresh billionaire data

## Local Development

Requires Node.js 18+ (only to run a local server).

```bash
npm run serve
```

Then open:

- http://localhost:8080/
- http://localhost:8080/de/

## Wealth Data

The page uses the **Forbes World's Billionaires annual list** (currently 2026, as of March 10, 2026).

From March to May, the workflow in .github/workflows/daily-wealth-update.yml checks once a day whether Forbes has published a new annual list. If it has, it opens a pull request with the new numbers and date, and a checklist of texts that are written for the old numbers (chapter percentages, last year's growth, "$20 trillion"). Check those, then merge.

To check by hand:

```bash
npm run update:wealth
```

It only changes data/billionaires.json when a newer list exists. `npm run update:wealth -- 2027` checks a given year, `-- --force` rewrites the file even if the list is not newer.

## Sources

Every figure on the page links to its source. The sources page (sources.html, German: de/sources.html) lists them all in one place, together with explanations of calculations such as yearly costs extrapolated to 2030 or shares of the world population.

## i18n Notes

- The default content is sourced from data/story.json.
- German overrides live in de/i18n_de.js.
- Missing keys in German gracefully fall back to the default text from the source content.
