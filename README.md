<div align="center">

# ⚡ DISCORD AIO // COMMAND CENTER
### *High-performance terminal engine & anti-detection automation suite for Discord power users.*

**663 hand-crafted Discord commands, an autonomous multi-provider AI agent with auto-failover, byte-accurate Firefox fingerprint cloaking, and hierarchical rate limit buckets.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js--Selfbot--v13-3.4.1-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://github.com/aiko-chan-ai/discord.js-selfbot-v13)
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
│ ├─ ◈ General(49) │ [18:24:12] [MSG] #general user  │ Usage:            │
│ ├─ 👤 User (49)   │ [18:24:45] [AFK] Mention @alice │ .stealemoji <e>   │
│ ├─ 🛡️ Mod (46)    │ [18:25:00] [BOT] Codex Agent:   │ Fetches direct    │
│ ├─ 🧹 Purge (30)  │  ⚡ [TOOL CALL] get_server_info │ 128px lossless    │
│ └─ 🛠️ Util (66)   │  └─ [OK] (150k members)         │ CDN asset URL.    │
├──────────────────┴─────────────────────────────────┴───────────────────┤
│ ◈ ACTIVE CLI STREAM: npm start │ CLI Console: npm run console          │
├────────────────────────────────────────────────────────────────────────┤
│ ❯ AI AGENT CLI: npm run agent:cli │ Discord Trigger: .agent <prompt>   │
└────────────────────────────────────────────────────────────────────────┘
```

</div>

---

## ⚡ The Punchline

> Most Discord selfbots are either clunky Python scripts or bloated electron web dashboards that eat your RAM and leak your tokens. **Discord AIO** is different: an ultra-fast, zero-overhead, keyboard-first terminal engine engineered like a high-end Bloomberg terminal for Discord power users.

---

## 🌟 Key Highlights

### 🧠 Autonomous AI Agent & Multi-Provider Failover
* **Dynamic Tool Calling**: 18 structured OpenAI-compatible function schemas (`get_user_info`, `list_user_servers`, `get_most_active_server`, `create_server`, `search_messages`, `list_roles`, etc.).
* **Multi-Provider Auto-Failover**: Connects to **OpenRouter** (`nvidia/nemotron-3-ultra-550b-a55b:free`) and **NVIDIA NIM** (`nvidia/nemotron-3-ultra-550b-a55b`). If your primary provider hits an HTTP 429 rate limit or quota ceiling, it **automatically fails over to the backup provider's model** and completes your task without crashing.
* **Dedicated AI Chat Session**: Run `npm run agent:cli` for an interactive terminal AI session with streaming tokens and specialist decomposition.

### 🥷 Stealth & Anti-Detection Architecture
* **Byte-Accurate Firefox Fingerprint**: Emulates genuine Mozilla Firefox v136.0 on Windows with realistic headers and WebSocket properties.
* **Live Discord Build Number Scraper**: Automatically pulls the latest production client build number directly from Discord web assets on startup.
* **Hierarchical Token Bucket Rate Limiting**: Enforces separate rate limit buckets for Global API, Global DMs, Per-Recipient DMs, and Channel messages.
* **Pre-Send Gateway Synchronization**: Emits typing indicators and applies humanized typing pauses before dispatching messages.
* **Paced Humanized Deletion**: Enforces randomized human-like jitter (800ms - 1500ms) rather than robotic 0ms trigger deletion.
* **Webhook Logger for Deleted Messages**: Deleted message snipes forward silently to a configured Discord webhook (`.snipewebhook <url>`), keeping your terminal clean.
* **Sliding-Window Rate Limiter & 429 Backoff**: Throttles bursts and automatically engages protective cooldowns on Discord rate limits to safeguard your account.
* **15-Second Auto-Destruct with Jitter**: Every outgoing selfbot message deletes itself with randomized jitter (customizable with `.autodeleteall <seconds>`).
* **Message Auto-Chunking**: Powered by `MessageSplitter.js`, large outputs are sliced into sequential chunks under 1,900 characters.

---

## 📂 Command Architecture (663 Commands across 20 Categories)

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
| **⚙️ Config** | **25** | Snipe webhook forwarder, model setup, TUI theme changers, RAM cache flushers, rate-limit safety toggles, and custom aliases. |
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

### 3. Configuration
Copy the template configuration file:
```bash
cp config.example.json config.json
```

Edit `config.json` with your Discord token and optional AI keys:
```json
{
  "token": "YOUR_DISCORD_TOKEN_HERE",
  "prefix": ".",
  "autoDeleteMessages": {
    "enabled": true,
    "delay": 15000
  },
  "agent": {
    "primaryProvider": "openrouter",
    "fallbackProvider": "nvidia",
    "openrouterApiKey": "sk-or-v1-...",
    "openrouterModel": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidiaApiKey": "",
    "nvidiaModel": "nvidia/nemotron-3-ultra-550b-a55b"
  },
  "webhookLogging": {
    "enabled": false,
    "deletedMessagesWebhookUrl": ""
  }
}
```

*Tip: You can also leave `config.json` blank and run the selfbot—it will launch in safe preview mode and let you sync your token via `.tokenhelper`!*

### 4. Launch Modes
```bash
# 1. Main Selfbot Output Stream
npm start

# 2. Interactive CLI Console Prompt
npm run console

# 3. Dedicated AI Agent Chat Session
npm run agent:cli
```

---

## 🧪 Automated Test Suite

Every module, command, rate limiter, and provider failover is thoroughly covered by automated regression tests:
```bash
npm test
```
Runs 13 test suites verifying:
* Storage atomic writes & JSON persistence
* Command tokenizer & dual-input context abstraction
* Anti-Detection humanized pacing, typing simulation & 429 backoff
* Live Discord build number puller & Firefox fingerprint cloaking
* Hierarchical token buckets for DMs and channels
* Universal Secret Sanitizer credential redaction
* Tool registry & SafetyGate permission boundaries
* Multi-provider model search & automatic HTTP 429 failover
* AgentEngine ReAct loop, specialist decomposition & cancellation
* 663 verified commands with zero duplicate collisions

---

## ⚖️ Legal & Disclaimer

> **Notice:** Selfbots violate the Discord Terms of Service. Automating user accounts can result in account termination. This software is provided strictly for educational, research, and authorized administrative testing purposes. Use at your own risk. The authors assume no liability for misuse.

---

<div align="center">
Built with precision by <a href="https://github.com/ItzPhantomm"><b>ItzPhantomm</b></a>
</div>
