<div align="center">

# FLAW // COMMAND CENTER
### *Acid-Lime Developer Command Center & User-Installable Discord Application*

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=16&duration=2400&pause=900&color=C8FF64&center=true&vCenter=true&width=700&lines=User-Installed+Discord+Application+(%2Fflaw);664%2B+Production+Commands+Across+20+Categories;Native+Subcommands+(%2Fmoderation+ban%2C+%2Futility+calc);Components+V2+Acid-Lime+Paged+Dashboard;Multi-Provider+Autonomous+AI+Agent+(OpenRouter+%2B+NVIDIA);Byte-Accurate+Firefox+Cloak+%2B+Hierarchical+Rate+Limits)](https://git.io/typing-svg)

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-v18+-222631?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js--v14-14.27.0-222631?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Flaw Engine](https://img.shields.io/badge/Flaw--Core-v2.0-C8FF64?style=for-the-badge&logoColor=black)](https://github.com/ItzPhantomm/discord-aio-selfbot)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-222631?style=for-the-badge&logo=openai&logoColor=white)](https://openrouter.ai/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-222631?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com/)
[![License](https://img.shields.io/badge/License-MIT-222631?style=for-the-badge&logoColor=white)](LICENSE)

</div>

---

## Overview

Flaw is an official **Discord User-Installable Application frontend** powered by Components V2 paired with a zero-overhead execution engine engineered for Discord power users.

---

## Flaw User-Installed App Frontend (`/flaw`)

Flaw installs directly onto your personal Discord account and can be summoned anywhere across Discord—including Direct Messages, group chats, and servers where the bot is not in the member list.

```
┌─────────────────────────────────────────────────────────────┐
│ FLAW / COMMAND CENTER [v2.0]                                │
│ PERSONAL TOOLKIT · COMMAND INDEX                            │
├─────────────────────────────────────────────────────────────┤
│ Commands :: 664                                             │
│ Modules  :: 13                                              │
│ Profile  :: FAST MODE (INSTANT TEXT)                        │
│ Status   :: ONLINE (ItsLemon#0000)                          │
├─────────────────────────────────────────────────────────────┤
│ [ Select Module (13 cmds/page)...                         ] │
├─────────────────────────────────────────────────────────────┤
│ [Mode: Fast]   [Search]   [Execute]   [Refresh]             │
└─────────────────────────────────────────────────────────────┘
```

### 1. Interactive Command Center Overview (`/flaw`)
* **Header**: `FLAW / COMMAND CENTER` with version tag `[v2.0]`.
* **Overview Metrics**:
  - `Commands :: 664`
  - `Modules :: 13`
  - `Profile :: FAST MODE (INSTANT TEXT)` / `NORMAL MODE (TYPING)`
  - `Status :: ONLINE`
* **Command Modules**:
  - `Utility` (66 commands)
  - `Social & User` (49 commands)
  - `Moderation` (46 commands)
  - `OP Powerhouse` (100 commands)
  - `General` (49 commands)
  - `Purge` (30 commands)
  - `Automation` (36 commands)
  - `Voice & RPC` (40 commands)
  - `Text & Ciphers` (41 commands)
  - `System & Config` (26 commands)
  - `Developer Tools` (15 commands)
  - `Crypto & Hash` (30 commands)
  - `Fun & Casino` (51 commands)

### 2. 13-CMD Interactive Pagination
* Exactly **13 commands per page** with syntax, parameter options, and descriptions.
* Interactive **`◀ Page N`** and **`Page N+1 ▶`** buttons to paginate through any category.
* Companion dropdown updates automatically to inspect parameters for the 13 commands currently on screen.
* Dedicated **`Run .<command>`** button to execute immediately on your selfbot and receive execution output cards with duration metrics.

### 3. Native Discord Subcommands
Every core command is registered as an official Discord subcommand with typed parameters:
* `/moderation ban user:@target [reason:<text>]`
* `/moderation kick user:@target [reason:<text>]`
* `/moderation mute user:@target [minutes:<number>]`
* `/utility calc expression:<math>`
* `/general ping`
* `/purge purge [count:<number>]`
* `/op opghostping target:@user`
* `/voice rpcspotify [title:<text>]`

### 4. Fast Mode vs Normal Mode (`.switch`)
* **Fast Mode**: Instantaneous command responses (`0ms` artificial typing wait) while maintaining background WebSocket typing signals.
* **Normal Mode**: Human typing simulation with proportional jitter.
* Toggle via chat (`.switch fast` / `.switch normal`) or via 1-tap button directly inside the `/flaw` overview.

---

## Architecture & Capabilities

### Autonomous AI Agent & Multi-Provider Failover
* **Dynamic Tool Calling**: 18 structured OpenAI-compatible function schemas (`get_user_info`, `list_user_servers`, `get_most_active_server`, `create_server`, `search_messages`, `list_roles`, etc.).
* **Multi-Provider Auto-Failover**: Connects to **OpenRouter** (`nvidia/nemotron-3-ultra-550b-a55b:free`) and **NVIDIA NIM** (`nvidia/nemotron-3-ultra-550b-a55b`). If your primary provider hits an HTTP 429 rate limit or quota ceiling, it automatically fails over to the backup provider's model.
* **Dedicated AI Chat Session**: Run `npm run agent:cli` for an interactive terminal AI session with streaming tokens and specialist decomposition.

### Anti-Detection & Hardening
* **Byte-Accurate Firefox Fingerprint**: Emulates genuine Mozilla Firefox v136.0 on Windows with realistic headers and WebSocket properties (`src/client/FingerprintCloak.js`).
* **Live Discord Build Number Scraper**: Automatically pulls the latest production client build number directly from Discord web assets on startup (`src/client/BuildNumberPuller.js`).
* **Hierarchical Token Bucket Rate Limiting**: Enforces separate rate limit buckets for Global API, Global DMs, Per-Recipient DMs, and Channel messages (`src/client/RateLimitBuckets.js`).
* **Pre-Send Gateway Synchronization**: Emits typing indicators and applies humanized typing pauses before dispatching messages.
* **Paced Humanized Deletion**: Enforces randomized human-like jitter (800ms - 1500ms) rather than robotic 0ms trigger deletion.
* **Webhook Logger for Deleted Messages**: Deleted message snipes forward silently to a configured Discord webhook (`.snipewebhook <url>`), keeping your terminal clean.
* **Sliding-Window Rate Limiter & 429 Backoff**: Throttles bursts and automatically engages protective cooldowns on Discord rate limits to safeguard your account.
* **15-Second Auto-Destruct with Jitter**: Outgoing selfbot messages delete themselves with randomized jitter (customizable with `.autodeleteall <seconds>`).
* **Message Auto-Chunking**: Powered by `MessageSplitter.js`, large outputs are sliced into sequential chunks under 1,900 characters.

---

## Command Architecture (664 Commands across 20 Categories)

| Category | Count | Focus & Description |
|---|:---:|---|
| **OP** | **100** | Ghost pings, regex purges, channel nukes, slowmode sweeps, server recon, voice dominance. |
| **Utility** | **66** | Snipes, edit-snipes, reaction snipes, calculator, IP/WHOIS, QR codes, token inspectors, unix epoch converters. |
| **Fun** | **51** | Blackjack 21, casino slots, tic-tac-toe, trivia, riddles, would-you-rather, roasts, pickup lines, ASCII art. |
| **User** | **49** | Account dossiers, relationship manager, friend request auto-accepter, blocked user list, presence presets, bio editors. |
| **General** | **49** | Userinfo, serverinfo, avatar/banner HD downloaders, first message jump links, invite inspectors, shard status. |
| **Moderation** | **46** | Ban, kick, softban, timeout, mass-unban, unhoist nicknames, slowmode locks, role managers, audit log inspectors. |
| **Text** | **41** | Mock case, reverse, vaporwave, 1337 speak, Morse code, binary, zalgo, regional indicator emojis, ASCII boxes. |
| **RPC & Voice** | **40** | Spotify presence with album covers, Twitch streaming badges, fake video/screen-share indicators, voice channel switchers. |
| **Automation** | **36** | Chat alerts, auto-responders, auto-reactors, autocopy user mirroring, recurring channel broadcasters. |
| **Purge** | **30** | Media purges, link purges, caps purges, numerical spam purges, bot message cleans, bounded message ID wipes. |
| **Config** | **26** | Fast mode toggle, snipe webhook forwarder, model setup, TUI theme changers, rate-limit safety toggles, custom aliases. |
| **Backup** | **20** | Full guild snapshot backups (roles, permissions, channels), emoji dumpers, server layout cloners. |
| **Developer** | **15** | Conventional commit generators, Dockerfile templates, SQL table schemas, regex escapers, cURL builders. |
| **Web** | **15** | HTTP status codes, MIME headers, DNS lookups, URL parsing, CDN signature audits. |
| **Crypto** | **30** | SHA-256, HMAC, AES-256-CBC encryption/decryption, Caesar, ROT13, RSA-2048 keypairs, Shannon entropy checks. |
| **Admin** | **10** | Role member audits, emoji slot capacity meters, sticker quotas, invite utilization leaderboards. |
| **Math** | **10** | Factorials, Fibonacci sequences, quadratic solvers, statistics calculators, angle conversions. |
| **Media** | **10** | Aspect ratio calculators, video bitrate file estimators, CMYK/RGB converters. |
| **Productivity** | **10** | Pomodoro timers, message bookmark vaults, reusable snippets, worklog journals. |
| **System** | **10** | Host hardware diagnostics, CPU load averages, RAM allocation, event loop latency meters. |

---

## Quick Start Guide

### 1. Prerequisites
* **Node.js v18 or higher** (Tested on Node.js v22).
* A Discord user account token (for selfbot engine).
* A Discord bot application token (for user-installable frontend app).
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

Edit `config.json` with your Discord credentials:
```json
{
  "token": "YOUR_DISCORD_USER_TOKEN",
  "prefix": ".",
  "frontend": {
    "enabled": true,
    "botToken": "YOUR_DISCORD_BOT_TOKEN",
    "ownerId": "1449235608022286347",
    "authorizedUsers": [
      "1449235608022286347"
    ]
  },
  "webhookLogging": {
    "enabled": false,
    "deletedMessagesWebhookUrl": ""
  }
}
```

### 4. Launch Modes
```bash
# 1. Main Selfbot Output Stream & User App Frontend
npm start

# 2. Interactive CLI Console Prompt
npm run console

# 3. Dedicated AI Agent Chat Session
npm run agent:cli
```

---

## Legal & Disclaimer

> **Notice:** Automating user accounts violates the Discord Terms of Service and can result in account termination. This software is provided strictly for educational, research, and authorized administrative testing purposes. Use at your own risk. The authors assume no liability for misuse.

---

<div align="center">
Built by <a href="https://github.com/ItzPhantomm"><b>ItzPhantomm</b></a>
</div>
