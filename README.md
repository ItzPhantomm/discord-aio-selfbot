# Flaw // Discord Command Center & Selfbot

An advanced, keyboard-first Discord selfbot featuring 660+ native commands, an autonomous ReAct AI agent with multi-provider failover (OpenRouter & NVIDIA NIM), and an official user-installable Discord slash app (`/flaw`) built with Components V2.

Hardened with byte-accurate Firefox fingerprint cloaking, dynamic build scraper, hierarchical token-bucket rate limits, and an instant Fast Mode toggle.

---

## Features

### User-Installed Discord App (`/flaw`)
* **Runs Anywhere**: Installable to your Discord user account. Trigger commands in any server, DM, or group chat without adding the bot to the guild.
* **13-Command Category Paging**: Interactive menu displaying 13 commands per page with `◀ Previous` and `Next ▶` pagination buttons.
* **Native Subcommands**: Direct execution via official slash subcommands (`/moderation ban user:@user`, `/utility calc expression:10*5`, `/general ping`).
* **Fast Mode vs Normal Mode**: Instant command dispatching (`0ms` artificial typing pause) or realistic human typing simulation, toggleable via `.switch` or in-app button.

### Multi-Provider Autonomous AI Agent
* **18 Tool Functions**: Real Discord inspection (`get_user_info`, `search_messages`, `list_roles`, `get_server_info`, etc.).
* **Auto-Failover**: Automatically falls back from OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free`) to NVIDIA NIM if rate-limited (HTTP 429).
* **CLI Chat**: Run `npm run agent:cli` for an interactive terminal chat session.

### Anti-Detection Engine
* **Firefox Fingerprint**: Emulates genuine Mozilla Firefox v136 on Windows NT 10.0 (`X-Super-Properties`).
* **Dynamic Build Puller**: Automatically extracts the live client build number on startup.
* **Hierarchical Token Buckets**: Separate rate limit queues for Global, DM Global, Recipient DMs, and Channels.
* **Webhook Logger**: Silently forwards deleted message snipes to a designated Discord webhook (`.snipewebhook <url>`).
* **Auto-Destruct**: Self-destructing messages with randomized jitter (`.autodeleteall <seconds>`).

---

## Command Overview (660+ Commands)

| Category | Commands | Description |
|---|:---:|---|
| **OP** | 100 | Ghost pings, mass purges, server reconnaissance, channel nukes, slowmode sweeps. |
| **Utility** | 66 | Snipes, edit-snipes, calculator, IP/WHOIS, QR codes, token inspectors, unix converters. |
| **Fun** | 51 | Blackjack 21, casino slots, tic-tac-toe, trivia, riddles, would-you-rather, roasts. |
| **User** | 49 | Account dossiers, relationship manager, auto-accept friends, presence presets, bio editors. |
| **General** | 49 | Userinfo, serverinfo, avatar/banner HD downloaders, invite inspectors, latency. |
| **Moderation** | 46 | Ban, kick, softban, timeout, mass-unban, unhoist, slowmode locks, role managers. |
| **Text** | 41 | Mock case, reverse, vaporwave, 1337 speak, Morse code, binary, zalgo, ASCII boxes. |
| **RPC & Voice** | 40 | Custom Spotify presence with album covers, Twitch stream badges, voice channel tools. |
| **Automation** | 36 | Auto-responders, auto-reactors, autocopy user mirroring, interval broadcasters. |
| **Purge** | 30 | Media purges, link purges, caps purges, numerical spam purges, bot message cleans. |
| **Config** | 26 | Fast mode toggle, snipe webhook forwarder, model setup, TUI theme changers. |
| **Backup** | 20 | Full guild snapshot backups (roles, permissions, channels), emoji dumpers. |
| **Developer** | 15 | Conventional commit generators, Dockerfile templates, SQL schemas, regex escapers. |
| **Crypto** | 30 | SHA-256, HMAC, AES-256-CBC encryption/decryption, RSA-2048 keypairs. |
| **Web** | 15 | HTTP status codes, MIME headers, DNS lookups, URL parsing, CDN signature audits. |
| **Admin** | 10 | Role member audits, emoji slot capacity meters, sticker quotas. |
| **Math** | 10 | Factorials, Fibonacci sequences, quadratic solvers, statistics calculators. |
| **Media** | 10 | Aspect ratio calculators, video bitrate estimators, CMYK/RGB converters. |
| **Productivity**| 10 | Pomodoro timers, message bookmark vaults, reusable snippets, worklog journals. |
| **System** | 10 | Hardware diagnostics, CPU load averages, RAM allocation, latency meters. |

---

## Installation

```bash
git clone https://github.com/ItzPhantomm/discord-aio-selfbot.git
cd discord-aio-selfbot
npm install
```

### Configuration

Copy the example configuration:
```bash
cp config.example.json config.json
```

Populate `config.json` with your credentials:
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

### Running

```bash
# Start active live stream & Discord user-app frontend
npm start

# Interactive CLI console
npm run console

# Dedicated AI chat terminal
npm run agent:cli
```

---

## Slash Subcommands Quick Reference

The user-installable frontend registers native subcommands directly into your Discord client:

```
/moderation ban user:@member [reason:spam]
/moderation kick user:@member [reason:inactivity]
/moderation mute user:@member [minutes:10]
/utility calc expression:25 * 4 + 10
/general ping
/purge purge [count:15]
/op opghostping target:@member
/voice rpcspotify [title:SongName]
```

---

## License & Disclaimer

Selfbots violate Discord's Terms of Service. Automating user accounts can lead to account suspension. This software is provided strictly for educational and testing purposes. Use at your own discretion.
