// OP Sub-module: channels.js
const Logger = require("../../utils/Logger");

module.exports = [
// B. OP Chat & Channel Dominance (21-40)
  {
    name: 'opchatfreeze',
    category: 'OP',
    description: 'Removes SEND_MESSAGES for @everyone in channel instantly',
    usage: '.opchatfreeze',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel?.permissionOverwrites) return ctx.reply('❌ Guild channel required.');
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: false });
      return ctx.reply('🧊 **CHAT FROZEN:** @everyone message permissions revoked in channel.');
    }
  },
  {
    name: 'opchatunfreeze',
    category: 'OP',
    description: 'Restores SEND_MESSAGES for @everyone in channel',
    usage: '.opchatunfreeze',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel?.permissionOverwrites) return ctx.reply('❌ Guild channel required.');
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: true });
      return ctx.reply('☀️ **CHAT UNFROZEN:** @everyone message permissions restored.');
    }
  },
  {
    name: 'opquicknuke',
    category: 'OP',
    description: 'Clones active channel, copies permissions, position, topic, and removes old channel',
    usage: '.opquicknuke',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel?.clone) return ctx.reply('❌ Guild text channel required.');
      const pos = ctx.channel.position;
      const clone = await ctx.channel.clone();
      await clone.setPosition(pos);
      await ctx.channel.delete();
      return clone.send('💥 **CHANNEL REGENERATED & CLONED.**');
    }
  },
  {
    name: 'opslowmodeall',
    category: 'OP',
    description: 'Mass sets slowmode across every text channel in the guild',
    usage: '.opslowmodeall <seconds>',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const sec = parseInt(args[0], 10) || 5;
      let count = 0;
      for (const ch of ctx.guild.channels.cache.values()) {
        if (ch.isText() && ch.setRateLimitPerUser) {
          await ch.setRateLimitPerUser(sec).catch(() => {});
          count++;
        }
      }
      return ctx.reply(`⏱️ Mass slowmode of \`${sec}s\` enforced across \`${count}\` channels.`);
    }
  },
  {
    name: 'opclearslowmodeall',
    category: 'OP',
    description: 'Disables slowmode across every channel in the guild',
    usage: '.opclearslowmodeall',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      let count = 0;
      for (const ch of ctx.guild.channels.cache.values()) {
        if (ch.isText() && ch.setRateLimitPerUser) {
          await ch.setRateLimitPerUser(0).catch(() => {});
          count++;
        }
      }
      return ctx.reply(`⏱️ Slowmode cleared across \`${count}\` channels.`);
    }
  },
  {
    name: 'opmassreaction',
    category: 'OP',
    description: 'Adds up to 5 emojis to target message in rapid succession',
    usage: '.opmassreaction <msg_id> <emoji1> [emoji2...]',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.opmassreaction <msg_id> <emojis...>`');
      const m = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!m) return ctx.reply('❌ Message not found.');
      for (const e of args.slice(1, 6)) {
        await m.react(e).catch(() => {});
      }
      return ctx.reply('⚡ Mass reactions applied.');
    }
  },
  {
    name: 'opmassunreact',
    category: 'OP',
    description: 'Removes all your reactions from target message',
    usage: '.opmassunreact <msg_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide message ID.');
      const m = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!m) return ctx.reply('❌ Message not found.');
      m.reactions.cache.forEach(r => r.users.remove(ctx.client?.user?.id).catch(() => {}));
      return ctx.reply('🧹 Reactions cleared.');
    }
  },
  {
    name: 'oppurgeregex',
    category: 'OP',
    description: 'Purges your messages matching regex pattern in the last 100 messages',
    usage: '.oppurgeregex <pattern>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide regex pattern.');
      const regex = new RegExp(args[0], 'i');
      const msgs = await ctx.channel.messages.fetch({ limit: 100 });
      const matched = msgs.filter(m => m.author.id === ctx.client?.user?.id && regex.test(m.content));
      let count = 0;
      for (const m of matched.values()) {
        await m.delete().catch(() => {});
        count++;
      }
      return ctx.reply(`🧹 Purged \`${count}\` regex-matched messages.`);
    }
  },
  {
    name: 'oppurgeuntil',
    category: 'OP',
    description: 'Purges all your messages backwards from now until reaching target message ID',
    usage: '.oppurgeuntil <msg_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide message ID.');
      const msgs = await ctx.channel.messages.fetch({ after: args[0], limit: 100 });
      const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id);
      let count = 0;
      for (const m of mine.values()) {
        await m.delete().catch(() => {});
        count++;
      }
      return ctx.reply(`🧹 Purged \`${count}\` messages backwards to target ID.`);
    }
  },
  {
    name: 'oppurgestickers',
    category: 'OP',
    description: 'Purges sticker messages in channel',
    usage: '.oppurgestickers <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const stickers = msgs.filter(m => m.stickers.size > 0 && m.deletable).first(count);
      for (const m of stickers) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${stickers.length}\` stickers.`);
    }
  },
  {
    name: 'oppurgemedia',
    category: 'OP',
    description: 'Purges video, audio, and image attachments in channel',
    usage: '.oppurgemedia <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const media = msgs.filter(m => m.attachments.size > 0 && m.deletable).first(count);
      for (const m of media) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${media.length}\` media files.`);
    }
  },
  {
    name: 'oppurgebots',
    category: 'OP',
    description: 'Purges messages from bot accounts (requires Manage Messages)',
    usage: '.oppurgebots <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const bots = msgs.filter(m => m.author.bot && m.deletable).first(count);
      for (const m of bots) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${bots.length}\` bot messages.`);
    }
  },
  {
    name: 'oppurgewebhooks',
    category: 'OP',
    description: 'Purges messages dispatched by webhooks',
    usage: '.oppurgewebhooks <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const hooks = msgs.filter(m => m.webhookId && m.deletable).first(count);
      for (const m of hooks) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${hooks.length}\` webhook messages.`);
    }
  },
  {
    name: 'oppurgecaps',
    category: 'OP',
    description: 'Purges ALL-CAPS messages in channel',
    usage: '.oppurgecaps <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const caps = msgs.filter(m => m.content.length > 5 && m.content === m.content.toUpperCase() && m.deletable).first(count);
      for (const m of caps) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${caps.length}\` uppercase messages.`);
    }
  },
  {
    name: 'oppurgenumbers',
    category: 'OP',
    description: 'Purges numbers and counting chain messages',
    usage: '.oppurgenumbers <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const nums = msgs.filter(m => /^\d+$/.test(m.content.trim()) && m.deletable).first(count);
      for (const m of nums) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${nums.length}\` number messages.`);
    }
  },
  {
    name: 'oppurgesystem',
    category: 'OP',
    description: 'Purges Discord boost and join system messages',
    usage: '.oppurgesystem <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const sys = msgs.filter(m => m.system && m.deletable).first(count);
      for (const m of sys) { await m.delete().catch(() => {}); }
      return ctx.reply(`🧹 Purged \`${sys.length}\` system notices.`);
    }
  },
  {
    name: 'opspamvelocity',
    category: 'OP',
    description: 'Calculates message velocity per minute in the channel',
    usage: '.opspamvelocity',
    run: async (ctx) => {
      if (!ctx.channel) return;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const first = msgs.first();
      const last = msgs.last();
      const spanMin = first && last ? Math.max((first.createdTimestamp - last.createdTimestamp) / 60000, 0.1) : 1;
      const rate = (msgs.size / spanMin).toFixed(1);
      return ctx.reply(`📈 **Chat Velocity:** \`${rate} msgs/min\` (Based on last ${msgs.size} messages)`);
    }
  },
  {
    name: 'oppinfirst',
    category: 'OP',
    description: 'Pins the earliest message in the channel',
    usage: '.oppinfirst',
    run: async (ctx) => {
      if (!ctx.channel) return;
      const msgs = await ctx.channel.messages.fetch({ after: '0', limit: 1 });
      const first = msgs.first();
      if (!first) return ctx.reply('❌ Earliest message not found.');
      await first.pin();
      return ctx.reply('📌 Pinned earliest channel message.');
    }
  },
  {
    name: 'opunpinall',
    category: 'OP',
    description: 'Unpins all pinned messages in the channel',
    usage: '.opunpinall',
    run: async (ctx) => {
      if (!ctx.channel) return;
      const pins = await ctx.channel.messages.fetchPinned();
      for (const p of pins.values()) { await p.unpin().catch(() => {}); }
      return ctx.reply(`📌 Unpinned \`${pins.size}\` messages.`);
    }
  },
  {
    name: 'opchannelpurgeall',
    category: 'OP',
    description: 'Purges all deletable messages in channel (requires Manage Messages)',
    usage: '.opchannelpurgeall [count]',
    run: async (ctx, args) => {
      if (!ctx.channel?.bulkDelete) return ctx.reply('❌ Manage Messages permission required.');
      const count = Math.min(parseInt(args[0], 10) || 20, 100);
      const res = await ctx.channel.bulkDelete(count, true);
      return ctx.reply(`🧹 Purged \`${res.size}\` messages.`);
    }
  }
];
