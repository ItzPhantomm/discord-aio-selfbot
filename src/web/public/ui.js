/* Hunter UI — component primitives (design system) */
"use strict";

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
