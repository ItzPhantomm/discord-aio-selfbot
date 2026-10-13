/* Hunter — views part D: notifications, backups, themes, console, palette */
"use strict";

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
      out.appendChild(h("div", { class: "console-line dim" }, `✓ ${d.duration_ms}ms`));
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