/* Discord AIO // Automations workspace */
"use strict";

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
  const reactionsText = h("input", { class: "field-input", type: "text", value: ((a.config || {}).reactions || ["👍"]).join(","), placeholder: "👍,❤️" });
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
  if (a.type === "auto_react") return `"${cfg.trigger || ""}" → ${(cfg.reactions || ["👍"]).join(", ")}`;
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