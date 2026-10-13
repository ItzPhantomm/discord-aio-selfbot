/* Discord AIO // Settings & Activity Logs */
"use strict";

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
