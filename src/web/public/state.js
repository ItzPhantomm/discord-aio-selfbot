/* Hunter State — one source of truth for client status + realtime streams */
"use strict";

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
