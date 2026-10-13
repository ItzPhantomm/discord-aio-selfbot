/* Hunter — core helpers: DOM, formatting, API client, toasts */
"use strict";

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