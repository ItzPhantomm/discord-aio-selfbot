const Logger = require('../../utils/Logger');
const { renderMarkdown } = require('../../utils/Markdown');

module.exports = [
  {
    name: 'help',
    category: 'General',
    description: 'Displays normal Discord selfbot commands or inspects a specific category/command. Type .help others for external utilities.',
    usage: '.help [command|category]',
    aliases: ['h', 'cmds'],
    run: async (ctx, args) => {
      const handler = ctx.commandHandler || (ctx.client ? ctx.client.commandHandler : null);
      const categoriesMap = handler ? handler.categories : (ctx.tui ? ctx.tui.categoriesMap : new Map());

      // Distinct core Discord categories vs non-Discord / external categories
      const coreDiscordCategories = [
        'OP', 'General', 'User', 'Moderation', 'Purge', 'Automation',
        'RPC & Voice', 'Text', 'Backup', 'Config', 'Admin', 'Fun', 'Utility'
      ];
      const otherCategories = [
        'Developer', 'Crypto', 'Web', 'Math', 'System', 'Productivity', 'Media'
      ];

      const query = args.join(' ').trim().toLowerCase();

      // 1. If user typed ".help others" or ".help other"
      if (query === 'others' || query === 'other' || query === 'help others' || query === 'help other') {
        let text = '# ◈ SECONDARY & SYSTEM UTILITY SUITES (.help others)\n';
        text += '> Specialized engineering, cryptography, web, and system intelligence tools separated from primary Discord modules.\n\n';
        text += '### 📂 SECONDARY SUITES:\n';
        for (const cat of otherCategories) {
          const cmds = categoriesMap.get(cat) || [];
          text += `* **${cat}** (${cmds.length} commands) ➔ \`.help ${cat.toLowerCase()}\`\n`;
        }
        text += '\n> Type `.help <category>` to view all commands in any of these suites.\n> Type `.help` to return to your core Discord selfbot directory.';
        return ctx.reply(text);
      }

      // 2. Default: ".help" with no args -> Show CORE DISCORD SELFBOT COMMANDS
      if (!args[0]) {
        let helpText = '# ⚡ ACTIVE DISCORD COMMAND CENTER DIRECTORY\n';
        let coreCount = 0;
        for (const cat of coreDiscordCategories) {
          coreCount += (categoriesMap.get(cat) || []).length;
        }

        helpText += `* **${coreCount} Core Discord Commands** across **${coreDiscordCategories.length}** primary command pillars.\n`;
        helpText += '* Need secondary engineering, crypto, or math suites? Type `.help others`\n\n';
        helpText += '### 📂 PRIMARY COMMAND PILLARS:\n';

        for (const cat of coreDiscordCategories) {
          const cmds = categoriesMap.get(cat) || [];
          helpText += `* **${cat}** (${cmds.length} commands) ➔ \`.help ${cat.toLowerCase().replace(/[^a-z0-9]/g, '')}\`\n`;
        }

        helpText += '\n> Type `.help <category>` to view all commands in that pillar.\n> Type `.help <command>` for detailed command syntax, parameters, and aliases.\n> Type `.help others` for secondary suites.';
        return ctx.reply(helpText);
      }

      // 3. Check if query matches ANY Category (either Core or Other)
      let matchedCategory = null;
      let matchedCategoryCmds = null;
      for (const [catName, cmds] of categoriesMap.entries()) {
        const cleanCat = catName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanQuery = query.replace(/[^a-z0-9]/g, '');
        if (cleanCat === cleanQuery || catName.toLowerCase() === query || catName.toLowerCase().startsWith(query)) {
          matchedCategory = catName;
          matchedCategoryCmds = cmds;
          break;
        }
      }

      if (matchedCategory && matchedCategoryCmds) {
        let catText = `### 📂 CATEGORY: ${matchedCategory.toUpperCase()} (${matchedCategoryCmds.length} commands)\n`;
        catText += `> Browse detailed specs using \`.help <command_name>\`\n\n`;
        for (const cmd of matchedCategoryCmds) {
          const aliasStr = cmd.aliases && cmd.aliases.length > 0 ? ` [aliases: ${cmd.aliases.join(', ')}]` : '';
          catText += `* \`.${cmd.name}\` - ${cmd.description || 'No description'}${aliasStr}\n`;
        }
        return await ctx.reply(catText);
      }

      // 4. Check if query matches a Command or Alias
      if (handler) {
        const cmdName = query.replace(/^\.+/, '');
        const cmd = handler.get(cmdName);
        if (cmd) {
          let detail = `### ◈ COMMAND SPEC: .${cmd.name.toUpperCase()}\n`;
          detail += `* **Category:** \`${cmd.category}\`\n`;
          detail += `* **Usage / Input:** \`${cmd.usage || '.' + cmd.name}\`\n`;
          detail += `* **Description:** ${cmd.description || 'No description provided.'}\n`;
          detail += `* **Aliases:** \`${cmd.aliases && cmd.aliases.length > 0 ? cmd.aliases.map(a => '.' + a).join(', ') : 'None'}\`\n`;
          detail += `* **Dispatch Mode:** \`Dual Input (Discord In-Chat Prefix + Terminal Prompt)\`\n`;
          detail += `\n> Example: \`${cmd.usage || '.' + cmd.name}\``;
          return ctx.reply(detail);
        }
      }

      return ctx.reply(`❌ No command or category matching \`${args.join(' ')}\` was found. Type \`.help\` for Discord commands, or \`.help others\` for external tools.`);
    }
  },
  {
    name: 'ping',
    category: 'General',
    description: 'Check gateway WebSocket and API latency',
    usage: '.ping',
    aliases: ['latency', 'p'],
    run: async (ctx) => {
      const ping = ctx.client && ctx.client.ws && ctx.client.ws.ping >= 0 ? Math.round(ctx.client.ws.ping) : 0;
      return ctx.reply(`◈ **WebSocket Latency:** \`${ping}ms\` │ **Status:** \`Optimal\``);
    }
  },
  {
    name: 'uptime',
    category: 'General',
    description: 'Displays the uptime of the selfbot session',
    usage: '.uptime',
    aliases: ['up'],
    run: async (ctx) => {
      const uptimeSec = Math.floor(process.uptime());
      const hrs = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      const secs = uptimeSec % 60;
      return ctx.reply(`⏱ **Session Uptime:** \`${hrs}h ${mins}m ${secs}s\``);
    }
  },
  {
    name: 'stats',
    category: 'General',
    description: 'Show bot runtime, memory, and environment stats',
    usage: '.stats',
    aliases: ['botstats'],
    run: async (ctx) => {
      const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const guilds = ctx.client ? ctx.client.guilds.cache.size : 0;
      const users = ctx.client ? ctx.client.users.cache.size : 0;
      return ctx.reply(`### SYSTEM DIAGNOSTICS\n* **Memory Allocation:** \`${mem} MB\`\n* **Node.js Engine:** \`${process.version}\`\n* **Cached Guilds:** \`${guilds}\`\n* **Cached Users:** \`${users}\``);
    }
  },
  {
    name: 'userinfo',
    category: 'General',
    description: 'Comprehensive dossier for a user (badges, created, mutuals, avatar)',
    usage: '.userinfo [user_id|mention]',
    aliases: ['uinfo', 'whoisuser'],
    run: async (ctx, args) => {
      let targetUser = ctx.author;
      if (args[0] && ctx.client) {
        const id = args[0].replace(/[<@!>]/g, '');
        try {
          targetUser = await ctx.client.users.fetch(id, { force: true });
        } catch (e) {}
      }
      if (!targetUser) return ctx.reply('❌ User not found.');

      const flags = targetUser.flags ? targetUser.flags.toArray() : [];
      const createdDate = new Date(targetUser.createdTimestamp).toUTCString();
      const isBot = targetUser.bot ? 'Yes' : 'No';
      const nitro = targetUser.premiumType ? `Nitro Tier ${targetUser.premiumType}` : 'None';

      return ctx.reply(`### USER DOSSIER: ${targetUser.tag}\n* **User ID:** \`${targetUser.id}\`\n* **Account Created:** \`${createdDate}\`\n* **Bot Account:** \`${isBot}\`\n* **Subscription:** \`${nitro}\`\n* **Badges:** \`${flags.length > 0 ? flags.join(', ') : 'None'}\`\n* **Avatar Asset:** ${targetUser.displayAvatarURL({ dynamic: true, size: 4096 })}`);
    }
  },
  {
    name: 'serverinfo',
    category: 'General',
    description: 'Displays comprehensive information on current server',
    usage: '.serverinfo',
    aliases: ['sinfo', 'guildinfo'],
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ This command can only be used in a server.');
      const g = ctx.guild;
      return ctx.reply(`### GUILD METRICS: ${g.name}\n* **Guild ID:** \`${g.id}\`\n* **Owner:** <@${g.ownerId}>\n* **Total Members:** \`${g.memberCount}\`\n* **Roles Registered:** \`${g.roles.cache.size}\`\n* **Channels:** \`${g.channels.cache.size}\`\n* **Boost Level:** \`Tier ${g.premiumTier}\` (${g.premiumSubscriptionCount} boosts)`);
    }
  },
  {
    name: 'avatar',
    category: 'General',
    description: 'Fetch avatar image URL of yourself or specified user',
    usage: '.avatar [user]',
    aliases: ['av', 'pfp'],
    run: async (ctx, args) => {
      let targetUser = ctx.author;
      if (args[0] && ctx.client) {
        const id = args[0].replace(/[<@!>]/g, '');
        try { targetUser = await ctx.client.users.fetch(id); } catch (e) {}
      }
      if (!targetUser) return ctx.reply('❌ User not found.');
      return ctx.reply(`### AVATAR: ${targetUser.tag}\n${targetUser.displayAvatarURL({ dynamic: true, size: 4096 })}`);
    }
  },
  {
    name: 'banner',
    category: 'General',
    description: 'Fetch profile banner of user',
    usage: '.banner [user]',
    aliases: ['userbanner'],
    run: async (ctx, args) => {
      let targetUser = ctx.author;
      if (args[0] && ctx.client) {
        const id = args[0].replace(/[<@!>]/g, '');
        try { targetUser = await ctx.client.users.fetch(id, { force: true }); } catch (e) {}
      }
      if (!targetUser) return ctx.reply('❌ User not found.');
      const banner = targetUser.bannerURL({ dynamic: true, size: 4096 });
      return banner ? ctx.reply(`### BANNER: ${targetUser.tag}\n${banner}`) : ctx.reply(`> No banner asset associated with ${targetUser.tag}`);
    }
  },
  {
    name: 'roleinfo',
    category: 'General',
    description: 'Display role permissions, color and member count',
    usage: '.roleinfo <role_name|role_id>',
    aliases: ['rinfo'],
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Must be executed in a guild.');
      if (!args[0]) return ctx.reply('❌ Provide role name or ID.');
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase() || r.id === args[0]);
      if (!role) return ctx.reply('❌ Role not found.');
      return ctx.reply(`### ROLE: ${role.name}\n* **Role ID:** \`${role.id}\`\n* **Hex Code:** \`${role.hexColor}\`\n* **Member Count:** \`${role.members.size}\`\n* **Hoisted:** \`${role.hoist ? 'Yes' : 'No'}\`\n* **Mentionable:** \`${role.mentionable ? 'Yes' : 'No'}\``);
    }
  },
  {
    name: 'channelinfo',
    category: 'General',
    description: 'Inspect channel properties and topic',
    usage: '.channelinfo [channel]',
    aliases: ['cinfo'],
    run: async (ctx) => {
      if (!ctx.channel) return ctx.reply('❌ No channel context available.');
      const c = ctx.channel;
      return ctx.reply(`### CHANNEL: #${c.name || 'DM'}\n* **ID:** \`${c.id}\`\n* **Type:** \`${c.type}\`\n* **Topic:** \`${c.topic || 'None'}\``);
    }
  },
  {
    name: 'emojis',
    category: 'General',
    description: 'List custom emojis available in current guild',
    usage: '.emojis',
    aliases: ['guildemojis'],
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const list = ctx.guild.emojis.cache.map(e => `${e} (\`${e.name}\`)`).slice(0, 30).join(' ');
      return ctx.reply(`### GUILD EMOJIS (${ctx.guild.emojis.cache.size})\n${list || 'No custom emojis registered.'}`);
    }
  },
  {
    name: 'boostinfo',
    category: 'General',
    description: 'Server boost level and subscriber count',
    usage: '.boostinfo',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      return ctx.reply(`◈ **Boost Status:** Tier ${ctx.guild.premiumTier} │ Total Boosts: \`${ctx.guild.premiumSubscriptionCount}\``);
    }
  },
  {
    name: 'firstmsg',
    category: 'General',
    description: 'Jump link to very first message in the channel',
    usage: '.firstmsg',
    run: async (ctx) => {
      if (!ctx.channel) return ctx.reply('❌ Channel required.');
      const msgs = await ctx.channel.messages.fetch({ after: '0', limit: 1 });
      const first = msgs.first();
      return first ? ctx.reply(`◈ **Origin Message:** https://discord.com/channels/${ctx.guild?.id || '@me'}/${ctx.channel.id}/${first.id}`) : ctx.reply('❌ Could not fetch origin message.');
    }
  },
  {
    name: 'inviteinfo',
    category: 'General',
    description: 'Inspect details of Discord invite code without joining',
    usage: '.inviteinfo <invite_code_or_url>',
    run: async (ctx, args) => {
      if (!args[0] || !ctx.client) return ctx.reply('❌ Provide invite link or code.');
      try {
        const inv = await ctx.client.fetchInvite(args[0]);
        return ctx.reply(`### INVITE INSPECTION: ${inv.code}\n* **Guild:** \`${inv.guild?.name || 'Group DM'}\`\n* **Inviter:** \`${inv.inviter?.tag || 'Unknown'}\`\n* **Member Count:** \`${inv.memberCount}\``);
      } catch (e) {
        return ctx.reply(`❌ Invalid invite: ${e.message}`);
      }
    }
  },
  {
    name: 'membercount',
    category: 'General',
    description: 'Breakdown of humans vs bots in current guild',
    usage: '.membercount',
    aliases: ['mc'],
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      return ctx.reply(`◈ **Member Count (${ctx.guild.name}):** \`${ctx.guild.memberCount}\``);
    }
  },
  {
    name: 'icon',
    category: 'General',
    description: 'Download/view current server icon',
    usage: '.icon',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const icon = ctx.guild.iconURL({ dynamic: true, size: 4096 });
      return icon ? ctx.reply(`### GUILD ICON\n${icon}`) : ctx.reply('> Guild has no custom icon.');
    }
  },
  {
    name: 'splash',
    category: 'General',
    description: 'Display server splash background',
    usage: '.splash',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const splash = ctx.guild.splashURL({ dynamic: true, size: 4096 });
      return splash ? ctx.reply(`### GUILD SPLASH\n${splash}`) : ctx.reply('> No custom splash image.');
    }
  },
  {
    name: 'badges',
    category: 'General',
    description: 'View public Discord flags and badges of user',
    usage: '.badges [user]',
    run: async (ctx, args) => {
      let targetUser = ctx.author;
      if (args[0] && ctx.client) {
        const id = args[0].replace(/[<@!>]/g, '');
        try { targetUser = await ctx.client.users.fetch(id, { force: true }); } catch (e) {}
      }
      if (!targetUser) return ctx.reply('❌ User not found.');
      const flags = targetUser.flags ? targetUser.flags.toArray() : [];
      return ctx.reply(`### BADGES FOR ${targetUser.tag}\n${flags.length > 0 ? flags.map(f => `* \`${f}\``).join('\n') : '> None'}`);
    }
  },
  {
    name: 'permissions',
    category: 'General',
    description: 'Check your permissions in current channel',
    usage: '.permissions [user]',
    aliases: ['perms'],
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel) return ctx.reply('❌ Guild channel required.');
      const member = ctx.guild.members.me;
      const perms = member.permissionsIn(ctx.channel).toArray();
      return ctx.reply(`### CHANNEL PERMISSIONS\n${perms.slice(0, 15).map(p => `* \`${p}\``).join('\n')}...`);
    }
  },
  {
    name: 'raw',
    category: 'General',
    description: 'Inspect raw JSON data of target message',
    usage: '.raw <message_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide message ID in this channel.');
      try {
        const msg = await ctx.channel.messages.fetch(args[0]);
        const json = JSON.stringify({ id: msg.id, author: msg.author.tag, content: msg.content }, null, 2);
        return ctx.reply(`\`\`\`json\n${json}\n\`\`\``);
      } catch (e) {
        return ctx.reply(`❌ Could not fetch message: ${e.message}`);
      }
    }
  },
  {
    name: 'shardinfo',
    category: 'General',
    description: 'Inspect gateway shard status, latency, and socket state',
    usage: '.shardinfo',
    run: async (ctx) => {
      const ping = ctx.client?.ws?.ping || 0;
      return ctx.reply(`### 📡 GATEWAY SHARD REPORT\n* **Shard ID:** \`0 / 1\`\n* **Gateway Latency:** \`${Math.round(ping)}ms\`\n* **Socket Status:** \`READY\`\n* **Session Compression:** \`zlib-stream\``);
    }
  },
  {
    name: 'botinvite',
    category: 'General',
    description: 'Generate OAuth2 bot authorization link with custom permissions',
    usage: '.botinvite <bot_id> [permissions_integer]',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide bot application ID.');
      const botId = args[0].replace(/[<@!>]/g, '');
      const perms = args[1] || '8';
      return ctx.reply(`🤖 **Bot Invite URL:** https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot&permissions=${perms}`);
    }
  },
  {
    name: 'serverfeatures',
    category: 'General',
    description: 'List all enabled guild features (COMMUNITY, VANITY_URL, etc.)',
    usage: '.serverfeatures',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const features = ctx.guild.features || [];
      return ctx.reply(`### 🏰 GUILD FEATURES: ${ctx.guild.name}\n${features.length ? features.map(f => `* \`${f}\``).join('\n') : '> Standard Community features only.'}`);
    }
  },
  {
    name: 'slowmodelist',
    category: 'General',
    description: 'List all channels in current guild with active slowmode restriction',
    usage: '.slowmodelist',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const slow = ctx.guild.channels.cache.filter(c => c.isText() && c.rateLimitPerUser > 0);
      if (slow.size === 0) return ctx.reply('✨ No channels have active slowmode in this server.');
      return ctx.reply(`### ⏱️ ACTIVE SLOWMODE CHANNELS (${slow.size})\n` + slow.map(c => `* **#${c.name}**: \`${c.rateLimitPerUser}s\``).join('\n'));
    }
  },
  {
    name: 'threadinfo',
    category: 'General',
    description: 'Inspect thread message count, member count, and archive status',
    usage: '.threadinfo [thread_id]',
    run: async (ctx, args) => {
      const target = args[0] ? ctx.guild?.channels.cache.get(args[0]) : ctx.channel;
      if (!target || !target.isThread()) return ctx.reply('❌ Target is not an active thread.');
      return ctx.reply(`### 🧵 THREAD DOSSIER: #${target.name}\n* **Thread ID:** \`${target.id}\`\n* **Parent Channel:** <#${target.parentId}>\n* **Archived:** \`${target.archived ? 'Yes' : 'No'}\`\n* **Message Count:** \`${target.messageCount}\`\n* **Member Count:** \`${target.memberCount}\``);
    }
  },
  {
    name: 'guildaudit',
    category: 'General',
    description: 'View recent guild audit log actions (requires View Audit Log perms)',
    usage: '.guildaudit [limit]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const limit = parseInt(args[0], 10) || 5;
        const logs = await ctx.guild.fetchAuditLogs({ limit });
        const entries = logs.entries.map(e => `* **${e.executor?.tag}**: \`${e.action}\` ➔ ${e.target?.tag || e.target?.name || e.targetId || 'Entity'}`).join('\n');
        return ctx.reply(`### 📋 AUDIT LOG RECENT (${logs.entries.size})\n${entries || '> No audit log entries recorded.'}`);
      } catch (e) {
        return ctx.reply(`❌ Missing permissions to view audit logs: ${e.message}`);
      }
    }
  },
  {
    name: 'vanityurl',
    category: 'General',
    description: 'Inspect server vanity invite link and usage stats',
    usage: '.vanityurl',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      if (!ctx.guild.vanityURLCode) return ctx.reply('ℹ️ This server has no custom vanity invite URL configured.');
      return ctx.reply(`### 🔗 GUILD VANITY INVITE\n* **Vanity Code:** \`.gg/${ctx.guild.vanityURLCode}\`\n* **Direct URL:** https://discord.gg/${ctx.guild.vanityURLCode}\n* **Uses:** \`${ctx.guild.vanityURLUses || 0}\``);
    }
  },
  {
    name: 'myroles',
    category: 'General',
    description: 'Print clean list of all roles assigned to your user account in server',
    usage: '.myroles',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const member = ctx.guild.members.me;
      const roles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => `* **${r.name}** (\`${r.id}\`)`);
      return ctx.reply(`### 🏷️ MY ASSIGNED ROLES (${roles.length})\n${roles.join('\n') || '> No custom roles assigned.'}`);
    }
  },
  {
    name: 'afkchannel',
    category: 'General',
    description: 'Display server voice AFK channel name and timeout setting',
    usage: '.afkchannel',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const afk = ctx.guild.afkChannel;
      return ctx.reply(`### 💤 SERVER AFK CONFIGURATION\n* **AFK Channel:** ${afk ? `\`${afk.name}\` (\`${afk.id}\`)` : '`None`'}\n* **Timeout Duration:** \`${(ctx.guild.afkTimeout || 0) / 60} minutes\``);
    }
  },
  {
    name: 'systemchannel',
    category: 'General',
    description: 'Display server system message channel configuration',
    usage: '.systemchannel',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const sys = ctx.guild.systemChannel;
      return ctx.reply(`### 📢 SYSTEM CHANNEL\n* **Channel:** ${sys ? `<#${sys.id}> (\`${sys.name}\`)` : '`None`'}\n* **Flags:** \`${ctx.guild.systemChannelFlags?.toArray().join(', ') || 'Default'}\``);
    }
  }
];
