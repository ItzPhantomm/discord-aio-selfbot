/* Hunter — Home command center, Activity timeline, Servers workspace */
"use strict";

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
            h("span", { class: "kv-k", text: (ch.type === "text" ? "#" : ch.type === "voice" ? "🔊 " : "◇ ") + ch.name }),
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