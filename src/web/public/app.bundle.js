"use strict";

/* === BUNDLE: common.js === */
/* Hunter — core helpers: DOM, formatting, API client, toasts */
/* ============ DOM BUILDER ============ */
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ============ ESCAPE / FORMAT ============ */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

const cap = (s) => (s || "").charAt(0).toUpperCase() + (s || "").slice(1);

const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  try { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; }
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  try { return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; }
};

const fmtDuration = (secs) => {
  secs = Math.max(0, Math.floor(secs || 0));
  const d = Math.floor(secs / 86400), hh = Math.floor((secs % 86400) / 3600),
        mm = Math.floor((secs % 3600) / 60), ss = secs % 60;
  if (d > 0) return `${d}d ${hh}h ${mm}m`;
  if (hh > 0) return `${hh}h ${mm}m`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
};

const fmtBytes = (n) => {
  n = Number(n || 0);
  if (n > 1048576) return (n / 1048576).toFixed(1) + " MB";
  if (n > 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
};

/* greeting by local hour — used by Home */
const greeting = () => {
  const hr = new Date().getHours();
  if (hr < 5) return "Good night";
  if (hr < 12) return "Good morning";
  if (hr < 18) return "Good afternoon";
  return "Good evening";
};

/* ============ TOASTS ============ */
function toast(msg, kind = "", title) {
  let box = $(".toast-container");
  if (!box) { 
    box = h("div", { class: "toast-container", role: "status", "aria-live": "polite" }); 
    document.body.appendChild(box); 
  }
  
  const icons = {
    err: `<svg class="h-icon h-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 5v3M8 10h.01"/></svg>`,
    ok: `<svg class="h-icon h-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 8 7 12 13 4"/></svg>`,
    warn: `<svg class="h-icon h-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l6 11H2L8 2z"/><path d="M8 6v3M8 11h.01"/></svg>`,
    info: `<svg class="h-icon h-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 6v3M8 11h.01"/></svg>`,
  };
  
  const t = h("div", { class: "toast " + kind },
    h("div", { class: "toast-icon" }, h("span", { html: icons[kind] || icons.info })),
    h("div", { class: "toast-content" },
      title ? h("div", { class: "toast-title", text: title }) : null,
      h("div", { class: "toast-message", text: msg })
    ),
    h("button", { class: "toast-close", "aria-label": "Dismiss", onclick: () => { t.classList.add("hiding"); setTimeout(() => t.remove(), 200); } },
      `<svg class="h-icon h-icon-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>`
    )
  );
  
  box.appendChild(t);
  
  // Trigger show animation
  requestAnimationFrame(() => t.classList.add("show"));
  
  // Auto dismiss
  setTimeout(() => { 
    t.classList.add("hiding"); 
    setTimeout(() => t.remove(), 300); 
  }, 4000);
}

/* ============ API CLIENT ============ */
let csrfToken = null;

const jsonSafe = async (res) => {
  if (res.status === 401) {
    if (typeof renderLogin === "function") renderLogin();
    throw new Error("Session expired — sign in again");
  }
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const msg = (data && data.detail) || res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
};

async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  if (method !== "GET" && csrfToken) opts.headers["X-CSRF-Token"] = csrfToken;
  return jsonSafe(await fetch("/api" + path, opts));
}

const apiGet = (p) => api("GET", p);
const apiPost = (p, b) => api("POST", p, b);
const apiPut = (p, b) => api("PUT", p, b);
const apiDel = (p) => api("DELETE", p);

/* ============ TOAST CONTAINER INIT ============ */
if (!$(".toast-container")) {
  const container = h("div", { class: "toast-container", role: "status", "aria-live": "polite" });
  document.body.appendChild(container);
}

/* ============ FLOATING LABEL HANDLING ============ */
function initFloatingLabels(root = document) {
  $$(".field-input", root).forEach(input => {
    const update = () => {
      input.classList.toggle("has-value", input.value !== "");
      if (input.type === "select-one") {
        input.classList.toggle("has-value", input.value !== "");
      }
    };
    update();
    input.addEventListener("input", update);
    input.addEventListener("change", update);
    if (input.type === "select-one") input.addEventListener("change", update);
  });
}

/* ============ TABS KEYBOARD ============ */
function initTabsKeyboard(root = document) {
  $$(".tabs", root).forEach(tabs => {
    const tabs_list = $$(".tab", tabs);
    tabs_list.forEach((tab, i) => {
      tab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          tabs_list[(i + 1) % tabs_list.length].click();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          tabs_list[(i - 1 + tabs_list.length) % tabs_list.length].click();
        } else if (e.key === "Home") {
          e.preventDefault();
          tabs_list[0].click();
        } else if (e.key === "End") {
          e.preventDefault();
          tabs_list[tabs_list.length - 1].click();
        }
      });
    });
  });
}

/* ============ INITIALIZE ON DOM READY ============ */
document.addEventListener("DOMContentLoaded", () => {
  initFloatingLabels();
  initTabsKeyboard();
});

/* ============ PAGE HELPERS ============ */
const loaderHtml = () => Skeleton(3).outerHTML;

const errHtml = (e) => {
  const wrap = document.createElement("div");
  wrap.appendChild(ErrorState(e, { retry: () => { if (typeof __currentRender === "function") __currentRender(); } }));
  return wrap.innerHTML;
};

const empty = (m) => EmptyState({ title: m, icon: "grid" });

function pageHead(title, sub, actions) {
  return h("div", { class: "page-head" },
    h("div", {}, h("h1", { class: "page-title", text: title }), sub ? h("p", { class: "page-subtitle", text: sub }) : null),
    actions ? h("div", { class: "page-head__actions" }, actions) : null);
}

function section(title) { return h("div", { class: "section-label", text: title }); }

function field(label, input, hint) {
  if (typeof input === "string") input = h("span", { class: "field-value", html: input });
  return h("div", { class: "field" },
    h("label", { class: "field-label", text: label }),
    input,
    hint ? h("div", { class: "field-hint", text: hint }) : null);
}

function toggleRow(title, on, detail) {
  return Toggle(title, on, { sub: detail?.sub, onChange: detail?.onChange });
}

function stat(label, value, cls = "") {
  return h("div", { class: "stat " + cls },
    h("div", { class: "stat__label", text: label }),
    h("div", { class: "stat__value", text: value }));
}

function quickLink(label, on, key) {
  return Toggle(label, on, { 
    sub: key === "afk" ? "Auto-reply when mentioned" : "Auto-farm OwO activities", 
    onChange: async (v) => { await apiPut("/" + key + "/toggle", { enabled: v }); toast(v ? "Enabled" : "Disabled", "ok"); } 
  });
}

/* ============ OVERLAY HELPERS ============ */
function overlayPanel(title, bodyEl) {
  return Modal({ title, body: bodyEl });
}

function overlayForm(title, fieldEls, onSave, onCancel) {
  const errLine = h("div", { class: "form-error", style: "display:none" });
  const saveBtn = h("button", { class: "btn btn-primary", text: "Save" });
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true; saveBtn.textContent = "Saving…";
    let keepOpen = false;
    try {
      const ok = await onSave();
      keepOpen = ok === false;
    } catch (err) {
      keepOpen = true;
      errLine.textContent = err.message || String(err);
      errLine.style.display = "block";
    }
    if (keepOpen) { saveBtn.disabled = false; saveBtn.textContent = "Save"; return; }
    modal.close();
  });
  const modal = Modal({
    title,
    body: [...fieldEls, errLine],
    footer: [Button({ label: "Cancel", onclick: () => { onCancel?.(); modal.close(); } }), saveBtn],
  });
  return modal;
}

/* ============ LEGACY COMPAT ============ */
var live = { state: "disconnected" };

/* ============ SMALL LEGACY WIDGETS ============ */
function sel(options, value, attrs = {}) {
  const el = h("select", { class: "field-input", ...attrs });
  for (const o of options) {
    const [val, label] = Array.isArray(o) ? o : [o, cap(String(o).replace(/_/g, " "))];
    el.appendChild(h("option", { value: val, text: label, selected: val === value ? "" : null }));
  }
  return el;
}

function tog(checked, onChange) {
  return h("label", { class: "switch" },
    h("input", { type: "checkbox", checked: !!checked, onchange: async (e) => {
      e.target.disabled = true;
      try { await onChange?.(e.target.checked); }
      catch (err) { toast(err.message, "err"); e.target.checked = !e.target.checked; }
      finally { e.target.disabled = false; }
    }}),
    h("span", { class: "switch-track" }),
    h("span", { class: "switch-thumb" }));
}

function chipInput(items = []) {
  let values = items.slice();
  const wrap = h("div", { class: "chips-input" });
  const input = h("input", { class: "chips-input__input", placeholder: "Add value + Enter" });
  const paint = () => {
    wrap.replaceChildren(...values.map((v, i) =>
      h("span", { class: "chips-input__chip" }, v,
        h("button", { class: "chips-input__chip-x", "aria-label": "Remove", onclick: () => { values.splice(i, 1); paint(); } }, "×"))),
      input);
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      e.preventDefault(); values.push(input.value.trim()); input.value = ""; paint();
    } else if (e.key === "Backspace" && !input.value && values.length) { values.pop(); paint(); }
  });
  wrap.value = values;
  paint();
  return wrap;
}


/* primitives (Button, Icon, Modal, Tabs, ...) live in ui.js */
var live = { state: "disconnected" };

/* === BUNDLE: ui.js === */
/* Hunter UI — component primitives (design system) */
/* ============ ICON SET (16px stroke) ============ */
const ICON_PATHS = {
  home: '<path d="M2.5 9.5L8 4l5.5 5.5"/><path d="M4 8.7V13a1 1 0 0 0 1 1h2v-3h2v3h2a1 1 0 0 0 1-1V8.7"/>',
  bolt: '<path d="M8.5 1.5L3 9h4l-1 5.5L12.5 7h-4V1.5z"/>',
  terminal: '<rect x="1.5" y="2.5" width="13" height="11" rx="1.4"/><path d="M4.5 6l2 1.8-2 1.8M8.5 10H12"/>',
  layers: '<path d="M8 1.5L14.5 5 8 8.5 1.5 4.5 8 1.5z"/><path d="M1.5 8L8 11.5 14.5 8"/><path d="M1.5 11.5L8 15l6.5-3.5"/>',
  activity: '<path d="M1.5 8.5h2.6l1.8-5 3 9.5 2-6.5 1.2 2h2.4"/>',
  bell: '<path d="M8 1.8A4.2 4.2 0 0 0 4 6v2.4L2.9 10.9a.75.75 0 0 0 .68 1.1h9a.75.75 0 0 0 .7-1L12 8.5V6a4 4 0 0 0-2-4.2z"/><path d="M6.4 13.5a1.7 1.7 0 0 0 3.2 0"/>',
  server: '<rect x="1.5" y="2" width="13" height="5" rx="1.2"/><rect x="1.5" y="9.5" width="13" height="4.5" rx="1.2"/><circle cx="4.4" cy="4.5" r=".8" fill="currentColor" stroke="none"/><circle cx="4.4" cy="11.8" r=".8" fill="currentColor" stroke="none"/>',
  palette: '<path d="M8 1.8a6.2 6.2 0 1 0 0 12.4c.9 0 1.4-.7 1.2-1.5-.2-1 .5-1.8 1.5-1.8h1.3A2.7 2.7 0 0 0 15 8.2 6.4 6.4 0 0 0 8 1.8z"/><circle cx="5.4" cy="6.4" r=".9" fill="currentColor" stroke="none"/><circle cx="9.2" cy="4.8" r=".9" fill="currentColor" stroke="none"/>',
  user: '<circle cx="8" cy="5.2" r="2.8"/><path d="M2.8 13.5c.6-2.6 2.4-3.4 5-3.4s4.4.9 5 3.4"/>',
  shield: '<path d="M8 1.5l5 2v4c0 3.2-2 5.8-5 7-3-1.2-5-3.8-5-7v-4l5-2z"/><path d="M5.8 8l1.5 1.5 3.2-3.5"/>',
  wrench: '<path d="M9.5 2.5a3.4 3.4 0 0 0-4.4 4L2 9.6a1.5 1.5 0 1 0 2.1 2.1l3.1-3.1a3.4 3.4 0 0 0 4.2-4.3L9.7 6 6.9 4.7 9.5 2.5z"/>',
  box: '<path d="M8 1.5L14 5v6L8 14.5 2 11V5l6-3.5z"/><path d="M2 5l6 3.2L14 5M8 8.2V14.5"/>',
  archive: '<rect x="1.5" y="2.5" width="13" height="4" rx="1"/><path d="M3 6.5V13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6.5M6.5 9h3"/>',
  script: '<rect x="3" y="1.5" width="10" height="13" rx="1.4"/><path d="M6 4.5h4M5.5 7h3M5.5 9.5h4"/>',
  search: '<circle cx="7" cy="7" r="4.4"/><path d="M10.2 10.2L14 14"/>',
  gear: '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.9 3.9l1.4 1.4m5.4 5.4l1.4 1.4m0-8.2l-1.4 1.4M5.3 10.7l-1.4 1.4"/>',
  avatar: '<circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="6.4" r="2.1"/><path d="M3.6 12.5c1-2.1 2.5-1.6 4.4-3.5 1.9 1.9 2.7 2.6 4.4 3.5"/>',
  clock: '<circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.3 1.6"/>',
  history: '<path d="M2.4 8a5.6 5.6 0 1 1 1.7 4M2.4 12.2V8.6H6"/><path d="M8 5.2V8l2 1.4"/>',
  plus: '<path d="M8 3.4v9.2M3.4 8h9.2"/>',
  play: '<path d="M5 3.4v9.2l7.5-4.6L5 3.4z"/>',
  stop: '<rect x="3.8" y="3.8" width="8.4" height="8.4" rx="1"/>',
  power: '<path d="M8 1.8v5.4"/><path d="M4.7 4.4a5 5 0 1 0 6.6 0"/>',
  rotate: '<path d="M13.4 8A5.4 5.4 0 1 1 11.6 3.9"/><path d="M13.6 1.6v3h-3"/>',
  check: '<path d="M3 8.6l3.2 3.2L13 4.8"/>',
  x: '<path d="M4 4l8 8M12 4l-8 8"/>',
  chevron_r: '<path d="M6 3.5L10.5 8 6 12.5"/>',
  chevron_d: '<path d="M3.5 6L8 10.5 12.5 6"/>',
  dots: '<circle cx="3.4" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="12.6" cy="8" r="1" fill="currentColor" stroke="none"/>',
  menu: '<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>',
  more: '<circle cx="8" cy="3.4" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="12.6" r="1" fill="currentColor" stroke="none"/>',
  copy: '<rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1.2"/><path d="M3.6 10.5h-.1A1.5 1.5 0 0 1 2 9V3.6A1.6 1.6 0 0 1 3.6 2H9a1.5 1.5 0 0 1 1.5 1.5"/>',
  star: '<path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.2L8 11.7 4.2 13.5l.7-4.2-3.1-3 4.3-.6L8 1.8z"/>',
  trash: '<path d="M2.5 4.4h11M6.5 2.4h3M4 6.4l.6 6.5a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-6.5M6.7 8.5v3.2m2.6-3.2v3.2"/>',
  edit: '<path d="M9.3 2.9l3.8 3.8L6.2 13.6l-4 .9.9-4L9.3 2.9z"/>',
  refresh: '<path d="M13.4 8A5.4 5.4 0 1 1 11.6 3.9"/><path d="M13.6 1.6v3h-3"/>',
  warn: '<path d="M8 2l6.3 11H1.7L8 2z"/><path d="M8 6.4v3.3"/><circle cx="8" cy="11.7" r=".7" fill="currentColor" stroke="none"/>',
  info: '<circle cx="8" cy="8" r="6.2"/><path d="M8 7.4V11"/><circle cx="8" cy="5" r=".9" fill="currentColor" stroke="none"/>',
  moon: '<path d="M13.5 9.5A5.6 5.6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z"/>',
  arrow_r: '<path d="M2.8 8h10M9 4.5L12.8 8 9 11.5"/>',
  arrow_l: '<path d="M13.2 8h-10M7 4.5L3.2 8 7 11.5"/>',
  download: '<path d="M8 2.4v7.2M5 6.8l3 2.8 3-2.8M3 13.4h10"/>',
  upload: '<path d="M8 13.6V6.4M5 9.2l3-2.8 3 2.8M3 2.6h10"/>',
  filter: '<path d="M2.4 4h11.2M4.8 8h6.4M6.8 12h2.4"/>',
  pin: '<path d="M9.7 1.8l4.5 4.5-1.8.6a4.6 4.6 0 0 1-1.9 4L7 8.5 3 13.4 2.6 13l4.4-4.4-2.4-2.4a4.6 4.6 0 0 1 4-1.9l.6-1.8z" transform="scale(.95) translate(.4 .4)"/>',
  discord: '<path d="M12.8 3.4A11 11 0 0 0 10 2.5l-.4.8a9.4 9.4 0 0 0-3.2 0L6 2.5a11 11 0 0 0-2.8.9C1.5 6.1 1 8.7 1.2 11.3a11 11 0 0 0 3.4 1.7l.7-1.2-.8-.5.2-.2a7.9 7.9 0 0 0 6.6 0l.2.2-.8.5.7 1.2a11 11 0 0 0 3.4-1.7c.3-3-.5-5.6-2-7.9zM6 9.6c-.6 0-1.1-.6-1.1-1.3S5.4 7 6 7s1.1.6 1.1 1.3S6.6 9.6 6 9.6zm4 0c-.6 0-1.1-.6-1.1-1.3S9.4 7 10 7s1.1.6 1.1 1.3-.5 1.3-1.1 1.3z" fill="currentColor" stroke="none"/>',
  presence: '<circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="2.3" fill="currentColor" stroke="none"/>',
  grid: '<rect x="2" y="2" width="5.2" height="5.2" rx="1"/><rect x="8.8" y="2" width="5.2" height="5.2" rx="1"/><rect x="2" y="8.8" width="5.2" height="5.2" rx="1"/><rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1"/>',
  database: '<ellipse cx="8" cy="3.5" rx="5.5" ry="2"/><path d="M2.5 3.5v9c0 1.1 2.7 2 6 2s6-.9 6-2v-9"/><path d="M2.5 8c0 1.1 2.7 2 6 2s6-.9 6-2"/>',
  flask: '<path d="M6 2h4M6.8 2v4L3 12.4a1.5 1.5 0 0 0 1.3 2.1h7.4A1.5 1.5 0 0 0 13 12.4L9.2 6V2"/><path d="M4.6 9.6h6.8"/>',
  swap: '<path d="M4 6h9M10.5 3.5L13 6l-2.5 2.5M12 10H3m2.5 2.5L3 10l2.5-2.5"/>',
  external: '<path d="M6.5 3.5H4A1.5 1.5 0 0 0 2.5 5v7A1.5 1.5 0 0 0 4 13.5h7A1.5 1.5 0 0 0 12.5 12V9.5"/><path d="M9.5 2.5h4v4M13 3L7.5 8.5"/>',
  command: '<path d="M6 3a2 2 0 1 0-2 2h8a2 2 0 1 0-2-2v8a2 2 0 1 0 2-2H4a2 2 0 1 0 2 2V3z" transform="scale(.85) translate(1.4 1.4)"/>',
  dot: '<circle cx="8" cy="8" r="3" fill="currentColor" stroke="none"/>',
  key: '<circle cx="5.5" cy="10.5" r="3.2"/><path d="M8 8L13.5 2.5M11.5 2.5h2v2"/>',
  wifi: '<path d="M2 6.5a9 9 0 0 1 12 0M4.5 9.3a5.5 5.5 0 0 1 7 0"/><circle cx="8" cy="12.2" r="1" fill="currentColor" stroke="none"/>',
  eye: '<path d="M1.5 8s2.4-4.2 6.5-4.2S14.5 8 14.5 8 12 12.2 8 12.2 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2.2"/>',
};

const Icon = (name, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.dot}</svg>`;

/* ============ PRIMITIVES ============ */
const Kbd = (...keys) => h("span", { class: "kbd" }, keys.join(""));

function Button(opts = {}) {
  const { label, icon, variant = "ghost", size = "md", loading = false, danger = false, onclick, disabled, title } = opts;
  const cls = `btn ${variant}${size === "sm" ? " sm" : ""}${size === "lg" ? " lg" : ""}${danger ? " danger" : ""}`;
  const el = h("button", { class: cls, title, disabled: disabled || loading ? "" : null });
  const render = (state) => {
    el.replaceChildren();
    if (state) el.appendChild(h("span", { class: "btn__spinner" }));
    else if (icon) el.innerHTML = Icon(icon, size === "sm" ? 13 : 15);
    if (state && state !== true) el.appendChild(document.createTextNode(state));
    else if (typeof label === "string") el.appendChild(document.createTextNode(label));
    else if (label) el.appendChild(label);
  };
  render(loading);
  el.addEventListener("click", async (e) => {
    if (el.disabled) return;
    el.disabled = true;
    render(true);
    try { await onclick?.(e); }
    catch (err) { toast(err.message || String(err), "err"); }
    finally { el.disabled = false; render(false); }
  });
  return el;
}

const Badge = (text, kind = "") => h("span", { class: "badge " + kind }, text);

const StatusDot = (state) => {
  const map = { running: "ok", connected: "ok", starting: "busy", connecting: "busy", stopping: "busy", stopped: "off", disconnected: "off", error: "err" };
  return h("span", { class: "sdot " + (map[state] || "off"), "data-state": state },
    h("span", { class: "sdot__dot" }));
};

function Skeleton(rows = 3) {
  return h("div", { class: "skeletons", role: "status", "aria-label": "Loading" },
    Array.from({ length: rows }, (_, i) =>
      h("div", { class: "skel-row", style: `animation-delay:${i * 90}ms` },
        h("div", { class: "skel skel--icon" }),
        h("div", { class: "skel-lines" },
          h("div", { class: "skel skel--line", style: `width:${68 - i * 9}%` }),
          h("div", { class: "skel skel--line", style: `width:${44 - i * 6}%` })))));
}

function EmptyState({ icon = "grid", title, body, action }) {
  return h("div", { class: "empty-state" },
    h("div", { class: "empty-state__icon" }, h("span", { html: Icon(icon, 22) })),
    h("div", { class: "empty-state__title", text: title }),
    body ? h("p", { class: "empty-state__body", text: body }) : null,
    action ? h("div", { class: "empty-state__action" }, action) : null);
}

function ErrorState(err, { retry, logs } = {}) {
  return h("div", { class: "empty-state empty-state--error" },
    h("div", { class: "empty-state__icon err" }, h("span", { html: Icon("warn", 22) })),
    h("div", { class: "empty-state__title", text: "Something failed" }),
    h("p", { class: "empty-state__body", text: err?.message || String(err) }),
    h("div", { class: "empty-state__action" },
      retry ? Button({ label: "Retry", variant: "primary", icon: "refresh", onclick: retry }) : null,
      logs ? Button({ label: "Open logs", onclick: () => navigate("activity") }) : null));
}

function Tabs(items, active, onChange) {
  const bar = h("div", { class: "tabs", role: "tablist" });
  const paint = () => {
    [...bar.children].forEach((c, i) => {
      c.classList.toggle("active", items[i].id === active);
      c.setAttribute("aria-selected", items[i].id === active ? "true" : "false");
    });
  };
  for (const it of items) {
    bar.appendChild(h("button", { class: "tab", role: "tab", onclick: () => { active = it.id; paint(); onChange(it.id); } },
      it.icon ? h("span", { html: Icon(it.icon, 14) }) : null,
      it.label,
      it.count != null ? h("span", { class: "tab__count", text: String(it.count) }) : null));
  }
  paint();
  return bar;
}

function DataTable({ columns, rows, emptyMsg, onRowClick, rowActions }) {
  if (!rows.length) return EmptyState({ title: emptyMsg || "Nothing here yet", icon: "grid" });
  const thead = h("thead", {}, h("tr", {}, columns.map(c =>
    h("th", { text: c.label, style: c.width ? `width:${c.width}` : null }))));
  const tbody = h("tbody", {});
  for (const row of rows) {
    const tr = h("tr", { onclick: onRowClick ? () => onRowClick(row) : null, class: onRowClick ? "clickable" : "" });
    for (const c of columns) {
      tr.appendChild(h("td", {}, c.render ? c.render(row) : document.createTextNode(row[c.key] ?? "—")));
    }
    if (rowActions) tr.appendChild(h("td", { class: "row-actions" }, rowActions(row)));
    tbody.appendChild(tr);
  }
  return h("div", { class: "table-wrap" }, h("table", { class: "table" }, thead, tbody));
}

/* Modal — centered dialog; on mobile becomes a bottom sheet via CSS */
function Modal({ title, body, footer, wide, onClose }) {
  const overlay = h("div", { class: "overlay", onclick: (e) => { if (e.target === overlay) close(); } });
  const close = () => { overlay.classList.add("closing"); setTimeout(() => overlay.remove(), 140); onClose?.(); };
  const dialog = h("div", { class: "modal" + (wide ? " modal--wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
    h("div", { class: "modal__head" }, h("h3", { text: title }),
      h("button", { class: "icon-btn", "aria-label": "Close", onclick: close, html: Icon("x", 15) })),
    h("div", { class: "modal__body" }, body),
    footer ? h("div", { class: "modal__foot" }, footer) : null);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));
  return { close, overlay, dialog };
}

/* Confirmation for destructive actions */
function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = true, onConfirm } = {}) {
  return new Promise((resolve) => {
    let modal;
    const body = h("div", {}, h("p", { class: "confirm-msg", text: message }));
    const footer = [
      Button({ label: "Cancel", onclick: () => { modal.close(); resolve(false); } }),
      Button({ label: confirmLabel, variant: "primary", danger, onclick: async () => {
        modal.close();
        const result = onConfirm ? await onConfirm() : true;
        resolve(result !== false);
      }}),
    ];
    modal = Modal({ title, body, footer });
  });
}

function Field(label, input, hint) {
  return h("div", { class: "field" },
    h("label", { text: label }),
    input,
    hint ? h("div", { class: "hint" }, hint) : null);
}

function Toggle(title, on, { sub, onChange } = {}) {
  const sw = h("label", { class: "switch" },
    h("input", { type: "checkbox", checked: !!on, "aria-label": title, onchange: async (e) => {
      e.target.disabled = true;
      try { await onChange?.(e.target.checked); }
      catch (err) { toast(err.message, "err"); e.target.checked = !e.target.checked; }
      finally { e.target.disabled = false; }
    } }),
    h("span", { class: "track" }));
  return h("div", { class: "toggle-row" },
    h("div", {}, h("div", { class: "t", text: title }), sub ? h("div", { class: "d", text: sub }) : null),
    sw);
}

const Panel = (title, bodyChildren, { actions, dense } = {}) => {
  const head = title != null
    ? h("div", { class: "panel__head" }, h("h3", { text: title }), h("span", { class: "spacer" }), actions || null)
    : null;
  return h("section", { class: "panel" + (dense ? " panel--dense" : "") },
    head,
    h("div", { class: "panel__body" }, bodyChildren));
};

/* Tooltip via data-tip (CSS driven, no JS) */
const tip = (el, text) => { el.setAttribute("data-tip", text); return el; };


/* === BUNDLE: state.js === */
/* Hunter State — one source of truth for client status + realtime streams */
/* ============ STORE ============ */
const Store = {
  /* Client lifecycle snapshot from /api/client/state — the ONLY source for
     connection UI. Never fake latency/uptime/state. */
  client: {
    control_state: "stopped", connection_state: "disconnected", phase: "",
    error: null, user: null, guild_count: 0, dm_count: 0, latency: 0,
    uptime_seconds: 0, reconnect_count: 0, prefix: "h!", token_configured: false,
  },
  unread: 0,                 // notifications
  activity: [],              // live event stream (newest first)
  commands: [],              // command registry cache
  servers: [],               // guild cache
  ready: false,
};

const _subs = new Set();
const onStore = (fn) => { _subs.add(fn); return () => _subs.delete(fn); };
const emitStore = () => {
  /* keep the legacy `live` alias in sync for older views */
  try { live.state = Store.client.connection_state; live.prefix = Store.client.prefix; } catch (e) {}
  for (const fn of _subs) { try { fn(Store); } catch (e) { console.error(e); } }
};

/* ============ CLIENT STATE MACHINE ============ */
const CLIENT_STATES = {
  stopped:      { label: "Stopped",       tone: "off"  },
  starting:     { label: "Starting",      tone: "busy" },
  running:      { label: "Running",       tone: "ok"   },
  stopping:     { label: "Stopping",      tone: "busy" },
  error:        { label: "Error",         tone: "err"  },
};
const clientState = () => Store.client.control_state || "stopped";

async function refreshClientState() {
  try {
    const s = await apiGet("/client/state");
    Store.client = Object.assign({}, Store.client, s);
    Store.ready = true;
    emitStore();
  } catch (e) { /* auth or network; login view handles */ }
}

async function clientAction(action) {
  // action: start | stop | restart — real backend call, optimistic UI from response
  try {
    const res = await apiPost(`/client/${action}`);
    if (!res.ok) { toast(res.error || `Could not ${action} client`, "err"); }
    else toast(action === "stop" ? "Client stopping…" : action === "start" ? "Starting client…" : "Restarting client…");
    await refreshClientState();
    return res;
  } catch (e) { toast(e.message, "err"); return { ok: false }; }
}

/* ============ ACTIVITY STREAM ============ */
function pushActivity(item) {
  Store.activity.unshift(item);
  if (Store.activity.length > 120) Store.activity.length = 120;
  emitStore();
}

/* ============ WEBSOCKET ============ */
let _ws = null, _wsHB = null;
function connectWS() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const open = () => {
    _ws = new WebSocket(`${proto}://${location.host}/api/ws`);
    _ws.onopen = () => { _wsHB = setInterval(() => { try { _ws.send("ping"); } catch (e) {} }, 25000); };
    _ws.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (m.type === "status" && m.data) {
        Store.client = Object.assign({}, Store.client, m.data);
        // map legacy connection state into control view if needed
        emitStore();
      } else if (m.type === "client_state" && m.data) {
        Store.client = Object.assign({}, Store.client, m.data);
        emitStore();
      } else if (m.type === "event" && m.data) {
        pushActivity(m.data);
      } else if (m.type === "notification") {
        Store.unread += 1; emitStore();
      } else if (m.type === "config" || m.type === "refresh") {
        refreshClientState();
        if (typeof __currentRender === "function") __currentRender();
      } else if (m.type === "theme" && m.data?.vars) {
        applyThemeVars(m.data.vars);
      }
    };
    _ws.onclose = () => { clearInterval(_wsHB); setTimeout(open, 4000); };
    _ws.onerror = () => { try { _ws.close(); } catch (e) {} };
  };
  open();
}

async function refreshUnread() {
  try { const d = await apiGet("/notifications/unread"); Store.unread = d.unread || 0; emitStore(); } catch (e) {}
}

/* ============ THEME VARS ============ */
function applyThemeVars(vars) {
  if (!vars) return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(`--${k}`, v);
}
async function loadActiveTheme() {
  try { const r = await apiGet("/themes/active"); applyThemeVars(r?.theme?.vars); } catch (e) {}
}

/* ============ FAVORITES / RECENT (localStorage) ============ */
const favKey = "hunter.favorites";
const getFavs = () => { try { return JSON.parse(localStorage.getItem(favKey)) || []; } catch (e) { return []; } };
const isFav = (name) => getFavs().includes(name);
const toggleFav = (name) => {
  const f = getFavs();
  const i = f.indexOf(name);
  if (i >= 0) f.splice(i, 1); else f.push(name);
  localStorage.setItem(favKey, JSON.stringify(f.slice(0, 30)));
  return i < 0;
};
const recentKey = "hunter.recent";
const pushRecent = (name) => {
  try {
    let r = JSON.parse(localStorage.getItem(recentKey)) || [];
    r = [name, ...r.filter((x) => x !== name)].slice(0, 24);
    localStorage.setItem(recentKey, JSON.stringify(r));
  } catch (e) {}
};
const getRecent = () => { try { return JSON.parse(localStorage.getItem(recentKey)) || []; } catch (e) { return []; } };

/* ============ DASHBOARD LAYOUT (persisted) ============ */
const layoutKey = "hunter.layout";
const DEFAULT_LAYOUT = ["status", "activity", "automations", "health", "quick", "servers"];
const getLayout = () => { try { return JSON.parse(localStorage.getItem(layoutKey)) || DEFAULT_LAYOUT.slice(); } catch (e) { return DEFAULT_LAYOUT.slice(); } };
const setLayout = (l) => { try { localStorage.setItem(layoutKey, JSON.stringify(l)); } catch (e) {} };


/* === BUNDLE: views-home.js === */
/* Hunter — Home command center, Activity timeline, Servers workspace */
function metricCell(label, value) {
  return h("div", { class: "stat-card" },
    h("div", { class: "stat-label", text: label }),
    h("div", { class: "stat-value", text: value }));
}

/* ============ HOME ============ */
async function viewHome(slot) {
  slot.replaceChildren(Skeleton(5));
  let dash, automations, settings;
  try {
    [dash, automations, settings] = await Promise.all([
      apiGet("/dashboard"),
      apiGet("/automations").catch(() => ({ automations: [] })),
      apiGet("/settings").catch(() => ({})),
    ]);
  } catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); return; }

  const c = Store.client;
  const counts = dash.counts || {};
  const connected = c.control_state === "running" && c.connection_state === "connected";
  const subline = c.control_state === "running"
    ? (connected ? "Everything is running normally." : "Connected to gateway, waiting for ready…")
    : c.control_state === "starting" ? "Connecting to Discord…" : "Client is not running.";
  const uname = c.user?.username;

  /* --- workspace header --- */
  const header = h("div", { class: "home-head" },
    h("div", {},
      h("h1", { class: "home-head-title", text: uname ? `${greeting()}, ${uname}.` : `${greeting()}.` }),
      h("p", { class: "home-head-sub", text: subline })),
    h("div", { class: "home-head-pills" },
      connCluster()));

  /* --- client status module (live-updating) --- */
  const statusGridEl = h("div", { class: "panel-body home-status-grid", id: "home-live" });
  const statusCard = h("section", { class: "panel home-status" }, statusGridEl);
  const paintStatus = () => {
    const cl = Store.client;
    const conn = cl.control_state === "running" && cl.connection_state === "connected";
    statusGridEl.replaceChildren(
      metricCell("Status", cap(conn ? "running" : cl.control_state)),
      metricCell("Account", cl.user?.username || "—"),
      metricCell("Latency", cl.connection_state === "connected" && cl.latency ? `${cl.latency}ms` : "—"),
      metricCell("Uptime", conn ? fmtDuration(cl.uptime_seconds) : "—"),
      metricCell("Servers", String(cl.guild_count || 0)),
      metricCell("Automations", `${counts.automations_enabled || 0} active`),
      metricCell("Scripts", `${counts.scripts || 0} loaded`),
      metricCell("Custom cmds", String(counts.custom_commands || 0)));
  };
  paintStatus();
  statusCard.addEventListener("store", paintStatus);

  /* --- quick actions --- */
  const quick = h("div", { class: "quick-actions" },
    quickAction("bolt", "New automation", () => { navigate("automations"); setTimeout(() => $("#new-automation-btn")?.click(), 60); }),
    quickAction("terminal", "Run command", () => { navigate("commands"); }),
    quickAction("presence", "Edit presence", () => navigate("presence")),
    quickAction("script", "New script", () => { navigate("scripts"); setTimeout(() => $("#new-script-btn")?.click(), 60); }),
    quickAction("activity", "View logs", () => navigate("activity")),
    quickAction("archive", "Create backup", () => { navigate("backups"); }));

  /* --- live activity --- */
  const recent = (dash.recent_activity || []).slice(0, 9);
  const activityList = h("div", { class: "feed" },
    recent.length === 0
      ? EmptyState({ title: "No activity yet", body: "Events from commands, automations and scripts will appear here in real time.", icon: "activity" })
      : recent.map((l) => feedRow(l)));
  if (Store.activity.length) {
    for (const a of Store.activity.slice(0, 6)) activityList.prepend(liveRow(a));
  }
  const activityPanel = Panel("Live activity", activityList, {
    actions: h("button", { class: "link", onclick: () => navigate("activity") }, "View all"),
  });

  /* --- automations overview --- */
  const autos = (automations.automations || []).filter((a) => a.enabled).slice(0, 5);
  const autosPanel = Panel("Active automations",
    autos.length === 0
      ? EmptyState({
          title: "No automations running",
          body: "Automations react to messages and events — auto replies, reactions and more.",
          icon: "bolt",
          action: Button({ label: "Create automation", variant: "primary", icon: "plus", onclick: () => navigate("automations") }),
        })
      : h("div", { class: "stack" }, autos.map(autoRow)),
    { actions: h("button", { class: "link", onclick: () => navigate("automations") }, "Manage") });

  /* --- system health --- */
  const healthPanel = Panel("System health", h("div", { class: "stack" }, [
    healthRow("Discord gateway", connected ? "ok" : (c.control_state === "error" ? "err" : "off"), connected ? "Connected" : cap(c.control_state)),
    healthRow("Control API", "ok", "Healthy"),
    healthRow("Database", "ok", "Connected"),
    healthRow("Scheduler", settings.scheduler ? "ok" : "off", settings.scheduler ? "Running" : "Idle"),
    healthRow("Scripts engine", "ok", `${counts.scripts || 0} loaded`),
  ]));

  /* --- notifications summary --- */
  const notifPanel = Panel("Notifications",
    Store.unread
      ? EmptyState({ title: `${Store.unread} unread notification${Store.unread === 1 ? "" : "s"}`, body: "Open the inbox to review recent events.", icon: "bell", action: Button({ label: "Open inbox", onclick: () => navigate("notifications") }) })
      : EmptyState({ title: "Inbox zero", body: "Notifications from rules you configure will land here.", icon: "bell" }),
    { actions: h("button", { class: "link", onclick: () => navigate("notifications") }, "Inbox") });

  slot.replaceChildren(
    header,
    statusCard,
    h("div", { class: "quick-actions-wrap" }, quick),
    h("div", { class: "home-grid" }, activityPanel, autosPanel, healthPanel, notifPanel),
  );
}

window.viewHome = viewHome;
window.viewActivity = viewActivity;
window.viewServers = viewServers;
window.metricCell = metricCell;

const quickAction = (icon, label, onclick) =>
  h("button", { class: "qa", onclick },
    h("span", { class: "qa-icon", html: Icon(icon, 16) }),
    h("span", { class: "qa-label", text: label }));

function feedRow(l) {
  const kind = classifyEvent(l.event_type || l.name || "");
  return h("button", { class: "feed-row", onclick: () => eventDetails(l) },
    h("span", { class: "feed-dot " + kind.tone }),
    h("div", { class: "feed-main" },
      h("span", { class: "feed-msg", text: l.message || l.name || "Event" }),
      h("span", { class: "feed-meta", text: l.source || kind.label })),
    h("span", { class: "feed-time", text: fmtTime(l.timestamp) }));
}
const liveRow = (a) => feedRow({ event_type: a.name, message: a.message, source: a.source || "live", timestamp: a.timestamp });

function classifyEvent(name) {
  if (name.includes("error") || name.includes("fail")) return { label: "Error", tone: "err" };
  if (name.includes("command")) return { label: "Command", tone: "info" };
  if (name.includes("automation")) return { label: "Automation", tone: "accent" };
  if (name.includes("script")) return { label: "Script", tone: "accent" };
  if (name.includes("schedule")) return { label: "Schedule", tone: "info" };
  if (name.includes("presence")) return { label: "Presence", tone: "ok" };
  if (name.includes("client.") || name.includes("connect")) return { label: "Client", tone: "ok" };
  if (name.includes("notification")) return { label: "Notification", tone: "warn" };
  return { label: "System", tone: "" };
}

function eventDetails(l) {
  const rows = [];
  const put = (k, v) => v && rows.push([k, String(v)]);
  put("Event", l.event_type || l.name);
  put("Message", l.message);
  put("Source", l.source);
  put("Time", fmtDate(l.timestamp));
  put("Details", l.details);
  Modal({
    title: "Event details",
    body: h("div", { class: "kv" }, rows.map(([k, v]) =>
      h("div", { class: "kv-row" }, h("span", { class: "kv-k", text: k }), h("span", { class: "kv-v", text: v })))),
  });
}

function autoRow(a) {
  const trigger = a.config?.keyword ? `"${a.config.keyword}"` : a.config?.reply ? "auto reply" : cap(a.type || "message");
  return h("div", { class: "auto-row" },
    h("div", { class: "auto-row-main" },
      h("span", { class: "auto-name", text: a.name }),
      h("span", { class: "auto-trigger", text: trigger })),
    h("span", { class: "spacer" }),
    a.last_triggered ? h("span", { class: "auto-meta", text: "last " + fmtTime(a.last_triggered) }) : null,
    Toggle(a.name, a.enabled, { onChange: async (v) => { await apiPost(`/automations/${a.id}/toggle`); } }));
}

const healthRow = (label, tone, value) =>
  h("div", { class: "health-row" },
    h("span", { class: "status-dot " + tone }, h("span", { class: "sdot-dot" })),
    h("span", { class: "health-label", text: label }),
    h("span", { class: "spacer" }),
    h("span", { class: "health-value", text: value }));

/* ============ ACTIVITY CENTER ============ */
async function viewActivity(slot) {
  slot.replaceChildren(Skeleton(5));
  let logs, cmds;
  try {
    [logs, cmds] = await Promise.all([
      apiGet("/logs?limit=200"),
      apiGet("/command-history?limit=80").catch(() => ({ history: [] })),
    ]);
  } catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); return; }

  let filter = "all", query = "";

  // merge logs + command history into one timeline
  const events = [
    ...(logs.entries || []).map((l) => ({
      id: "log-" + l.id, time: l.timestamp, kind: classifyEvent(l.event_type || "").label.toLowerCase(),
      title: l.message, event: l.event_type, source: l.source, details: l.details,
    })),
    ...(cmds.history || []).map((c2) => ({
      id: "cmd-" + c2.id, time: c2.timestamp, kind: "command",
      title: `${c2.command}${c2.args ? " " + c2.args : ""}`, event: "command",
      source: c2.success === false ? "failed" : "ok", details: c2.response || c2.error,
    })),
  ].sort((a, b) => (b.time || "").localeCompare(a.time || ""));

  const KINDS = [
    { id: "all", label: "All" }, { id: "command", label: "Commands" }, { id: "automation", label: "Automations" },
    { id: "script", label: "Scripts" }, { id: "schedule", label: "Schedules" }, { id: "presence", label: "Presence" },
    { id: "client", label: "Client" }, { id: "system", label: "System" }, { id: "error", label: "Errors" },
  ];

  const list = h("div", { class: "timeline" });
  const search = h("input", { class: "field-input", placeholder: "Search events…", "aria-label": "Search events" });
  const tabs = Tabs(KINDS, filter, (id) => { filter = id; paint(); });
  const countEl = h("span", { class: "text-muted", text: "" });

  const paint = () => {
    const q = query.toLowerCase();
    const shown = events.filter((e) =>
      (filter === "all" || e.kind === filter || (filter === "error" && e.source === "failed")) &&
      (!q || (e.title || "").toLowerCase().includes(q)));
    countEl.textContent = `${shown.length} event${shown.length === 1 ? "" : "s"}`;
    list.replaceChildren();
    if (!shown.length) {
      list.appendChild(EmptyState({ title: "No events match", body: "Try a different filter or clear the search.", icon: "filter" }));
      return;
    }
    let lastDay = "";
    for (const e of shown.slice(0, 160)) {
      const day = (e.time || "").slice(0, 10);
      if (day !== lastDay) { lastDay = day; list.appendChild(h("div", { class: "timeline-day", text: fmtDate(e.time).split(",")[0] })); }
      list.appendChild(timelineRow(e));
    }
  };
  search.addEventListener("input", () => { query = search.value; paint(); });
  paint();

  slot.replaceChildren(
    pageHead("Activity", "A unified timeline of commands, automations, scripts and system events.",
      [search, countEl]),
    tabs, list);
}

function timelineRow(e) {
  const kind = classifyEvent(e.event || e.kind || "");
  const failed = e.source === "failed" || e.kind === "error";
  return h("div", { class: "tl-row" },
    h("div", { class: "tl-row-rail" },
      h("span", { class: "status-dot " + (failed ? "err" : kind.tone) }, h("span", { class: "sdot-dot" })),
      h("span", { class: "tl-row-line" })),
    h("button", { class: "tl-row-body", onclick: () => eventDetails(e) },
      h("div", { class: "tl-row-top" },
        h("span", { class: "tl-title", text: e.title || "—" }),
        Badge(kind.label, kind.tone === "err" ? "danger" : kind.tone === "ok" ? "success" : "default"),
        h("span", { class: "spacer" }),
        h("span", { class: "tl-time", text: fmtTime(e.time) })),
      e.details ? h("span", { class: "tl-desc", text: String(e.details).slice(0, 120) }) : null));
}

/* ============ SERVERS ============ */
async function viewServers(slot) {
  slot.replaceChildren(Skeleton(4));
  let data;
  try { data = await apiGet("/servers"); }
  catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); return; }

  if (!data.connected || !(data.servers || []).length) {
    slot.replaceChildren(pageHead("Servers", "Servers the account shares with others."),
      EmptyState({
        title: "No servers available",
        body: data.connected ? "This account isn't in any servers." : "Connect the client to load your servers.",
        icon: "server",
        action: data.connected ? null : Button({ label: "Start client", variant: "primary", icon: "play", onclick: () => clientAction("start") }),
      }));
    return;
  }

  const grid = h("div", { class: "server-grid" });
  for (const s of data.servers) {
    grid.appendChild(h("button", { class: "server-card", onclick: () => serverDetailModal(s) },
      s.icon ? h("img", { class: "server-icon", src: s.icon, alt: "" })
             : h("span", { class: "server-icon server-icon-fallback", text: s.name.slice(0, 2).toUpperCase() }),
      h("div", { class: "server-body" },
        h("span", { class: "server-name", text: s.name }),
        h("span", { class: "server-meta", text: `${s.member_count ?? "?"} members · ${s.channel_count} channels · ${s.role_count} roles` }))));
  }
  slot.replaceChildren(pageHead("Servers", `${data.servers.length} guild${data.servers.length === 1 ? "" : "s"} visible to this account.`), grid);
}

async function serverDetailModal(s) {
  const body = Skeleton(3);
  const modal = Modal({ title: s.name, body, wide: true });
  try {
    const d = await apiGet(`/servers/${s.id}`);
    const tabs = Tabs([
      { id: "channels", label: "Channels", count: d.channels.length },
      { id: "roles", label: "Roles", count: d.roles.length },
      { id: "members", label: "Members", count: d.member_count },
    ], "channels", (id) => paint(id));
    const list = h("div", { class: "stack compact" });
    const paint = (id) => {
      list.replaceChildren();
      if (id === "channels") {
        for (const ch of d.channels.slice(0, 120)) {
          list.appendChild(h("div", { class: "kv-row" },
            h("span", { class: "kv-k", text: (ch.type === "text" ? "#" : ch.type === "voice" ? " " : "◇ ") + ch.name }),
            h("span", { class: "kv-v mono", text: ch.id })));
        }
      } else if (id === "roles") {
        for (const r of d.roles) {
          list.appendChild(h("div", { class: "kv-row" },
            h("span", { class: "kv-k", text: r.name, style: r.color !== "#000000" ? `color:${r.color}` : null }),
            h("span", { class: "kv-v mono", text: r.id })));
        }
      } else {
        for (const m of d.members.slice(0, 80)) {
          list.appendChild(h("div", { class: "kv-row" },
            h("span", { class: "kv-k", text: m.name + (m.bot ? " (bot)" : "") }),
            h("span", { class: "kv-v mono", text: m.id })));
        }
      }
    };
    body.replaceChildren(tabs, list);
    paint("channels");
  } catch (e) {
    body.replaceChildren(ErrorState(e));
  }
}

/* === BUNDLE: views-cmd.js === */
/* Discord AIO // Command Explorer + Interactive Execution */
const CATEGORY_LABELS = {
  all: "All",
  op: "OP Superweapons",
  general: "General",
  utility: "Utility",
  moderation: "Moderation",
  user: "User",
  purge: "Purge",
  automation: "Automation",
  "rpc & voice": "RPC & Voice",
  fun: "Fun",
  text: "Text",
  backup: "Backup",
  config: "Config",
  admin: "Admin",
  developer: "Developer",
  crypto: "Crypto",
  web: "Web",
  math: "Math",
  system: "System",
  productivity: "Productivity",
  media: "Media",
  custom: "Custom"
};

const CATEGORY_ICONS = {
  op: "bolt",
  general: "home",
  utility: "wrench",
  moderation: "shield",
  user: "user",
  purge: "trash",
  automation: "activity",
  "rpc & voice": "presence",
  fun: "flask",
  text: "script",
  backup: "archive",
  config: "gear",
  admin: "key",
  developer: "terminal",
  crypto: "shield",
  web: "external",
  math: "plus",
  system: "server",
  productivity: "check",
  media: "grid",
  custom: "command"
};

const getCatLabel = (c) => CATEGORY_LABELS[c.toLowerCase()] || c;
const getCatIcon = (c) => CATEGORY_ICONS[c.toLowerCase()] || "terminal";

async function viewCommands(slot) {
  if (!Store.commands.length) { try { await refreshCommandsCache(); } catch (e) {} }
  const cmds = Store.commands;
  let query = "", cat = "all", tab = "all"; // all | favorites | recent

  const search = h("input", { class: "field-input search", placeholder: `Search ${cmds.length} commands…`, "aria-label": "Search commands" });
  const catBar = h("div", { class: "chip-row" });
  const listWrap = h("div", { class: "cmd-list" });
  const detail = h("aside", { class: "cmd-detail" });
  const countEl = h("span", { class: "text-muted" });

  const uniqueCats = Array.from(new Set(cmds.map(x => x.category).filter(Boolean))).sort();
  const categories = ["all", ...uniqueCats];

  const paintChips = () => {
    catBar.replaceChildren(...categories.map((c) =>
      h("button", { class: "chip" + (cat === c ? " active" : ""), onclick: () => { cat = c; paintChips(); paintList(); } },
        c === "all" ? "All" : getCatLabel(c),
        c !== "all" ? h("span", { class: "chip-count", text: String(cmds.filter((x) => x.category === c).length) }) : null)));
  };

  let selected = null;
  const paintDetail = () => {
    if (!selected) {
      detail.replaceChildren(EmptyState({ title: "Select a command", body: "Details, syntax and interactive execution appear here.", icon: "terminal" }));
      return;
    }
    const c = selected;
    const argsInput = h("input", { class: "field-input", placeholder: "Arguments (e.g. 5, @user, text...)", style: "font-family: var(--font-mono); font-size: 13px;" });
    const execResult = h("div", { class: "code-block", style: "display: none; max-height: 140px; overflow-y: auto; margin-top: 8px;" });

    const execBtn = Button({
      label: "Execute",
      variant: "primary",
      icon: "play",
      size: "sm",
      onclick: async () => {
        execResult.style.display = "block";
        execResult.textContent = "Executing command…";
        try {
          const cmdLine = (c.name + " " + argsInput.value).trim();
          pushRecent(c.name);
          const res = await apiPost("/console/execute", { command: cmdLine });
          execResult.textContent = (res.output || "No output returned.") + `\n\n ${res.duration_ms || 0}ms`;
        } catch (err) {
          execResult.textContent = `️ Error: ${err.message}`;
        }
      }
    });

    const toggleBtn = Button({
      label: c.enabled ? "Disable Command" : "Enable Command",
      variant: c.enabled ? "danger" : "secondary",
      size: "sm",
      onclick: async () => {
        await apiPost("/commands/toggle", { name: c.name, enabled: !c.enabled });
        c.enabled = !c.enabled;
        paintList();
        paintDetail();
        toast(c.enabled ? `Enabled ${c.name}` : `Disabled ${c.name}`, "ok");
      }
    });

    detail.replaceChildren(
      h("div", { class: "cmd-detail-head" },
        h("h3", { class: "cmd-detail-name", text: (Store.client.prefix || ".") + c.name }),
        h("span", { class: "spacer" }),
        h("button", {
          class: "icon-btn",
          "data-tip": isFav(c.name) ? "Unfavorite" : "Favorite",
          onclick: () => { toggleFav(c.name); paintList(); paintDetail(); },
          html: Icon("star", 15)
        }),
        h("span", { class: "cmd-detail-star" + (isFav(c.name) ? " on" : "") })),
      Badge(getCatLabel(c.category) || c.category, "brand"),
      c.owner_only ? Badge("Owner only", "warning") : null,
      !c.enabled ? Badge("Disabled", "danger") : null,
      h("p", { class: "cmd-detail-desc", text: c.description || "No description provided." }),
      c.usage ? h("div", { class: "code-block", text: (Store.client.prefix || ".") + c.usage.replace(/^\.+/, "") }) : null,
      c.aliases?.length ? h("div", { class: "kv" }, h("div", { class: "kv-row" }, h("span", { class: "kv-k", text: "Aliases" }), h("span", { class: "kv-v", text: c.aliases.join(", ") }))) : null,
      c.cooldown ? h("div", { class: "kv" }, h("div", { class: "kv-row" }, h("span", { class: "kv-k", text: "Cooldown" }), h("span", { class: "kv-v", text: c.cooldown + "s" }))) : null,

      // Interactive Execution Form
      h("div", { style: "margin-top: 18px; border-top: 1px solid var(--color-border); padding-top: 14px;" },
        h("div", { class: "section-label", text: "Interactive Execution Form" }),
        argsInput,
        h("div", { class: "flex gap-2 mt-2", style: "align-items: center;" },
          execBtn,
          toggleBtn,
          h("span", { class: "spacer" }),
          Button({ label: "Open in Console", size: "sm", variant: "ghost", onclick: () => {
            navigate("console");
            setTimeout(() => {
              const cin = document.getElementById("console-input");
              if (cin) { cin.value = (Store.client.prefix || ".") + c.name + " " + argsInput.value; cin.focus(); }
            }, 50);
          }})),
        execResult)
    );
  };

  const paintList = () => {
    const q = query.toLowerCase();
    let pool = cmds;
    if (tab === "favorites") pool = pool.filter((c) => isFav(c.name));
    if (tab === "recent") {
      const rec = getRecent();
      pool = rec.map((n) => cmds.find((c) => c.name === n)).filter(Boolean);
    }
    if (cat !== "all") pool = pool.filter((c) => c.category === cat);
    if (q) pool = pool.filter((c) =>
      c.name.includes(q) || (c.description || "").toLowerCase().includes(q) ||
      (c.aliases || []).some((a) => a.includes(q)));

    countEl.textContent = `${pool.length} command${pool.length === 1 ? "" : "s"}`;
    listWrap.replaceChildren();
    if (!pool.length) {
      listWrap.appendChild(EmptyState({
        title: tab === "favorites" ? "No favorites yet" : "No commands match",
        body: tab === "favorites" ? "Star commands to pin them here." : "Try another search or category filter.",
        icon: tab === "favorites" ? "star" : "search",
      }));
      return;
    }

    let lastCat = "";
    for (const c of pool.slice(0, 300)) {
      if (c.category !== lastCat) {
        lastCat = c.category;
        listWrap.appendChild(h("div", { class: "cmd-group" },
          h("span", { html: Icon(getCatIcon(c.category), 13) }),
          getCatLabel(c.category)));
      }
      listWrap.appendChild(h("button", { class: "cmd-row" + (selected?.name === c.name ? " active" : ""),
        onclick: () => { selected = c; paintList(); paintDetail(); } },
        h("span", { class: "cmd-name mono", text: c.name }),
        h("span", { class: "cmd-desc", text: (c.description || "").slice(0, 56) }),
        isFav(c.name) ? h("span", { class: "cmd-fav", html: Icon("star", 12) }) : null,
        !c.enabled ? Badge("off", "danger") : null));
    }
  };

  search.addEventListener("input", () => { query = search.value; paintList(); });

  const modeTabs = Tabs([
    { id: "all", label: "All Commands", count: cmds.length },
    { id: "favorites", label: "Favorites", count: getFavs().length },
    { id: "recent", label: "Recently Used", count: getRecent().length },
  ], tab, (id) => { tab = id; paintList(); });

  slot.replaceChildren(
    pageHead("Command Center", "Explore, search, configure and interactively run every command in the selfbot.",
      [search, countEl]),
    modeTabs, catBar,
    h("div", { class: "cmd-layout" }, listWrap, detail));

  paintChips();
  paintList();
  if (cmds.length && !selected) { selected = cmds[0]; paintDetail(); }
}

window.viewCommands = viewCommands;


/* === BUNDLE: views-auto.js === */
/* Discord AIO // Automations workspace */
/* ============ AUTOMATIONS VIEW ============ */
async function viewAutomations(slot) {
  slot.replaceChildren(Skeleton(5));
  let autos = [], afk = {}, owo = {}, jobs = [];
  try {
    const [dAutos, dAfk, dOwo, dJobs] = await Promise.all([
      apiGet("/automations").catch(() => ({ automations: [] })),
      apiGet("/afk").catch(() => ({ enabled: false })),
      apiGet("/owo").catch(() => ({ enabled: false })),
      apiGet("/jobs").catch(() => ({ jobs: [] }))
    ]);
    autos = dAutos.automations || [];
    afk = dAfk || {};
    owo = dOwo || {};
    jobs = dJobs.jobs || [];
  } catch (e) {
    slot.replaceChildren(ErrorState(e));
    return;
  }

  let tab = "rules";
  const body = h("div", { class: "mt-4" });
  const renderTab = () => {
    body.replaceChildren();
    if (tab === "rules") renderRules(body, autos);
    else if (tab === "afk") renderAfk(body, afk);
    else if (tab === "owo") renderOwo(body, owo);
    else if (tab === "jobs") renderJobs(body, jobs);
  };

  const tabs = Tabs([
    { id: "rules", label: "Rules & Responders", count: autos.length },
    { id: "afk", label: "AFK Manager", badge: afk.enabled ? "on" : null },
    { id: "owo", label: "OwO Farmer", badge: owo.enabled ? "on" : null },
    { id: "jobs", label: "Scheduled Jobs", count: jobs.length }
  ], tab, (id) => {
    tab = id;
    renderTab();
  });

  slot.replaceChildren(
    pageHead("Automations", "Trigger → conditions → actions for auto-reply, auto-react, AFK and scheduled tasks.", [
      Button({ label: "New automation", variant: "primary", icon: "plus", onclick: () => ruleModal(null, () => renderApp()) })
    ]),
    tabs,
    body
  );
  renderTab();
}

/* ============ KV ROW SAFE ============ */

/* ============ CHAIN VISUALIZATION ============ */
function chainOf(a) {
  const cfg = a.config || {};
  const steps = [];
  if (a.type === "auto_reply") {
    steps.push(["Message received", "message event"]);
    steps.push(["Content matches", `"${cfg.trigger || "?"}" · ${cfg.mode || "contains"}`]);
    steps.push(["Send response", (cfg.responses || []).join(" | ") || "—"]);
  } else if (a.type === "auto_react") {
    steps.push(["Message received", "message event"]);
    steps.push(["Content matches", `"${cfg.trigger || "?"}"`]);
    steps.push(["React", (cfg.reactions || []).join(" ")]);
  } else if (a.type === "keyword") {
    steps.push(["Keyword detected", (cfg.keywords || []).join(", ") || "—"]);
    steps.push(["Send response", (cfg.responses || [cfg.response || "—"]).join(" | ")]);
  } else {
    steps.push([a.type.replace(/_/g, " "), "custom trigger"]);
    steps.push(["Action", JSON.stringify(cfg).slice(0, 40)]);
  }
  if (a.cooldown) steps.push(["Cooldown", a.cooldown + "s"]);
  return steps;
}

function chainEl(a) {
  const steps = chainOf(a);
  return h("div", { class: "chain" }, steps.map(([label, detail], i) =>
    h("div", { class: "chain-step" },
      i > 0 ? h("span", { class: "chain-arrow", html: Icon("chevron_r", 12) }) : null,
      h("div", { class: "chain-card" },
        h("span", { class: "chain-label", text: label }),
        h("span", { class: "chain-detail", text: detail })))));
}

/* ============ AUTO HISTORY ============ */
async function autoHistory(a) {
  const modal = Modal({ title: `Execution history — ${a.name}`, body: Skeleton(3) });
  try {
    const d = await apiGet(`/automations/${a.id}/history`);
    modal.dialog.querySelector(".modal-body").replaceChildren(
      h("div", { class: "kv" },
        kvRowSafe("Total triggers", d.trigger_count),
        kvRowSafe("Last triggered", d.last_triggered ? fmtDate(d.last_triggered) : "never")),
      d.history.length
        ? h("div", { class: "feed" }, d.history.map((e) => feedRow(e)))
        : EmptyState({ title: "No executions yet", body: "This automation hasn't matched any messages yet.", icon: "bolt" }));
  } catch (e) { modal.dialog.querySelector(".modal-body").replaceChildren(ErrorState(e)); }
}

/* ============ RULE MODAL ============ */
function ruleModal(initial, onDone) {
  const a = initial || { type: "auto_reply", name: "", config: {}, cooldown: 2.0, channels: [], users: [] };
  const name = h("input", { class: "field-input", type: "text", value: a.name || "", placeholder: "e.g. Support auto-reply" });
  const typeSel = sel(["auto_reply", "auto_react", "keyword", "custom_trigger"], a.type || "auto_reply");
  const trigger = h("input", { class: "field-input", type: "text", value: (a.config || {}).trigger || "", placeholder: "trigger text" });
  const responseText = h("input", { class: "field-input", type: "text", value: (a.config || {}).responses ? (a.config.responses[0] || "") : ((a.config || {}).response || ""), placeholder: "Response text" });
  const reactionsText = h("input", { class: "field-input", type: "text", value: ((a.config || {}).reactions || [""]).join(","), placeholder: ",️" });
  const keywordsText = h("input", { class: "field-input", type: "text", value: ((a.config || {}).keywords || []).join(","), placeholder: "alpha,beta" });
  const cooldown = h("input", { class: "field-input", type: "number", value: a.cooldown ?? 2, step: "0.5" });
  const channels = chipInput((a.channels || []).map(String));
  const users = chipInput((a.users || []).map(String));

  const fieldsEl = h("div", {});
  const fieldsFor = (t) => {
    const div = h("div", {});
    if (t === "auto_react") {
      div.appendChild(field("Reactions (comma-separated)", reactionsText, "reaction emojis to add"));
      div.appendChild(field("Trigger", trigger, "message content to match"));
    } else if (t === "keyword") div.appendChild(field("Keywords (comma-separated)", keywordsText));
    else { div.appendChild(field("Trigger", trigger, "text to match")); div.appendChild(field("Response", responseText, "what to send back")); }
    return div;
  };
  fieldsEl.appendChild(fieldsFor(typeSel.value));
  typeSel.onchange = () => { fieldsEl.replaceChildren(fieldsFor(typeSel.value)); };

  const chainPreview = h("div", {});
  const paintPreview = () => {
    const t = typeSel.value;
    const cfg = t === "auto_react" ? { trigger: trigger.value, reactions: reactionsText.value.split(",") }
      : t === "keyword" ? { keywords: keywordsText.value.split(",") }
      : { trigger: trigger.value, responses: [responseText.value] };
    chainPreview.replaceChildren(chainEl({ type: t, config: cfg, cooldown: parseFloat(cooldown.value) || 0 }));
  };
  [typeSel, trigger, responseText, reactionsText, keywordsText, cooldown].forEach((el) =>
    el.addEventListener("input", paintPreview));
  paintPreview();

  overlayForm(a.id ? `Edit: ${a.name}` : "New automation", [
    field("Name", name),
    field("Type", typeSel),
    fieldsEl,
    field("Cooldown (seconds)", cooldown),
    field("Channel restrictions", channels, "empty = all channels"),
    field("User restrictions", users, "empty = all users"),
    h("div", { class: "field" }, h("label", { class: "field-label", text: "Preview" }), chainPreview),
  ], async () => {
    const t = typeSel.value, config = {};
    if (t === "auto_react") { config.reactions = reactionsText.value.split(",").map((s) => s.trim()).filter(Boolean); config.trigger = trigger.value; }
    else if (t === "keyword") { config.keywords = keywordsText.value.split(",").map((s) => s.trim()).filter(Boolean); }
    else { config.trigger = trigger.value; config.mode = "contains"; config.responses = [responseText.value || (trigger.value + "!")]; }
    const payload = { type: t, name: name.value || "rule", config, cooldown: parseFloat(cooldown.value) || 2,
      channels: channels.value.map(Number).filter(Boolean), users: users.value.map(Number).filter(Boolean),
      enabled: a.enabled ?? true };
    if (a.id) await apiPut("/automations/" + a.id, payload); else await apiPost("/automations", payload);
    toast(a.id ? "Automation updated" : "Automation created", "ok");
    onDone?.();
  });
}

/* ============ JOB MODAL ============ */
function jobModal() {
  const name = h("input", { class: "field-input", type: "text", placeholder: "Job name" });
  const typeSel = sel(["custom", "reminder", "recurring", "script"], "custom");
  const intervalSec = h("input", { class: "field-input", type: "number", value: 3600, min: 1 });
  const cronField = h("input", { class: "field-input", type: "text", placeholder: "0 9 * * *", value: "" });
  const channel = h("input", { class: "field-input", type: "text", placeholder: "channel id" });
  const content = h("input", { class: "field-input", type: "text", placeholder: "message content" });
  const scriptSel = h("input", { class: "field-input", type: "text", placeholder: "script name" });

  const extraEl = h("div", {});
  const rebuildType = () => {
    const t = typeSel.value; extraEl.innerHTML = "";
    if (t === "script") extraEl.appendChild(field("Script name", scriptSel));
    else if (t === "custom" || t === "recurring") {
      extraEl.appendChild(field("Interval (seconds)", intervalSec));
      extraEl.appendChild(field("Channel ID", channel));
      extraEl.appendChild(field("Message content", content));
    } else {
      extraEl.appendChild(field("Cron expression", cronField, "minute hour day month weekday"));
      extraEl.appendChild(field("Channel ID", channel));
      extraEl.appendChild(field("Message content", content));
    }
  };
  rebuildType(); typeSel.onchange = rebuildType;

  overlayForm("New scheduled job", [
    field("Name", name), field("Type", typeSel), extraEl,
  ], async () => {
    const t = typeSel.value; let schedule, action;
    if (t === "script") { schedule = { type: "interval", seconds: 3600 }; action = { type: "script", script: scriptSel.value }; }
    else {
      schedule = (t === "custom" || t === "recurring") ? { type: "interval", seconds: parseInt(intervalSec.value) || 3600 } : { type: "cron", cron: cronOnly(cronField.value) };
      action = { type: "send_message", channel_id: parseInt(channel.value) || 0, content: (t === "reminder" ? "⏰ " : "") + content.value };
    }
    await apiPost("/jobs", { name: name.value || "job", job_type: t, schedule, action, enabled: true });
    toast("Job scheduled", "ok"); renderApp();
  });
}
function cronOnly(exp) {
  const p = exp.trim().split(/\s+/);
  if (p.length === 5) return { minute: p[0], hour: p[1], day: p[2], month: p[3], day_of_week: p[4] };
  return {};
}

/* ============ RENDER AFK ============ */
function renderAfk(body, afk) {
  const msg = h("input", { class: "field-input", type: "text", value: afk.message || "", placeholder: "AFK message" });
  const ret = h("input", { class: "field-input", type: "text", value: afk.return_message || "", placeholder: "Return message" });
  const cooldown = h("input", { class: "field-input", type: "number", value: afk.cooldown || 30 });
  const ignoredUsers = chipInput((afk.ignored_users || []).map(String));
  const ignoredChannels = chipInput((afk.ignored_channels || []).map(String));

  body.appendChild(h("div", { class: "grid grid-cols-2" },
    Panel("AFK status", [
      h("div", { class: "kv" },
        kvRowSafe("State", afk.started_at ? "AFK since " + fmtTime(afk.started_at) : "Not AFK")),
      Toggle("AFK enabled", afk.enabled, { onChange: async (v) => { await apiPost("/afk/toggle", { enabled: v, message: "AFK" }); toast("Saved", "ok"); renderApp(); } }),
      field("AFK message", msg), field("Return message", ret), field("Response cooldown (s)", cooldown),
    ]),
    Panel("Restrictions", [
      field("Ignored users (Discord IDs)", ignoredUsers),
      field("Ignored channels (Discord IDs)", ignoredChannels),
      h("div", { class: "flex justify-end gap-3 mt-4" },
        Button({ label: "Save AFK settings", variant: "primary", onclick: async () => {
          await apiPut("/afk", { message: msg.value, return_message: ret.value, cooldown: parseInt(cooldown.value) || 30,
            ignored_users: ignoredUsers.value.map(Number).filter(Boolean), ignored_channels: ignoredChannels.value.map(Number).filter(Boolean) });
          toast("AFK settings saved", "ok");
        }})),
    ])));
}

/* ============ RENDER OWO ============ */
function renderOwo(body, owo) {
  const ch = h("input", { class: "field-input", type: "number", value: owo.channel_id || 0, placeholder: "channel id" });
  body.appendChild(h("div", { class: "grid grid-cols-2" },
    Panel("OwO Farmer", [
      h("div", { class: "kv" },
        kvRowSafe("State", Badge(owo.enabled ? "Running" : "Stopped", owo.enabled ? "success" : "default"))),
      Toggle("Enabled", owo.enabled, { onChange: async (v) => { await apiPut("/owo", { enabled: v }); toast("OwO farmer " + (v ? "started" : "stopped"), "ok"); renderApp(); } }),
      field("Target channel ID", ch, "0 = auto-detect from events"),
      Button({ label: "Save channel", variant: "primary", onclick: async () => {
        await apiPut("/owo", { channel_id: parseInt(ch.value) || 0 }); toast("Channel saved", "ok");
      }}),
    ]),
    Panel("Auto actions", [
      owoRow("Hunt", owo.auto_hunt, "auto_hunt"),
      owoRow("Battle", owo.auto_battle, "auto_battle"),
      owoRow("Daily", owo.auto_daily, "auto_daily"),
      owoRow("Quests", owo.auto_quest, "auto_quest"),
      owoRow("Sell / Sacrifice", owo.auto_sell || owo.auto_sacrifice, "auto_sell"),
      owoRow("Gamble", owo.auto_gamble, "auto_gamble"),
    ])));
  function owoRow(label, on, key) { return Toggle(label, on, { onChange: async (v) => { await apiPut("/owo", { [key]: v }); toast("Saved", "ok"); } }); }
}

/* ============ RENDER RULES ============ */
function renderRules(body, autos) {
  if (!autos.length) {
    body.appendChild(EmptyState({
      title: "No automations yet",
      body: "Automations react to messages for you — auto replies, auto reactions, keyword detection.",
      icon: "bolt",
      action: Button({ label: "Create your first automation", variant: "primary", icon: "plus", onclick: () => ruleModal(null, () => renderApp()) }),
    }));
    return;
  }
  const list = h("div", { class: "stack" });
  for (const a of autos) {
    const expanded = a._open;
    const card = h("div", { class: "rule-card" + (a.enabled ? "" : " off") },
      h("div", { class: "rule-card-head" },
        h("button", { class: "rule-card-toggle", "data-tip": expanded ? "Collapse" : "Expand",
          onclick: () => { a._open = !a._open; renderRules(body, autos); }, html: Icon(expanded ? "chevron_d" : "chevron_r", 14) }),
        h("div", { class: "rule-card-id" },
          h("span", { class: "rule-card-name", text: a.name }),
          h("span", { class: "rule-card-meta", text: describeAuto(a) })),
        h("span", { class: "spacer" }),
        a.trigger_count ? h("span", { class: "badge badge-brand", text: `${a.trigger_count} runs` }) : null,
        Toggle(a.name, a.enabled, { onChange: async (v) => { await apiPost(`/automations/${a.id}/toggle`, { enabled: v }); a.enabled = v; renderRules(body, autos); } })),
      expanded ? chainEl(a) : null,
      expanded ? h("div", { class: "rule-card-foot" },
        Button({ label: "Test run", icon: "play", size: "sm", onclick: async () => {
          const r = await apiPost(`/automations/${a.id}/run`, { sample: { content: (a.config || {}).trigger || "test", author_name: "tester" } });
          toast(r.ok && r.matched ? "Automation executed" : r.detail || "Conditions didn't match", r.ok && r.matched ? "ok" : "");
        }}),
        Button({ label: "History", icon: "history", size: "sm", onclick: () => autoHistory(a) }),
        Button({ label: "Duplicate", icon: "copy", size: "sm", onclick: async () => { await apiPost(`/automations/${a.id}/duplicate`); toast("Duplicated", "ok"); renderApp(); } }),
        Button({ label: "Edit", icon: "edit", size: "sm", onclick: () => ruleModal(a, () => renderApp()) }),
        h("span", { class: "spacer" }),
        Button({ label: "Delete", icon: "trash", size: "sm", variant: "danger", onclick: async () => {
          if (await ConfirmDialog({ title: "Delete automation?", message: `"${a.name}" will stop running. This cannot be undone.`, confirmLabel: "Delete" }))
            { await apiDel("/automations/" + a.id); toast("Deleted", "ok"); renderApp(); }
        }})) : null);
    list.appendChild(card);
  }
  body.appendChild(list);
}

function describeAuto(a) {
  const cfg = a.config || {};
  if (a.type === "auto_reply") return `"${cfg.trigger || ""}" → ${(cfg.responses || []).length} response(s)`;
  if (a.type === "auto_react") return `"${cfg.trigger || ""}" → ${(cfg.reactions || [""]).join(", ")}`;
  if (a.type === "keyword") return `keywords: ${(cfg.keywords || []).join(", ") || "—"}`;
  return JSON.stringify(cfg).slice(0, 60);
}

/* ============ RENDER JOBS ============ */
function renderJobs(body, jobs) {
  const render = () => {
    body.replaceChildren();
    body.appendChild(h("div", { class: "flex justify-between items-center mb-6" },
      h("div", {}),
      Button({ label: "New job", variant: "primary", icon: "plus", onclick: jobModal })));
    if (!jobs.length) { body.appendChild(EmptyState({ title: "No scheduled jobs", body: "Schedule messages, reminders, or recurring tasks.", icon: "clock" })); return; }
    body.appendChild(DataTable({
      columns: [
        { key: "name", label: "Name" },
        { key: "job_type", label: "Type", render: (j) => h("code", { class: "mono", text: j.job_type }) },
        { key: "schedule", label: "Schedule", render: (j) => document.createTextNode(describeSchedule(j.schedule)) },
        { key: "action", label: "Action", render: (j) => h("code", { class: "mono", text: describeAction(j.action) }) },
        { key: "next_run", label: "Next run", render: (j) => document.createTextNode(fmtDate(j.next_run)) },
        { key: "run_count", label: "Runs" },
      ],
      rows: jobs,
      emptyMsg: "No scheduled jobs",
      rowActions: (j) => h("span", {},
        Button({ icon: "trash", size: "sm", variant: "danger", title: "Delete", onclick: async () => {
          if (await ConfirmDialog({ title: "Delete job?", message: `"${j.name}" will stop running.`, confirmLabel: "Delete" }))
            { await apiDel("/jobs/" + j.id); toast("Deleted", "ok"); renderApp(); }
        }}),
        Toggle(j.enabled, async (v) => { await apiPost(`/jobs/${j.id}/toggle`, { enabled: v }); j.enabled = v; render(); })),
    }));
  };
  render();
}

function describeSchedule(s) {
  s = s || {};
  if (s.type === "interval") {
    let p = "every ";
    if (s.days) p += s.days + "d ";
    if (s.hours) p += s.hours + "h ";
    if (s.minutes) p += s.minutes + "m ";
    if (s.seconds || (!s.days && !s.hours && !s.minutes)) p += (s.seconds || 3600) + "s";
    return p;
  }
  if (s.type === "cron") return "cron";
  if (s.type === "once") return "once";
  return s.type || "custom";
}
function describeAction(a) {
  a = a || {};
  if (a.type === "send_message") return `msg → ch ${a.channel_id || "?"}`;
  if (a.type === "script") return `run ${a.script || ""}`;
  return a.type || "—";
}

window.viewAutomations = viewAutomations;

/* === BUNDLE: views-b.js === */
/* Hunter — views part B: scripts, custom commands, profile */
/* ============ SCRIPTS ============ */
async function viewScripts(slot) {
  slot.replaceChildren(Skeleton(5));
  let data;
  try { data = await apiGet("/scripts"); } catch (e) { slot.replaceChildren(ErrorState(e)); return; }
  const scripts = data.scripts || [];

  const render = () => {
    slot.replaceChildren(
      pageHead("Scripts", "Data-driven automation: trigger → conditions → actions → response. Actions are whitelisted — no arbitrary code."),
      h("div", { class: "flex gap-3 mb-4" },
        h("span", { class: "spacer" }),
        Button({ label: "Import", variant: "secondary", icon: "upload", onclick: () => document.getElementById("import-file").click() }),
        h("input", { id: "import-file", type: "file", accept: ".json", class: "hidden", onchange: importFile }),
        Button({ label: "New script", variant: "primary", icon: "plus", onclick: () => scriptModal(null, render) })),
      scripts.length === 0
        ? EmptyState({ title: "No scripts yet", body: "Scripts respond to events and run whitelisted actions.", icon: "script", action: Button({ label: "Create script", variant: "primary", icon: "plus", onclick: () => scriptModal(null, render) }) })
        : DataTable({
            columns: [
              { key: "name", label: "Name", render: (s) => h("b", { text: s.name }) },
              { key: "trigger", label: "Trigger", render: (s) => h("code", { class: "mono" }, describeTrigger(s.trigger)) },
              { key: "conditions", label: "Cond.", render: (s) => (s.conditions || []).length },
              { key: "actions", label: "Act.", render: (s) => (s.actions || []).length },
              { key: "execution_count", label: "Runs" },
              { key: "last_error", label: "Last error", render: (s) => s.last_error ? h("span", { class: "text-danger" }, esc(String(s.last_error).slice(0, 34))) : h("span", { class: "text-faint" }, "—") },
            ],
            rows: scripts,
            rowActions: (s) => h("span", {},
              Button({ label: "Edit", size: "sm", variant: "ghost", onclick: () => scriptModal(scripts.find(x => x.id === s.id), render) }),
              Button({ label: "Export", size: "sm", onclick: exportOne(s) }),
              Button({ label: "Duplicate", size: "sm", onclick: dup(s.id) }),
              Button({ label: "Del", size: "sm", variant: "danger", onclick: del(s.id) }),
              Toggle(s.enabled, async (v) => { await apiPost("/scripts/" + s.id + "/toggle", { enabled: v }); render(); })),
            },
          ));
  };
  
  async function del(id) { await apiDel("/scripts/" + id); toast("Deleted", "ok"); render(); }
  function dup(id) { return async () => { await apiPost("/scripts/" + id + "/duplicate"); toast("Duplicated", "ok"); render(); }; }
  function exportOne(s) { return () => { const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(blob); const a = h("a", { href: u, download: s.name + ".script.json" }); a.click(); URL.revokeObjectURL(u); }; }
  async function importFile(e) {
    const file = e.target.files[0]; if (!file) return;
    try { const obj = JSON.parse(await file.text()); await apiPost("/scripts/import", obj); toast("Imported", "ok"); render(); }
    catch (err) { toast("Import failed: " + err.message, "err"); }
    e.target.value = "";
  }
  render();
}

function describeTrigger(tr) {
  tr = tr || {};
  return ((tr.type || "message_contains").replace(/_/g, " ") + (tr.pattern ? " · " + tr.pattern : ""));
}

function scriptModal(initial, onDone) {
  const s = initial || { name: "", description: "", trigger: { type: "message_contains", pattern: "" }, conditions: [], actions: [], enabled: true };
  const name = h("input", { class: "field-input", type: "text", value: s.name, placeholder: "Script name" });
  const desc = h("input", { class: "field-input", type: "text", value: s.description || "", placeholder: "Description" });
  const trigType = sel(["message_contains", "message_exact", "message_starts_with", "message_regex", "any_message", "author_id", "channel_id"], s.trigger.type || "message_contains");
  const pattern = h("input", { class: "field-input", type: "text", value: s.trigger.pattern || "", placeholder: "e.g. hello" });

  const condOn = h("input", { type: "checkbox", checked: (s.conditions || []).length > 0 });
  const condChannel = h("input", { class: "field-input", type: "text", placeholder: "channel id (or author id)", value: (s.conditions || []).find(c => c.type === "channel")?.value || "" });
  const condEl = h("div", {});
  const rebuildCond = () => { condEl.innerHTML = ""; if (condOn.checked) condEl.appendChild(field("Restrict to channel", condChannel, "leave empty = no restriction")); };
  condOn.onchange = rebuildCond; rebuildCond();

  const actionType = sel(["send_message", "react", "set_afk", "end_afk"], "send_message");
  const actChannel = h("input", { class: "field-input", type: "text", value: "", placeholder: "channel id (empty = same)" });
  const actContent = h("input", { class: "field-input", type: "text", value: "", placeholder: "content — supports {user} {username} {server} {channel} {time} {date} {message}" });
  const actEmoji = h("input", { class: "field-input", type: "text", value: "", placeholder: "emoji" });
  const actEl = h("div", {});
  const rebuildAction = () => {
    actEl.innerHTML = "";
    if (actionType.value === "send_message") { actEl.appendChild(field("Channel", actChannel)); actEl.appendChild(field("Content", actContent)); }
    else if (actionType.value === "react") actEl.appendChild(field("Emoji", actEmoji));
    else if (actionType.value === "set_afk") actEl.appendChild(field("Message", h("input", { class: "field-input", type: "text", placeholder: "AFK message", id: "afk-msg-in" })));
  };
  rebuildAction(); actionType.onchange = rebuildAction;

  const saveScript = async () => {
    const conditions = condOn.checked && condChannel.value ? [{ type: "channel", value: condChannel.value }] : [];
    const actions = [];
    if (actionType.value === "send_message") actions.push({ type: "send_message", content: actContent.value, channel_id: actChannel.value ? parseInt(actChannel.value) : undefined });
    else if (actionType.value === "react") actions.push({ type: "react", emoji: actEmoji.value || "" });
    else if (actionType.value === "set_afk") actions.push({ type: "set_afk", message: $("#afk-msg-in")?.value || "AFK" });
    else if (actionType.value === "end_afk") actions.push({ type: "end_afk" });

    const payload = { name: name.value || "script", description: desc.value, enabled: s.enabled ?? true,
      trigger: { type: trigType.value, pattern: pattern.value }, conditions, actions };
    try {
      if (s.id) await apiPut("/scripts/" + s.id, { ...payload, response: s.response || [], permissions: s.permissions || ["safe"] });
      else await apiPost("/scripts", { ...payload, response: [], permissions: ["safe"] });
      toast("Saved", "ok"); modal.close(); onDone && onDone();
    } catch (e) { toast(e.message, "err"); }
  };

  const modal = Modal({
    title: s.id ? "Edit script" : "New script",
    wide: true,
    body: h("div", {},
      field("Name", name), field("Description", desc),
      h("div", { class: "section-label", text: "Trigger" }),
      field("Event", trigType), field("Pattern", pattern),
      h("div", { class: "section-label", text: "Conditions" }),
      Toggle("Restrict to a channel", condOn.checked, { onChange: rebuildCond }), condEl,
      h("div", { class: "section-label", text: "Action" }),
      field("Type", actionType), actEl),
    footer: [
      Button({ label: "Cancel", onclick: () => modal.close() }),
      Button({ label: s.id ? "Save" : "Create", variant: "primary", onclick: saveScript }),
    ],
  });
}

function describeTrigger(tr) {
  tr = tr || {};
  return ((tr.type || "message_contains").replace(/_/g, " ") + (tr.pattern ? " · " + tr.pattern : ""));
}

/* ============ CUSTOM COMMANDS ============ */
async function viewCustom(slot) {
  slot.replaceChildren(Skeleton(5));
  let data;
  try { data = await apiGet("/custom-commands"); } catch (e) { slot.replaceChildren(ErrorState(e)); return; }
  const cmds = data.commands || [];

  const render = () => {
    const tableEl = DataTable({
      columns: [
        { key: "name", label: "Trigger", render: (c) => h("code", { class: "mono cmd-name" }, (Store.client.prefix || "h!") + c.name) },
        { key: "response", label: "Response", render: (c) => c.response.length > 60 ? c.response.slice(0, 60) + "…" : c.response },
        { key: "aliases", label: "Aliases", render: (c) => renderAliases(c.aliases || []) },
        { key: "usage_count", label: "Used" },
      ],
      rows: cmds,
      rowActions: (c) => h("span", {},
        Button({ label: "Edit", size: "sm", variant: "ghost", onclick: () => customModal(cmds.find(x => x.id === c.id), render) }),
        Button({ label: "Del", size: "sm", variant: "danger", onclick: del(c.id) }),
        Toggle(c.enabled, async (v) => { await apiPost("/custom-commands/" + c.id + "/toggle", { enabled: v }); render(); })),
    });
    slot.replaceChildren(
      pageHead("Custom Commands", "Define your own prefix commands with variables and arguments."),
      h("div", { class: "flex gap-3 mb-4" },
        h("span", { class: "text-dim text-sm" }, "Variables: ", h("code", { class: "mono", text: "{user} {username} {server} {channel} {time} {date} {message} {0} {1} {args}" })),
        h("span", { class: "spacer" }),
        Button({ label: "New command", variant: "primary", icon: "plus", onclick: () => customModal(null, render) })),
      tableEl);
  };
  
  async function del(id) { await apiDel("/custom-commands/" + id); toast("Deleted", "ok"); render(); }
  render();
}

function renderAliases(aliases) {
  if (!aliases.length) return h("span", { class: "text-faint text-xs" }, "—");
  const out = h("span", {});
  aliases.forEach((a, i) => { out.appendChild(h("code", { class: "mono", text: a })); if (i < aliases.length - 1) out.appendChild(document.createTextNode(", ")); });
  return out;
}

function customModal(initial, onDone) {
  const c = initial || { name: "", response: "", aliases: [], cooldown: 0, enabled: true };
  const name = h("input", { class: "field-input", type: "text", value: c.name, placeholder: "hello" });
  const response = h("textarea", { class: "field-textarea", value: c.response || "", placeholder: "Hello {user}!" });
  const aliases = chipInput((c.aliases || []).map(String));
  const cooldown = h("input", { class: "field-input", type: "number", value: c.cooldown || 0, step: "0.5" });

  const saveCmd = async () => {
    const payload = { name: name.value.trim(), response: response.value, aliases: aliases.value, cooldown: parseFloat(cooldown.value) || 0 };
    if (!payload.name || !payload.response) { toast("Name and response required", "err"); return; }
    try {
      if (c.id) await apiPut("/custom-commands/" + c.id, payload);
      else await apiPost("/custom-commands", { ...payload, trigger: "!" + payload.name });
      toast("Saved", "ok"); modal.close(); onDone && onDone();
    } catch (e) { toast(e.message, "err"); }
  };

  const modal = Modal({
    title: c.id ? "Edit custom command" : "New custom command",
    wide: true,
    body: h("div", {},
      field("Command name", name, "used without the prefix"),
      field("Response template", response),
      field("Aliases", aliases),
      field("Cooldown (s)", cooldown),
      h("div", { class: "field" }, h("div", { class: "field-hint" }, "Variables:\n{user} {username} {server} {channel}\n{time} {date} {message}\n{0} {1} … position args  {args} all args"))),
    footer: [
      Button({ label: "Cancel", onclick: () => modal.close() }),
      Button({ label: c.id ? "Save" : "Create", variant: "primary", onclick: saveCmd }),
    ],
  });
}

/* ============ PROFILE ============ */
async function viewProfile(slot) {
  slot.replaceChildren(Skeleton(5));
  let prof;
  try { prof = await apiGet("/profile"); } catch (e) { slot.replaceChildren(ErrorState(e)); return; }

  const render = () => {
    const avatarFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23232329'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%237c8cff' font-size='30' font-weight='bold'%3E%3F%3C/text%3E%3C/svg%3E";

    const profileCard = Panel("Profile", h("div", { class: "text-center" },
      h("img", { class: "avatar avatar-xl", src: prof.avatar || avatarFallback, alt: "Avatar" }),
      h("h2", { class: "mt-4" }, prof.username + "#" + prof.discriminator),
      h("p", { class: "hint" }, "ID: " + prof.id),
      h("p", { class: "hint" }, "Created: " + (prof.created_at ? fmtDate(prof.created_at) : "—")),
      prof.bio ? h("p", { class: "mt-6", style: "white-space:pre-wrap", text: prof.bio }) : h("p", { class: "hint mt-6" }, "No bio set")));

    const toolsCard = Panel("Profile Tools", h("div", { class: "stack" },
      Button({ label: "Check Profile", variant: "primary", icon: "shield", onclick: checkProfile }),
      Button({ label: "Edit Bio / Avatar (Unavailable)", variant: "secondary", icon: "edit",
        onclick: () => toast("Bio/Avatar editing requires Discord user API access (may not work for self-bots)", "warn") })));

    const errorCard = Panel("Profile unavailable", h("div", { class: "text-center" },
      h("div", { class: "empty" }, h("div", { class: "big" }, ""), h("p", { text: prof.error })),
      h("p", { class: "hint mt-4" }, "Set a valid Discord token in Settings → Connection, then restart the client.")));

    slot.replaceChildren(
      pageHead("Profile", "Your Discord account identity, live from Discord."),
      prof.error ? errorCard : h("div", { class: "grid grid-cols-2" }, profileCard, toolsCard));
  };


  async function checkProfile() {
    try {
      const fresh = await apiGet("/profile");
      if (fresh.error) { toast("Profile check failed: " + fresh.error, "err"); return; }
      toast("Profile OK: " + fresh.username + "#" + fresh.discriminator, "ok");
      render();
    } catch (e) { toast(e.message, "err"); }
  }

  render();
}

window.viewScripts = viewScripts;
window.viewCustom = viewCustom;
window.viewProfile = viewProfile;

/* === BUNDLE: views-c.js === */
/* Discord AIO // Settings & Activity Logs */
/* ============ LOGS ============ */
async function viewLogs(slot) {
  slot.replaceChildren(Skeleton(5));
  try {
    const data = await apiGet("/logs?limit=200");
    const entries = data.entries || [];
    
    if (!entries.length) {
      slot.replaceChildren(
        pageHead("Logs", "Raw structured log entries."),
        EmptyState({ title: "No log entries", body: "Log entries will appear here as the application runs.", icon: "database" })
      );
      return;
    }

    const levels = { debug: "dim", info: "info", warn: "warn", error: "err" };
    const list = h("div", { class: "feed" }, entries.map((l) => 
      h("button", { class: "log-row" + (l.level === "error" ? " err" : ""), onclick: () => logDetails(l) },
        h("span", { class: "feed-dot " + (levels[l.level] || "") }),
        h("div", { class: "feed-main" },
          h("span", { class: "feed-msg mono", text: l.message }),
          h("span", { class: "feed-meta", text: l.source || "system" })),
        h("span", { class: "feed-time", text: fmtTime(l.timestamp) })
      )
    ));

    slot.replaceChildren(
      pageHead("Logs", "Raw structured log entries.", [
        Button({ label: "Refresh", variant: "secondary", icon: "refresh", onclick: () => renderApp() })
      ]),
      list);
  } catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); }
}

function logDetails(l) {
  const rows = [];
  const put = (k, v) => v !== undefined && v !== null && v !== "" && rows.push([k, String(v)]);
  put("Level", l.level);
  put("Source", l.source);
  put("Event", l.event_type);
  put("Message", l.message);
  put("Time", fmtDate(l.timestamp));
  if (l.context) put("Context", JSON.stringify(l.context, null, 2));
  if (l.details) put("Details", l.details);
  Modal({
    title: "Log Entry Details",
    body: h("div", { class: "kv" }, rows.map(([k, v]) =>
      h("div", { class: "kv-row" }, h("span", { class: "kv-k", text: k }), h("span", { class: "kv-v mono", text: v })))),
  });
}

/* ============ SETTINGS ============ */
async function viewSettings(slot) {
  slot.replaceChildren(Skeleton(5));
  let s, tokenStatus;
  try {
    s = await apiGet("/settings");
    try { tokenStatus = await apiGet("/token/status"); } catch (e) { tokenStatus = { configured: false }; }
  } catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); return; }

  let tab = "general";
  const body = h("div", { class: "mt-4" });

  const renderTab = () => {
    body.replaceChildren();
    if (tab === "general") renderGeneral();
    else if (tab === "connection") renderConnection();
    else if (tab === "appearance") renderAppearance();
    else if (tab === "advanced") renderAdvanced();
  };

  /* ---- GENERAL ---- */
  function renderGeneral() {
    const prefixInput = h("input", { class: "field-input", type: "text", value: s.command_prefix || s.prefix || ".", style: "max-width:140px" });
    const autoDeleteSwitch = Toggle("Auto-Delete Outgoing Messages", s.auto_delete_enabled !== false, {
      sub: "Automatically delete selfbot replies after delay",
      onChange: (v) => { s.auto_delete_enabled = v; }
    });
    const autoDeleteDelay = h("input", { class: "field-input", type: "number", value: (s.auto_delete_delay || 15000) / 1000, style: "max-width:140px" });
    const deleteTriggerSwitch = Toggle("Delete Command Trigger", s.delete_trigger_before_send !== false, {
      sub: "Delete prefix trigger message in chat with safe human jitter",
      onChange: (v) => { s.delete_trigger_before_send = v; }
    });
    const humanTypingSwitch = Toggle("Simulate Human Typing", s.human_typing !== false, {
      sub: "Emit typing indicator before sending message",
      onChange: (v) => { s.human_typing = v; }
    });

    const saveBtn = Button({
      label: "Save Settings",
      variant: "primary",
      onclick: async () => {
        try {
          await apiPut("/settings", {
            command_prefix: prefixInput.value.trim() || ".",
            auto_delete_enabled: Boolean(s.auto_delete_enabled),
            auto_delete_delay: (parseInt(autoDeleteDelay.value, 10) || 15) * 1000,
            delete_trigger_before_send: Boolean(s.delete_trigger_before_send),
            human_typing: Boolean(s.human_typing)
          });
          toast("Settings saved successfully", "ok");
          refreshClientState();
        } catch (e) {
          toast(e.message, "err");
        }
      }
    });

    body.replaceChildren(
      h("div", { class: "grid grid-cols-2" },
        Panel("Workspace & Prefix", [
          field("Command prefix", prefixInput, "Trigger for selfbot commands (e.g. . or !)"),
          field("Auto-delete delay (seconds)", autoDeleteDelay, "15s recommended"),
          saveBtn
        ]),
        Panel("Anti-Detection & Stealth", [
          autoDeleteSwitch,
          deleteTriggerSwitch,
          humanTypingSwitch
        ])
      )
    );
  }

  /* ---- CONNECTION ---- */
  function renderConnection() {
    const tokenInput = h("input", { class: "field-input", type: "password", placeholder: "Paste Discord user token" });
    const statusEl = h("div", { class: "mt-3" });
    const conn = Store.client;
    body.replaceChildren(
      h("div", { class: "grid grid-cols-2" },
        Panel("Gateway Connection", [
          h("div", { class: "kv" },
            kvRowSafe("State", cap(conn.control_state) + (conn.connection_state ? " · " + cap(conn.connection_state) : "")),
            kvRowSafe("Account", conn.user ? conn.user.username : "Not Connected"),
            kvRowSafe("Gateway Latency", conn.connection_state === "connected" ? conn.latency + "ms" : "Offline"),
            kvRowSafe("Process Uptime", conn.uptime_seconds ? fmtDuration(conn.uptime_seconds) : "0s")),
          h("div", { class: "flex gap-3 mt-4" },
            conn.control_state === "running"
              ? Button({ label: "Restart Gateway", icon: "rotate", onclick: () => clientAction("restart") })
              : Button({ label: "Start Gateway", variant: "primary", icon: "play", onclick: () => clientAction("start") }),
            Button({ label: "Stop Gateway", icon: "stop", variant: "danger", onclick: () => clientAction("stop") })),
        ]),
        Panel("Discord Account Token", [
          h("p", { class: "text-muted mb-4" }, "Your Discord user token authenticates the selfbot. Stored securely server-side in config.json."),
          field("Token", tokenInput),
          statusEl,
          h("div", { class: "flex gap-3 mt-4" },
            Button({ label: "Validate Token", icon: "shield", onclick: async () => {
              const token = tokenInput.value.trim();
              if (!token) { statusEl.innerHTML = '<span class="text-warning">Enter a token first</span>'; return; }
              statusEl.textContent = "Validating with Discord API...";
              const r = await apiPost("/token/validate", { token, validate: true });
              if (r.valid && r.user) { statusEl.innerHTML = `<span class="text-success">[VALID] Logged in as ${r.user.username}#${r.user.discriminator}</span>`; }
              else { statusEl.innerHTML = `<span class="text-danger">[INVALID] ${r.error || "Discord rejected token"}</span>`; }
            }}),
            Button({ label: "Save & Connect", variant: "primary", onclick: async () => {
              const token = tokenInput.value.trim();
              if (!token) { statusEl.innerHTML = '<span class="text-warning">Enter a token first</span>'; return; }
              statusEl.textContent = "Saving...";
              await apiPost("/token/set", { token, validate: true });
              statusEl.innerHTML = '<span class="text-success">[SAVED] Connecting gateway...</span>';
              await refreshClientState();
              setTimeout(() => clientAction("start"), 800);
            }}))
        ])
      )
    );
  }

  /* ---- APPEARANCE ---- */
  async function renderAppearance() {
    body.replaceChildren(Skeleton(3));
    let themes;
    try { themes = await apiGet("/themes"); } catch (e) { body.replaceChildren(ErrorState(e)); return; }
    body.replaceChildren(
      Panel("Appearance & Palette", [
        h("div", { class: "section-label", text: "Active Theme Selection" }),
        h("div", { class: "chip-row" },
          (themes.themes || []).map((t) =>
            h("button", { class: "chip" + (t.active ? " active" : ""), onclick: async () => {
              await apiPost(`/themes/${t.id}/apply`);
              toast(`Theme applied: ${t.name}`, "ok");
              renderApp();
            }}, t.name))),
        h("p", { class: "text-muted text-sm mt-3" }, "Full theme editing and live custom palette builder lives in the Themes page."),
      ])
    );
  }

  /* ---- ADVANCED ---- */
  function renderAdvanced() {
    body.replaceChildren(
      h("div", { class: "grid grid-cols-2" },
        Panel("System Diagnostics", [
          h("div", { class: "kv" },
            kvRowSafe("Engine", "Discord AIO Selfbot v2.5"),
            kvRowSafe("Architecture", "Node.js (CommonJS)"),
            kvRowSafe("Client Identity", "Mozilla Firefox v136.0 Cloak"),
            kvRowSafe("Rate Limiting", "Hierarchical Token Buckets (Active)"),
            kvRowSafe("Secret Sanitizer", "Universal Redactor (Active)")),
          h("div", { class: "flex gap-3 mt-4" },
            Button({ label: "Raw Logs", icon: "database", onclick: () => navigate("logs") }),
            Button({ label: "Activity Timeline", icon: "activity", onclick: () => navigate("activity") })),
        ]),
        Panel("Session & Webhooks", [
          h("p", { class: "text-muted mb-4" }, "Configure deleted message webhook forwarding to keep terminal clean."),
          Button({ label: "Configure in Terminal", icon: "terminal", onclick: () => navigate("console") }),
          h("div", { class: "mt-4" },
            Button({ label: "Sign out", icon: "power", variant: "danger", onclick: async () => { await apiPost("/auth/logout"); renderLogin(); } })
          )
        ])
      )
    );
  }

  slot.replaceChildren(
    pageHead("Settings", "Configure your Discord selfbot workspace."),
    Tabs([
      { id: "general", label: "General" },
      { id: "connection", label: "Connection" },
      { id: "appearance", label: "Appearance" },
      { id: "advanced", label: "Advanced" },
    ], tab, (id) => { tab = id; renderTab(); }),
    body);
  renderGeneral();
}

function kvRowSafe(k, v) {
  return h("div", { class: "kv-row" }, h("span", { class: "kv-k", text: k }), h("span", { class: "kv-v", text: String(v) }));
}

function sv(key, setter) {
  return async (v) => { try { await apiPut("/settings", { [key]: v }); setter(v); toast("Saved", "ok"); } catch (e) { toast(e.message, "err"); } };
}

window.viewLogs = viewLogs;
window.viewSettings = viewSettings;


/* === BUNDLE: views-presence.js === */
/* Hunter — Presence Studio: config + live Discord-style preview */
async function viewPresence(slot) {
  slot.replaceChildren(Skeleton(4));
  let pres;
  try { pres = await apiGet("/presence"); }
  catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); return; }

  const state = {
    status: pres.status || "online",
    type: pres.activities?.[0]?.type || "playing",
    name: pres.activities?.[0]?.name || "",
    details: pres.activities?.[0]?.details || "",
    state: pres.activities?.[0]?.state || "",
    url: pres.activities?.[0]?.url || "",
  };

  /* live preview — Discord profile-style card */
  const preview = h("div", { class: "presence-preview" });
  const paintPreview = () => {
    const statusTone = { online: "ok", idle: "warn", dnd: "err", invisible: "off" }[state.status] || "off";
    const typeLabel = { playing: "Playing", streaming: "Streaming", listening: "Listening to", watching: "Watching", custom: "" }[state.type] || "Playing";
    const u = Store.client.user;
    const initials = (u?.username || "U").slice(0, 2).toUpperCase();
    preview.replaceChildren(
      h("div", { class: "pv-card" },
        h("div", { class: "pv-card-banner" }),
        h("div", { class: "pv-card-avatar-wrap" },
          u?.avatar ? h("img", { class: "pv-card-avatar", src: u.avatar, alt: "" })
                    : h("span", { class: "pv-card-avatar pv-card-avatar-fallback", text: initials }),
          h("span", { class: "status-dot " + statusTone + " pv-card-status" }, h("span", { class: "sdot-dot" }))),
        h("div", { class: "pv-card-body" },
          h("div", { class: "pv-card-name", text: u ? u.username : "Your account" }),
          h("div", { class: "pv-card-tag", text: u ? `#${u.discriminator}` : "" }),
          state.name ? h("div", { class: "pv-card-activity" },
            typeLabel && state.type !== "custom" ? h("span", { class: "pv-card-activity-label", text: typeLabel }) : null,
            h("span", { class: "pv-card-activity-name", text: state.name })) : null,
          state.details ? h("div", { class: "pv-card-detail", text: state.details }) : null,
          state.state ? h("div", { class: "pv-card-detail", text: state.state }) : null,
          !state.name && !state.details && !state.state
            ? h("div", { class: "pv-card-activity-label", text: "No activity set" }) : null)));
  };

  /* controls */
  const statusSel = sel([["online", "Online"], ["idle", "Idle"], ["dnd", "Do not disturb"], ["invisible", "Invisible"]], state.status);
  const typeSel = sel([["playing", "Playing"], ["streaming", "Streaming"], ["listening", "Listening to"], ["watching", "Watching"], ["custom", "Custom status"]], state.type);
  const nameIn = h("input", { class: "field-input", type: "text", value: state.name, placeholder: "Activity name" });
  const detailsIn = h("input", { class: "field-input", type: "text", value: state.details, placeholder: "Details (rich presence)" });
  const stateIn = h("input", { class: "field-input", type: "text", value: state.state, placeholder: "State (rich presence)" });
  const urlIn = h("input", { class: "field-input", type: "text", value: state.url, placeholder: "https://twitch.tv/…" });

  const sync = () => {
    state.status = statusSel.value; state.type = typeSel.value;
    state.name = nameIn.value; state.details = detailsIn.value;
    state.state = stateIn.value; state.url = urlIn.value;
    paintPreview();
  };
  [statusSel, typeSel, nameIn, detailsIn, stateIn, urlIn].forEach((el) => el.addEventListener("input", sync));

  const presets = h("div", { class: "preset-row" }, [
    ["play", "Playing Game", "playing", "Discord AIO"],
    ["presence", "Listening Music", "listening", "Spotify"],
    ["eye", "Watching Stream", "watching", "Twitch"],
    ["moon", "Idle Status", "idle", ""],
    ["wifi", "Live Broadcast", "streaming", "https://twitch.tv"],
  ].map(([iconName, label, type, name]) =>
    h("button", { class: "preset", onclick: () => {
      state.status = type === "idle" ? "idle" : "online";
      state.type = type; state.name = name || label; state.details = ""; state.state = ""; state.url = "";
      statusSel.value = state.status; typeSel.value = type; nameIn.value = state.name;
      detailsIn.value = ""; stateIn.value = ""; urlIn.value = "";
      paintPreview();
    }}, h("span", { class: "preset-icon", html: Icon(iconName, 14) }), h("span", { class: "preset-label", text: label }))));

  const applyBtn = Button({
    label: "Apply presence", variant: "primary", icon: "check",
    onclick: async () => {
      const activity = state.name || state.details || state.state || state.type === "custom"
        ? { type: state.type, name: state.name || undefined, details: state.details || undefined,
            state: state.state || undefined, url: state.url || undefined }
        : null;
      if (activity) for (const k of Object.keys(activity)) activity[k] === undefined && delete activity[k];
      await apiPut("/presence", { status: state.status, activity });
      toast("Presence updated", "ok");
    },
  });

  const configPanel = Panel("Configuration", [
    field("Status", statusSel),
    h("div", { class: "section-label", text: "Activity" }),
    field("Type", typeSel),
    state.type === "streaming" ? field("Stream URL", urlIn, "Required for streaming") : null,
    field("Activity name", nameIn),
    field("Details", detailsIn, "First line under the activity"),
    field("State", stateIn, "Second line under the activity"),
    h("div", { class: "section-label", text: "Presets" }),
    presets,
  ]);
  // rebuild streaming field visibility
  typeSel.addEventListener("change", () => {
    const streaming = typeSel.value === "streaming";
    const existing = configPanel.querySelector(".field-stream-url");
    if (streaming && !existing) {
      const f = field("Stream URL", urlIn, "Required for streaming");
      f.classList.add("field-stream-url");
      configPanel.querySelector(".panel-body").insertBefore(f, configPanel.querySelector(".panel-body").children[4]);
    } else if (!streaming && existing) existing.remove();
  });

  slot.replaceChildren(
    pageHead("Presence Studio", "Set your status and rich activity — the preview updates as you type.", [
      Button({ label: "Clear presence", icon: "x", onclick: async () => {
        await apiPost("/presence/clear", {}); toast("Presence cleared", "ok"); renderApp();
      }}),
      applyBtn,
    ]),
    h("div", { class: "studio-layout" }, configPanel,
      h("div", {}, h("div", { class: "section-label", text: "Live preview" }), preview)));
  paintPreview();
}

window.viewPresence = viewPresence;

/* === BUNDLE: views-d.js === */
/* Hunter — views part D: notifications, backups, themes, console, palette */
/* ============ NOTIFICATIONS ============ */
async function viewNotifications(slot) {
  slot.replaceChildren(Skeleton(5));
  let tab = "inbox";
  let inbox = [], rules = [];

  const load = async () => {
    if (tab === "inbox") {
      const d = await apiGet("/notifications/inbox?limit=100");
      inbox = d.notifications || [];
    } else {
      const d = await apiGet("/notifications/rules");
      rules = d.rules || [];
    }
  };

  const render = async () => {
    slot.replaceChildren(
      pageHead("Notifications", "Event-driven alerts routed to the dashboard inbox, Discord, or webhooks."),
      h("div", { class: "tabs" },
        h("button", { class: "tab" + (tab === "inbox" ? " active" : ""), onclick: () => { tab = "inbox"; refresh(); } }, "Inbox"),
        h("button", { class: "tab" + (tab === "rules" ? " active" : ""), onclick: () => { tab = "rules"; refresh(); } }, "Rules")));

    if (tab === "inbox") {
      const bar = h("div", { class: "flex gap-3 mb-4" },
        h("span", { class: "spacer" }),
        Button({ label: "Mark all read", variant: "secondary", icon: "check", onclick: markAllRead }),
        Button({ label: "Clear inbox", variant: "danger", icon: "trash", onclick: clearAll }));
      
      if (!inbox.length) {
        slot.replaceChildren(
          pageHead("Notifications", "Event-driven alerts routed to the dashboard inbox, Discord, or webhooks."),
          h("div", { class: "tabs" },
            h("button", { class: "tab" + (tab === "inbox" ? " active" : ""), onclick: () => { tab = "inbox"; refresh(); } }, "Inbox"),
            h("button", { class: "tab" + (tab === "rules" ? " active" : ""), onclick: () => { tab = "rules"; refresh(); } }, "Rules")),
          bar,
          EmptyState({ title: "No notifications", body: "Create a rule to start routing events here.", icon: "bell" }));
        return;
      }
      
      const notifRows = inbox.map((n) =>
        h("div", { class: "notif sev-" + (n.severity || "info") + (n.read ? "" : " unread") },
          h("div", { class: "notif-head" },
            h("strong", { text: n.title }),
            h("span", { class: "spacer" }),
            h("code", { class: "mono", text: fmtDate(n.created_at) })),
          h("p", { class: "notif-body", text: n.description || "" }),
          h("div", { class: "notif-foot" },
            h("span", { class: "type " + (n.source || "system") }, n.source || "system"),
            h("span", { class: "badge badge-" + (n.severity || "info") }, n.severity || "info"),
            h("span", { class: "spacer" }),
            n.read ? null : Button({ label: "Mark read", variant: "secondary", size: "sm", onclick: () => markRead(n.id) }))));
      slot.replaceChildren(
        pageHead("Notifications", "Event-driven alerts routed to the dashboard inbox, Discord, or webhooks."),
        h("div", { class: "tabs" },
          h("button", { class: "tab" + (tab === "inbox" ? " active" : ""), onclick: () => { tab = "inbox"; refresh(); } }, "Inbox"),
          h("button", { class: "tab" + (tab === "rules" ? " active" : ""), onclick: () => { tab = "rules"; refresh(); } }, "Rules")),
        bar,
        h("div", { class: "notif-list" }, notifRows));
    } else {
      const bar = h("div", { class: "flex gap-3 mb-4" },
        h("span", { class: "spacer" }),
        Button({ label: "New rule", variant: "primary", icon: "plus", onclick: newRule }));
      
      if (!rules.length) {
        slot.replaceChildren(
          pageHead("Notifications", "Event-driven alerts routed to the dashboard inbox, Discord, or webhooks."),
          h("div", { class: "tabs" },
            h("button", { class: "tab" + (tab === "inbox" ? " active" : ""), onclick: () => { tab = "inbox"; refresh(); } }, "Inbox"),
            h("button", { class: "tab" + (tab === "rules" ? " active" : ""), onclick: () => { tab = "rules"; refresh(); } }, "Rules")),
          bar,
          EmptyState({ title: "No rules yet", body: "Create a rule to start routing events.", icon: "bell", action: Button({ label: "Create rule", variant: "primary", icon: "plus", onclick: newRule }) }));
        return;
      }
      
      const ruleRows = rules.map((r) => h("tr", {},
        h("td", { text: r.name }),
        h("td", {}, r.event_type === "keyword"
          ? h("span", { class: "mono" }, "keyword: " + (r.keyword || "…"))
          : h("code", { class: "mono" }, r.event_type || "*")),
        h("td", { text: (r.destinations || []).join(", ") }),
        h("td", {}, Badge(r.severity || "info", r.severity || "info")),
        h("td", {}, Badge(r.enabled ? "on" : "off", r.enabled ? "success" : "default")),
        h("td", { class: "cell-actions" },
          Button({ label: r.enabled ? "Disable" : "Enable", size: "sm", onclick: () => toggleRule(r) }),
          Button({ label: "Test", size: "sm", onclick: () => testRule(r) }),
          Button({ label: "Delete", size: "sm", variant: "danger", onclick: () => deleteRule(r) }))));
      
      slot.replaceChildren(
        pageHead("Notifications", "Event-driven alerts routed to the dashboard inbox, Discord, or webhooks."),
        h("div", { class: "tabs" },
          h("button", { class: "tab" + (tab === "inbox" ? " active" : ""), onclick: () => { tab = "inbox"; refresh(); } }, "Inbox"),
          h("button", { class: "tab" + (tab === "rules" ? " active" : ""), onclick: () => { tab = "rules"; refresh(); } }, "Rules")),
        h("div", { class: "flex gap-3 mb-4" },
          h("span", { class: "spacer" }),
          Button({ label: "New rule", variant: "primary", icon: "plus", onclick: newRule })),
        DataTable({
          columns: [
            { key: "name", label: "Name" },
            { key: "event_type", label: "Matches", render: (r) => r.event_type === "keyword" ? h("span", { class: "mono" }, "keyword: " + (r.keyword || "…")) : h("code", { class: "mono" }, r.event_type || "*") },
            { key: "destinations", label: "Destinations", render: (r) => (r.destinations || []).join(", ") },
            { key: "severity", label: "Severity", render: (r) => Badge(r.severity || "info", r.severity || "info") },
            { key: "enabled", label: "Enabled", render: (r) => Badge(r.enabled ? "on" : "off", r.enabled ? "success" : "default") },
          ],
          rows: rules,
          rowActions: (r) => h("span", {},
            Button({ label: r.enabled ? "Disable" : "Enable", size: "sm", onclick: () => toggleRule(r) }),
            Button({ label: "Test", size: "sm", onclick: () => testRule(r) }),
            Button({ label: "Delete", size: "sm", variant: "danger", onclick: () => deleteRule(r) })),
        }));
    }
  };

  const refresh = async () => { try { await load(); } catch (e) { slot.replaceChildren(ErrorState(e)); return; } await render(); };


  async function markRead(id) { try { await apiPost("/notifications/read?notification_id=" + id); refresh(); } catch (e) { toast(e.message, "err"); } }
  async function markAllRead() { try { await apiPost("/notifications/read"); refresh(); toast("Marked all read", "ok"); } catch (e) { toast(e.message, "err"); } }
  async function clearAll() {
    if (!await ConfirmDialog({ title: "Clear inbox?", message: "This will permanently delete all notifications.", confirmLabel: "Clear" })) return;
    try { await apiPost("/notifications/clear"); refresh(); toast("Inbox cleared", "ok"); } catch (e) { toast(e.message, "err"); }
  }
  async function toggleRule(r) { try { await apiPost(`/notifications/rules/${r.id}/toggle`, { enabled: !r.enabled }); refresh(); } catch (e) { toast(e.message, "err"); } }
  async function testRule(r) { try { const d = await apiPost(`/notifications/rules/${r.id}/test`); toast(d.ok ? "Test delivered: " + (d.delivered || []).join(", ") : d.error || "failed", d.ok ? "ok" : "err"); refresh(); } catch (e) { toast(e.message, "err"); } }
  async function deleteRule(r) {
    if (!await ConfirmDialog({ title: "Delete rule?", message: `Delete "${r.name}"?`, confirmLabel: "Delete" })) return;
    try { await apiDel(`/notifications/rules/${r.id}`); refresh(); } catch (e) { toast(e.message, "err"); }
  }
  function newRule() {
    const name = h("input", { class: "field-input", type: "text", placeholder: "Rule name" });
    const etype = h("input", { class: "field-input", type: "text", placeholder: 'Event type, keyword, or * (e.g. command.error)', value: "*" });
    const keyword = h("input", { class: "field-input", type: "text", placeholder: "Keyword (when matching payload text)" });
    const sev = h("select", { class: "field-input select" }, ["info", "success", "warn", "error"].map(s => h("option", { value: s }, s)));
    const dests = {};
    const destRow = h("div", { class: "check-grid" }, ["dashboard", "discord", "webhook", "desktop"].map(d =>
      h("label", { class: "check" }, h("input", { type: "checkbox", onchange: (e) => dests[d] = e.target.checked }), d)));
    const hook = h("input", { class: "field-input", type: "url", placeholder: "Webhook URL (for webhook destination)" });
    const chan = h("input", { class: "field-input", type: "text", placeholder: "Discord channel ID (for discord destination)" });
    overlayForm("New notification rule", [
      field("Name", name),
      field("Event match", etype, "* = any event, an exact event type, or 'keyword' to match payload text"),
      field("Keyword", keyword),
      h("div", { class: "field" }, h("label", { class: "field-label", text: "Destinations" }), destRow),
      field("Webhook URL", hook),
      field("Discord channel ID", chan),
      field("Severity", sev),
    ], async () => {
      const chosen = Object.keys(dests).filter((k) => dests[k]);
      if (!chosen.length) { toast("Pick at least one destination", "err"); return false; }
      await apiPost("/notifications/rules", {
        name: name.value, event_type: etype.value || "*", keyword: keyword.value,
        destinations: chosen, webhook_url: hook.value, discord_channel_id: parseInt(chan.value || "0", 10),
        severity: sev.value,
      });
      tab = "rules"; refresh(); return true;
    });
  }
  
  await load();
  await render();
}

/* ============ BACKUPS / RECOVERY ============ */
async function viewBackups(slot) {
  slot.replaceChildren(Skeleton(4));
  let backups = [];

  const load = async () => { const d = await apiGet("/backups"); backups = d.backups || []; };
  
  const render = () => {
    slot.replaceChildren(
      pageHead("Recovery", "Snapshots of your workspace configuration — restore granularly with a diff preview."),
      h("div", { class: "flex gap-3 mb-4" },
        h("span", { class: "spacer" }),
        Button({ label: "Import", variant: "secondary", icon: "upload", onclick: importBackup }),
        Button({ label: "Create backup", variant: "primary", icon: "download", onclick: createBackup })),
      backups.length === 0
        ? EmptyState({ title: "No backups yet", body: "Create one before making bulk changes.", icon: "archive", action: Button({ label: "Create backup", variant: "primary", icon: "plus", onclick: createBackup }) })
        : DataTable({
            columns: [
              { key: "name", label: "Name" },
              { key: "kind", label: "Kind", render: (b) => Badge(b.kind, "brand") },
              { key: "size_bytes", label: "Size", render: (b) => fmtBytes(b.size_bytes) },
              { key: "created_at", label: "Created", render: (b) => fmtDate(b.created_at) },
            ],
            rows: backups,
            rowActions: (b) => h("span", {},
              Button({ label: "Inspect", size: "sm", onclick: () => inspectBackup(b) }),
              Button({ label: "Restore", size: "sm", variant: "primary", onclick: () => restoreBackup(b) }),
              Button({ label: "Export", size: "sm", onclick: () => exportBackup(b) }),
              Button({ label: "Delete", size: "sm", variant: "danger", onclick: () => deleteBackup(b) })),
          }));
  };
  
  const refresh = async () => { try { await load(); } catch (e) { slot.replaceChildren(ErrorState(e)); return; } render(); };

  async function createBackup() {
    try { await apiPost("/backups", {}); toast("Snapshot created", "ok"); refresh(); } catch (e) { toast(e.message, "err"); }
  }
  async function inspectBackup(b) {
    try {
      const d = await apiGet(`/backups/${b.id}`);
      const rows = Object.entries(d.sections || {}).map(([k, v]) =>
        h("div", { class: "kv-row" }, h("code", { class: "kv-k", text: k }), h("span", { class: "spacer" }), h("strong", { class: "kv-v", text: String(v) })));
      Modal({ title: `Backup: ${b.name}`, body: h("div", {}, rows.length ? rows : EmptyState({ title: "Empty snapshot", icon: "archive" })) });
    } catch (e) { toast(e.message, "err"); }
  }
  async function exportBackup(b) {
    try {
      const d = await apiGet(`/backups/${b.id}/export`);
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
      const a = h("a", { href: URL.createObjectURL(blob), download: `hunter-backup-${b.id}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      toast("Backup exported", "ok");
    } catch (e) { toast(e.message, "err"); }
  }
  function importBackup() {
    const ta = h("textarea", { class: "field-textarea", rows: 6, placeholder: "Paste a Hunter backup export JSON…" });
    overlayForm("Import backup", [h("div", { class: "field" }, h("label", { class: "field-label", text: "Backup JSON" }), ta)], async () => {
      let data;
      try { data = JSON.parse(ta.value); } catch (e) { toast("Invalid JSON", "err"); return false; }
      await apiPost("/backups/import", { data });
      toast("Imported", "ok"); refresh(); return true;
    });
  }
  async function deleteBackup(b) {
    if (!await ConfirmDialog({ title: "Delete backup?", message: `Delete "${b.name}"?`, confirmLabel: "Delete" })) return;
    try { await apiDel(`/backups/${b.id}`); refresh(); } catch (e) { toast(e.message, "err"); }
  }
  async function restoreBackup(b) {
    try {
      const d = await apiGet(`/backups/${b.id}/diff`);
      const all = ["settings", "automations", "scripts", "custom_commands", "jobs", "notification_rules", "themes"];
      const picked = {};
      const checks = h("div", { class: "check-grid" }, all.map((s) =>
        h("label", { class: "check" },
          h("input", { type: "checkbox", checked: true, onchange: (e) => picked[s] = e.target.checked }), s)));
      const preview = h("div", { class: "hint" },
        (d.preview || []).length
          ? "Diff vs current: " + (d.preview || []).join(" · ")
          : "Snapshot matches current counts — restore will re-add the snapshot items.");
      overlayForm(`Restore: ${b.name}`, [
        h("div", { class: "field" }, h("label", { class: "field-label", text: "Sections" }), checks),
        preview,
        h("div", { class: "field" }, h("div", { class: "field-hint" }, "Restore adds the snapshot items back. Duplicates may be created if items already exist.")),
      ], async () => {
        const sections = all.filter((s) => picked[s] !== false);
        await apiPost(`/backups/${b.id}/restore`, { sections });
        toast("Restore complete", "ok"); return true;
      });
    } catch (e) { toast(e.message, "err"); }
  }
  
  await load();
  render();
}

/* ============ THEMES ============ */
async function viewThemes(slot) {
  slot.replaceChildren(Skeleton(4));
  let themes = [];

  const applyVars = (vars) => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars || {})) root.style.setProperty(`--${k}`, v);
  };

  const load = async () => { const d = await apiGet("/themes"); themes = d.themes || []; };
  
  const render = () => {
    slot.replaceChildren(
      pageHead("Themes", "Appearance engine — apply a theme live or build your own variable set."),
      h("div", { class: "flex gap-3 mb-4" },
        h("span", { class: "spacer" }),
        Button({ label: "Reset to Midnight", variant: "secondary", icon: "rotate", onclick: resetTheme }),
        Button({ label: "New theme", variant: "primary", icon: "plus", onclick: newTheme })),
      h("div", { class: "theme-grid" }, themes.map((t) => {
        const vars = t.vars || {};
        return h("div", { class: "theme-card" + (t.active ? " active" : "") },
          h("div", { class: "theme-preview", style: `background:${vars.bg || "#08090b"};border-color:${vars["panel-border"] || "#23262f"}` },
            h("div", { class: "tp-chip", style: `background:${vars.accent || "#00d4aa"}` }),
            h("div", { class: "tp-bar", style: `background:${vars["bg-elev"] || "#0d0e13"}` }),
            h("div", { class: "tp-bar", style: `background:${vars["bg-raised"] || "#121419"}` }),
            h("div", { class: "tp-dot", style: `background:${vars.ok || "#10b981"}` }),
            h("div", { class: "tp-dot", style: `background:${vars.warn || "#f59e0b"}` }),
            h("div", { class: "tp-dot", style: `background:${vars.danger || "#ef4444"}` })),
          h("div", { class: "theme-card-body" },
            h("div", { class: "theme-card-name" }, t.name, t.built_in ? Badge("built-in", "brand") : null),
            h("div", { class: "hint" }, `${Object.keys(vars).length} variables`)),
          h("div", { class: "theme-card-actions" },
            !t.active ? Button({ label: "Apply", size: "sm", variant: "primary", onclick: () => applyTheme(t) }) : Badge("Active", "success"),
            !t.built_in ? Button({ label: "Edit", size: "sm", onclick: () => editTheme(t) }) : Button({ label: "Duplicate", size: "sm", onclick: () => duplicateTheme(t) }),
            !t.built_in ? Button({ label: "Delete", size: "sm", variant: "danger", onclick: () => deleteTheme(t) }) : null));
      })));
  };
  
  const refresh = async () => { try { await load(); } catch (e) { slot.replaceChildren(ErrorState(e)); return; } render(); };

  
  async function applyTheme(t) {
    try { const d = await apiPost(`/themes/${t.id}/apply`); applyVars(d.vars); toast(`Applied "${t.name}"`, "ok"); refresh(); }
    catch (e) { toast(e.message, "err"); }
  }
  async function resetTheme() {
    try { await apiPost("/themes/reset"); applyVars({}); location.reload(); } catch (e) { toast(e.message, "err"); }
  }
  async function duplicateTheme(t) {
    try { const d = await apiPost(`/themes/${t.id}/duplicate`, {}); toast(`Created "${d.name}"`, "ok"); refresh(); } catch (e) { toast(e.message, "err"); }
  }
  async function deleteTheme(t) {
    if (!await ConfirmDialog({ title: "Delete theme?", message: `Delete "${t.name}"?`, confirmLabel: "Delete" })) return;
    try { await apiDel(`/themes/${t.id}`); refresh(); } catch (e) { toast(e.message, "err"); }
  }
  function themeForm(title, initial, save) {
    const name = h("input", { class: "field-input", type: "text", value: initial?.name || "" });
    const keys = ["bg", "bg-elev", "bg-raised", "panel", "panel-border", "text", "text-dim",
                  "accent", "accent-soft", "ok", "warn", "danger", "radius", "radius-lg"];
    const inputs = {};
    const grid = h("div", { class: "var-grid" }, keys.map((k) => {
      const inp = h("input", { class: "field-input", type: "text", value: (initial?.vars || {})[k] || "", placeholder: k });
      inputs[k] = inp;
      return h("div", { class: "field" }, h("label", { class: "field-label", text: k }), inp);
    }));
    const liveDot = h("div", { class: "live-dot" });
    const updatePreview = () => {
      liveDot.style.background = inputs["bg-raised"].value || "#121419";
      liveDot.style.borderColor = inputs["panel-border"].value || "#23262f";
      liveDot.style.color = inputs.accent.value || "#00d4aa";
      liveDot.style.borderRadius = inputs.radius.value || "8px";
      applyVars(Object.fromEntries(keys.map((k) => [k, inputs[k].value]).filter(([, v]) => v)));
    };
    grid.addEventListener("input", updatePreview);
    overlayForm(title, [
      field("Name", name),
      h("div", { class: "field" }, h("label", { class: "field-label", text: "Live preview" }), liveDot),
      grid,
    ], async () => {
      const vars = Object.fromEntries(keys.map((k) => [k, inputs[k].value]).filter(([, v]) => v));
      await save(name.value, vars);
      refresh(); return true;
    }, () => { // cancel: revert to active theme
      const active = themes.find((t) => t.active);
      if (active) applyVars(active.vars);
    });
    updatePreview();
  }
  function newTheme() { themeForm("New theme", null, async (name, vars) => {
    try { await apiPost("/themes", { name, vars }); toast("Theme created", "ok"); return true; }
    catch (e) { toast(e.message, "err"); return false; }
  }); }
  function editTheme(t) { themeForm(`Edit: ${t.name}`, t, async (name, vars) => {
    try { await apiPut(`/themes/${t.id}`, { name, vars }); toast("Theme saved", "ok"); return true; }
    catch (e) { toast(e.message, "err"); return false; }
  }); }
  
  await load();
  render();
}

/* ============ CONSOLE ============ */
async function viewConsole(slot) {
  slot.replaceChildren(Skeleton(4));
  let history = [];
  try { const d = await apiGet("/console/history"); history = d.history || []; } catch (e) {}

  const out = h("div", { class: "console-out", id: "console-out" });
  const input = h("input", { class: "field-input console-input", type: "text", placeholder: "h!ping", spellcheck: "false", id: "console-input" });
  const mirror = h("input", { class: "field-input", type: "text", placeholder: "Mirror to Discord channel ID (optional)" });
  const sugg = h("div", { class: "console-sugg", id: "console-sugg" });

  const print = (line, cls) => out.appendChild(h("div", { class: "console-line " + (cls || "") }, line));
  const scroll = () => { out.scrollTop = out.scrollHeight; };

  print(`Hunter console — type a command (${Store.client.prefix || "h!"}help) or press Ctrl+K for the palette.`, "dim");

  for (const entry of [...history].reverse()) {
    out.appendChild(h("div", { class: "console-line " + (entry.ok ? "" : "err") },
      h("code", { class: "mono " + (entry.ok ? "ok" : "err") }, entry.command),
      h("span", { class: "dim", text: " → " + (entry.output || "").split("\n")[0] })));
  }
  out.scrollTop = out.scrollHeight;

  const run = async () => {
    const cmd = input.value.trim();
    if (!cmd) return;
    out.appendChild(h("div", { class: "console-line cmd" },
      h("code", { class: "mono", text: "> " + cmd })));
    input.value = ""; sugg.innerHTML = "";
    try {
      const d = await apiPost("/console/execute", { command: cmd, channel_id: parseInt(mirror.value || "0", 10) || 0 });
      if (d.output) out.appendChild(h("div", { class: "console-line " + (d.ok ? "" : "err") }, d.output));
      out.appendChild(h("div", { class: "console-line dim" }, ` ${d.duration_ms}ms`));
      out.scrollTop = out.scrollHeight;
    } catch (e) { out.appendChild(h("div", { class: "console-line err" }, e.message)); }
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

  // live autocomplete from the registry
  let debounce = null;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const q = input.value.trim();
      if (!q || q.includes(" ")) { sugg.innerHTML = ""; return; }
      try {
        const d = await apiGet("/console/complete?q=" + encodeURIComponent(q));
        sugg.innerHTML = "";
        for (const s of (d.suggestions || []).slice(0, 6)) {
          sugg.appendChild(h("button", { class: "sugg", onclick: () => { input.value = s.name; input.focus(); sugg.innerHTML = ""; } },
            h("code", { class: "mono", text: s.name }), h("span", { class: "dim", text: " " + s.description })));
        }
      } catch (e) {}
    }, 150);
  });

  slot.replaceChildren(
    pageHead("Console", "Run real commands remotely — the same engine that powers Discord messages."),
    Panel("Command executor", h("div", { class: "console-wrap" }, out, sugg,
      h("div", { class: "console-row" }, input,
        Button({ label: "Run", variant: "primary", onclick: run })),
      h("div", { class: "hint", style: "margin-top:8px" }, "Optional mirror channel:"), mirror),
    { actions: Button({ label: "Clear", variant: "secondary", size: "sm", icon: "trash", onclick: () => { out.innerHTML = ""; } }) }));
  setTimeout(() => { try { input?.focus?.(); } catch {} }, 50);
}

/* ============ COMMAND PALETTE (Ctrl+K) ============ */

function fuzzyScore(text, q) {
  text = text.toLowerCase(); q = q.toLowerCase();
  if (!q) return 1;
  if (text.startsWith(q)) return 3;
  if (text.includes(q)) return 2;
  let ti = 0;
  for (const ch of q) {
    ti = text.indexOf(ch, ti);
    if (ti < 0) return 0;
    ti++;
  }
  return 0.5;
}

function openPalette() {
  if ($(".overlay.palette-overlay")) return;
  const pages = ALL_NAV.map((n) => ({
    kind: "page", name: n.label, icon: n.icon, run: () => navigate(n.id),
  }));
  const actions = [
    { kind: "action", name: "Start client", icon: "play", run: () => clientAction("start") },
    { kind: "action", name: "Stop client", icon: "stop", run: () => stopFlow() },
    { kind: "action", name: "Restart client", icon: "rotate", run: () => clientAction("restart") },
    { kind: "action", name: "Create backup", icon: "archive", run: async () => { await apiPost("/backups", { name: "Snapshot " + new Date().toLocaleString() }); toast("Backup created", "ok"); } },
    { kind: "action", name: "Switch theme", icon: "palette", run: async () => { navigate("themes"); } },
    { kind: "action", name: "Toggle command palette help", icon: "info", run: () => toast("⌘K — search anything", "ok") },
  ];

  const input = h("input", { class: "palette-input", placeholder: "Search commands, pages and actions…", "aria-label": "Command palette" });
  const results = h("div", { class: "palette-results", role: "listbox" });
  const overlay = h("div", { class: "overlay palette-overlay", onclick: (e) => { if (e.target === overlay) close(); } });
  const close = () => { overlay.classList.add("closing"); setTimeout(() => overlay.remove(), 120); };

  let items = [], active = 0;

  const build = () => {
    const q = input.value.trim();
    const cmds = Store.commands.map((c) => ({
      kind: "command", name: c.name, desc: c.description, category: CATEGORY_LABELS[c.category] || c.category,
      icon: CATEGORY_ICONS[c.category] || "grid",
      run: async () => { navigate("console"); await apiPost("/console/execute", { command: c.name }); pushRecent(c.name); },
    }));
    let pool = [...cmds, ...pages, ...actions];
    if (q) {
      pool = pool.map((it) => ({ it, score: Math.max(fuzzyScore(it.name, q), fuzzyScore(it.desc || "", q) * 0.8) }))
        .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.it);
    } else {
      const rec = getRecent().map((n) => pool.find((p) => p.kind === "command" && p.name === n)).filter(Boolean);
      pool = [...rec, ...pool.filter((p) => !rec.includes(p))];
    }
    items = pool.slice(0, 12);
    active = 0;
    paint();
  };

  const paint = () => {
    results.replaceChildren(...items.map((it, i) =>
      h("button", { class: "palette-item" + (i === active ? " active" : ""), role: "option",
        onclick: () => { close(); it.run(); } },
        h("span", { class: "palette-icon", html: Icon(it.icon, 16) }),
        h("span", { class: "palette-name", text: it.kind === "command" ? Store.client.prefix + it.name : it.name }),
        it.desc ? h("span", { class: "palette-desc", text: it.desc.slice(0, 58) }) : null,
        h("span", { class: "palette-kind", text: it.kind }))));
    if (!items.length) results.replaceChildren(
      EmptyState({ title: "No results", body: "Nothing matches that search.", icon: "search" }));
    const act = $(".palette-item.active", results);
    act?.scrollIntoView({ block: "nearest" });
  };

  input.addEventListener("input", build);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, items.length - 1); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); paint(); }
    else if (e.key === "Enter") { e.preventDefault(); items[active]?.run(); close(); }
  });

  overlay.appendChild(h("div", { class: "palette" }, input, results));
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.classList.add("open"); input.focus(); });
  build();
}

window.openPalette = openPalette;
window.viewNotifications = viewNotifications;
window.viewBackups = viewBackups;
window.viewThemes = viewThemes;
window.viewConsole = viewConsole;

/* === BUNDLE: views-auth.js === */
/* Hunter — onboarding: workspace sign-in + Discord connection flow */
/* ============ WELCOME / SIGN-IN ============ */
function loginView() {
  const token = h("input", { class: "field-input", type: "password", placeholder: "Admin token", "aria-label": "Admin token" });
  const err = h("div", { class: "form-error", style: "display:none" });
  const btn = Button({ label: "Sign in", variant: "primary", size: "lg", onclick: async () => {
    err.style.display = "none";
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.value }),
    });
    if (!res.ok) {
      let msg = "Sign-in failed";
      try { const d = await res.json(); msg = d.detail || msg; } catch (e) {}
      err.textContent = msg; err.style.display = "block";
      return;
    }
    csrfToken = document.cookie.split("; ").find((c) => c.startsWith("hunter_csrf="))?.split("=")[1] || null;
    await Promise.all([refreshClientState(), refreshUnread(), refreshCommandsCache()]);
    loadActiveTheme();
    connectWS();
    if (!Store.client.token_configured) openConnectFlow(true);
    renderApp();
  }});

  return h("div", { class: "auth-screen" },
    h("div", { class: "auth-card" },
      h("div", { class: "brand-mark-lg", html: Icon("bolt", 32) }),
      h("h1", { class: "auth-title", text: "Discord AIO" }),
      h("p", { class: "auth-sub", text: "Nighty Control Center — Full Selfbot Automation Suite" }),
      h("form", { onsubmit: (e) => { e.preventDefault(); btn.click(); } },
        field("Admin token", token, "Enter web dashboard password (default: admin)"),
        err),
      h("div", { class: "auth-actions" }, btn),
      h("p", { class: "auth-foot" },
        "Automating a personal Discord account violates Discord's Terms of Service.",
        h("br"), "Includes anti-detection, jitter pacing, and safe action rate limiting.")));
}

/* ============ CONNECT DISCORD FLOW ============ */
function openConnectFlow(firstRun = false) {
  if ($(".overlay.connect-flow")) return;

  const steps = ["Authenticate", "Configure", "Start", "Running"];
  let step = 0;
  const token = h("input", { class: "field-input", type: "password", placeholder: "Discord user token", "aria-label": "Discord user token" });
  const statusEl = h("div", { class: "connect-flow-status" });
  const stepBar = h("div", { class: "connect-flow-steps" });
  const err = h("div", { class: "form-error", style: "display:none" });

  const paintSteps = () => {
    stepBar.replaceChildren(...steps.map((label, i) =>
      h("div", { class: "step" + (i < step ? " done" : i === step ? " active" : "") },
        h("span", { class: "step-dot" }, i < step ? h("span", { html: Icon("check", 11) }) : String(i + 1)),
        h("span", { class: "step-label", text: label })),
    ));
  };

  const paintStatus = (msg, tone = "") => {
    statusEl.replaceChildren(h("p", { class: "connect-flow-msg " + tone, text: msg }));
  };

  const body = h("div", { class: "connect-flow" },
    h("p", { class: "connect-flow-intro", text: firstRun
      ? "Connect your Discord account to start automating. Hunter validates the token server-side before saving."
      : "Paste your Discord user token. It's validated before the client starts." }),
    stepBar,
    field("Discord user token", token),
    statusEl, err,
    h("p", { class: "hint" },
      "Only use a token you own and are authorized to use. Automating user accounts violates Discord's ToS — Hunter includes no anti-detection features."));

  const footer = [
    Button({ label: "Cancel", onclick: () => flow.close() }),
    Button({ label: "Validate", icon: "shield", onclick: async () => {
      err.style.display = "none";
      const t = token.value.trim();
      if (!t) { err.textContent = "Enter a token first"; err.style.display = "block"; return false; }
      paintStatus("Validating token…");
      const r = await apiPost("/token/validate", { token: t, validate: true });
      if (r.valid && r.user) {
        paintStatus(`Token valid — signed in as ${r.user.username}#${r.user.discriminator}`, "ok");
        step = 1; paintSteps();
      } else {
        err.textContent = "Invalid token: " + (r.error || "Discord rejected it");
        err.style.display = "block";
        paintStatus("");
        return false;
      }
    }}),
    Button({ label: "Save & start client", variant: "primary", icon: "play", onclick: async () => {
      err.style.display = "none";
      const t = token.value.trim();
      if (!t) { err.textContent = "Enter a token first"; err.style.display = "block"; return false; }
      step = 2; paintSteps();
      paintStatus("Saving token and starting client…");
      try {
        await apiPost("/token/set", { token: t, validate: true });
        paintStatus("Client starting…");
        await refreshClientState();
        await clientAction("start");
        const deadline = Date.now() + 30000;
        while (Date.now() < deadline) {
          await refreshClientState();
          if (Store.client.connection_state === "connected") break;
          if (Store.client.control_state === "error") {
            err.textContent = Store.client.error || "Client failed to start";
            err.style.display = "block";
            step = 1; paintSteps(); paintStatus("");
            return false;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
        await refreshClientState();
        if (Store.client.connection_state === "connected") {
          step = 3; paintSteps();
          paintStatus(`Connected as ${Store.client.user?.username} — ${Store.client.guild_count} servers`, "ok");
          toast("Discord connected", "ok");
          setTimeout(() => { flow.close(); renderApp(); }, 900);
        } else {
          err.textContent = "Connection timed out — check the token and try again";
          err.style.display = "block";
          step = 1; paintSteps(); paintStatus("");
          return false;
        }
      } catch (e) {
        err.textContent = e.message; err.style.display = "block";
        step = 1; paintSteps(); paintStatus("");
        return false;
      }
    }}),
  ];

  paintSteps();
  const flow = Modal({ title: firstRun ? "Connect Discord" : "Connection Center", body, footer });
  token.focus();
}

window.loginView = loginView;
window.openConnectFlow = openConnectFlow;

/* === BUNDLE: app.js === */
/* Hunter — application shell: routing, navigation, client control, boot */
/* ============ NAVIGATION MODEL ============ */
const NAV_GROUPS = [
  { label: null, items: [
    { id: "home", label: "Home", icon: "home" },
    { id: "activity", label: "Activity", icon: "activity" },
  ]},
  { label: "Commands", items: [
    { id: "commands", label: "Command Center", icon: "terminal" },
    { id: "console", label: "Console", icon: "command" },
  ]},
  { label: "Automations", items: [
    { id: "automations", label: "Automations", icon: "bolt" },
    { id: "scripts", label: "Scripts", icon: "script" },
    { id: "custom", label: "Custom Commands", icon: "command" },
  ]},
  { label: "Modules", items: [
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "backups", label: "Recovery", icon: "archive" },
    { id: "servers", label: "Servers", icon: "server" },
  ]},
  { label: "Personalization", items: [
    { id: "presence", label: "Presence Studio", icon: "presence" },
    { id: "profile", label: "Profile", icon: "avatar" },
    { id: "themes", label: "Themes", icon: "palette" },
  ]},
  { label: null, items: [
    { id: "settings", label: "Settings", icon: "settings" },
  ]},
];
const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);
const PAGE_META = {
  home:        { title: "Home",        sub: "Your command center" },
  activity:    { title: "Activity",    sub: "Everything happening across the account" },
  commands:    { title: "Commands",    sub: "Browse, favorite and run every command" },
  console:     { title: "Console",     sub: "Run commands remotely" },
  automations: { title: "Automations", sub: "Trigger → conditions → actions" },
  scripts:     { title: "Scripts",     sub: "Event-driven script engine" },
  custom:      { title: "Custom Commands", sub: "Your own prefix commands" },
  notifications:{ title: "Notifications", sub: "Inbox and routing rules" },
  backups:     { title: "Recovery",    sub: "Snapshots and restore" },
  servers:     { title: "Servers",     sub: "Guilds, channels and roles" },
  presence:    { title: "Presence Studio", sub: "Live status and rich activity" },
  profile:     { title: "Profile",     sub: "Your identity" },
  themes:      { title: "Themes",      sub: "Make the dashboard yours" },
  logs:        { title: "Logs",        sub: "Raw structured log" },
  settings:    { title: "Settings",    sub: "Configure the workspace" },
};
const MOBILE_NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "commands", label: "Commands", icon: "terminal" },
  { id: "automations", label: "Automate", icon: "bolt" },
  { id: "activity", label: "Activity", icon: "activity" },
];

let currentRoute = { name: "home", id: null };

function navigate(name, id = null) {
  if (!ALL_NAV.some((n) => n.id === name) && name !== "logs") return;
  currentRoute = { name, id };
  history.pushState({}, "", "/" + name + (id ? "/" + id : ""));
  renderApp();
}

/* ============ SHELL ============ */
function renderApp() {
  const meta = PAGE_META[currentRoute.name] || { title: cap(currentRoute.name), sub: "" };
  const app = h("div", { class: "app" },
    buildSidebar(),
    h("div", { class: "main" },
      buildTopbar(meta),
      h("main", { class: "content" }, h("div", { class: "view", id: "view-slot" }))),
    buildMobileNav(),
    buildMobileDrawer());
  $("#app").replaceChildren(app);
  renderView($("#view-slot"));
}

function buildSidebar() {
  const nav = h("nav", { class: "nav", "aria-label": "Primary navigation" });
  for (const group of NAV_GROUPS) {
    if (group.label) nav.appendChild(h("div", { class: "nav-group", text: group.label }));
    for (const it of group.items) {
      const item = h("button", {
        class: "nav-item" + (currentRoute.name === it.id ? " active" : ""),
        "data-nav": it.id, "aria-current": currentRoute.name === it.id ? "page" : null,
        onclick: () => navigate(it.id),
      }, h("span", { class: "nav-icon", html: Icon(it.icon, 16) }), it.label,
         it.id === "notifications" ? h("span", { class: "nav-badge" + (Store.unread ? " show" : ""), text: Store.unread > 9 ? "9+" : String(Store.unread) }) : null);
      nav.appendChild(item);
    }
  }
  const foot = h("div", { class: "sidebar-foot" },
    h("div", { class: "sidebar-conn", id: "sidebar-conn" }, connCluster("compact")));
  return h("aside", { class: "sidebar" },
    h("div", { class: "sidebar-brand" },
      h("div", { class: "brand-mark", text: "" }),
      h("div", {},
        h("div", { class: "brand-name", text: "Discord AIO" }),
        h("div", { class: "brand-sub", text: "Nighty Edition" }))),
    nav, foot);
}

/* Status cluster — one component reused everywhere (single source of truth) */
function connCluster(mode = "full") {
  const c = Store.client;
  const st = CLIENT_STATES[c.control_state] || CLIENT_STATES.stopped;
  const dot = StatusDot(c.control_state === "running" ? (c.connection_state === "connected" ? "connected" : "connecting") : c.control_state);
  const latency = c.connection_state === "connected" && c.latency ? `${c.latency}ms` : null;

  if (mode === "compact") {
    const compactActions = [];
    if (c.control_state === "running") {
      compactActions.push(Button({ icon: "rotate", size: "sm", title: "Restart", onclick: () => clientAction("restart") }));
      compactActions.push(Button({ icon: "stop", size: "sm", variant: "danger", title: "Stop", onclick: () => stopFlow() }));
    } else if (c.control_state === "starting" || c.control_state === "stopping") {
      compactActions.push(Button({ icon: "stop", size: "sm", variant: "danger", title: "Cancel", onclick: () => clientAction("stop") }));
    } else {
      compactActions.push(Button({ icon: "play", variant: "primary", size: "sm", title: "Start",
        onclick: () => c.token_configured ? clientAction("start") : openConnectFlow() }));
    }
    return h("div", { class: "conn conn-compact" }, dot,
      h("span", { class: "conn-label", text: st.label }),
      latency ? h("span", { class: "conn-meta", text: latency }) : null,
      h("span", { class: "spacer" }), h("span", { class: "conn-actions" }, compactActions));
  }

  // full cluster: state + actions
  const actions = [];
  if (c.control_state === "running") {
    actions.push(Button({ icon: "rotate", label: "Restart", size: "sm", onclick: () => clientAction("restart") }));
    actions.push(Button({ icon: "stop", label: "Stop", size: "sm", variant: "danger", onclick: () => stopFlow() }));
  } else if (c.control_state === "starting") {
    actions.push(Button({ icon: "stop", label: "Cancel", size: "sm", variant: "danger", onclick: () => clientAction("stop") }));
  } else {
    actions.push(Button({ icon: "play", label: "Start", variant: "primary", size: "sm",
      onclick: () => c.token_configured ? clientAction("start") : openConnectFlow() }));
  }

  return h("div", { class: "conn" },
    h("div", { class: "conn-row" }, dot, h("span", { class: "conn-label", text: st.label }),
      latency ? h("span", { class: "conn-lat", text: latency }) : null,
      h("span", { class: "spacer" }), h("span", { class: "conn-actions" }, actions)),
    c.error ? h("div", { class: "conn-error" },
      h("span", { html: Icon("alert_circle", 13) }), c.error,
      h("button", { class: "link", onclick: () => navigate("activity") }, "View logs")) : null,
    c.control_state === "starting" && c.phase ? h("div", { class: "conn-phase", text: c.phase }) : null);
}

async function stopFlow() {
  const ok = await ConfirmDialog({
    title: "Stop client?",
    message: "The Discord connection will close and automations, schedules and the console will pause until you start again.",
    confirmLabel: "Stop client",
  });
  if (ok) clientAction("stop");
}

/* ============ TOPBAR ============ */
function buildTopbar(meta) {
  const c = Store.client;
  return h("header", { class: "topbar" },
    h("div", { class: "topbar-left" },
      h("button", { class: "topbar-menu icon-btn", "aria-label": "Menu", onclick: toggleDrawer, html: Icon("menu", 18) }),
      h("div", { class: "topbar-title" },
        h("h1", { class: "topbar-title-text", text: meta.title }),
        h("p", { class: "topbar-subtitle", text: meta.sub }))),
    h("div", { class: "topbar-meta" },
      h("button", { class: "palette-trigger", onclick: () => { if (typeof openPalette === 'function') openPalette(); }, "aria-label": "Open command palette" },
        h("span", { class: "palette-trigger-icon", html: Icon("search", 14) }),
        h("span", { class: "palette-trigger-text", text: "Search" }),
        h("kbd", { class: "kbd" }, h("span", { text: "⌘" }), h("span", { text: "K" }))),
      h("button", { class: "topbar-bell icon-btn", "aria-label": "Notifications", onclick: () => navigate("notifications") },
        h("span", { class: "topbar-bell-icon", html: Icon("bell", 16) }),
        h("span", { class: "topbar-bell-dot" + (Store.unread ? " show" : "") })),
      h("div", { class: "topbar-account", id: "topbar-account" }, accountChip())));
}

function accountChip() {
  const u = Store.client.user;
  if (!u) {
    return h("button", { class: "account-chip", onclick: openConnectFlow, title: "Connect Discord" },
      h("span", { class: "avatar avatar-sm avatar-empty", html: Icon("user", 14) }),
      h("span", { class: "account-name", text: "Not connected" }));
  }
  const initials = (u.username || "?").slice(0, 2).toUpperCase();
  return h("button", { class: "account-chip", onclick: () => navigate("profile"), title: u.username },
    u.avatar ? h("img", { class: "avatar avatar-sm", src: u.avatar, alt: "" })
             : h("span", { class: "avatar avatar-sm avatar-fallback", text: initials }),
    h("span", { class: "account-name", text: u.username }));
}

/* ============ MOBILE ============ */
function buildMobileNav() {
  return h("nav", { class: "mobile-nav", "aria-label": "Mobile navigation" },
    MOBILE_NAV.map((it) =>
      h("button", { class: "mobile-nav-item" + (currentRoute.name === it.id ? " active" : ""), "data-mnav": it.id, onclick: () => navigate(it.id) },
        h("span", { class: "mobile-nav-icon", html: Icon(it.icon, 20) }),
        h("span", { class: "mobile-nav-label", text: it.label }))),
    h("button", { class: "mobile-nav-item" + (currentRoute.name === "more" ? " active" : ""), "data-mnav": "more", onclick: toggleDrawer },
      h("span", { class: "mobile-nav-icon", html: Icon("menu", 20) }),
      h("span", { class: "mobile-nav-label", text: "More" })));
}

function buildMobileDrawer() {
  const drawer = h("div", { class: "drawer", "aria-hidden": "true" },
    h("div", { class: "drawer-scrim", onclick: toggleDrawer }),
    h("div", { class: "drawer-panel", role: "dialog", "aria-label": "Navigation" },
      h("div", { class: "drawer-header" },
        h("div", { class: "drawer-title", text: "Discord AIO // Nighty" }),
        h("button", { class: "icon-btn drawer-close", "aria-label": "Close", onclick: toggleDrawer, html: Icon("x", 18) })),
      h("div", { class: "drawer-conn", id: "drawer-conn" }, connCluster()),
      h("nav", { class: "drawer-nav" },
        NAV_GROUPS.flatMap((g) => [
          g.label ? h("div", { class: "drawer-section-title", text: g.label }) : null,
          ...g.items.map((it) =>
            h("button", { class: "drawer-item" + (currentRoute.name === it.id ? " active" : ""),
              onclick: () => { toggleDrawer(); navigate(it.id); } },
              h("span", { class: "drawer-item-icon", html: Icon(it.icon, 16) }), it.label,
              it.id === "notifications" && Store.unread ? h("span", { class: "badge badge-brand", text: String(Store.unread) }) : null)),
        ]))));
  return drawer;
}

function toggleDrawer() {
  const d = $(".drawer");
  if (!d) return;
  const open = d.classList.toggle("open");
  d.setAttribute("aria-hidden", open ? "false" : "true");
}

/* ============ ROUTER ============ */
const VIEWS = {
  home: "viewHome", activity: "viewActivity", commands: "viewCommands", console: "viewConsole",
  automations: "viewAutomations", scripts: "viewScripts", custom: "viewCustom",
  notifications: "viewNotifications", backups: "viewBackups", servers: "viewServers",
  presence: "viewPresence", profile: "viewProfile", themes: "viewThemes",
  logs: "viewLogs", settings: "viewSettings",
};

async function renderView(slot) {
  const route = currentRoute.name;
  let fn = (typeof window !== 'undefined' ? window[VIEWS[route]] : null) ||
           (typeof window !== 'undefined' ? window[route] : null);

  if (!fn && typeof window !== 'undefined') {
    try { fn = eval(VIEWS[route]); } catch {}
  }

  __currentRender = () => { if (currentRoute.name) renderApp(); };
  slot.replaceChildren(Skeleton(4));
  try {
    if (!fn) throw new Error(`Unknown view: "${route}"`);
    await fn(slot);
  } catch (e) {
    console.error(`View Render Error [${route}]:`, e);
    slot.replaceChildren(ErrorState(e, { retry: () => renderApp(), logs: true }));
  }
}

/* ============ BOOT ============ */
window.addEventListener("popstate", renderApp);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const o = $(".overlay");
    if (o) { o.classList.add("closing"); setTimeout(() => o.remove(), 240); }
    const d = $(".drawer.open");
    if (d) toggleDrawer();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (typeof openPalette === 'function') openPalette();
  }
});

// Scroll-aware topbar
let lastScrollY = 0;
window.addEventListener("scroll", () => {
  const topbar = $(".topbar");
  if (!topbar) return;
  const currentScrollY = window.scrollY;
  if (currentScrollY > 100) topbar.classList.add("topbar-scrolled");
  else topbar.classList.remove("topbar-scrolled");
  
  if (currentScrollY > lastScrollY && currentScrollY > 200) {
    topbar.classList.add("topbar-hidden");
    topbar.classList.remove("topbar-visible");
  } else {
    topbar.classList.remove("topbar-hidden");
    topbar.classList.add("topbar-visible");
  }
  lastScrollY = currentScrollY;
}, { passive: true });

/* Live shell repaint — only status chrome, never open forms/views */
onStore(() => {
  const conn = $("#sidebar-conn");
  if (conn) conn.replaceChildren(connCluster("compact"));
  const dconn = $("#drawer-conn");
  if (dconn) dconn.replaceChildren(connCluster());
  const acc = $("#topbar-account");
  if (acc) acc.replaceChildren(accountChip());
  const bell = $(".topbar-bell-dot");
  if (bell && bell.classList) bell.classList.toggle("show", Boolean(Store.unread > 0));
  const badge = $(".nav-badge");
  if (badge && badge.classList) { badge.textContent = Store.unread > 9 ? "9+" : String(Store.unread); badge.classList.toggle("show", Boolean(Store.unread > 0)); }
  const home = $("#home-live");
  if (home && currentRoute.name === "home") {
    try { home.dispatchEvent(new CustomEvent("store", { bubbles: true })); } catch {}
  }
});

(async function boot() {
  try {
    const me = await apiGet("/auth/me");
    if (me.authenticated) {
      csrfToken = document.cookie.split("; ").find((c) => c.startsWith("hunter_csrf="))?.split("=")[1] || null;
      // Sync route from URL path
      const pathRoute = location.pathname.replace(/^\/+/, '').split('/')[0];
      if (ALL_NAV.some(n => n.id === pathRoute) || pathRoute === "logs") {
        currentRoute = { name: pathRoute, id: null };
      }
      await Promise.all([refreshClientState(), refreshUnread(), refreshCommandsCache()]);
      loadActiveTheme();
      connectWS();
      renderApp();
      // refresh client state periodically (latency/uptime)
      setInterval(refreshClientState, 5000);
    } else {
      renderLogin();
    }
  } catch (e) {
    renderLogin();
  }
})();

async function refreshCommandsCache() {
  try { const d = await apiGet("/commands"); Store.commands = d.commands || []; emitStore(); } catch (e) {}
}

function renderLogin() {
  $("#app").replaceChildren(loginView());
}
