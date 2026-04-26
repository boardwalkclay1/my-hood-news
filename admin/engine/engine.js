import fs from "fs";
import path from "path";
import Parser from "rss-parser";

const parser = new Parser();

// ---------- CONFIG ----------
const DATA_DIR = path.resolve("./data");
const OUTPUT_FILE = path.join(DATA_DIR, "all-cities.json");

// 50 cities (you can expand/change later)
const CITIES = [
  "Atlanta", "Detroit", "Chicago", "Houston", "Los Angeles",
  "Philadelphia", "Baltimore", "Oakland", "Memphis", "New Orleans",
  "Cleveland", "St. Louis", "Milwaukee", "Birmingham", "Jacksonville",
  "Miami", "Dallas", "Fort Worth", "San Antonio", "Phoenix",
  "Las Vegas", "Kansas City", "Cincinnati", "Pittsburgh", "Richmond",
  "Charlotte", "Raleigh", "Indianapolis", "Columbus", "Louisville",
  "Tulsa", "Oklahoma City", "Baton Rouge", "Shreveport", "Flint",
  "Gary", "Camden", "Newark", "Trenton", "Buffalo",
  "Rochester", "Syracuse", "Hartford", "Bridgeport", "Stockton",
  "Fresno", "Compton", "Inglewood", "East St. Louis", "Paterson"
];

// Sections we care about
const SECTIONS = [
  "front",
  "local",
  "crime",
  "sports",
  "business",
  "opinion",
  "community"
];

// Map section -> search query suffix
const SECTION_QUERIES = {
  front: "",
  local: " local news",
  crime: " crime",
  sports: " sports",
  business: " business",
  opinion: " opinion",
  community: " community events"
};

// ---------- CORE ENGINE ----------
async function run() {
  ensureDataDir();

  const citiesData = [];

  for (const cityName of CITIES) {
    console.log(`🔍 Scraping ${cityName}...`);
    const cityId = cityName.toLowerCase().replace(/\s+/g, "-");

    const sections = {};
    for (const section of SECTIONS) {
      const articles = await scrapeSection(cityName, section);
      sections[section] = articles;
    }

    citiesData.push({
      id: cityId,
      name: cityName,
      sections
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    cities: citiesData
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`✅ Wrote ${OUTPUT_FILE}`);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ---------- SCRAPING ----------
async function scrapeSection(cityName, section) {
  const suffix = SECTION_QUERIES[section] || "";
  const query = `${cityName}${suffix}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 10).map(item => ({
      title: item.title || "",
      snippet: item.contentSnippet || "",
      link: item.link || "",
      source: "Google News",
      city: cityName,
      section
    }));
  } catch (e) {
    console.error(`❌ Failed section "${section}" for ${cityName}:`, e.message);
    return [];
  }
}

// ---------- RUN ----------
run().catch(err => {
  console.error("Engine failed:", err);
  process.exit(1);
});
