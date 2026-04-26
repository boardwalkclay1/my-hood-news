import fs from "fs";
import path from "path";
import Parser from "rss-parser";

const parser = new Parser();

// ---------- CONFIG ----------
const DATA_DIR = path.resolve("./data");
const OUTPUT_FILE = path.join(DATA_DIR, "all-cities.json");

// tune these if you want
const MAX_PER_FEED = 15;
const MAX_PER_SECTION = 25;

// 50 cities (can expand later)
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

// sections we care about in the JSON
const SECTIONS = [
  "front",
  "local",
  "crime",
  "jobs",
  "events",
  "community_help",
  "business",
  "sports",
  "opinion"
];

// for each section, define one or more RSS search patterns
const SECTION_SOURCES = {
  front: [
    q => googleNewsUrl(`${q} breaking news`),
    q => googleNewsUrl(`${q} top stories`)
  ],
  local: [
    q => googleNewsUrl(`${q} local news`),
    q => googleNewsUrl(`${q} neighborhood news`)
  ],
  crime: [
    q => googleNewsUrl(`${q} crime`),
    q => googleNewsUrl(`${q} shooting OR homicide OR robbery`)
  ],
  jobs: [
    q => googleNewsUrl(`${q} jobs`),
    q => googleNewsUrl(`${q} hiring`),
    q => googleNewsUrl(`${q} employment opportunities`)
  ],
  events: [
    q => googleNewsUrl(`${q} events`),
    q => googleNewsUrl(`${q} community events`),
    q => googleNewsUrl(`${q} weekend events`)
  ],
  community_help: [
    q => googleNewsUrl(`${q} community resources`),
    q => googleNewsUrl(`${q} food bank OR shelter OR assistance`),
    q => googleNewsUrl(`${q} non profit help`)
  ],
  business: [
    q => googleNewsUrl(`${q} business`),
    q => googleNewsUrl(`${q} economy`),
    q => googleNewsUrl(`${q} small business`)
  ],
  sports: [
    q => googleNewsUrl(`${q} sports`),
    q => googleNewsUrl(`${q} high school sports`)
  ],
  opinion: [
    q => googleNewsUrl(`${q} opinion`),
    q => googleNewsUrl(`${q} editorial`),
    q => googleNewsUrl(`${q} column`)
  ]
};

// ---------- URL HELPERS ----------
function googleNewsUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-US&gl=US&ceid=US:en`;
}

// ---------- CORE ENGINE ----------
async function run() {
  ensureDataDir();

  console.log("🚀 HOOD NEWS ENGINE — START");
  const startedAt = new Date();

  const cityPromises = CITIES.map(cityName => buildCityRecord(cityName));
  const citiesData = await Promise.all(cityPromises);

  const payload = {
    generatedAt: new Date().toISOString(),
    runtimeSeconds: ((Date.now() - startedAt.getTime()) / 1000).toFixed(1),
    cityCount: citiesData.length,
    sections: SECTIONS,
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

// ---------- CITY BUILDER ----------
async function buildCityRecord(cityName) {
  const cityId = cityName.toLowerCase().replace(/\s+/g, "-");
  console.log(`\n🔍 City: ${cityName}`);

  const sections = {};
  const sectionStats = {};

  for (const section of SECTIONS) {
    const articles = await buildSection(cityName, section);
    sections[section] = articles;
    sectionStats[section] = articles.length;
  }

  return {
    id: cityId,
    name: cityName,
    sections,
    stats: sectionStats
  };
}

// ---------- SECTION BUILDER ----------
async function buildSection(cityName, section) {
  const sources = SECTION_SOURCES[section] || [];
  if (!sources.length) return [];

  const queryBase = cityName;
  const urls = sources.map(fn => fn(queryBase));

  const allItems = [];
  for (const url of urls) {
    const items = await fetchRss(url, cityName, section);
    allItems.push(...items);
  }

  const deduped = dedupeArticles(allItems);
  const limited = deduped.slice(0, MAX_PER_SECTION);

  return limited;
}

// ---------- RSS FETCH ----------
async function fetchRss(url, cityName, section) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, MAX_PER_FEED).map(item => normalizeArticle(item, cityName, section));
  } catch (e) {
    console.error(`   ❌ RSS fail [${cityName} / ${section}]`, e.message);
    return [];
  }
}

// ---------- NORMALIZATION ----------
function normalizeArticle(item, cityName, section) {
  const title = (item.title || "").trim();
  const snippet = (item.contentSnippet || "").trim();
  const link = (item.link || "").trim();

  return {
    id: hashId(`${cityName}|${section}|${title}|${link}`),
    title,
    snippet,
    link,
    source: "Google News",
    city: cityName,
    section,
    publishedAt: item.isoDate || item.pubDate || null
  };
}

// simple hash to generate stable IDs
function hashId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return `a${Math.abs(hash)}`;
}

// ---------- DEDUPE ----------
function dedupeArticles(items) {
  const seen = new Set();
  const out = [];

  for (const item of items) {
    const key = (item.title || "") + "|" + (item.link || "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

// ---------- RUN ----------
run().catch(err => {
  console.error("Engine failed:", err);
  process.exit(1);
});
