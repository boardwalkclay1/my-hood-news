import * as dashboard from "./modules/dashboard.js";

const modules = { dashboard };
const content = document.getElementById("admin-content");
const navButtons = document.querySelectorAll(".admin-nav button");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const mod = btn.dataset.module;
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadModule(mod);
  });
});

function loadModule(name) {
  const mod = modules[name];
  if (!mod || !mod.render) {
    content.innerHTML = `<div style="opacity:.5;margin-top:40px;">Module "${name}" not found.</div>`;
    return;
  }
  content.innerHTML = "";
  content.appendChild(mod.render());
}

loadModule("dashboard");
