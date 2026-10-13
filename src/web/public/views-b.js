/* Hunter — views part B: scripts, custom commands, profile */
"use strict";

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
  const actEmoji = h("input", { class: "field-input", type: "text", value: "👍", placeholder: "emoji" });
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
    else if (actionType.value === "react") actions.push({ type: "react", emoji: actEmoji.value || "👍" });
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
      h("div", { class: "empty" }, h("div", { class: "big" }, "⚠"), h("p", { text: prof.error })),
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