/**
 * Discord Server Reconnaissance & Member Intelligence
 */

module.exports = [
  {
    name: 'oldestmembers',
    category: 'General',
    description: 'List members in current server with the oldest Discord account creation dates',
    usage: '.oldestmembers [limit]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const limit = Math.min(parseInt(args[0], 10) || 10, 25);
      const members = Array.from(ctx.guild.members.cache.values())
        .sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp)
        .slice(0, limit);

      const rows = members.map((m, i) => `${i + 1}. **${m.user.tag}** (\`${m.id}\`) - Created: <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>`);
      return ctx.reply(`### 👴 OLDEST ACCOUNTS IN ${ctx.guild.name}\n${rows.join('\n')}`);
    }
  },
  {
    name: 'youngestmembers',
    category: 'General',
    description: 'List members in current server with the newest Discord accounts (useful for spotting alts/raids)',
    usage: '.youngestmembers [limit]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const limit = Math.min(parseInt(args[0], 10) || 10, 25);
      const members = Array.from(ctx.guild.members.cache.values())
        .sort((a, b) => b.user.createdTimestamp - a.user.createdTimestamp)
        .slice(0, limit);

      const rows = members.map((m, i) => `${i + 1}. **${m.user.tag}** (\`${m.id}\`) - Created: <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>`);
      return ctx.reply(`### 🐣 NEWEST ACCOUNTS IN ${ctx.guild.name}\n${rows.join('\n')}`);
    }
  },
  {
    name: 'recentjoins',
    category: 'General',
    description: 'List the members who most recently joined the current server',
    usage: '.recentjoins [limit]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const limit = Math.min(parseInt(args[0], 10) || 10, 25);
      const members = Array.from(ctx.guild.members.cache.values())
        .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
        .slice(0, limit);

      const rows = members.map((m, i) => `${i + 1}. **${m.user.tag}** - Joined: <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`);
      return ctx.reply(`### 🚪 RECENT JOINS: ${ctx.guild.name}\n${rows.join('\n')}`);
    }
  },
  {
    name: 'memberid',
    category: 'General',
    description: 'Resolve user mention or username/tag into snowflake ID',
    usage: '.memberid <@user_or_username>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user mention or username.');
      let targetUser = null;
      const mentionMatch = args[0].match(/<@!?([0-9]+)>/);
      if (mentionMatch) {
        targetUser = ctx.client.users.cache.get(mentionMatch[1]);
      } else if (ctx.guild) {
        const query = args.join(' ').toLowerCase();
        const member = ctx.guild.members.cache.find(m => m.user.tag.toLowerCase().includes(query) || m.displayName.toLowerCase().includes(query));
        targetUser = member?.user;
      }
      if (!targetUser) return ctx.reply('❌ Member not found in cache.');
      return ctx.reply(`👤 **${targetUser.tag}** ➔ Snowflake ID: \`${targetUser.id}\``);
    }
  },
  {
    name: 'channelid',
    category: 'General',
    description: 'Extract snowflake ID of specified channel (or active channel)',
    usage: '.channelid [#channel_or_name]',
    run: async (ctx, args) => {
      let targetCh = ctx.channel;
      if (args[0] && ctx.guild) {
        const mention = args[0].match(/<#([0-9]+)>/);
        if (mention) {
          targetCh = ctx.guild.channels.cache.get(mention[1]);
        } else {
          const query = args.join(' ').toLowerCase();
          targetCh = ctx.guild.channels.cache.find(c => c.name.toLowerCase() === query);
        }
      }
      if (!targetCh) return ctx.reply('❌ Channel not found.');
      return ctx.reply(`📺 **#${targetCh.name || 'DM'}** ➔ Snowflake ID: \`${targetCh.id}\``);
    }
  },
  {
    name: 'roleid',
    category: 'General',
    description: 'Resolve role name or mention into snowflake ID',
    usage: '.roleid <@role_or_name>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Guild and role name required.');
      const mention = args[0].match(/<@&([0-9]+)>/);
      let role = null;
      if (mention) {
        role = ctx.guild.roles.cache.get(mention[1]);
      } else {
        const query = args.join(' ').toLowerCase();
        role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === query || r.id === args[0]);
      }
      if (!role) return ctx.reply('❌ Role not found.');
      return ctx.reply(`🏷️ **${role.name}** ➔ Snowflake ID: \`${role.id}\``);
    }
  },
  {
    name: 'guildid',
    category: 'General',
    description: 'Output current guild snowflake ID and owner ID',
    usage: '.guildid',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      return ctx.reply(`🏰 **${ctx.guild.name}**\n* Guild ID: \`${ctx.guild.id}\`\n* Owner ID: \`${ctx.guild.ownerId}\``);
    }
  },
  {
    name: 'whounbanned',
    category: 'Moderation',
    description: 'Inspect audit logs for the most recently unbanned member and executor',
    usage: '.whounbanned',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const audit = await ctx.guild.fetchAuditLogs({ type: 'MEMBER_BAN_REMOVE', limit: 1 });
        const entry = audit.entries.first();
        if (!entry) return ctx.reply('ℹ️ No unban actions found in recent audit logs.');
        return ctx.reply(`### 🔓 LAST UNBAN ACTION\n* **Unbanned User:** \`${entry.target?.tag || entry.targetId}\`\n* **Moderator:** \`${entry.executor?.tag || 'System'}\`\n* **Timestamp:** <t:${Math.floor(entry.createdTimestamp / 1000)}:R>`);
      } catch (err) {
        return ctx.reply(`❌ Missing Audit Log permission: ${err.message}`);
      }
    }
  },
  {
    name: 'whokicked',
    category: 'Moderation',
    description: 'Inspect audit logs for the most recently kicked member and executor',
    usage: '.whokicked',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const audit = await ctx.guild.fetchAuditLogs({ type: 'MEMBER_KICK', limit: 1 });
        const entry = audit.entries.first();
        if (!entry) return ctx.reply('ℹ️ No kick actions found in recent audit logs.');
        return ctx.reply(`### 👢 LAST KICK ACTION\n* **Kicked Member:** \`${entry.target?.tag || entry.targetId}\`\n* **Moderator:** \`${entry.executor?.tag || 'System'}\`\n* **Reason:** ${entry.reason || 'No reason specified'}\n* **Timestamp:** <t:${Math.floor(entry.createdTimestamp / 1000)}:R>`);
      } catch (err) {
        return ctx.reply(`❌ Missing Audit Log permission: ${err.message}`);
      }
    }
  },
  {
    name: 'whobanned',
    category: 'Moderation',
    description: 'Inspect audit logs for the most recently banned member, executor, and reason',
    usage: '.whobanned',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const audit = await ctx.guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD', limit: 1 });
        const entry = audit.entries.first();
        if (!entry) return ctx.reply('ℹ️ No ban actions found in recent audit logs.');
        return ctx.reply(`### 🔨 LAST BAN ACTION\n* **Banned User:** \`${entry.target?.tag || entry.targetId}\`\n* **Moderator:** \`${entry.executor?.tag || 'System'}\`\n* **Reason:** ${entry.reason || 'No reason specified'}\n* **Timestamp:** <t:${Math.floor(entry.createdTimestamp / 1000)}:R>`);
      } catch (err) {
        return ctx.reply(`❌ Missing Audit Log permission: ${err.message}`);
      }
    }
  },
  {
    name: 'channelperms',
    category: 'General',
    description: 'Inspect permission overwrites and custom overrides on target channel',
    usage: '.channelperms [channel]',
    run: async (ctx, args) => {
      const ch = args[0] ? ctx.guild?.channels.cache.get(args[0].replace(/[<#>]/g, '')) : ctx.channel;
      if (!ch) return ctx.reply('❌ Channel not found.');
      const overwrites = ch.permissionOverwrites.cache;
      if (overwrites.size === 0) return ctx.reply(`ℹ️ #${ch.name} has no explicit role/member permission overrides.`);
      const rows = overwrites.map(ow => `* **${ow.type}** (\`${ow.id}\`): Allow \`${ow.allow.toArray().length}\`, Deny \`${ow.deny.toArray().length}\``);
      return ctx.reply(`### 🛡️ PERMISSION OVERWRITES: #${ch.name} (${overwrites.size})\n${rows.slice(0, 15).join('\n')}`);
    }
  },
  {
    name: 'rolememberslist',
    category: 'General',
    description: 'List members assigned to target role with usernames and IDs',
    usage: '.rolememberslist <role_name_or_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Guild and role required.');
      const query = args.join(' ').toLowerCase();
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === query || r.id === args[0]);
      if (!role) return ctx.reply('❌ Role not found.');
      const members = Array.from(role.members.values());
      if (members.length === 0) return ctx.reply(`ℹ️ Role **${role.name}** has 0 members.`);
      const rows = members.map(m => `* **${m.user.tag}** (\`${m.id}\`)`);
      return ctx.reply(`### 🏷️ MEMBERS WITH ${role.name} (${members.length})\n${rows.slice(0, 25).join('\n')}`);
    }
  },
  {
    name: 'serverhoistlist',
    category: 'General',
    description: 'Overview of all hoisted roles displayed separately in server member list',
    usage: '.serverhoistlist',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const hoisted = ctx.guild.roles.cache.filter(r => r.hoist).sort((a, b) => b.position - a.position);
      const rows = hoisted.map(r => `* [Pos ${r.position}] **${r.name}** (\`${r.hexColor}\`) - \`${r.members.size}\` members`);
      return ctx.reply(`### 🏷️ HOISTED ROLES (${hoisted.size})\n${rows.join('\n')}`);
    }
  },
  {
    name: 'botlist',
    category: 'General',
    description: 'List all bot accounts present in current guild with usernames and IDs',
    usage: '.botlist',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const bots = ctx.guild.members.cache.filter(m => m.user.bot);
      const rows = bots.map(b => `* **${b.user.tag}** (\`${b.id}\`)`);
      return ctx.reply(`### 🤖 BOTS IN ${ctx.guild.name} (${bots.size})\n${rows.slice(0, 25).join('\n')}`);
    }
  }
];
