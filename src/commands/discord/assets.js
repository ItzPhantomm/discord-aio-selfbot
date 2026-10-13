/**
 * Discord Emoji, Sticker & Media Asset Tools
 */

module.exports = [
  {
    name: 'stealemoji',
    category: 'Utility',
    description: 'Fetch custom emoji from another server and upload to current server (or output direct CDN link)',
    usage: '.stealemoji <emoji> [name]',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide a custom emoji.');
      const match = args[0].match(/<(a?):([a-zA-Z0-9_]+):([0-9]+)>/);
      if (!match) return ctx.reply('❌ Custom Discord emoji required (e.g. `<:name:id>` or `<a:name:id>`).');

      const isAnimated = match[1] === 'a';
      const defaultName = match[2];
      const emojiId = match[3];
      const customName = args[1] || defaultName;
      const extension = isAnimated ? 'gif' : 'png';
      const cdnUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=128&quality=lossless`;

      if (ctx.guild && ctx.guild.members.me.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
        try {
          const created = await ctx.guild.emojis.create(cdnUrl, customName);
          return ctx.reply(`✅ Successfully added custom emoji: ${created} (\`${created.name}\`)`);
        } catch (err) {
          return ctx.reply(`⚠️ Could not auto-upload (${err.message}). Direct CDN Link:\n${cdnUrl}`);
        }
      } else {
        return ctx.reply(`😀 **Emoji Asset Captured:** \`${customName}\` (${isAnimated ? 'Animated GIF' : 'Static PNG'})\n🔗 **Direct CDN Link:** ${cdnUrl}`);
      }
    }
  },
  {
    name: 'stealsticker',
    category: 'Utility',
    description: 'Inspect sticker details and retrieve direct download CDN URL',
    usage: '.stealsticker [sticker_id_or_reply]',
    run: async (ctx, args) => {
      let stickerId = args[0];
      if (!stickerId && ctx.message?.reference) {
        const refMsg = await ctx.channel.messages.fetch(ctx.message.reference.messageId).catch(() => null);
        if (refMsg?.stickers?.size > 0) {
          stickerId = refMsg.stickers.first().id;
        }
      }
      if (!stickerId) return ctx.reply('❌ Provide sticker ID or reply to a message with a sticker.');

      const cleanId = stickerId.replace(/[^0-9]/g, '');
      const cdnUrl = `https://media.discordapp.net/stickers/${cleanId}.png?size=320`;
      return ctx.reply(`🖼️ **Sticker Asset [ID: \`${cleanId}\`]:**\n${cdnUrl}`);
    }
  },
  {
    name: 'enlarge',
    category: 'Utility',
    description: 'Display 4096px high-res direct image of any custom emoji (with dynamic GIF / PNG auto-detection)',
    usage: '.enlarge <emoji>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide custom emoji.');
      const match = args[0].match(/<(a?):([a-zA-Z0-9_]+):([0-9]+)>/);
      if (!match) return ctx.reply('❌ Custom Discord emoji required.');

      const isAnimated = match[1] === 'a';
      const name = match[2];
      const id = match[3];
      const extension = isAnimated ? 'gif' : 'png';
      const fullUrl = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=4096&quality=lossless`;
      return ctx.reply(`🔍 **Emoji Enlarge:** \`${name}\`\n${fullUrl}`);
    }
  },
  {
    name: 'emojicount',
    category: 'Utility',
    description: 'Breakdown of static vs animated emoji slots used and slots remaining based on server boost tier',
    usage: '.emojicount',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const all = ctx.guild.emojis.cache;
      const animated = all.filter(e => e.animated).size;
      const staticCount = all.size - animated;

      const tierLimits = { '0': 50, '1': 100, '2': 150, '3': 250 };
      const maxSlots = tierLimits[String(ctx.guild.premiumTier)] || 50;

      return ctx.reply(`### 😀 SERVER EMOJI INVENTORY\n* **Static Emojis:** \`${staticCount} / ${maxSlots}\` used (\`${Math.max(0, maxSlots - staticCount)}\` slots free)\n* **Animated Emojis:** \`${animated} / ${maxSlots}\` used (\`${Math.max(0, maxSlots - animated)}\` slots free)\n* **Total Registered:** \`${all.size}\`\n* **Server Boost Level:** \`Tier ${ctx.guild.premiumTier}\``);
    }
  },
  {
    name: 'emojisearch',
    category: 'Utility',
    description: 'Search accessible custom emojis by name across all joined servers',
    usage: '.emojisearch <query>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide emoji search keyword.');
      const query = args.join(' ').toLowerCase();
      const results = [];

      if (ctx.client?.guilds) {
        for (const guild of ctx.client.guilds.cache.values()) {
          for (const emoji of guild.emojis.cache.values()) {
            if (emoji.name.toLowerCase().includes(query)) {
              results.push(`${emoji} \`:${emoji.name}:\` (*${guild.name}*)`);
              if (results.length >= 25) break;
            }
          }
          if (results.length >= 25) break;
        }
      }

      if (results.length === 0) return ctx.reply(`🔍 No custom emojis found matching "${query}".`);
      return ctx.reply(`### 🔍 EMOJI SEARCH RESULTS (${results.length})\n${results.join('\n')}`);
    }
  },
  {
    name: 'stickers',
    category: 'Utility',
    description: 'List all custom stickers uploaded to current server',
    usage: '.stickers',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const list = ctx.guild.stickers.cache;
      if (list.size === 0) return ctx.reply('ℹ️ This server has no custom stickers.');
      const rows = list.map(s => `* **${s.name}** [ID: \`${s.id}\`] (${s.format})`);
      return ctx.reply(`### 🖼️ SERVER STICKERS (${list.size})\n${rows.slice(0, 20).join('\n')}`);
    }
  },
  {
    name: 'guildicon',
    category: 'General',
    description: 'Direct download link for high-res server icon (dynamic PNG / GIF)',
    usage: '.guildicon',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const icon = ctx.guild.iconURL({ dynamic: true, size: 4096 });
      return icon ? ctx.reply(`🖼️ **Server Icon (${ctx.guild.name}):**\n${icon}`) : ctx.reply('ℹ️ This server has no icon.');
    }
  },
  {
    name: 'guildbanner',
    category: 'General',
    description: 'Direct download link for high-res server banner (dynamic PNG / GIF)',
    usage: '.guildbanner',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const banner = ctx.guild.bannerURL({ dynamic: true, size: 4096 });
      return banner ? ctx.reply(`🎨 **Server Banner (${ctx.guild.name}):**\n${banner}`) : ctx.reply('ℹ️ This server has no banner.');
    }
  },
  {
    name: 'guildsplash',
    category: 'General',
    description: 'Direct download link for high-res server invite splash asset',
    usage: '.guildsplash',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const splash = ctx.guild.splashURL({ dynamic: true, size: 4096 });
      return splash ? ctx.reply(`🖼️ **Server Invite Splash (${ctx.guild.name}):**\n${splash}`) : ctx.reply('ℹ️ This server has no splash image.');
    }
  },
  {
    name: 'guilddiscovery',
    category: 'General',
    description: 'Check if server is public and indexed on Discord Server Discovery',
    usage: '.guilddiscovery',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const isDiscoverable = ctx.guild.features.includes('DISCOVERABLE');
      const isCommunity = ctx.guild.features.includes('COMMUNITY');
      return ctx.reply(`### 🌐 DISCOVERY STATUS: ${ctx.guild.name}\n* **Server Discovery:** \`${isDiscoverable ? 'ENABLED (Publicly Indexed)' : 'DISABLED (Private)'}\`\n* **Community Server:** \`${isCommunity ? 'YES' : 'NO'}\``);
    }
  }
];
