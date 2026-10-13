module.exports = [
  {
    name: 'auditroles',
    category: 'Admin',
    description: 'Audit server roles without members or without permissions',
    usage: '.auditroles',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const empty = ctx.guild.roles.cache.filter(r => r.members.size === 0 && r.name !== '@everyone');
      return ctx.reply(`### 🏷️ ROLES AUDIT\n* **Total Roles:** \`${ctx.guild.roles.cache.size}\`\n* **Roles with 0 Members:** \`${empty.size}\``);
    }
  },
  {
    name: 'auditemojis',
    category: 'Admin',
    description: 'Audit server custom emoji capacity, animated count, and slots remaining',
    usage: '.auditemojis',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const emojis = ctx.guild.emojis.cache;
      const animated = emojis.filter(e => e.animated).size;
      const staticCount = emojis.size - animated;
      return ctx.reply(`### 😀 EMOJI CAPACITY AUDIT\n* **Static Emojis:** \`${staticCount}\`\n* **Animated Emojis:** \`${animated}\`\n* **Total Registered:** \`${emojis.size}\``);
    }
  },
  {
    name: 'auditstickers',
    category: 'Admin',
    description: 'Audit server custom sticker capacity and tier limit',
    usage: '.auditstickers',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const stickers = ctx.guild.stickers.cache;
      return ctx.reply(`### 🖼️ STICKER AUDIT\n* **Total Stickers:** \`${stickers.size}\`\n* **Tier:** \`Tier ${ctx.guild.premiumTier}\``);
    }
  },
  {
    name: 'invitesaudit',
    category: 'Admin',
    description: 'Inspect active guild invites and highest inviter rankings',
    usage: '.invitesaudit',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const invs = await ctx.guild.invites.fetch();
        const top = Array.from(invs.values()).sort((a, b) => b.uses - a.uses).slice(0, 5);
        const rows = top.map(i => `* **.gg/${i.code}**: \`${i.uses} uses\` (by ${i.inviter?.tag || 'System'})`);
        return ctx.reply(`### ✉️ INVITE AUDIT (${invs.size} active)\n${rows.join('\n') || '> No active invites.'}`);
      } catch (e) {
        return ctx.reply(`❌ Missing Manage Server permission: ${e.message}`);
      }
    }
  },
  {
    name: 'integrationsaudit',
    category: 'Admin',
    description: 'Audit server bot integrations and webhook conduits',
    usage: '.integrationsaudit',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const integrations = await ctx.guild.fetchIntegrations();
        return ctx.reply(`### 🔌 GUILD INTEGRATIONS\n* **Active Integrations:** \`${integrations.size}\``);
      } catch (e) {
        return ctx.reply(`❌ Cannot view integrations: ${e.message}`);
      }
    }
  },
  {
    name: 'banscount',
    category: 'Admin',
    description: 'Count total ban entries recorded in guild database',
    usage: '.banscount',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const bans = await ctx.guild.bans.fetch();
        return ctx.reply(`🔨 **Total Bans in ${ctx.guild.name}:** \`${bans.size}\``);
      } catch (e) {
        return ctx.reply(`❌ Ban permission required: ${e.message}`);
      }
    }
  },
  {
    name: 'channelpositions',
    category: 'Admin',
    description: 'Display ordered category and channel position hierarchy',
    usage: '.channelpositions',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const channels = ctx.guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').sort((a, b) => a.position - b.position);
      const rows = channels.map(c => `* [${c.position}] **${c.name}** (\`${c.children?.size || 0} channels\`)`);
      return ctx.reply(`### 📁 CATEGORY ORDER\n${rows.slice(0, 15).join('\n') || '> No categories.'}`);
    }
  },
  {
    name: 'hoistedroles',
    category: 'Admin',
    description: 'List roles configured to display separately in sidebar (hoisted)',
    usage: '.hoistedroles',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const hoisted = ctx.guild.roles.cache.filter(r => r.hoist).sort((a, b) => b.position - a.position);
      return ctx.reply(`### 🏷️ HOISTED ROLES (${hoisted.size})\n` + hoisted.map(r => `* **${r.name}** (\`${r.hexColor}\`)`).join('\n'));
    }
  },
  {
    name: 'mentionableroles',
    category: 'Admin',
    description: 'List roles that can be mentioned by @everyone',
    usage: '.mentionableroles',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const mentionable = ctx.guild.roles.cache.filter(r => r.mentionable);
      return ctx.reply(`### 📢 MENTIONABLE ROLES (${mentionable.size})\n` + (mentionable.map(r => `* **${r.name}**`).join('\n') || '> No mentionable roles.'));
    }
  },
  {
    name: 'servercreated',
    category: 'Admin',
    description: 'Precise guild registration date, epoch, and server age',
    usage: '.servercreated',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const g = ctx.guild;
      const days = Math.floor((Date.now() - g.createdTimestamp) / (1000 * 60 * 60 * 24));
      return ctx.reply(`### 🏰 GUILD CREATION: ${g.name}\n* **Created Date:** \`${new Date(g.createdTimestamp).toUTCString()}\`\n* **Server Age:** \`${days} days old\``);
    }
  }
];
