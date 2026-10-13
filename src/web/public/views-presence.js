/* Hunter — Presence Studio: config + live Discord-style preview */
"use strict";

async function viewPresence(slot) {
  slot.replaceChildren(Skeleton(4));
  let pres;
  try { pres = await apiGet("/presence"); }
  catch (e) { slot.replaceChildren(ErrorState(e, { retry: () => renderApp() })); return; }

  const state = {
    status: pres.status || "online",
    type: pres.activities?.[0]?.type || "playing",
    name: pres.activities?.[0]?.name || "",
    details: pres.activities?.[0]?.details || "",
    state: pres.activities?.[0]?.state || "",
    url: pres.activities?.[0]?.url || "",
  };

  /* live preview — Discord profile-style card */
  const preview = h("div", { class: "presence-preview" });
  const paintPreview = () => {
    const statusTone = { online: "ok", idle: "warn", dnd: "err", invisible: "off" }[state.status] || "off";
    const typeLabel = { playing: "Playing", streaming: "Streaming", listening: "Listening to", watching: "Watching", custom: "" }[state.type] || "Playing";
    const u = Store.client.user;
    const initials = (u?.username || "U").slice(0, 2).toUpperCase();
    preview.replaceChildren(
      h("div", { class: "pv-card" },
        h("div", { class: "pv-card-banner" }),
        h("div", { class: "pv-card-avatar-wrap" },
          u?.avatar ? h("img", { class: "pv-card-avatar", src: u.avatar, alt: "" })
                    : h("span", { class: "pv-card-avatar pv-card-avatar-fallback", text: initials }),
          h("span", { class: "status-dot " + statusTone + " pv-card-status" }, h("span", { class: "sdot-dot" }))),
        h("div", { class: "pv-card-body" },
          h("div", { class: "pv-card-name", text: u ? u.username : "Your account" }),
          h("div", { class: "pv-card-tag", text: u ? `#${u.discriminator}` : "" }),
          state.name ? h("div", { class: "pv-card-activity" },
            typeLabel && state.type !== "custom" ? h("span", { class: "pv-card-activity-label", text: typeLabel }) : null,
            h("span", { class: "pv-card-activity-name", text: state.name })) : null,
          state.details ? h("div", { class: "pv-card-detail", text: state.details }) : null,
          state.state ? h("div", { class: "pv-card-detail", text: state.state }) : null,
          !state.name && !state.details && !state.state
            ? h("div", { class: "pv-card-activity-label", text: "No activity set" }) : null)));
  };

  /* controls */
  const statusSel = sel([["online", "Online"], ["idle", "Idle"], ["dnd", "Do not disturb"], ["invisible", "Invisible"]], state.status);
  const typeSel = sel([["playing", "Playing"], ["streaming", "Streaming"], ["listening", "Listening to"], ["watching", "Watching"], ["custom", "Custom status"]], state.type);
  const nameIn = h("input", { class: "field-input", type: "text", value: state.name, placeholder: "Activity name" });
  const detailsIn = h("input", { class: "field-input", type: "text", value: state.details, placeholder: "Details (rich presence)" });
  const stateIn = h("input", { class: "field-input", type: "text", value: state.state, placeholder: "State (rich presence)" });
  const urlIn = h("input", { class: "field-input", type: "text", value: state.url, placeholder: "https://twitch.tv/…" });

  const sync = () => {
    state.status = statusSel.value; state.type = typeSel.value;
    state.name = nameIn.value; state.details = detailsIn.value;
    state.state = stateIn.value; state.url = urlIn.value;
    paintPreview();
  };
  [statusSel, typeSel, nameIn, detailsIn, stateIn, urlIn].forEach((el) => el.addEventListener("input", sync));

  const presets = h("div", { class: "preset-row" }, [
    ["play", "Playing Game", "playing", "Discord AIO"],
    ["presence", "Listening Music", "listening", "Spotify"],
    ["eye", "Watching Stream", "watching", "Twitch"],
    ["moon", "Idle Status", "idle", ""],
    ["wifi", "Live Broadcast", "streaming", "https://twitch.tv"],
  ].map(([iconName, label, type, name]) =>
    h("button", { class: "preset", onclick: () => {
      state.status = type === "idle" ? "idle" : "online";
      state.type = type; state.name = name || label; state.details = ""; state.state = ""; state.url = "";
      statusSel.value = state.status; typeSel.value = type; nameIn.value = state.name;
      detailsIn.value = ""; stateIn.value = ""; urlIn.value = "";
      paintPreview();
    }}, h("span", { class: "preset-icon", html: Icon(iconName, 14) }), h("span", { class: "preset-label", text: label }))));

  const applyBtn = Button({
    label: "Apply presence", variant: "primary", icon: "check",
    onclick: async () => {
      const activity = state.name || state.details || state.state || state.type === "custom"
        ? { type: state.type, name: state.name || undefined, details: state.details || undefined,
            state: state.state || undefined, url: state.url || undefined }
        : null;
      if (activity) for (const k of Object.keys(activity)) activity[k] === undefined && delete activity[k];
      await apiPut("/presence", { status: state.status, activity });
      toast("Presence updated", "ok");
    },
  });

  const configPanel = Panel("Configuration", [
    field("Status", statusSel),
    h("div", { class: "section-label", text: "Activity" }),
    field("Type", typeSel),
    state.type === "streaming" ? field("Stream URL", urlIn, "Required for streaming") : null,
    field("Activity name", nameIn),
    field("Details", detailsIn, "First line under the activity"),
    field("State", stateIn, "Second line under the activity"),
    h("div", { class: "section-label", text: "Presets" }),
    presets,
  ]);
  // rebuild streaming field visibility
  typeSel.addEventListener("change", () => {
    const streaming = typeSel.value === "streaming";
    const existing = configPanel.querySelector(".field-stream-url");
    if (streaming && !existing) {
      const f = field("Stream URL", urlIn, "Required for streaming");
      f.classList.add("field-stream-url");
      configPanel.querySelector(".panel-body").insertBefore(f, configPanel.querySelector(".panel-body").children[4]);
    } else if (!streaming && existing) existing.remove();
  });

  slot.replaceChildren(
    pageHead("Presence Studio", "Set your status and rich activity — the preview updates as you type.", [
      Button({ label: "Clear presence", icon: "x", onclick: async () => {
        await apiPost("/presence/clear", {}); toast("Presence cleared", "ok"); renderApp();
      }}),
      applyBtn,
    ]),
    h("div", { class: "studio-layout" }, configPanel,
      h("div", {}, h("div", { class: "section-label", text: "Live preview" }), preview)));
  paintPreview();
}

window.viewPresence = viewPresence;