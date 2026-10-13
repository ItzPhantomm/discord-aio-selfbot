<div align="center">

# ⚡ DISCORD AIO // COMMAND CENTER
### *The $100k Nighty-inspired web control center & terminal engine for Discord power users.*

**660+ hand-crafted Discord commands, an autonomous multi-provider AI agent with auto-failover, and a bespoke production web dashboard.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js--Selfbot--v13-3.4.1-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://github.com/aiko-chan-ai/discord.js-selfbot-v13)
[![Web Dashboard](https://img.shields.io/badge/Dashboard-Nighty_Edition-00d4aa?style=for-the-badge&logo=fastapi&logoColor=white)](http://localhost:8080)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-6366F1?style=for-the-badge)](https://openrouter.ai/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com/)
[![License](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](LICENSE)

---

```
┌────────────────────────────────────────────────────────────────────────┐
│ [● ONLINE] User#1337 | Ping: 24ms | Channel: #general | Guilds: 48    │
├──────────────────┬─────────────────────────────────┬───────────────────┤
│ ◈ NAVIGATION     │ ◈ ACTIVITY & EVENT FEED         │ ◈ INSPECTOR       │
│ ├─ 🔥 OP (100)   │ [18:24:01] [OK]  .ping (14ms)   │ ◈ .STEALEMOJI     │
│ ├─ ◈ General(49) │ [18:24:12] [SNP] Message sniped │ Usage:            │
│ ├─ 👤 User (49)   │ [18:24:45] [AFK] Mention @alice │ .stealemoji <e>   │
│ ├─ 🛡️ Mod (46)    │ [18:25:00] [BOT] Codex Agent:   │ Fetches direct    │
│ ├─ 🧹 Purge (30)  │  ⚡ [TOOL CALL] get_server_info │ 128px lossless    │
│ └─ 🛠️ Util (66)   │  └─ [OK] (150k members)         │ CDN asset URL.    │
├──────────────────┴─────────────────────────────────┴───────────────────┤
│ ◈ WEB CONTROL CENTER: http://localhost:8080 (Nighty Edition)           │
├────────────────────────────────────────────────────────────────────────┤
│ ❯ ACTIVE CLI STREAM: npm start │ CLI Console: npm run console          │
└────────────────────────────────────────────────────────────────────────┘
```

</div>

---

## ⚡ The Punchline

> Most Discord selfbots are either clunky Python scripts or bloated electron web dashboards that eat your RAM and leak your tokens. **Discord AIO** is different: an ultra-fast, zero-overhead, keyboard-first terminal engine paired with an **executive-grade Nighty web control center** (`http://localhost:8080`) engineered like a high-end Bloomberg terminal for Discord power users.

---

## 🌐 The Nighty Web Control Center (`http://localhost:8080`)

Experience a bespoke, graphite-surfaced developer control center modeled after **[Nighty](https://nighty.one/)**:

1. **Overview Dashboard (`/home`)**:
   - Gateway connection state (`Connected`, `Starting`, `Stopped`, `Error`), live latency counter (`ms`), uptime tracker.
   - Connected user profile badge, server count, open DMs count, active automations counter.
   - Live activity timeline streaming message snipes, commands, and gateway events in real time via WebSockets.
2. **Command Explorer (`/commands`)**:
   - Interactive catalog reflecting **all 662+ commands** discovered dynamically from the live backend.
   - Instant search across names, descriptions, and aliases with category chip filters.
   - Interactive command detail panel: usage syntax, parameters, cooldowns, examples, and **Interactive Execution Form** with real-time output cards and duration metrics.
   - Star/favorite commands with persistent local storage.
3. **Presence Studio (`/presence`)**:
   - Status switcher (`Online`, `Idle`, `Do Not Disturb`, `Invisible`).
   - Rich Activity creator: `Playing`, `Streaming` (Twitch/YouTube), `Listening to` (Spotify), `Watching`, and `Competing`.
   - Custom status text, state, details, timestamps, and 1-click rotation presets (`🎮 Playing`, `🎧 Spotify`, `🌙 Idle vibes`).
   - **Live Discord Profile Card Preview** updating in real time as you type!
4. **Account & Settings (`/settings` & `/profile`)**:
   - Connected Discord identity, bio editor, custom status, and session controls.
   - Command prefix, auto-destruct timers, anti-detection pacing, and AI provider selection.
   - **Recovery & Snapshots (`/backups`)**: Create full configuration and storage snapshots, preview diffs, export JSON, and perform 1-click restores.
   - **Theme Customization (`/themes`)**: 5 built-in themes (*Nighty Graphite*, *Obsidian Monochrome*, *Midnight Aurora*, *Emerald Terminal*, *Cyberpunk Neon*) plus live custom CSS variable builder.
5. **Modules & Extensions (`/automations`)**:
   - Auto-responders, auto-reactors, keyword detection triggers.
   - AFK Manager with auto-reply message and cooldowns.
   - OwO farmer configuration.
   - Event-driven Scripts & Scheduled Jobs.
6. **Activity Console (`/console`)**:
   - Remote command execution terminal with live autocomplete (`Tab`), command history, execution latency, and error boundaries.
7. **Global Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Fuzzy-search commands, pages, and quick actions from anywhere in the dashboard.

---

## 🌟 Key Highlights

### 🧠 Autonomous AI Agent & Multi-Provider Failover
* **Dynamic Tool Calling**: 18 structured OpenAI-compatible function schemas (`get_user_info`, `list_user_servers`, `get_most_active_server`, `create_server`, `search_messages`, `list_roles`, etc.).
* **Multi-Provider Auto-Failover**: Connects to **OpenRouter** (`nvidia/nemotron-3-ultra-550b-a55b:free`) and **NVIDIA NIM** (`nvidia/nemotron-3-ultra-550b-a55b`). If your primary provider hits an HTTP 429 rate limit or quota ceiling, it **automatically fails over to the backup provider's model** and completes your task without crashing.
* **Dedicated AI Chat Session**: Run `npm run agent:cli` for an interactive terminal AI session with streaming tokens and specialist decomposition.

### 🥷 Stealth & Anti-Detection Architecture
* **Paced Humanized Deletion**: Enforces randomized human-like jitter (800ms - 1500ms) rather than robotic 0ms trigger deletion.
* **Simulated Human Typing**: Automatically simulates Discord's native `sendTyping()` indicator proportional to message length before dispatching responses.
* **Sliding-Window Rate Limiter & 429 Backoff**: Throttles bursts and automatically engages protective cooldowns on Discord rate limits to safeguard your account.
* **15-Second Auto-Destruct with Jitter**: Every outgoing selfbot message deletes itself with randomized jitter (customizable with `.autodeleteall <seconds>`).
* **Message Auto-Chunking**: Powered by `MessageSplitter.js`, large outputs are sliced into sequential chunks under 1,900 characters.

---

## 📂 Command Architecture (660+ Commands across 20 Categories)

| Category | Count | Focus & Description |
|---|:---:|---|
| **🔥 OP** | **100** | Superweapons: ghost pings, regex purges, channel nukes, slowmode sweeps, server recon, voice dominance, and mass reaction blasters. |
| **🛠️ Utility** | **66** | Snipes, edit-snipes, reaction snipes, calculator, IP/WHOIS, QR codes, token inspectors, unix epoch converters, and hastebin integration. |
| **🎲 Fun** | **51** | Blackjack 21, casino slots, tic-tac-toe, trivia, riddles, would-you-rather, roasts, pickup lines, rizz meters, and ASCII art. |
| **👤 User** | **49** | Account dossiers, relationship manager, friend request auto-accepter, blocked user list, presence presets (`studying`, `gaming`, `busy`), and bio editors. |
| **General** | **49** | Userinfo, serverinfo, avatar/banner HD downloaders, first message jump links, invite inspectors, shard status, and `.agent` controllers. |
| **🛡️ Moderation** | **46** | Ban, kick, softban, timeout, mass-unban, unhoist nicknames, slowmode locks, role managers, and audit log inspectors. |
| **✎ Text** | **41** | SpOnGeBoB mock case, reverse, vaporwave, 1337 speak, Morse code, binary, zalgo, regional indicator emojis, and ASCII boxes. |
| **🔊 RPC & Voice** | **40** | Fake Spotify presence with album covers, Twitch streaming badges, fake video/screen-share indicators, voice channel switchers, and WebRTC bitrate meters. |
| **⚡ Automation** | **36** | High-velocity chat alerts, auto-responders, auto-reactors, autocopy user mirroring, and recurring channel broadcasters. |
| **🧹 Purge** | **30** | Media purges, link purges, caps purges, numerical spam purges, bot message cleans, and bounded message ID wipes. |
| **⚙️ Config** | **24** | Model setup, TUI theme changers, RAM cache flushers, rate-limit safety toggles, and custom command aliases. |
| **💾 Backup** | **20** | Full guild snapshot backups (roles, permissions, channels), emoji dumpers, and server layout cloners. |
| **💻 Developer** | **15** | Conventional commit generators, Dockerfile templates, SQL table schemas, regex escapers, and cURL builders. |
| **🌐 Web** | **15** | HTTP status codes, MIME headers, DNS lookups, URL parsing, and CDN signature audits. |
| **🔐 Crypto** | **30** | SHA-256, HMAC, AES-256-CBC encryption/decryption, Caesar, ROT13, RSA-2048 keypairs, and Shannon entropy checks. |
| **👑 Admin** | **10** | Role member audits, emoji slot capacity meters, sticker quotas, and invite utilization leaderboards. |
| **📐 Math** | **10** | Factorials, Fibonacci sequences, quadratic solvers, statistics calculators, and angle conversions. |
| **🖼️ Media** | **10** | Aspect ratio calculators, video bitrate file estimators, and CMYK/RGB converters. |
| **📋 Productivity** | **10** | Pomodoro timers, message bookmark vaults, reusable snippets, and worklog journals. |
| **🖥️ System** | **10** | Host hardware diagnostics, CPU load averages, RAM allocation, and event loop latency meters. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js v18 or higher** (Tested on Node.js v22).
* A Discord user account token.
* *(Optional)* An [OpenRouter](https://openrouter.ai/) or [NVIDIA NIM](https://build.nvidia.com/) API key for AI agent reasoning.

### 2. Installation
```bash
git clone https://github.com/ItzPhantomm/discord-aio-selfbot.git
cd discord-aio-selfbot
npm install
```

### 3. Launch Modes
```bash
# 1. Main Selfbot & Nighty Web Control Center (http://localhost:8080)
npm start

# 2. Interactive CLI Console Prompt
npm run console

# 3. Dedicated AI Agent Chat Session
npm run agent:cli
```

Open **`http://localhost:8080`** in your browser to access the Nighty Web Dashboard!

---

## 🧪 Automated Test Suite

Every module, command, web endpoint, and provider failover is thoroughly covered by automated regression tests:
```bash
npm test
```
Runs 13 test suites verifying:
* Storage atomic writes & JSON persistence
* Command tokenizer & dual-input context abstraction
* Web Control Center REST endpoints, static assets, and WebSockets
* Anti-Detection humanized pacing, typing simulation & 429 backoff
* Universal Secret Sanitizer credential redaction
* Tool registry & SafetyGate permission boundaries
* Multi-provider model search & automatic HTTP 429 failover
* AgentEngine ReAct loop, specialist decomposition & cancellation
* 662+ verified commands with zero duplicate collisions

---

## ⚖️ Legal & Disclaimer

> **Notice:** Selfbots violate the Discord Terms of Service. Automating user accounts can result in account termination. This software is provided strictly for educational, research, and authorized administrative testing purposes. Use at your own risk. The authors assume no liability for misuse.

---

<div align="center">
Built with precision by <a href="https://github.com/ItzPhantomm"><b>ItzPhantomm</b></a>
</div>
