// OP Sub-module: recon.js
const Logger = require("../../utils/Logger");

module.exports = [
// C. OP Server Recon & Analytics (41-60)
  {
    name: 'opguildrecon',
    category: 'OP',
    description: 'Deep reconnaissance on current server: owner, boost tier, feature flags, vanity stats',
    usage: '.opguildrecon',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const g = ctx.guild;
      const owner = await g.fetchOwner().catch(() => null);
      return ctx.reply(`### 🏰 GUILD RECONNAISSANCE: ${g.name}\n* **Guild ID:** \`${g.id}\`\n* **Owner:** \`${owner?.user?.tag || g.ownerId}\`\n* **Member Count:** \`${g.memberCount}\`\n* **Boost Tier:** \`Tier ${g.premiumTier}\` (${g.premiumSubscriptionCount} boosts)\n* **Vanity Code:** \`${g.vanityURLCode || 'None'}\`\n* **Verification Level:** \`${g.verificationLevel}\``);
    }
  },
  {
    name: 'opadminroster',
    category: 'OP',
    description: 'Lists every member holding Administrator permission in guild',
    usage: '.opadminroster',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const admins = ctx.guild.members.cache.filter(m => m.permissions.has('ADMINISTRATOR'));
      const list = admins.map(a => `* **${a.user.tag}** (\`${a.id}\`)`);
      return ctx.reply(`### 👑 GUILD ADMINISTRATORS (${admins.size})\n${list.slice(0, 15).join('\n') || '> None cached.'}`);
    }
  },
  {
    name: 'opbanlist',
    category: 'OP',
    description: 'Comprehensive view of guild bans count and latest banned entries',
    usage: '.opbanlist',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const bans = await ctx.guild.bans.fetch();
        const list = Array.from(bans.values()).slice(0, 5).map(b => `* **${b.user.tag}**: ${b.reason || 'No reason'}`);
        return ctx.reply(`### 🔨 GUILD BANS (${bans.size})\n${list.join('\n') || '> No bans on record.'}`);
      } catch (e) {
        return ctx.reply(`❌ Missing ban permissions: ${e.message}`);
      }
    }
  },
  {
    name: 'opauditinspect',
    category: 'OP',
    description: 'Reads recent audit logs highlighting kicks, bans, and channel deletions',
    usage: '.opauditinspect [limit]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const limit = parseInt(args[0], 10) || 5;
        const audit = await ctx.guild.fetchAuditLogs({ limit });
        const list = audit.entries.map(e => `* **${e.executor?.tag}**: \`${e.action}\` ➔ ${e.target?.tag || e.targetId}`);
        return ctx.reply(`### 📋 AUDIT RECON (${audit.entries.size})\n${list.join('\n')}`);
      } catch (e) {
        return ctx.reply(`❌ Cannot view audit log: ${e.message}`);
      }
    }
  },
  {
    name: 'opvanityhunter',
    category: 'OP',
    description: 'Real-time vanity invite inspector and claim check',
    usage: '.opvanityhunter',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      return ctx.reply(`🔗 **Vanity Status:** \`${ctx.guild.vanityURLCode || 'No vanity URL active'}\` │ Uses: \`${ctx.guild.vanityURLUses || 0}\``);
    }
  },
  {
    name: 'opinvexit',
    category: 'OP',
    description: 'Inspects invite metadata (guild icon, inviter, member count) without joining',
    usage: '.opinvexit <invite_code>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide invite code or link.');
      try {
        const inv = await ctx.client.fetchInvite(args[0]);
        return ctx.reply(`### ✉️ INVITE DOSSIER\n* **Server:** **${inv.guild?.name || 'Group DM'}** (\`${inv.guild?.id || 'N/A'}\`)\n* **Inviter:** \`${inv.inviter?.tag || 'Unknown'}\`\n* **Members:** \`${inv.memberCount}\` total (${inv.presenceCount || 0} online)`);
      } catch (e) {
        return ctx.reply(`❌ Invalid invite: ${e.message}`);
      }
    }
  },
  {
    name: 'oprolehierarchy',
    category: 'OP',
    description: 'Visual ASCII hierarchy graph of top 15 roles by position',
    usage: '.oprolehierarchy',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const roles = ctx.guild.roles.cache.sort((a, b) => b.position - a.position).first(15);
      const rows = roles.map(r => `* [Pos ${r.position}] **${r.name}** (\`${r.hexColor}\`) - ${r.members.size} members`);
      return ctx.reply(`### 🏷️ ROLE HIERARCHY\n${rows.join('\n')}`);
    }
  },
  {
    name: 'opbotdensity',
    category: 'OP',
    description: 'Statistical breakdown of bot count vs verified bots vs human members',
    usage: '.opbotdensity',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const bots = ctx.guild.members.cache.filter(m => m.user.bot).size;
      const humans = ctx.guild.memberCount - bots;
      return ctx.reply(`🤖 **MEMBER COMPOSITION:**\n* Humans: \`${humans}\` (${Math.round((humans/ctx.guild.memberCount)*100)}%)\n* Bots: \`${bots}\` (${Math.round((bots/ctx.guild.memberCount)*100)}%)`);
    }
  },
  {
    name: 'opboosters',
    category: 'OP',
    description: 'Lists members currently boosting the server',
    usage: '.opboosters',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const boosters = ctx.guild.members.cache.filter(m => m.premiumSince != null);
      const rows = boosters.map(b => `* **${b.user.tag}** (Boosting since <t:${Math.floor(b.premiumSinceTimestamp/1000)}:R>)`);
      return ctx.reply(`### 🚀 SERVER BOOSTERS (${boosters.size})\n${rows.slice(0, 15).join('\n') || '> No boosters cached.'}`);
    }
  },
  {
    name: 'opemojidump',
    category: 'OP',
    description: 'Exports download links for all server custom emojis',
    usage: '.opemojidump',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const emojis = ctx.guild.emojis.cache;
      const links = emojis.map(e => `* \`${e.name}\`: ${e.url}`);
      return ctx.reply(`### 😀 SERVER EMOJIS (${emojis.size})\n${links.slice(0, 10).join('\n')}\n> Showing top 10 URLs.`);
    }
  },
  {
    name: 'opstickerdump',
    category: 'OP',
    description: 'Exports download links for all server stickers',
    usage: '.opstickerdump',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const stickers = ctx.guild.stickers.cache;
      const links = stickers.map(s => `* \`${s.name}\`: ${s.url}`);
      return ctx.reply(`### 🖼️ SERVER STICKERS (${stickers.size})\n${links.slice(0, 10).join('\n') || '> No custom stickers.'}`);
    }
  },
  {
    name: 'opchannelmap',
    category: 'OP',
    description: 'Structured overview of server categories, text channels, and voice rooms',
    usage: '.opchannelmap',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const text = ctx.guild.channels.cache.filter(c => c.isText()).size;
      const voice = ctx.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size;
      const cat = ctx.guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').size;
      return ctx.reply(`### 🗺️ GUILD CHANNEL TOPOLOGY\n* Categories: \`${cat}\`\n* Text Channels: \`${text}\`\n* Voice Channels: \`${voice}\`\n* Total: \`${ctx.guild.channels.cache.size}\``);
    }
  },
  {
    name: 'opunhoistall',
    category: 'OP',
    description: 'Scans server for members hoisting their names with symbols (!, #, @)',
    usage: '.opunhoistall',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const hoisters = ctx.guild.members.cache.filter(m => m.nickname && /^[!#@$%&*^~]/.test(m.nickname));
      return ctx.reply(`🧼 **HOISTER SCAN:** Detected \`${hoisters.size}\` members with symbol prefix nicknames.`);
    }
  },
  {
    name: 'opmuteroster',
    category: 'OP',
    description: 'Lists all server members currently under active timeout/mute',
    usage: '.opmuteroster',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const muted = ctx.guild.members.cache.filter(m => m.communicationDisabledUntilTimestamp > Date.now());
      return ctx.reply(`🔇 **MUTED MEMBERS:** \`${muted.size}\` members currently timed out.`);
    }
  },
  {
    name: 'opdeafroster',
    category: 'OP',
    description: 'Lists all voice members currently server-deafened',
    usage: '.opdeafroster',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const deaf = ctx.guild.members.cache.filter(m => m.voice?.serverDeaf);
      return ctx.reply(`🎧 **DEAFENED MEMBERS:** \`${deaf.size}\` members server-deafened in voice.`);
    }
  },
  {
    name: 'opsyschannel',
    category: 'OP',
    description: 'Inspects server welcome/boost channel configurations',
    usage: '.opsyschannel',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      return ctx.reply(`📢 System Channel: \`${ctx.guild.systemChannel?.name || 'None'}\` (${ctx.guild.systemChannelId || 'N/A'})`);
    }
  },
  {
    name: 'opnsfwchannels',
    category: 'OP',
    description: 'Lists all age-restricted NSFW channels in server',
    usage: '.opnsfwchannels',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const nsfw = ctx.guild.channels.cache.filter(c => c.nsfw).map(c => `* <#${c.id}> (\`${c.name}\`)`);
      return ctx.reply(`### 🔞 AGE-RESTRICTED CHANNELS (${nsfw.length})\n${nsfw.join('\n') || '> No NSFW channels.'}`);
    }
  },
  {
    name: 'opguildscore',
    category: 'OP',
    description: 'Calculates server moderation security score based on 2FA and verification',
    usage: '.opguildscore',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const score = (ctx.guild.mfaLevel === 'ELEVATED' ? 50 : 20) + (ctx.guild.verificationLevel !== 'NONE' ? 50 : 10);
      return ctx.reply(`🛡️ **SERVER SECURITY SCORE:** \`${score}/100\`\n* 2FA MFA Moderation: \`${ctx.guild.mfaLevel}\`\n* Verification: \`${ctx.guild.verificationLevel}\``);
    }
  },
  {
    name: 'opinvitespurge',
    category: 'OP',
    description: 'Deletes all active invite links for current server',
    usage: '.opinvitespurge',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const invs = await ctx.guild.invites.fetch().catch(() => null);
      if (!invs) return ctx.reply('❌ Cannot fetch invites.');
      for (const i of invs.values()) { await i.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${invs.size}\` server invite links.`);
    }
  },
  {
    name: 'opwebhookpurge',
    category: 'OP',
    description: 'Deletes all webhooks across current server',
    usage: '.opwebhookpurge',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const hooks = await ctx.guild.fetchWebhooks().catch(() => null);
      if (!hooks) return ctx.reply('❌ Missing webhook permissions.');
      for (const h of hooks.values()) { await h.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${hooks.size}\` guild webhooks.`);
    }
  }
];
