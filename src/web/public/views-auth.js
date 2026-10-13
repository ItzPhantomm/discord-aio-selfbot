/* Hunter — onboarding: workspace sign-in + Discord connection flow */
"use strict";

/* ============ WELCOME / SIGN-IN ============ */
function loginView() {
  const token = h("input", { class: "field-input", type: "password", placeholder: "Admin token", "aria-label": "Admin token" });
  const err = h("div", { class: "form-error", style: "display:none" });
  const btn = Button({ label: "Sign in", variant: "primary", size: "lg", onclick: async () => {
    err.style.display = "none";
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.value }),
    });
    if (!res.ok) {
      let msg = "Sign-in failed";
      try { const d = await res.json(); msg = d.detail || msg; } catch (e) {}
      err.textContent = msg; err.style.display = "block";
      return;
    }
    csrfToken = document.cookie.split("; ").find((c) => c.startsWith("hunter_csrf="))?.split("=")[1] || null;
    await Promise.all([refreshClientState(), refreshUnread(), refreshCommandsCache()]);
    loadActiveTheme();
    connectWS();
    if (!Store.client.token_configured) openConnectFlow(true);
    renderApp();
  }});

  return h("div", { class: "auth-screen" },
    h("div", { class: "auth-card" },
      h("div", { class: "brand-mark-lg", html: Icon("bolt", 32) }),
      h("h1", { class: "auth-title", text: "Discord AIO" }),
      h("p", { class: "auth-sub", text: "Nighty Control Center — Full Selfbot Automation Suite" }),
      h("form", { onsubmit: (e) => { e.preventDefault(); btn.click(); } },
        field("Admin token", token, "Enter web dashboard password (default: admin)"),
        err),
      h("div", { class: "auth-actions" }, btn),
      h("p", { class: "auth-foot" },
        "Automating a personal Discord account violates Discord's Terms of Service.",
        h("br"), "Includes anti-detection, jitter pacing, and safe action rate limiting.")));
}

/* ============ CONNECT DISCORD FLOW ============ */
function openConnectFlow(firstRun = false) {
  if ($(".overlay.connect-flow")) return;

  const steps = ["Authenticate", "Configure", "Start", "Running"];
  let step = 0;
  const token = h("input", { class: "field-input", type: "password", placeholder: "Discord user token", "aria-label": "Discord user token" });
  const statusEl = h("div", { class: "connect-flow-status" });
  const stepBar = h("div", { class: "connect-flow-steps" });
  const err = h("div", { class: "form-error", style: "display:none" });

  const paintSteps = () => {
    stepBar.replaceChildren(...steps.map((label, i) =>
      h("div", { class: "step" + (i < step ? " done" : i === step ? " active" : "") },
        h("span", { class: "step-dot" }, i < step ? h("span", { html: Icon("check", 11) }) : String(i + 1)),
        h("span", { class: "step-label", text: label })),
    ));
  };

  const paintStatus = (msg, tone = "") => {
    statusEl.replaceChildren(h("p", { class: "connect-flow-msg " + tone, text: msg }));
  };

  const body = h("div", { class: "connect-flow" },
    h("p", { class: "connect-flow-intro", text: firstRun
      ? "Connect your Discord account to start automating. Hunter validates the token server-side before saving."
      : "Paste your Discord user token. It's validated before the client starts." }),
    stepBar,
    field("Discord user token", token),
    statusEl, err,
    h("p", { class: "hint" },
      "Only use a token you own and are authorized to use. Automating user accounts violates Discord's ToS — Hunter includes no anti-detection features."));

  const footer = [
    Button({ label: "Cancel", onclick: () => flow.close() }),
    Button({ label: "Validate", icon: "shield", onclick: async () => {
      err.style.display = "none";
      const t = token.value.trim();
      if (!t) { err.textContent = "Enter a token first"; err.style.display = "block"; return false; }
      paintStatus("Validating token…");
      const r = await apiPost("/token/validate", { token: t, validate: true });
      if (r.valid && r.user) {
        paintStatus(`Token valid — signed in as ${r.user.username}#${r.user.discriminator}`, "ok");
        step = 1; paintSteps();
      } else {
        err.textContent = "Invalid token: " + (r.error || "Discord rejected it");
        err.style.display = "block";
        paintStatus("");
        return false;
      }
    }}),
    Button({ label: "Save & start client", variant: "primary", icon: "play", onclick: async () => {
      err.style.display = "none";
      const t = token.value.trim();
      if (!t) { err.textContent = "Enter a token first"; err.style.display = "block"; return false; }
      step = 2; paintSteps();
      paintStatus("Saving token and starting client…");
      try {
        await apiPost("/token/set", { token: t, validate: true });
        paintStatus("Client starting…");
        await refreshClientState();
        await clientAction("start");
        const deadline = Date.now() + 30000;
        while (Date.now() < deadline) {
          await refreshClientState();
          if (Store.client.connection_state === "connected") break;
          if (Store.client.control_state === "error") {
            err.textContent = Store.client.error || "Client failed to start";
            err.style.display = "block";
            step = 1; paintSteps(); paintStatus("");
            return false;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
        await refreshClientState();
        if (Store.client.connection_state === "connected") {
          step = 3; paintSteps();
          paintStatus(`Connected as ${Store.client.user?.username} — ${Store.client.guild_count} servers`, "ok");
          toast("Discord connected", "ok");
          setTimeout(() => { flow.close(); renderApp(); }, 900);
        } else {
          err.textContent = "Connection timed out — check the token and try again";
          err.style.display = "block";
          step = 1; paintSteps(); paintStatus("");
          return false;
        }
      } catch (e) {
        err.textContent = e.message; err.style.display = "block";
        step = 1; paintSteps(); paintStatus("");
        return false;
      }
    }}),
  ];

  paintSteps();
  const flow = Modal({ title: firstRun ? "Connect Discord" : "Connection Center", body, footer });
  token.focus();
}

window.loginView = loginView;
window.openConnectFlow = openConnectFlow;