/* Hunter — application shell: routing, navigation, client control, boot */
"use strict";

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
      h("div", { class: "brand-mark", text: "⚡" }),
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