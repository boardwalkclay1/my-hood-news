const DATA_URL = "../admin/engine/data/all-cities.json";
const TOTAL_PAGES = 7;

const state = {
  data: null,
  cities: [],
  currentCity: null,
  currentPage: 1,
  saved: []
};

document.addEventListener("DOMContentLoaded", () => {
  initDate();
  loadSaved();
  bindUI();
  loadData();
});

function initDate() {
  const el = document.getElementById("paper-date");
  const d = new Date();
  el.textContent = d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function bindUI() {
  document.getElementById("prev-page").addEventListener("click", () => changePage(-1));
  document.getElementById("next-page").addEventListener("click", () => changePage(1));
}

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    state.data = await res.json();
    state.cities = state.data.cities || [];
    renderCityList();
    buildPagesShell();
  } catch (e) {
    console.error("Failed to load data:", e);
  }
}

function renderCityList() {
  const ul = document.getElementById("city-list");
  ul.innerHTML = "";
  state.cities
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(city => {
      const li = document.createElement("li");
      li.textContent = city.name;
      li.dataset.cityId = city.id;
      li.addEventListener("click", () => selectCity(city.id));
      ul.appendChild(li);
    });
}

function selectCity(id) {
  state.currentCity = id;
  state.currentPage = 1;
  const city = state.cities.find(c => c.id === id);
  document.getElementById("paper-city").textContent = city ? city.name.toUpperCase() : "UNKNOWN";
  highlightCity();
  renderAllPages();
  showCurrentPage();
}

function highlightCity() {
  document.querySelectorAll("#city-list li").forEach(li => {
    li.classList.toggle("active", li.dataset.cityId === state.currentCity);
  });
}

function buildPagesShell() {
  const stack = document.getElementById("page-stack");
  stack.innerHTML = "";
  for (let i = 1; i <= TOTAL_PAGES; i++) {
    const page = document.createElement("article");
    page.className = "newspaper-page";
    page.dataset.page = i;
    page.innerHTML = `
      <div class="page-inner">
        <div class="page-label">Page ${i}</div>
        <div class="page-content" data-page="${i}"></div>
      </div>
    `;
    stack.appendChild(page);
  }
  document.getElementById("page-total").textContent = TOTAL_PAGES;
}

function changePage(delta) {
  const next = state.currentPage + delta;
  if (next < 1 || next > TOTAL_PAGES) return;
  state.currentPage = next;
  showCurrentPage();
}

function showCurrentPage() {
  document.getElementById("page-current").textContent = state.currentPage;
  document.querySelectorAll(".newspaper-page").forEach(p => {
    p.classList.toggle("active", Number(p.dataset.page) === state.currentPage);
  });
  const view = document.querySelector(".paper-view");
  view.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

function renderAllPages() {
  if (!state.currentCity || !state.data) return;
  const city = state.data.cities.find(c => c.id === state.currentCity);
  if (!city) return;

  renderPage1(city);
  renderPage2(city);
  renderPage3(city);
  renderPage4(city);
  renderPage5(city);
  renderPage6(city);
  renderPage7(city);
  bindClipButtons();
}

/* PAGE 1: FRONT */
function renderPage1(city) {
  const sec = city.sections.front;
  const container = getPageContent(1);
  container.parentElement.parentElement.classList.add("front-page");

  container.innerHTML = `
    <div class="front-main">
      <h1>${sec.main?.title || "No main story"}</h1>
      ${renderImage(sec.main?.image)}
      <p class="article-body">${sec.main?.snippet || ""}</p>
      ${renderLink(sec.main?.link)}
    </div>
    <div class="front-runner">
      <h2>${sec.runner_up?.title || "No runner-up story"}</h2>
      ${renderImage(sec.runner_up?.image)}
      <p class="article-body">${sec.runner_up?.snippet || ""}</p>
      ${renderLink(sec.runner_up?.link)}
    </div>
    <div class="front-previews">
      <div>
        <h3>Jobs Preview</h3>
        ${renderList(sec.preview_jobs)}
      </div>
      <div>
        <h3>Events Preview</h3>
        ${renderList(sec.preview_events)}
      </div>
    </div>
  `;
}

/* PAGE 2: LOCAL + CRIME */
function renderPage2(city) {
  const container = getPageContent(2);
  const local = city.sections.local;
  const crime = city.sections.crime;

  container.innerHTML = `
    <div class="column">
      <h2>Local</h2>
      ${renderImage(local.image)}
      ${renderList(local.articles, "local")}
    </div>
    <div class="column">
      <h2>Crime</h2>
      ${renderImage(crime.image)}
      ${renderList(crime.articles, "crime")}
    </div>
  `;
}

/* PAGE 3: EVENTS + COMMUNITY HELP */
function renderPage3(city) {
  const container = getPageContent(3);
  const events = city.sections.events;
  const help = city.sections.community_help;

  container.innerHTML = `
    <div class="column">
      <h2>Events</h2>
      ${renderImage(events.image)}
      ${renderList(events.articles, "events")}
    </div>
    <div class="column">
      <h2>Community Help</h2>
      ${renderImage(help.image)}
      ${renderList(help.articles, "community_help")}
    </div>
  `;
}

/* PAGE 4: BUSINESS + SPORTS */
function renderPage4(city) {
  const container = getPageContent(4);
  const business = city.sections.business;
  const sports = city.sections.sports;

  container.innerHTML = `
    <div class="column">
      <h2>Business</h2>
      ${renderImage(business.image)}
      ${renderList(business.articles, "business")}
    </div>
    <div class="column">
      <h2>Sports</h2>
      ${renderImage(sports.image)}
      ${renderList(sports.articles, "sports")}
    </div>
  `;
}

/* PAGE 5: OPINION + FEATURE */
function renderPage5(city) {
  const container = getPageContent(5);
  const opinion = city.sections.opinion;
  const feature = city.sections.feature;

  container.innerHTML = `
    <div class="column">
      <h2>Opinion</h2>
      ${renderImage(opinion.image)}
      ${renderList(opinion.articles, "opinion")}
    </div>
    <div class="column">
      <h2>Feature</h2>
      ${renderImage(feature.image)}
      ${renderList(feature.articles, "feature")}
    </div>
  `;
}

/* PAGE 6: TECHNOLOGY + JOBS */
function renderPage6(city) {
  const container = getPageContent(6);
  const tech = city.sections.technology;
  const jobs = city.sections.jobs;

  container.innerHTML = `
    <div class="column">
      <h2>Technology</h2>
      ${tech.enabled ? renderList(tech.articles, "technology") : "<p>Technology section disabled.</p>"}
    </div>
    <div class="column">
      <h2>Jobs</h2>
      ${renderList(jobs.full, "jobs")}
    </div>
  `;
}

/* PAGE 7: CARS & TRUCKS + APPS/AD/LEGAL */
function renderPage7(city) {
  const container = getPageContent(7);
  const cars = city.sections.cars_trucks;
  const apps = city.sections.apps;
  const ad = city.sections.ad_slot;
  const legal = city.sections.legal;

  container.innerHTML = `
    <div class="column">
      <h2>Cars & Trucks</h2>
      ${renderList(cars.listings, "cars_trucks")}
    </div>
    <div class="column">
      <h2>Extras</h2>
      <div class="extra-section">
        <h3>Your Ad Here</h3>
        ${ad.enabled ? renderAd(ad.content) : "<p>No ad purchased.</p>"}
      </div>
      <div class="extra-section">
        <h3>Apps & Products</h3>
        ${apps.enabled ? renderApps(apps.items) : "<p>No apps added.</p>"}
      </div>
      <div class="extra-section legal-section">
        <h3>Legal</h3>
        <p>${legal.disclaimer}</p>
        <ul>
          ${legal.sources.map(s => `<li>${s}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

/* HELPERS */
function getPageContent(pageNum) {
  return document.querySelector(`.page-content[data-page="${pageNum}"]`);
}

function renderImage(url) {
  if (!url) return "";
  return `<img src="${url}" class="article-image" />`;
}

function renderLink(url) {
  if (!url) return "";
  return `<p><a href="${url}" target="_blank">Read more</a></p>`;
}

function renderList(items = [], sectionKey = "") {
  if (!items || !items.length) return "<p>No items available.</p>";
  const cityId = state.currentCity || "unknown";

  return `
    <ul class="article-list">
      ${items
        .map(item => {
          const id = `${cityId}-${sectionKey}-${item.id || Math.random().toString(36).slice(2)}`;
          return `
          <li>
            <div class="article-card">
              <div class="article-header">
                <h2>${item.title || "Untitled"}</h2>
                <button class="clip-btn" data-clip-id="${id}">Rip & Save</button>
              </div>
              <div class="article-meta">
                <span>${item.source || ""}</span>
                <span>${item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ""}</span>
              </div>
              ${renderImage(item.image)}
              <p class="article-body">${item.snippet || ""}</p>
              ${renderLink(item.link)}
            </div>
          </li>`;
        })
        .join("")}
    </ul>
  `;
}

function renderApps(apps = []) {
  if (!apps.length) return "<p>No apps.</p>";
  return `
    <ul class="apps-list">
      ${apps
        .map(
          app => `
        <li>
          <strong>${app.name}</strong><br/>
          <span>${app.description || ""}</span><br/>
          <a href="${app.link}" target="_blank">Open</a>
        </li>`
        )
        .join("")}
    </ul>
  `;
}

function renderAd(ad) {
  if (!ad || !ad.title) return "<p>No ad.</p>";
  return `
    <div class="ad-box">
      <h4>${ad.title}</h4>
      ${renderImage(ad.image)}
      ${ad.link ? `<p><a href="${ad.link}" target="_blank">Visit</a></p>` : ""}
    </div>
  `;
}

/* CLIPPING */
function bindClipButtons() {
  document.querySelectorAll(".clip-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.clipId;
      const card = btn.closest(".article-card");
      if (!card) return;

      const title = card.querySelector("h2")?.textContent || "Untitled";
      const city = state.cities.find(c => c.id === state.currentCity)?.name || "Unknown";
      const page = state.currentPage;

      saveClip({ id, title, city, page });
      applyRipEffect(card);
    };
  });
}

function saveClip(clip) {
  if (!state.saved.find(c => c.id === clip.id)) {
    state.saved.push(clip);
    persistSaved();
    renderSaved();
  }
}

function persistSaved() {
  try {
    localStorage.setItem("hoodNewsSaved", JSON.stringify(state.saved));
  } catch (e) {}
}

function loadSaved() {
  try {
    const raw = localStorage.getItem("hoodNewsSaved");
    if (raw) state.saved = JSON.parse(raw);
  } catch (e) {
    state.saved = [];
  }
  renderSaved();
}

function renderSaved() {
  const ul = document.getElementById("saved-list");
  ul.innerHTML = "";
  state.saved.forEach(clip => {
    const li = document.createElement("li");
    li.className = "saved-item";
    li.innerHTML = `
      <div class="saved-title">${clip.title}</div>
      <div class="saved-meta">${clip.city} — Page ${clip.page}</div>
    `;
    ul.appendChild(li);
  });
}

function applyRipEffect(card) {
  card.classList.add("ripped");
  setTimeout(() => {
    card.classList.add("ripped-removed");
  }, 400);
}
