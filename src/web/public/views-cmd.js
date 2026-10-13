/* Discord AIO // Command Explorer + Interactive Execution */
"use strict";

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
          execResult.textContent = (res.output || "No output returned.") + `\n\n✓ ${res.duration_ms || 0}ms`;
        } catch (err) {
          execResult.textContent = `⚠️ Error: ${err.message}`;
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
