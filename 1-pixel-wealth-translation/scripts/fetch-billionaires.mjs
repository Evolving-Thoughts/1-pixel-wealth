import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = resolve(__dirname, "../data/billionaires.json");

const FORBES_ENDPOINT =
  "https://www.forbes.com/forbesapi/person/rtb/0/position/true.json?limit=200";

function toUsd(finalWorthMillions) {
  return Math.round(Number(finalWorthMillions || 0) * 1_000_000);
}

async function fetchTop200() {
  const response = await fetch(FORBES_ENDPOINT, {
    headers: {
      "User-Agent": "1-pixel-wealth-global/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Forbes request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const list = payload?.personList?.personsLists;

  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Forbes response did not include a ranked person list");
  }

  const people = list
    .slice(0, 200)
    .map((item) => ({
      rank: Number(item.position || item.rank || 0),
      name: item.personName || item.person?.name || "Unknown",
      wealthUsd: toUsd(item.finalWorth),
      country: item.countryOfCitizenship || null,
      source: item.source || null,
      profileUrl: item.uri ? `https://www.forbes.com/profile/${item.uri}/` : null,
    }))
    .sort((a, b) => a.rank - b.rank);

  const totalWealthUsd = people.reduce((sum, p) => sum + p.wealthUsd, 0);

  return {
    source: "Forbes Real-Time Billionaires",
    sourceUrl: "https://www.forbes.com/real-time-billionaires/",
    fetchedAt: new Date().toISOString(),
    count: people.length,
    totalWealthUsd,
    people,
  };
}

async function main() {
  const data = await fetchTop200();
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  process.stdout.write(
    `Updated ${outputPath} with ${data.count} people and ${data.totalWealthUsd} USD total wealth.\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
