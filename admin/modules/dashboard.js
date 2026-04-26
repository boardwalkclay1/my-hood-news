// CONFIG: adjust paths later to match your repo layout
const ALL_CITIES_URL = "/admin-data/all-cities.json";
const USERS_URL = "/admin-data/users.json";

const state = {
  cities: [],          // [{ id, name, sections: {...} }]
  users: [],           // [{ name, email, subscribed, purchases }]
  selectedCityIds: [], // multi-select
  currentSection: "front",
  maxArticles: 4
};

export function render() {
  const root = document.createElement("div");
  root.className = "dashboard-grid";

  const citiesPanel = buildCitiesPanel();
  const editorPanel = buildEditorPanel();
  const usersPanel = buildUsersPanel();

  root.appendChild(citiesPanel);
  root.appendChild(editorPanel);
  root.appendChild(usersPanel);

  loadData(citiesPanel, editorPanel, usersPanel);

  return root;
}

// ---------- DATA LOADING ----------
async function loadData(citiesPanel, editorPanel, usersPanel) {
  try {
    const [citiesRes, usersRes] = await Promise.all([
      fetch(ALL_CITIES_URL),
      fetch(USERS_URL)
    ]);

    const citiesJson = await citiesRes.json();
    const usersJson = await usersRes.json();

    state.cities = (citiesJson.cities || []).slice().sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    state.users = usersJson.users || [];

    renderCityList(citiesPanel);
    renderStats(usersPanel);
    renderUsers(usersPanel);
    renderArticles(editorPanel);
  } catch (e) {
    console.error("Admin data load failed:", e);
  }
}

// ---------- CITIES PANEL ----------
function buildCitiesPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";

  const header = document.createElement("div");
  header.className = "panel-header";

  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "Cities";

  const sub = document.createElement("div");
  sub.className = "panel-sub";
  sub.textContent = "Click or multi-select to edit";

  header.appendChild(title);
  header.appendChild(sub);

  const list = document.createElement("ul");
  list.className = "city-list";
  list.dataset.role = "city-list";

  panel.appendChild(header);
  panel.appendChild(list);

  return panel;
}

function renderCityList(panel) {
  const list = panel.querySelector('[data-role="city-list"]');
  list.innerHTML = "";

  state.cities.forEach(city => {
    const li = document.createElement("li");
    li.className = "city-list-item";
    li.dataset.cityId = city.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("click", e => {
      e.stopPropagation();
      toggleCitySelection(city.id, checkbox.checked);
    });

    const label = document.createElement("span");
    label.textContent = city.name;

    li.appendChild(checkbox);
    li.appendChild(label);

    li.addEventListener("click", () => {
      const isSelected = state.selectedCityIds.includes(city.id);
      toggleCitySelection(city.id, !isSelected);
      checkbox.checked = !isSelected;
    });

    list.appendChild(li);
  });

  syncCityActiveClasses(list);
}

function toggleCitySelection(cityId, selected) {
  if (selected) {
    if (!state.selectedCityIds.includes(cityId)) {
      state.selectedCityIds.push(cityId);
    }
  } else {
    state.selectedCityIds = state.selectedCityIds.filter(id => id !== cityId);
  }
  const list = document.querySelector(".city-list");
  syncCityActiveClasses(list);
  const editorPanel = document.querySelector('[data-role="editor-panel"]');
  if (editorPanel) renderArticles(editorPanel);
}

function syncCityActiveClasses(list) {
  const items = list.querySelectorAll(".city-list-item");
  items.forEach(li => {
    const id = li.dataset.cityId;
    li.classList.toggle("active", state.selectedCityIds.includes(id));
  });
}

// ---------- EDITOR PANEL ----------
function buildEditorPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.dataset.role = "editor-panel";

  const header = document.createElement("div");
  header.className = "panel-header";

  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "Articles";

  const controls = document.createElement("div");
  controls.className = "bulk-controls";

  const sectionSelect = document.createElement("select");
  ["front", "local", "crime", "sports", "business", "opinion", "community"].forEach(sec => {
    const opt = document.createElement("option");
    opt.value = sec;
    opt.textContent = sec.toUpperCase();
    sectionSelect.appendChild(opt);
  });
  sectionSelect.value = state.currentSection;
  sectionSelect.addEventListener("change", () => {
    state.currentSection = sectionSelect.value;
    renderArticles(panel);
  });

  const applyAllBtn = document.createElement("button");
  applyAllBtn.textContent = "Apply edits to all selected cities";
  applyAllBtn.addEventListener("click", () => applyBulkEdits(panel));

  controls.appendChild(sectionSelect);
  controls.appendChild(applyAllBtn);

  const articleList = document.createElement("div");
  articleList.className = "article-list";
  articleList.dataset.role = "article-list";

  header.appendChild(title);
  header.appendChild(controls);
  panel.appendChild(header);
  panel.appendChild(articleList);

  return panel;
}

function renderArticles(panel) {
  const list = panel.querySelector('[data-role="article-list"]');
  list.innerHTML = "";

  if (state.selectedCityIds.length === 0) {
    list.innerHTML = `<div style="font-size:12px;opacity:.6;">Select one or more cities to view/edit articles.</div>`;
    return;
  }

  const primaryCityId = state.selectedCityIds[0];
  const city = state.cities.find(c => c.id === primaryCityId);
  if (!city || !city.sections || !city.sections[state.currentSection]) {
    list.innerHTML = `<div style="font-size:12px;opacity:.6;">No data for ${state.currentSection.toUpperCase()} in ${city ? city.name : "city"}.</div>`;
    return;
  }

  const articles = city.sections[state.currentSection].slice(0, state.maxArticles);

  articles.forEach((article, index) => {
    const card = document.createElement("div");
    card.className = "article-card";
    card.dataset.articleIndex = index;

    const meta = document.createElement("div");
    meta.className = "article-meta";
    meta.innerHTML = `
      <span>${city.name} — ${state.currentSection.toUpperCase()}</span>
      <span>#${index + 1}</span>
    `;

    const titleInput = document.createElement("input");
    titleInput.value = article.title || "";
    titleInput.placeholder = "Title";

    const snippetArea = document.createElement("textarea");
    snippetArea.value = article.snippet || "";
    snippetArea.placeholder = "Snippet / body";

    const linkInput = document.createElement("input");
    linkInput.value = article.link || "";
    linkInput.placeholder = "Source link";

    card.appendChild(meta);
    card.appendChild(titleInput);
    card.appendChild(snippetArea);
    card.appendChild(linkInput);

    list.appendChild(card);
  });
}

function applyBulkEdits(panel) {
  if (state.selectedCityIds.length === 0) return;

  const list = panel.querySelector('[data-role="article-list"]');
  const cards = Array.from(list.querySelectorAll(".article-card"));

  const edits = cards.map(card => {
    const index = Number(card.dataset.articleIndex);
    const [titleInput, snippetArea, linkInput] = card.querySelectorAll("input, textarea");
    return {
      index,
      title: titleInput.value,
      snippet: snippetArea.value,
      link: linkInput.value
    };
  });

  state.selectedCityIds.forEach(cityId => {
    const city = state.cities.find(c => c.id === cityId);
    if (!city || !city.sections || !city.sections[state.currentSection]) return;

    edits.forEach(e => {
      const target = city.sections[state.currentSection][e.index];
      if (!target) return;
      target.title = e.title;
      target.snippet = e.snippet;
      target.link = e.link;
    });
  });

  // At this point, state.cities is mutated.
  // Later, you can wire this to save back to JSON via Node/GitHub.
  console.log("Bulk edits applied to cities:", state.selectedCityIds);
}

// ---------- USERS PANEL ----------
function buildUsersPanel() {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.dataset.role = "users-panel";

  const header = document.createElement("div");
  header.className = "panel-header";

  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "Users & Subscriptions";

  const sub = document.createElement("div");
  sub.className = "panel-sub";
  sub.textContent = "Signups, subscribers, purchasers";

  header.appendChild(title);
  header.appendChild(sub);

  const statsRow = document.createElement("div");
  statsRow.className = "stats-row";
  statsRow.dataset.role = "stats-row";

  const usersList = document.createElement("div");
  usersList.className = "users-list";
  usersList.dataset.role = "users-list";

  panel.appendChild(header);
  panel.appendChild(statsRow);
  panel.appendChild(usersList);

  return panel;
}

function renderStats(panel) {
  const row = panel.querySelector('[data-role="stats-row"]');
  row.innerHTML = "";

  const total = state.users.length;
  const subs = state.users.filter(u => u.subscribed).length;
  const buyers = state.users.filter(u => (u.purchases || 0) > 0).length;

  row.appendChild(buildStatBox("Total Users", total));
  row.appendChild(buildStatBox("Subscribers", subs));
  row.appendChild(buildStatBox("Purchasers", buyers));
}

function buildStatBox(label, value) {
  const box = document.createElement("div");
  box.className = "stat-box";

  const l = document.createElement("div");
  l.className = "stat-label";
  l.textContent = label;

  const v = document.createElement("div");
  v.className = "stat-value";
  v.textContent = value;

  box.appendChild(l);
  box.appendChild(v);
  return box;
}

function renderUsers(panel) {
  const list = panel.querySelector('[data-role="users-list"]');
  list.innerHTML = "";

  state.users.forEach(u => {
    const row = document.createElement("div");
    row.className = "user-row";

    const left = document.createElement("div");
    left.className = "user-name";
    left.textContent = u.name || u.email || "Unknown";

    const right = document.createElement("div");
    right.className = "user-meta";
    right.textContent = `${u.subscribed ? "Subscribed" : "Free"} • Purchases: ${u.purchases || 0}`;

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  });
}
