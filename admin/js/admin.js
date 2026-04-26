// MODULE REGISTRY (we will create these files later)
import * as dashboard from "./modules/dashboard.js";
import * as cities from "./modules/cities.js";
import * as editor from "./modules/editor.js";
import * as preview from "./modules/preview.js";
import * as settings from "./modules/settings.js";

const modules = { dashboard, cities, editor, preview, settings };

// DOM ELEMENTS
const navButtons = document.querySelectorAll(".admin-nav button");
const content = document.getElementById("admin-content");

// NAVIGATION HANDLER
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const mod = btn.dataset.module;

    // highlight active button
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // load module
    loadModule(mod);
  });
});

// MODULE LOADER
function loadModule(name) {
  const mod = modules[name];
  if (!mod || !mod.render) {
    content.innerHTML = `<div class="placeholder">Module "${name}" not found.</div>`;
    return;
  }

  // inject module HTML
  content.innerHTML = "";
  content.appendChild(mod.render());
}
