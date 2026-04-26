// ===============================
// HOOD NEWS — PUBLIC NEWSPAPER JS
// ===============================

// Path to the master JSON (source of truth)
const DATA_URL = "../admin/engine/data/all-cities.json";

// Global state
const state = {
  data: null,
  selectedCity: null,
  pages: []
};

// DOM elements
const citySelect = document.getElementById("city-select");
const newspaperContainer = document.getElementById("newspaper");

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  populateCityDropdown();
  setupCityChangeHandler();
});

// ===============================
// LOAD MASTER JSON
// ===============================
async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    state.data = await res.json();
  } catch (err) {
    console.error("Failed to load newspaper data:", err);
  }
}

// ===============================
// POPULATE CITY DROPDOWN
// ===============================
function populateCityDropdown() {
  if (!state.data || !state.data.cities) return;

  const cities = state.data.cities.slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city.id;
    opt.textContent = city.name;
    citySelect.appendChild(opt);
  });
}

// ===============================
// CITY CHANGE HANDLER
// ===============================
function setupCityChangeHandler() {
  citySelect.addEventListener("change", () => {
    const id = citySelect.value;
    const city = state.data.cities.find(c => c.id === id);
    if (!city) return;

    state.selectedCity = city;
    renderNewspaper(city);
  });
}

// ===============================
// RENDER NEWSPAPER (7 PAGES)
// ===============================
function renderNewspaper(city) {
  newspaperContainer.innerHTML = ""; // clear old pages

  const pages = [];

  // PAGE 1 — FRONT PAGE
  pages.push(renderPage1(city));

  // PAGE 2 — LOCAL + CRIME
  pages.push(renderTwoColumnPage(city, "local", "crime"));

  // PAGE 3 — EVENTS + COMMUNITY HELP
  pages.push(renderTwoColumnPage(city, "events", "community_help"));

  // PAGE 4 — BUSINESS + SPORTS
  pages.push(renderTwoColumnPage(city, "business", "sports"));

  // PAGE 5 — OPINION + FEATURE
  pages.push(renderTwoColumnPage(city, "opinion", "feature"));

  // PAGE 6 — TECHNOLOGY + JOBS
  pages.push(renderTechJobsPage(city));

  // PAGE 7 — CARS & TRUCKS + OPTIONAL SECTIONS
  pages.push(renderMarketplacePage(city));

  // Append all pages
  pages.forEach(page => newspaperContainer.appendChild(page));

  state.pages = pages;
}

// ===============================
// PAGE 1 — FRONT PAGE
// ===============================
function renderPage1(city) {
  const sec = city.sections.front;

  const page = createPage("front-page");

  page.innerHTML = `
    <div class="front-main">
      <h1>${sec.main?.title || "No main story"}</h1>
      ${renderImage(sec.main?.image)}
      <p>${sec.main?.snippet || ""}</p>
      <a href="${sec.main?.link}" target="_blank">Read more</a>
    </div>

    <div class="front-runner">
      <h2>${sec.runner_up?.title || "No runner-up story"}</h2>
      ${renderImage(sec.runner_up?.image)}
      <p>${sec.runner_up?.snippet || ""}</p>
      <a href="${sec.runner_up?.link}" target="_blank">Read more</a>
    </div>

    <div class="front-previews">
      <div class="jobs-preview">
        <h3>Jobs Preview</h3>
        ${renderList(sec.preview_jobs)}
      </div>

      <div class="events-preview">
        <h3>Events Preview</h3>
        ${renderList(sec.preview_events)}
      </div>
    </div>
  `;

  return page;
}

// ===============================
// GENERIC TWO-COLUMN PAGE
// ===============================
function renderTwoColumnPage(city, leftKey, rightKey) {
  const left = city.sections[leftKey];
  const right = city.sections[rightKey];

  const page = createPage(`${leftKey}-${rightKey}`);

  page.innerHTML = `
    <div class="column">
      <h2>${capitalize(leftKey)}</h2>
      ${renderImage(left.image)}
      ${renderList(left.articles)}
    </div>

    <div class="column">
      <h2>${capitalize(rightKey)}</h2>
      ${renderImage(right.image)}
      ${renderList(right.articles)}
    </div>
  `;

  return page;
}

// ===============================
// PAGE 6 — TECHNOLOGY + JOBS
// ===============================
function renderTechJobsPage(city) {
  const tech = city.sections.technology;
  const jobs = city.sections.jobs;

  const page = createPage("tech-jobs");

  page.innerHTML = `
    <div class="column">
      <h2>Technology</h2>
      ${tech.enabled ? renderList(tech.articles) : "<p>Technology section disabled</p>"}
    </div>

    <div class="column">
      <h2>Jobs</h2>
      ${renderList(jobs.full)}
    </div>
  `;

  return page;
}

// ===============================
// PAGE 7 — CARS & TRUCKS + OPTIONAL SECTIONS
// ===============================
function renderMarketplacePage(city) {
  const cars = city.sections.cars_trucks;
  const apps = city.sections.apps;
  const ad = city.sections.ad_slot;

  const page = createPage("marketplace");

  page.innerHTML = `
    <div class="column">
      <h2>Cars & Trucks</h2>
      ${renderList(cars.listings)}
    </div>

    <div class="column">
      <h2>Extras</h2>

      <div class="extra-section">
        <h3>Your Ad Here</h3>
        ${ad.enabled ? renderAd(ad.content) : "<p>No ad purchased</p>"}
      </div>

      <div class="extra-section">
        <h3>Apps & Products</h3>
        ${apps.enabled ? renderApps(apps.items) : "<p>No apps added</p>"}
      </div>

      <div class="extra-section">
        <h3>Legal</h3>
        ${renderLegal(city.sections.legal)}
      </div>
    </div>
  `;

  return page;
}

// ===============================
// HELPERS
// ===============================
function createPage(className) {
  const div = document.createElement("div");
  div.className = `newspaper-page ${className}`;
  return div;
}

function renderImage(url) {
  if (!url) return "";
  return `<img src="${url}" class="article-image">`;
}

function renderList(items = []) {
  if (!items.length) return "<p>No items available.</p>";

  return `
    <ul class="article-list">
      ${items
        .map(
          item => `
        <li>
          <strong>${item.title || "Untitled"}</strong>
          <p>${item.snippet || ""}</p>
          <a href="${item.link}" target="_blank">Read more</a>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

function renderApps(apps) {
  return `
    <ul class="apps-list">
      ${apps
        .map(
          app => `
        <li>
          <strong>${app.name}</strong>
          <p>${app.description}</p>
          <a href="${app.link}" target="_blank">Open</a>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

function renderAd(ad) {
  if (!ad || !ad.title) return "<p>No ad</p>";

  return `
    <div class="ad-box">
      <h4>${ad.title}</h4>
      ${renderImage(ad.image)}
      <a href="${ad.link}" target="_blank">Visit</a>
    </div>
  `;
}

function renderLegal(legal) {
  return `
    <p>${legal.disclaimer}</p>
    <ul>
      ${legal.sources.map(src => `<li>${src}</li>`).join("")}
    </ul>
  `;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
