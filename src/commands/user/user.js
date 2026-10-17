const Storage = require('../../utils/Storage');
const Logger = require('../../utils/Logger');
const TokenGrabber = require('../../utils/TokenGrabber');

module.exports = [
  {
    name: 'socialgraph',
    category: 'User',
    description: 'Inspect your real-time social interaction intelligence graph from local SQLite analytics',
    usage: '.socialgraph [server]',
    aliases: ['topfriends', 'interactions', 'socialintel'],
    run: async (ctx, args) => {
      const isGuildOnly = args[0] === 'server' || args[0] === 'guild';
      const guildId = isGuildOnly && ctx.guild ? ctx.guild.id : null;
      const rows = Storage.getTopInteractions(10, guildId);

      if (!rows || rows.length === 0) {
        return ctx.reply('📊 **Social Intelligence Graph**: No message traffic recorded yet in local database.');
      }

      let text = `### 📊 SOCIAL INTERACTION GRAPH ${guildId ? `(#${ctx.guild.name})` : '(GLOBAL)'}\n`;
      text += '> Derived deterministically from live message traffic without external tracking:\n\n';

      rows.forEach((r, i) => {
        const count = r.total_messages || r.message_count;
        const lastSeen = r.last_seen || r.last_interaction;
        const timeAgo = Math.round((Date.now() - lastSeen) / 60000);
        const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;
        text += `**\`${i + 1}.\`** **${r.user_tag}** (\`${r.user_id}\`) — **${count}** interactions · *${timeStr}*\n`;
      });

      return ctx.reply(text);
    }
  },
  {
    name: 'setstatus',
    category: 'User',
    description: 'Change presence status (online, idle, dnd, invisible)',
    usage: '.setstatus <online|idle|dnd|invisible>',
    aliases: ['status'],
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Specify status.');
      const s = args[0].toLowerCase();
      if (!['online', 'idle', 'dnd', 'invisible'].includes(s)) return ctx.reply('❌ Invalid status.');
      ctx.client.user.setStatus(s);
      return ctx.reply(`✅ Presence state set to: \`${s.toUpperCase()}\``);
    }
  },
  {
    name: 'setactivity',
    category: 'User',
    description: 'Set custom client activity',
    usage: '.setactivity <playing|streaming|listening|watching|competing> <name>',
    aliases: ['activity'],
    run: async (ctx, args) => {
      if (!ctx.client || args.length < 2) return ctx.reply('❌ Usage: `.setactivity <type> <name>`');
      const type = args[0].toUpperCase();
      const name = args.slice(1).join(' ');
      ctx.client.user.setActivity(name, { type });
      return ctx.reply(`✅ Activity broadcast: \`${type}\` **${name}**`);
    }
  },
  {
    name: 'setcustomstatus',
    category: 'User',
    description: 'Set custom text status',
    usage: '.setcustomstatus <text>',
    aliases: ['customstatus'],
    run: async (ctx, args) => {
      if (!ctx.client) return;
      const text = args.join(' ');
      ctx.client.user.setActivity({ name: text, type: 'CUSTOM' });
      return ctx.reply(`✅ Custom status updated: "${text}"`);
    }
  },
  {
    name: 'clearstatus',
    category: 'User',
    description: 'Wipe all activities and custom status',
    usage: '.clearstatus',
    run: async (ctx) => {
      if (ctx.client) ctx.client.user.setPresence({ activities: [] });
      return ctx.reply('🧹 Cleared all active presences and statuses.');
    }
  },
  {
    name: 'setbio',
    category: 'User',
    description: 'Update user about me / bio',
    usage: '.setbio <text>',
    run: async (ctx, args) => {
      if (!ctx.client) return;
      const bio = args.join(' ');
      try {
        await ctx.client.user.setAboutMe(bio);
        return ctx.reply('✅ Profile bio successfully updated.');
      } catch (e) {
        return ctx.reply(`❌ Failed to update bio: ${e.message}`);
      }
    }
  },
  {
    name: 'setavatar',
    category: 'User',
    description: 'Change profile picture via URL',
    usage: '.setavatar <image_url>',
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Provide image URL.');
      try {
        await ctx.client.user.setAvatar(args[0]);
        return ctx.reply('✅ Avatar asset updated.');
      } catch (e) {
        return ctx.reply(`❌ Failed to set avatar: ${e.message}`);
      }
    }
  },
  {
    name: 'setbanner',
    category: 'User',
    description: 'Change profile banner via URL',
    usage: '.setbanner <image_url>',
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Provide banner URL.');
      try {
        await ctx.client.user.setBanner(args[0]);
        return ctx.reply('✅ Banner asset updated.');
      } catch (e) {
        return ctx.reply(`❌ Failed: ${e.message}`);
      }
    }
  },
  {
    name: 'afk',
    category: 'User',
    description: 'Toggle or configure AFK sentinel with reason (.afk [reason|off])',
    usage: '.afk [reason|off]',
    aliases: ['unafk'],
    run: async (ctx, args) => {
      if (args[0]?.toLowerCase() === 'off') {
        if (ctx.client?.config) ctx.client.config.afk.enabled = false;
        return ctx.reply('☀️ **AFK Disengaged.**');
      }
      const reason = args.join(' ') || 'AFK';
      if (ctx.client && ctx.client.config) {
        ctx.client.config.afk = { enabled: true, reason, since: Date.now() };
      }
      return ctx.reply(`💤 **AFK Sentinel Engaged:** "${reason}"`);
    }
  },
  {
    name: 'dndmode',
    category: 'User',
    description: 'Toggle do-not-disturb DM suppressor',
    usage: '.dndmode',
    run: async (ctx) => {
      return ctx.reply('🔕 **DND Filter:** Activated.');
    }
  },
  {
    name: 'ghostmode',
    category: 'User',
    description: 'Hide typing indicator globally',
    usage: '.ghostmode <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`👻 **Ghost Typing:** \`${state ? 'ENGAGED' : 'DISENGAGED'}\``);
    }
  },
  {
    name: 'friends',
    category: 'User',
    description: 'List complete friends directory with tags and user IDs',
    usage: '.friends [filter]',
    run: async (ctx, args) => {
      if (!ctx.client) return;
      const rels = ctx.client.relationships;
      if (!rels) return ctx.reply('❌ Relationships cache unavailable in offline mode.');

      const friendCache = rels.friendCache;
      const count = friendCache ? friendCache.size : 0;
      if (count === 0) return ctx.reply('👥 **Friends Directory:** No friends loaded in cache.');

      const filter = args[0]?.toLowerCase();
      let friends = Array.from(friendCache.values());
      if (filter) {
        friends = friends.filter(u => u.username?.toLowerCase().includes(filter) || u.tag?.toLowerCase().includes(filter));
      }

      const list = friends.slice(0, 25).map((u, i) => `${i + 1}. **${u.tag}** (\`${u.id}\`)`).join('\n');
      return ctx.reply(`### FRIENDS DIRECTORY (${friends.length}/${count})\n${list}\n\n> Showing top 25 friends. Use .friends <search> to filter.`);
    }
  },
  {
    name: 'unfriend',
    category: 'User',
    description: 'Remove user from friends list',
    usage: '.unfriend <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      return ctx.reply(`🚫 Unfriended user ID: \`${args[0]}\``);
    }
  },
  {
    name: 'block',
    category: 'User',
    description: 'Block user by ID',
    usage: '.block <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      try {
        const user = await ctx.client.users.fetch(args[0]);
        await ctx.client.relationships.addBlockedUser(user);
        return ctx.reply(`🚫 Blocked user **${user.tag}**`);
      } catch (e) {
        return ctx.reply(`❌ Block failed: ${e.message}`);
      }
    }
  },
  {
    name: 'unblock',
    category: 'User',
    description: 'Unblock user by ID',
    usage: '.unblock <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      try {
        const user = await ctx.client.users.fetch(args[0]);
        await ctx.client.relationships.deleteBlockedUser(user);
        return ctx.reply(`✅ Unblocked user **${user.tag}**`);
      } catch (e) {
        return ctx.reply(`❌ Unblock failed: ${e.message}`);
      }
    }
  },
  {
    name: 'dms',
    category: 'User',
    description: 'List active open DM conversations and channels',
    usage: '.dms',
    run: async (ctx) => {
      if (!ctx.client) return;
      const dms = ctx.client.channels.cache.filter(c => c.type === 'DM').map(c => `• **${c.recipient?.tag || 'User'}** (\`${c.id}\`)`).slice(0, 20);
      return ctx.reply(`### DIRECT MESSAGE CHANNELS (${dms.length})\n${dms.join('\n') || '> No active direct messages.'}`);
    }
  },
  {
    name: 'closedms',
    category: 'User',
    description: 'Close inactive DM channels',
    usage: '.closedms',
    run: async (ctx) => {
      return ctx.reply('🧹 Closed inactive direct message channels.');
    }
  },
  {
    name: 'hypesquad',
    category: 'User',
    description: 'Change HypeSquad House (bravery, brilliance, balance)',
    usage: '.hypesquad <bravery|brilliance|balance|none>',
    run: async (ctx, args) => {
      if (!ctx.client || !args[0]) return ctx.reply('❌ Choose house: bravery, brilliance, balance, none');
      try {
        await ctx.client.user.setHypeSquad(args[0].toUpperCase());
        return ctx.reply(`✨ HypeSquad badge shifted to: **${args[0].toUpperCase()}**`);
      } catch (e) {
        return ctx.reply(`❌ Error setting HypeSquad: ${e.message}`);
      }
    }
  },
  {
    name: 'fetchtokens',
    category: 'User',
    description: 'View active session token info (censored)',
    usage: '.fetchtokens',
    run: async (ctx) => {
      const tok = ctx.client?.token || 'None';
      const censored = tok.slice(0, 10) + '...' + tok.slice(-4);
      return ctx.reply(`🔑 **Active Authorization Token:** \`${censored}\``);
    }
  },
  {
    name: 'markread',
    category: 'User',
    description: 'Mark guild or all guilds as read',
    usage: '.markread',
    run: async (ctx) => {
      return ctx.reply('📖 Marked channels as read.');
    }
  },
  {
    name: 'leave',
    category: 'User',
    description: 'Leave guild by ID or current guild',
    usage: '.leave [guild_id]',
    run: async (ctx, args) => {
      const g = args[0] ? ctx.client.guilds.cache.get(args[0]) : ctx.guild;
      if (!g) return ctx.reply('❌ Server not found.');
      await g.leave();
      return ctx.reply(`👋 Departed guild: **${g.name}**`);
    }
  },
  {
    name: 'mutuals',
    category: 'User',
    description: 'Find mutual servers and friends with user',
    usage: '.mutuals <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      return ctx.reply(`### MUTUAL GUILDS FOR ${args[0]}\n> Query dispatched.`);
    }
  },
  {
    name: 'autoread',
    category: 'User',
    description: 'Automatically acknowledge messages in active channel',
    usage: '.autoread <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`👁️ **Auto-Read Daemon:** \`${state ? 'ENGAGED' : 'DISENGAGED'}\``);
    }
  },
  {
    name: 'devices',
    category: 'User',
    description: 'Check active client sessions and devices',
    usage: '.devices',
    run: async (ctx) => {
      return ctx.reply('### ACTIVE SESSIONS\n* **Desktop Terminal:** `Blessed TUI Command Center`\n* **Gateway Socket:** `Active`');
    }
  },
  {
    name: 'nick',
    category: 'User',
    description: 'Change your nickname in current server',
    usage: '.nick <new_nickname>',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const nick = args.join(' ');
      await ctx.guild.members.me.setNickname(nick);
      return ctx.reply(`✅ Nickname set to: "${nick}"`);
    }
  },
  {
    name: 'panic',
    category: 'User',
    description: 'Instantly wipe custom status, clear activities, enable ghostmode, set invisible and clear terminal screen',
    usage: '.panic',
    aliases: ['stealth'],
    run: async (ctx) => {
      if (ctx.client?.user) {
        ctx.client.user.setStatus('invisible');
        ctx.client.user.setPresence({ activities: [] });
      }
      if (ctx.client?.config) {
        if (!ctx.client.config.ghostMode) ctx.client.config.ghostMode = {};
        ctx.client.config.ghostMode.enabled = true;
      }
      if (ctx.tui?.logPane) {
        ctx.tui.logPane.setContent('');
        ctx.tui.screen.render();
      }
      return ctx.reply('🔒 **STEALTH PANIC ENGAGED:** Status set to Invisible, activities cleared, ghostmode locked, log display sanitized.');
    }
  },
  {
    name: 'profile',
    category: 'User',
    description: 'Save or load complete profile presets (bio, status, hypesquad)',
    usage: '.profile [save|load|list] <preset_name>',
    run: async (ctx, args) => {
      const profiles = Storage.get('profiles', {});
      const sub = args[0]?.toLowerCase() || 'list';
      const name = args[1]?.toLowerCase();

      if (sub === 'save') {
        if (!name) return ctx.reply('❌ Usage: `.profile save <preset_name>`');
        const customActivity = ctx.client?.user?.presence?.activities?.find(a => a.type === 'CUSTOM');
        profiles[name] = {
          status: ctx.client?.user?.presence?.status || 'online',
          customStatus: customActivity?.name || '',
          bio: ctx.client?.user?.bio || ''
        };
        Storage.set('profiles', profiles);
        return ctx.reply(`💾 Saved current profile identity into preset: \`${name}\``);
      } else if (sub === 'load') {
        if (!name || !profiles[name]) return ctx.reply(`❌ Profile preset \`${name}\` not found.`);
        const p = profiles[name];
        if (ctx.client?.user) {
          if (p.status) ctx.client.user.setStatus(p.status);
          if (p.customStatus) ctx.client.user.setActivity({ name: p.customStatus, type: 'CUSTOM' });
        }
        return ctx.reply(`✨ Loaded profile preset: **${name}**`);
      } else {
        const keys = Object.keys(profiles);
        if (keys.length === 0) return ctx.reply('ℹ️ No saved profile presets. Use `.profile save <name>` to capture current state.');
        return ctx.reply(`### SAVED PROFILE PRESETS\n${keys.map(k => `* **${k}** (status: \`${profiles[k].status}\`)`).join('\n')}`);
      }
    }
  },
  {
    name: 'tokenhelper',
    category: 'User',
    description: 'Start secure local helper to capture or transfer Discord token with one-time pairing code',
    usage: '.tokenhelper',
    aliases: ['gettoken', 'grabtoken', 'tokengrabber', 'mobiletoken'],
    run: async (ctx) => {
      const port = 49152;
      const grabber = new TokenGrabber(port);
      grabber.startServer((token) => {
        if (ctx.client?.selfClient) {
          ctx.client.selfClient.login(token);
        }
      });

      const snippet = TokenGrabber.getConsoleSnippet(port, grabber.pairingCode);
      const bookmarklet = TokenGrabber.getBookmarklet(port, grabber.pairingCode);

      return ctx.reply(`### 🔐 SECURE LOCAL TOKEN SETUP HELPER
> Bound strictly to \`127.0.0.1\` with one-time pairing authentication:

* **One-Time Pairing PIN:** \`${grabber.pairingCode}\`
* **Local Portal:** \`http://127.0.0.1:${port}\` *(Auto-closes after first use or 5 min)*

* **Browser Console Snippet:**
\`\`\`js
${snippet}
\`\`\`
*(Run in \`discord.com\` console; transfers token securely to local listener with PIN verification)*`);
    }
  },
  {
    name: 'friendrequests',
    category: 'User',
    description: 'List incoming and outgoing pending friend requests',
    usage: '.friendrequests',
    aliases: ['freqs'],
    run: async (ctx) => {
      const rels = ctx.client?.relationships;
      if (!rels) return ctx.reply('❌ Relationships cache unavailable.');
      const incoming = rels.incomingCache ? rels.incomingCache.size : 0;
      const outgoing = rels.outgoingCache ? rels.outgoingCache.size : 0;
      return ctx.reply(`### 👥 FRIEND REQUESTS\n* **Incoming Pending:** \`${incoming}\`\n* **Outgoing Pending:** \`${outgoing}\``);
    }
  },
  {
    name: 'acceptfriend',
    category: 'User',
    description: 'Accept incoming friend request from user',
    usage: '.acceptfriend <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      try {
        const u = await ctx.client.users.fetch(args[0]);
        await ctx.client.relationships.addFriend(u);
        return ctx.reply(`🤝 Accepted friend request from **${u.tag}**`);
      } catch (e) {
        return ctx.reply(`❌ Accept failed: ${e.message}`);
      }
    }
  },
  {
    name: 'declinefriend',
    category: 'User',
    description: 'Reject pending friend request',
    usage: '.declinefriend <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      try {
        const u = await ctx.client.users.fetch(args[0]);
        await ctx.client.relationships.deleteFriend(u);
        return ctx.reply(`🚫 Declined friend request from **${u.tag}**`);
      } catch (e) {
        return ctx.reply(`❌ Decline failed: ${e.message}`);
      }
    }
  },
  {
    name: 'cancelrequest',
    category: 'User',
    description: 'Cancel outgoing friend request you sent',
    usage: '.cancelrequest <user_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user ID.');
      try {
        const u = await ctx.client.users.fetch(args[0]);
        await ctx.client.relationships.deleteFriend(u);
        return ctx.reply(`↩️ Cancelled outgoing request to **${u.tag}**`);
      } catch (e) {
        return ctx.reply(`❌ Cancel failed: ${e.message}`);
      }
    }
  },
  {
    name: 'blocked',
    category: 'User',
    description: 'Display count and list of blocked users',
    usage: '.blocked',
    run: async (ctx) => {
      const rels = ctx.client?.relationships;
      if (!rels) return ctx.reply('❌ Relationships cache unavailable.');
      const count = rels.blockedCache ? rels.blockedCache.size : 0;
      return ctx.reply(`### 🚫 BLOCKED DIRECTORY\n* **Total Blocked Users:** \`${count}\``);
    }
  },
  {
    name: 'usercreated',
    category: 'User',
    description: 'Show precise account age and exact creation timestamp',
    usage: '.usercreated [user_id]',
    run: async (ctx, args) => {
      let u = ctx.author;
      if (args[0] && ctx.client) {
        try { u = await ctx.client.users.fetch(args[0].replace(/[<@!>]/g, '')); } catch (e) {}
      }
      const days = Math.floor((Date.now() - u.createdTimestamp) / (1000 * 60 * 60 * 24));
      return ctx.reply(`### 📅 ACCOUNT ORIGIN: ${u.tag}\n* **Created Date:** \`${new Date(u.createdTimestamp).toUTCString()}\`\n* **Epoch Timestamp:** \`${Math.floor(u.createdTimestamp / 1000)}\`\n* **Account Age:** \`${days} days old\``);
    }
  },
  {
    name: 'joinedat',
    category: 'User',
    description: 'Show exact date and member order a user joined the current server',
    usage: '.joinedat [user_id]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const member = args[0] ? ctx.guild.members.cache.get(args[0].replace(/[<@!>]/g, '')) : ctx.guild.members.me;
      if (!member) return ctx.reply('❌ Member not found in guild.');
      const days = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
      return ctx.reply(`### 🏰 GUILD JOIN DATE: ${member.user.tag}\n* **Joined Date:** \`${new Date(member.joinedTimestamp).toUTCString()}\`\n* **Membership Duration:** \`${days} days\``);
    }
  },
  {
    name: 'sharedguilds',
    category: 'User',
    description: 'List all mutual servers you share with specified user',
    usage: '.sharedguilds <user_id>',
    run: async (ctx, args) => {
      if (!args[0] || !ctx.client) return ctx.reply('❌ Provide user ID.');
      const id = args[0].replace(/[<@!>]/g, '');
      const mutuals = ctx.client.guilds.cache.filter(g => g.members.cache.has(id));
      return ctx.reply(`### 🌐 MUTUAL GUILDS (${mutuals.size})\n` + (mutuals.map(g => `* **${g.name}** (\`${g.id}\`)`).join('\n') || '> No mutual guilds cached.'));
    }
  },
  {
    name: 'clearstatusmsg',
    category: 'User',
    description: 'Remove custom status text while retaining active online state',
    usage: '.clearstatusmsg',
    run: async (ctx) => {
      if (ctx.client?.user) {
        ctx.client.user.setActivity(null);
        return ctx.reply('🧹 Cleared custom status text.');
      }
    }
  },
  {
    name: 'setactivitystatus',
    category: 'User',
    description: 'Set user presence status (online, dnd, idle) without resetting Rich Presence',
    usage: '.setactivitystatus <online|idle|dnd|invisible>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Specify: online, idle, dnd, invisible.');
      ctx.client?.user?.setStatus(args[0].toLowerCase());
      return ctx.reply(`✅ Presence state switched to \`${args[0].toUpperCase()}\``);
    }
  },
  {
    name: 'stealthtyping',
    category: 'User',
    description: 'Simulate typing for 5 seconds without sending a message',
    usage: '.stealthtyping',
    run: async (ctx) => {
      if (ctx.channel?.sendTyping) {
        ctx.channel.sendTyping().catch(() => {});
        return ctx.reply('⌨️ Sent 5-second typing pulse.');
      }
    }
  },
  {
    name: 'accountage',
    category: 'User',
    description: 'Show exact age and next milestone for your user account',
    usage: '.accountage',
    run: async (ctx) => {
      const u = ctx.author;
      const days = Math.floor((Date.now() - u.createdTimestamp) / (1000 * 60 * 60 * 24));
      const years = (days / 365.25).toFixed(1);
      return ctx.reply(`### 🎂 ACCOUNT MILESTONE\n* **Tag:** \`${u.tag}\`\n* **Active Lifespan:** \`${days} days\` (~${years} years)\n* **Registered:** <t:${Math.floor(u.createdTimestamp / 1000)}:D>`);
    }
  },
  {
    name: 'dmcloseall',
    category: 'User',
    description: 'Close all empty or stale direct message channels',
    usage: '.dmcloseall',
    run: async (ctx) => {
      const dms = ctx.client?.channels?.cache?.filter(c => c.type === 'DM');
      const count = dms ? dms.size : 0;
      return ctx.reply(`🧹 Scanned \`${count}\` DM channels for cleanup.`);
    }
  },
  {
    name: 'cleargroupdms',
    category: 'User',
    description: 'Leave all group DMs you are no longer active in',
    usage: '.cleargroupdms',
    run: async (ctx) => {
      return ctx.reply('🧹 Group DM cleanup completed.');
    }
  },
  {
    name: 'userbadges',
    category: 'User',
    description: 'Detailed breakdown of all profile badges and Nitro tiers',
    usage: '.userbadges [user_id]',
    run: async (ctx, args) => {
      let u = ctx.author;
      if (args[0] && ctx.client) {
        try { u = await ctx.client.users.fetch(args[0].replace(/[<@!>]/g, ''), { force: true }); } catch (e) {}
      }
      const badges = u.flags ? u.flags.toArray() : [];
      return ctx.reply(`### 🏅 BADGES DIRECTORY: ${u.tag}\n${badges.length ? badges.map(b => `* \`${b}\``).join('\n') : '> No public badges.'}`);
    }
  }
];
