const Logger = require('../../utils/Logger');

let isPurgeStopped = false;

function getSafeDelay() {
  return Math.floor(Math.random() * 600) + 1100; // 1100ms - 1700ms human-like pacing
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = [
  {
    name: 'purge',
    category: 'Purge',
    description: 'Delete your last N messages in the channel',
    usage: '.purge <count>',
    aliases: ['purgeme', 'clear'],
    run: async (ctx, args) => {
      if (!ctx.channel) return ctx.reply('❌ Channel required.');
      const isPreview = args.includes('--preview') || args.includes('-p');
      const cleanArgs = args.filter(a => a !== '--preview' && a !== '-p');
      const limit = parseInt(cleanArgs[0], 10) || 5;

      const msgs = await ctx.channel.messages.fetch({ limit: Math.min(limit * 3, 100) });
      const myMsgs = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(limit);

      if (isPreview) {
        return ctx.reply(`🛡️ **DRY-RUN PREVIEW (.purge ${limit})**:\n* Matching Messages: \`${myMsgs.length}\`\n* Destination: <#${ctx.channel.id}>\n* Action: No messages were deleted (Dry-run safety preview). Run without \`--preview\` to execute.`);
      }

      isPurgeStopped = false;
      let deleted = 0;
      for (const m of myMsgs) {
        if (isPurgeStopped) break;
        try {
          await m.delete();
          deleted++;
          await sleep(getSafeDelay());
        } catch (e) {}
      }
      return ctx.log(`Purged ${deleted} messages.`);
    }
  },
  {
    name: 'purgeall',
    category: 'Purge',
    description: 'Bulk delete messages if you have Manage Messages',
    usage: '.purgeall <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || !ctx.channel.bulkDelete) return ctx.reply('❌ Manage messages required.');
      const count = Math.min(parseInt(args[0], 10) || 10, 100);
      const res = await ctx.channel.bulkDelete(count, true);
      return ctx.log(`Bulk purged ${res.size} messages.`);
    }
  },
  {
    name: 'purgebots',
    category: 'Purge',
    description: 'Purge bot messages in channel',
    usage: '.purgebots <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const botMsgs = msgs.filter(m => m.author.bot).first(count);
      for (const m of botMsgs) {
        if (m.deletable) await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${botMsgs.length} bot messages.`);
    }
  },
  {
    name: 'purgeuser',
    category: 'Purge',
    description: 'Purge messages from specific user',
    usage: '.purgeuser <user> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgeuser <user> <count>`');
      const userId = args[0].replace(/[<@!>]/g, '');
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const userMsgs = msgs.filter(m => m.author.id === userId).first(count);
      for (const m of userMsgs) {
        if (m.deletable) await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${userMsgs.length} messages from ${userId}.`);
    }
  },
  {
    name: 'purgelinks',
    category: 'Purge',
    description: 'Purge messages containing web links',
    usage: '.purgelinks <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const linkMsgs = msgs.filter(m => /https?:\/\//i.test(m.content) && m.deletable).first(count);
      for (const m of linkMsgs) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${linkMsgs.length} link messages.`);
    }
  },
  {
    name: 'purgeimages',
    category: 'Purge',
    description: 'Purge messages containing image attachments',
    usage: '.purgeimages <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const imgMsgs = msgs.filter(m => m.attachments.size > 0 && m.deletable).first(count);
      for (const m of imgMsgs) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${imgMsgs.length} image attachments.`);
    }
  },
  {
    name: 'purgematches',
    category: 'Purge',
    description: 'Purge messages matching regex pattern or text',
    usage: '.purgematches <pattern> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgematches <pattern> <count>`');
      const pattern = new RegExp(args[0], 'i');
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const matched = msgs.filter(m => pattern.test(m.content) && m.deletable).first(count);
      for (const m of matched) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${matched.length} matching messages.`);
    }
  },
  {
    name: 'cleardms',
    category: 'Purge',
    description: 'Purge your messages in active DM conversation',
    usage: '.cleardms [count]',
    run: async (ctx, args) => {
      if (!ctx.channel || ctx.channel.type !== 'DM') return ctx.reply('❌ Only works in DM channels.');
      const count = parseInt(args[0], 10) || 20;
      const msgs = await ctx.channel.messages.fetch({ limit: 100 });
      const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(count);
      for (const m of mine) {
        await m.delete().catch(() => {});
        await sleep(600);
      }
      return ctx.log(`Cleared ${mine.length} DM messages.`);
    }
  },
  {
    name: 'selfpurge',
    category: 'Purge',
    description: 'Purge strictly selfbot messages with rate-limit pacing',
    usage: '.selfpurge <count>',
    run: async (ctx, args) => {
      const count = parseInt(args[0], 10) || 15;
      const msgs = await ctx.channel.messages.fetch({ limit: 100 });
      const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(count);
      for (const m of mine) {
        await m.delete().catch(() => {});
        await sleep(700);
      }
      return ctx.log(`Self-purged ${mine.length} messages.`);
    }
  },
  {
    name: 'autodelete',
    category: 'Purge',
    description: 'Set automatic deletion delay for all your outgoing messages',
    usage: '.autodelete <seconds|off>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Usage: `.autodelete <seconds|off>`');
      if (args[0].toLowerCase() === 'off') {
        ctx.client.config.selfDelete.enabled = false;
        return ctx.reply('❌ Auto-delete disabled.');
      }
      const sec = parseInt(args[0], 10);
      if (isNaN(sec) || sec <= 0) return ctx.reply('❌ Invalid delay.');
      ctx.client.config.selfDelete.enabled = true;
      ctx.client.config.selfDelete.delay = sec * 1000;
      return ctx.reply(`⏱️ Auto-delete enabled (${sec} seconds).`);
    }
  },
  {
    name: 'cleanpinned',
    category: 'Purge',
    description: 'Unpin all messages in channel',
    usage: '.cleanpinned',
    run: async (ctx) => {
      if (!ctx.channel) return;
      const pins = await ctx.channel.messages.fetchPinned();
      for (const p of pins.values()) {
        await p.unpin().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Unpinned ${pins.size} messages.`);
    }
  },
  {
    name: 'purgethreads',
    category: 'Purge',
    description: 'Purge messages in active thread',
    usage: '.purgethreads <count>',
    run: async (ctx, args) => {
      if (!ctx.channel.isThread()) return ctx.reply('❌ Channel is not a thread.');
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: count });
      for (const m of msgs.values()) {
        if (m.deletable) await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged thread messages.`);
    }
  },
  {
    name: 'purgesystem',
    category: 'Purge',
    description: 'Purge system messages (joins, boosts, pins)',
    usage: '.purgesystem <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const sys = msgs.filter(m => m.system && m.deletable).first(count);
      for (const m of sys) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${sys.length} system messages.`);
    }
  },
  {
    name: 'purgestickers',
    category: 'Purge',
    description: 'Purge sticker messages in channel',
    usage: '.purgestickers <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const stickers = msgs.filter(m => m.stickers.size > 0 && m.deletable).first(count);
      for (const m of stickers) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${stickers.length} stickers.`);
    }
  },
  {
    name: 'purgementions',
    category: 'Purge',
    description: 'Purge messages containing mentions',
    usage: '.purgementions <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const mentions = msgs.filter(m => (m.mentions.users.size > 0 || m.mentions.roles.size > 0) && m.deletable).first(count);
      for (const m of mentions) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${mentions.length} mentions.`);
    }
  },
  {
    name: 'purgeinvites',
    category: 'Purge',
    description: 'Purge discord invite links',
    usage: '.purgeinvites <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const invites = msgs.filter(m => /(discord\.gg|discord\.com\/invite)/i.test(m.content) && m.deletable).first(count);
      for (const m of invites) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${invites.length} invites.`);
    }
  },
  {
    name: 'purgebefore',
    category: 'Purge',
    description: 'Purge messages before a message ID',
    usage: '.purgebefore <msg_id> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgebefore <msg_id> <count>`');
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ before: args[0], limit: count });
      for (const m of msgs.values()) {
        if (m.author.id === ctx.client?.user?.id) await m.delete().catch(() => {});
        await sleep(600);
      }
      return ctx.log(`Purged messages before ${args[0]}.`);
    }
  },
  {
    name: 'purgeafter',
    category: 'Purge',
    description: 'Purge messages after a message ID',
    usage: '.purgeafter <msg_id> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgeafter <msg_id> <count>`');
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ after: args[0], limit: count });
      for (const m of msgs.values()) {
        if (m.author.id === ctx.client?.user?.id) await m.delete().catch(() => {});
        await sleep(600);
      }
      return ctx.log(`Purged messages after ${args[0]}.`);
    }
  },
  {
    name: 'purgestop',
    category: 'Purge',
    description: 'Abort running purge loop',
    usage: '.purgestop',
    aliases: ['cancelpurge'],
    run: async (ctx) => {
      isPurgeStopped = true;
      return ctx.reply('🛑 Purge task cancellation requested.');
    }
  },
  {
    name: 'purgepreview',
    category: 'Purge',
    description: 'Preview messages that would be purged',
    usage: '.purgepreview <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 5;
      const msgs = await ctx.channel.messages.fetch({ limit: count });
      const preview = msgs.map(m => `• [${m.author.tag}]: ${m.content.slice(0, 30)}...`).join('\n');
      return ctx.reply(`🔍 **Purge Preview (${count} msgs):**\n${preview}`);
    }
  },
  {
    name: 'purgemedia',
    category: 'Purge',
    description: 'Delete messages containing audio, video, or image files',
    usage: '.purgemedia <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const media = msgs.filter(m => (m.attachments.size > 0 || /https?:\/\/.*(mp4|mov|mp3|wav|ogg|webm)/i.test(m.content)) && m.deletable).first(count);
      for (const m of media) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${media.length} media messages.`);
    }
  },
  {
    name: 'purgecaps',
    category: 'Purge',
    description: 'Purge messages containing predominantly ALL-CAPS text',
    usage: '.purgecaps <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const caps = msgs.filter(m => m.content.length > 5 && m.content === m.content.toUpperCase() && m.deletable).first(count);
      for (const m of caps) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${caps.length} caps messages.`);
    }
  },
  {
    name: 'purgenumbers',
    category: 'Purge',
    description: 'Purge messages containing mostly digits or count spam',
    usage: '.purgenumbers <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const nums = msgs.filter(m => /^\d+$/.test(m.content.trim()) && m.deletable).first(count);
      for (const m of nums) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${nums.length} number messages.`);
    }
  },
  {
    name: 'purgeembeds',
    category: 'Purge',
    description: 'Purge messages containing link preview embeds',
    usage: '.purgeembeds <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const embeds = msgs.filter(m => m.embeds.length > 0 && m.deletable).first(count);
      for (const m of embeds) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${embeds.length} embedded messages.`);
    }
  },
  {
    name: 'purgebounds',
    category: 'Purge',
    description: 'Purge all selfbot messages between start and end message IDs',
    usage: '.purgebounds <start_id> <end_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgebounds <start_id> <end_id>`');
      const msgs = await ctx.channel.messages.fetch({ after: args[0], before: args[1], limit: 50 });
      let deleted = 0;
      for (const m of msgs.values()) {
        if (m.author.id === ctx.client?.user?.id && m.deletable) {
          await m.delete().catch(() => {});
          deleted++;
          await sleep(500);
        }
      }
      return ctx.log(`Purged ${deleted} messages between bounds.`);
    }
  },
  {
    name: 'purgetextonly',
    category: 'Purge',
    description: 'Delete only plain text messages without attachments or links',
    usage: '.purgetextonly <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const plain = msgs.filter(m => m.attachments.size === 0 && !m.content.includes('http') && m.deletable).first(count);
      for (const m of plain) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${plain.length} plain text messages.`);
    }
  },
  {
    name: 'purgeshorter',
    category: 'Purge',
    description: 'Purge short messages under specified character count',
    usage: '.purgeshorter <min_chars> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgeshorter <chars> <count>`');
      const min = parseInt(args[0], 10) || 5;
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const short = msgs.filter(m => m.content.length <= min && m.deletable).first(count);
      for (const m of short) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${short.length} short messages.`);
    }
  },
  {
    name: 'purgelonger',
    category: 'Purge',
    description: 'Purge long walls of text exceeding character count',
    usage: '.purgelonger <max_chars> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.purgelonger <chars> <count>`');
      const max = parseInt(args[0], 10) || 200;
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const long = msgs.filter(m => m.content.length >= max && m.deletable).first(count);
      for (const m of long) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${long.length} long messages.`);
    }
  },
  {
    name: 'purgementionrole',
    category: 'Purge',
    description: 'Purge messages containing specific role pings',
    usage: '.purgementionrole <role_id> <count>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide role ID.');
      const count = parseInt(args[1], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const rolePing = msgs.filter(m => m.mentions.roles.has(args[0]) && m.deletable).first(count);
      for (const m of rolePing) {
        await m.delete().catch(() => {});
        await sleep(500);
      }
      return ctx.log(`Purged ${rolePing.length} role mention messages.`);
    }
  },
  {
    name: 'purgetoday',
    category: 'Purge',
    description: 'Purge your messages sent today in the active channel',
    usage: '.purgetoday',
    run: async (ctx) => {
      if (!ctx.channel) return;
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const msgs = await ctx.channel.messages.fetch({ limit: 100 });
      const today = msgs.filter(m => m.author.id === ctx.client?.user?.id && m.createdTimestamp >= startOfDay);
      let count = 0;
      for (const m of today.values()) {
        await m.delete().catch(() => {});
        count++;
        await sleep(500);
      }
      return ctx.log(`Purged ${count} messages sent today.`);
    }
  }
];
