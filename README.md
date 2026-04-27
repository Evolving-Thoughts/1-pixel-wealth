# 1 Pixel Wealth

A scrollytelling web experience that visualizes wealth at true scale.

The page combines static markup, CSS, and vanilla JavaScript with story/content data from JSON files.

## Features

- True-scale wealth bars with segmented rendering for very large heights
- Dynamic story rendering from data/story.json
- Dynamic billionaire data loading from data/billionaires.json
- German locale scaffold under de/
- Optional local development server and data refresh script

## Project Structure

- index.html: Main page shell
- main.js: Rendering, data loading, comparisons, counters, and ticker logic
- main.css: Layout and visual styling
- data/story.json: Story narrative and comparison/cause definitions
- data/billionaires.json: Wealth data used for the bars and totals
- de/index.html: German entry page
- de/i18n_de.js: German translation dictionary
- i18n.js: Locale page translation loader
- scripts/fetch-billionaires.mjs: Script to refresh billionaire data

## Requirements

- Node.js 18+ recommended
- npm

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start a local web server:

```bash
npm run serve
```

3. Open:

- http://localhost:8080/
- http://localhost:8080/de/

## Update Wealth Data

Run:

```bash
npm run update:wealth
```

This updates data/billionaires.json from the source configured in scripts/fetch-billionaires.mjs.

## i18n Notes

- The default content is sourced from data/story.json.
- German overrides live in de/i18n_de.js.
- Missing keys in German gracefully fall back to the default text from the source content.
