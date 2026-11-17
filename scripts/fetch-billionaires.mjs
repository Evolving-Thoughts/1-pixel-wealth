// Checks whether Forbes has published a new annual billionaires list and, if so,
// rewrites data/billionaires.json with its numbers and date.
//
//   node scripts/fetch-billionaires.mjs            check the current year (and the year before)
//   node scripts/fetch-billionaires.mjs 2027       check a given year
//   node scripts/fetch-billionaires.mjs --force    rewrite even if the list is not newer
//
// In GitHub Actions it also writes `updated`, `year` and `date` to $GITHUB_OUTPUT and a
// pull request description to wealth-update-pr.md, so the workflow can open a PR.
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../data/billionaires.json");
const prBodyPath = resolve(__dirname, "../wealth-update-pr.md");

const FIELDS = "personName,finalWorth,rank,position,date,countryOfCitizenship,source";
const FETCH_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3_000;
const TOP_PEOPLE = 10;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const millionsToUsd = (m) => Math.round(Number(m || 0) * 1_000_000);
const trillions = (usd) => (usd / 1e12).toFixed(2);

function listUrl(year) {
  return `https://www.forbes.com/forbesapi/person/billionaires/${year}/position/true.json?fields=${FIELDS}&limit=10000`;
}

async function fetchJson(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "pixel-wealth/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Forbes request failed: ${response.status} ${response.statusText}`);
      return await response.json();
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      const wait = RETRY_DELAY_MS * (attempt + 1);
      process.stderr.write(`Attempt ${attempt + 1} failed (${err.message}), retrying in ${wait} ms…\n`);
      await delay(wait);
    }
  }
}

// The annual list for one year, or null while Forbes has not published it yet.
async function fetchAnnualList(year) {
  const payload = await fetchJson(listUrl(year));
  const list = payload?.personList?.personsLists;
  if (!Array.isArray(list)) throw new Error(`Unexpected Forbes response for ${year}: no personList.personsLists`);
  if (list.length === 0) return null;

  const billionaires = list.filter((p) => Number(p.finalWorth) >= 1000); // finalWorth is in millions
  const people = billionaires
    .map((p) => ({
      rank: Number(p.position || p.rank || 0),
      name: String(p.personName || "Unknown"),
      wealthUsd: millionsToUsd(p.finalWorth),
      country: p.countryOfCitizenship || null,
      source: p.source || null,
    }))
    .sort((a, b) => a.rank - b.rank || b.wealthUsd - a.wealthUsd);

  const dates = list.map((p) => Number(p.date)).filter(Number.isFinite);
  const snapshotDate = dates.length ? new Date(Math.max(...dates)).toISOString().slice(0, 10) : `${year}-01-01`;

  // Sanity checks, so a broken response never replaces good data.
  if (billionaires.length < 1000) throw new Error(`Only ${billionaires.length} billionaires in the ${year} list, looks incomplete`);
  if (!people[0].wealthUsd) throw new Error(`No wealth figure for the richest person in ${year}`);

  const top = people.slice(0, TOP_PEOPLE);
  return {
    source: `Forbes World's Billionaires ${year} (Annual List)`,
    sourceUrl: "https://www.forbes.com/billionaires/",
    listYear: year,
    snapshotDate,
    count: top.length,
    totalWealthUsd: top.reduce((s, p) => s + p.wealthUsd, 0),
    allBillionairesCount: billionaires.length,
    allBillionairesTotalUsd: people.reduce((s, p) => s + p.wealthUsd, 0),
    people: top,
  };
}

async function readCurrent() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return null;
  }
}

async function setOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`).join("\n");
  await appendFile(process.env.GITHUB_OUTPUT, `${lines}\n`, "utf8");
}

function prBody(next, current, previousTotalUsd) {
  const growth = previousTotalUsd ? next.allBillionairesTotalUsd - previousTotalUsd : null;
  const row = (label, before, after) => `| ${label} | ${before} | ${after} |`;
  const c = current || {};
  return [
    `Forbes has published the ${next.listYear} billionaires list. This PR updates \`data/billionaires.json\`.`,
    "",
    "| | Before | New |",
    "|---|---|---|",
    row("Date", c.snapshotDate || "–", next.snapshotDate),
    row("Billionaires", c.allBillionairesCount ?? "–", next.allBillionairesCount),
    row("Total wealth", c.allBillionairesTotalUsd ? `$${trillions(c.allBillionairesTotalUsd)}T` : "–", `$${trillions(next.allBillionairesTotalUsd)}T`),
    row("Richest person", c.people?.[0] ? `${c.people[0].name}, $${(c.people[0].wealthUsd / 1e9).toFixed(0)}B` : "–", `${next.people[0].name}, $${(next.people[0].wealthUsd / 1e9).toFixed(0)}B`),
    growth !== null ? row(`Growth since ${next.listYear - 1} list`, "", `$${trillions(growth)}T`) : "",
    "",
    "Numbers, totals, the richest person's name and the date update by themselves. **These texts are written for the old numbers and need checking before merging:**",
    "",
    "- [ ] Chapter percentages (\"less than 20%\", \"~53%\": `chapterPct` in `data/story.json`)",
    "- [ ] \"…got richer by about $4 trillion last year\" and \"~2 trillion\" (`all-human-focused-causes-combined-3`, `cost-interval`) and picture 95 (`COSTS`, `GROWTH` in `viz.js`)",
    "- [ ] \"You don't have $20 trillion\" near the end",
    "- [ ] \"Elon Musk's wealth has increased…\" in the scroll counter, if the richest person changed",
    "- [ ] Each change also in `de/i18n_de.js`",
    "",
    "🤖 Opened by the Wealth Data Update workflow",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const yearArg = args.find((a) => /^\d{4}$/.test(a));
  const thisYear = new Date().getUTCFullYear();
  const years = yearArg ? [Number(yearArg)] : [thisYear, thisYear - 1];

  const current = await readCurrent();
  let next = null;
  for (const year of years) {
    process.stdout.write(`Checking Forbes list ${year}… `);
    next = await fetchAnnualList(year);
    process.stdout.write(next ? `found, dated ${next.snapshotDate}\n` : "not published yet\n");
    if (next) break;
  }

  if (!next) {
    await setOutput({ updated: "false" });
    return;
  }
  if (!force && current?.snapshotDate && next.snapshotDate <= current.snapshotDate) {
    process.stdout.write(`Nothing new: the page already uses the list dated ${current.snapshotDate}.\n`);
    await setOutput({ updated: "false" });
    return;
  }

  let previousTotalUsd = null;
  try {
    previousTotalUsd = (await fetchAnnualList(next.listYear - 1))?.allBillionairesTotalUsd ?? null;
  } catch (err) {
    process.stderr.write(`Could not load the ${next.listYear - 1} list for comparison: ${err.message}\n`);
  }

  await writeFile(outputPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await writeFile(prBodyPath, `${prBody(next, current, previousTotalUsd)}\n`, "utf8");
  process.stdout.write(
    `Updated data/billionaires.json: ${next.allBillionairesCount} billionaires, $${trillions(next.allBillionairesTotalUsd)}T, as of ${next.snapshotDate}.\n`
  );
  await setOutput({ updated: "true", year: String(next.listYear), date: next.snapshotDate });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
