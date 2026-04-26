import fs from "fs";
import path from "path";
import Parser from "rss-parser";

const parser = new Parser();

// ---------- CONFIG ----------
const DATA_DIR = path.resolve("./data");
const OUTPUT_FILE = path.join(DATA_DIR, "all-cities.json");

const MAX_PER_FEED = 15;
const MAX_PER_SECTION = 25;

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

// sections we output
const SECTIONS = [
  "front",
  "local",
  "crime",
  "events",
  "community_help",
  "business",
  "sports",
  "opinion",
  "feature",
  "technology",
  "jobs",
  "cars_trucks",
  "apps",
  "ad_slot",
  "legal"
];

// search sources per section
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
  ],
  feature: [
    q => googleNewsUrl(`${q} human interest`),
    q => googleNewsUrl(`${q} community profile`),
    q => googleNewsUrl(`${q} spotlight story`)
  ],
  technology: [
    q => googleNewsUrl(`${q} technology`),
    q => googleNewsUrl(`${q} tech startups`),
    q => googleNewsUrl(`${q} innovation`)
  ],
  jobs: [
    q => googleNewsUrl(`${q} jobs`),
    q => googleNewsUrl(`${q} hiring`),
    q => googleNewsUrl(`${q} employment opportunities`)
  ],
  cars_trucks: [
    q => googleNewsUrl(`${q} cars for sale`),
    q => googleNewsUrl(`${q} used trucks for sale`)
  ]
};

function googleNewsUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-US&gl=US&ceid=US:en`;
}

// ---------- CORE RUN ----------
async function run() {
  ensureDataDir();

  console.log("🚀 HOOD NEWS ENGINE — START");
  const startedAt = Date.now();

  const citiesData = await Promise.all(CITIES.map(buildCityRecord));

  const payload = {
    generatedAt: new Date().toISOString(),
    runtimeSeconds: ((Date.now() - startedAt) / 1000).toFixed(1),
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

// ---------- CITY ----------
async function buildCityRecord(cityName) {
  const cityId = cityName.toLowerCase().replace(/\s+/g, "-");
  console.log(`\n🔍 City: ${cityName}`);

  const baseSections = await buildNewsSections(cityName);

  // front page: pick main + runner_up + previews
  const frontArticles = baseSections.front || [];
  const main = frontArticles[0] || null;
  const runner = frontArticles[1] || null;

  const jobsFull = baseSections.jobs || [];
  const jobsPreview = jobsFull.slice(0, 4);

  const eventsFull = baseSections.events || [];
  const eventsPreview = eventsFull.slice(0, 3);

  const sections = {
    front: {
      main,
      runner_up: runner,
      preview_jobs: jobsPreview,
      preview_events: eventsPreview
    },
    local: wrapSection(baseSections.local),
    crime: wrapSection(baseSections.crime),
    events: wrapSection(baseSections.events),
    community_help: wrapSection(baseSections.community_help),
    business: wrapSection(baseSections.business),
    sports: wrapSection(baseSections.sports),
    opinion: wrapSection(baseSections.opinion),
    feature: wrapSection(baseSections.feature),
    technology: {
      enabled: false,
      articles: baseSections.technology || [],
      image: firstImage(baseSections.technology)
    },
    jobs: {
      preview: jobsPreview,
      full: jobsFull
    },
    cars_trucks: {
      listings: baseSections.cars_trucks || []
    },
    apps: {
      enabled: false,
      items: []
    },
    ad_slot: {
      enabled: false,
      content: {
        title: "",
        image: "",
        link: ""
      }
    },
    legal: {
      sources: [
        "Google News",
        "Original publishers linked in each article"
      ],
      disclaimer:
        "All headlines and snippets link to original sources. Images and videos are embedded via source URLs only."
    }
  };

  return {
    id: cityId,
    name: cityName,
    sections
  };
}

function wrapSection(articles) {
  return {
    articles: articles || [],
    image: firstImage(articles)
  };
}

function firstImage(articles) {
  if (!articles || !articles.length) return "";
  const withImg = articles.find(a => a.image);
  return withImg ? withImg.image : "";
}

// ---------- SECTION SCRAPING ----------
async function buildNewsSections(cityName) {
  const out = {};
  const base = cityName;

  for (const section of Object.keys(SECTION_SOURCES)) {
    const urls = SECTION_SOURCES[section].map(fn => fn(base));
    const allItems = [];

    for (const url of urls) {
      const items = await fetchRss(url, cityName, section);
      allItems.push(...items);
    }

    const deduped = dedupeArticles(allItems).slice(0, MAX_PER_SECTION);
    out[section] = deduped;
  }

  return out;
}

async function fetchRss(url, cityName, section) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || [])
      .slice(0, MAX_PER_FEED)
      .map(item => normalizeArticle(item, cityName, section));
  } catch (e) {
    console.error(`   ❌ RSS fail [${cityName} / ${section}]`, e.message);
    return [];
  }
}

function normalizeArticle(item, cityName, section) {
  const title = (item.title || "").trim();
  const snippet = (item.contentSnippet || "").trim();
  const link = (item.link || "").trim();

  return {
    id: hashId(`${cityName}|${section}|${title}|${link}`),
    title,
    snippet,
    link,
    image: null,   // placeholder for OG:image URL if you add HTML scraping later
    video: null,   // placeholder for video embed URL
    source: "Google News",
    city: cityName,
    section,
    publishedAt: item.isoDate || item.pubDate || null
  };
}

function hashId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return `a${Math.abs(hash)}`;
}

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
