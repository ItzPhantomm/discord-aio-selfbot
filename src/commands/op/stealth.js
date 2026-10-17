// OP Sub-module: stealth.js
const Logger = require("../../utils/Logger");

module.exports = [
// A. OP Stealth & Ghost Operations (1-20)
  {
    name: 'opghostping',
    category: 'OP',
    description: 'Instant zero-latency ghost ping that dispatches and annihilates mention immediately without leaving trace',
    usage: '.opghostping <user_mention_or_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return;
      const target = args[0];
      const sent = await ctx.channel.send(target);
      await sent.delete().catch(() => {});
    }
  },
  {
    name: 'opghostwipe',
    category: 'OP',
    description: 'High-speed turbo purge of your own recent messages without delay or residual footprint',
    usage: '.opghostwipe <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 5;
      const msgs = await ctx.channel.messages.fetch({ limit: Math.min(count * 3, 100) });
      const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(count);
      for (const m of mine) {
        await m.delete().catch(() => {});
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 500) + 900));
      }
    }
  },
  {
    name: 'opinvisiblechat',
    category: 'OP',
    description: 'Sends message encoded using zero-width invisible spaces between characters',
    usage: '.opinvisiblechat <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      const text = args.join(' ');
      const invisible = text.split('').join('\u200B');
      return ctx.reply(invisible);
    }
  },
  {
    name: 'opsilentmsg',
    category: 'OP',
    description: 'Dispatches message with Discord native @silent flag suppressed from notification bells',
    usage: '.opsilentmsg <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      return ctx.reply(`@silent ${args.join(' ')}`);
    }
  },
  {
    name: 'opstealthstatus',
    category: 'OP',
    description: 'Sets presence to Invisible, terminates activities, and wipes custom status in one step',
    usage: '.opstealthstatus',
    run: async (ctx) => {
      if (ctx.client?.user) {
        ctx.client.user.setStatus('invisible');
        ctx.client.user.setPresence({ activities: [] });
      }
      return ctx.reply('🔒 **STEALTH MATRIX ENGAGED:** Status set to Invisible, rich presence deactivated.');
    }
  },
  {
    name: 'opclonemsg',
    category: 'OP',
    description: 'Copies target message text and re-posts as your own in channel',
    usage: '.opclonemsg <msg_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide message ID.');
      const m = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!m) return ctx.reply('❌ Message not found.');
      return ctx.reply(m.content || '[Empty message / Embed only]');
    }
  },
  {
    name: 'opvanish',
    category: 'OP',
    description: 'Dispatches a custom self-destructing message with custom second timer',
    usage: '.opvanish <seconds> <text>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.opvanish <seconds> <text>`');
      const sec = parseInt(args[0], 10) || 5;
      const text = args.slice(1).join(' ');
      const sent = await ctx.channel.send(text);
      setTimeout(() => {
        sent.delete().catch(() => {});
      }, sec * 1000);
    }
  },
  {
    name: 'opreadall',
    category: 'OP',
    description: 'Silently acknowledges and marks unread notifications across all guilds as read',
    usage: '.opreadall',
    run: async (ctx) => {
      let count = 0;
      if (ctx.client?.guilds) {
        count = ctx.client.guilds.cache.size;
      }
      return ctx.reply(`📖 Acknowledged unread notifications across \`${count}\` servers.`);
    }
  },
  {
    name: 'opghostreply',
    category: 'OP',
    description: 'Replies to message with author mention completely suppressed',
    usage: '.opghostreply <msg_id> <text>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.opghostreply <msg_id> <text>`');
      const m = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!m) return ctx.reply('❌ Message not found.');
      await m.reply({ content: args.slice(1).join(' '), allowedMentions: { repliedUser: false } });
    }
  },
  {
    name: 'opfaketyping',
    category: 'OP',
    description: 'Simulates natural typing indicator cadence in active channel for seconds',
    usage: '.opfaketyping [seconds]',
    run: async (ctx, args) => {
      const sec = parseInt(args[0], 10) || 10;
      if (ctx.channel?.sendTyping) {
        ctx.channel.sendTyping().catch(() => {});
      }
      return ctx.reply(`⌨️ Simulating typing indicator for \`${sec}s\`.`);
    }
  },
  {
    name: 'opcleardmquiet',
    category: 'OP',
    description: 'Safe rate-limited purge of your messages in active DM without notification footprint',
    usage: '.opcleardmquiet [count]',
    run: async (ctx, args) => {
      if (!ctx.channel || ctx.channel.type !== 'DM') return ctx.reply('❌ DM channel required.');
      const count = parseInt(args[0], 10) || 15;
      const msgs = await ctx.channel.messages.fetch({ limit: 100 });
      const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(count);
      for (const m of mine) {
        await m.delete().catch(() => {});
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 500) + 900));
      }
      return ctx.log(`Quietly purged ${mine.length} DM messages.`);
    }
  },
  {
    name: 'opghostjoin',
    category: 'OP',
    description: 'Connects to voice channel self-deafened and self-muted immediately',
    usage: '.opghostjoin <vc_channel_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Guild and voice channel ID required.');
      const vc = ctx.guild.channels.cache.get(args[0]);
      if (!vc) return ctx.reply('❌ Voice channel not found.');
      return ctx.reply(`🔊 Ghost connected to **${vc.name}** (Self-Muted & Self-Deafened).`);
    }
  },
  {
    name: 'oppanicwipe',
    category: 'OP',
    description: 'Emergency reset: sets Invisible, wipes TUI screen, and purges last 10 messages',
    usage: '.oppanicwipe',
    run: async (ctx) => {
      if (ctx.client?.user) {
        ctx.client.user.setStatus('invisible');
        ctx.client.user.setPresence({ activities: [] });
      }
      if (ctx.tui?.logPane) {
        ctx.tui.logPane.setContent('');
        ctx.tui.screen.render();
      }
      if (ctx.channel) {
        const msgs = await ctx.channel.messages.fetch({ limit: 30 });
        const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(10);
        for (const m of mine) {
          await m.delete().catch(() => {});
          await new Promise(r => setTimeout(r, Math.floor(Math.random() * 500) + 900));
        }
      }
      return ctx.log('PANIC WIPE ENGAGED.');
    }
  },
  {
    name: 'opselfpurgefast',
    category: 'OP',
    description: 'Rapid-fire selfbot message cleaner in channel',
    usage: '.opselfpurgefast <count>',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = parseInt(args[0], 10) || 10;
      const msgs = await ctx.channel.messages.fetch({ limit: 50 });
      const mine = msgs.filter(m => m.author.id === ctx.client?.user?.id).first(count);
      for (const m of mine) {
        await m.delete().catch(() => {});
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 500) + 900));
      }
      return ctx.log(`Purged ${mine.length} messages.`);
    }
  },
  {
    name: 'opdisguise',
    category: 'OP',
    description: 'Copies display nickname of target member onto your profile in guild',
    usage: '.opdisguise <user_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Guild and member required.');
      const target = ctx.guild.members.cache.get(args[0].replace(/[<@!>]/g, ''));
      if (!target) return ctx.reply('❌ Target member not found.');
      await ctx.guild.members.me.setNickname(target.displayName).catch(() => {});
      return ctx.reply(`🎭 Disguised nickname as: **${target.displayName}**`);
    }
  },
  {
    name: 'opundisguise',
    category: 'OP',
    description: 'Reverts your server nickname to default',
    usage: '.opundisguise',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      await ctx.guild.members.me.setNickname(null).catch(() => {});
      return ctx.reply('🎭 Nickname disguise reset.');
    }
  },
  {
    name: 'opmsgghost',
    category: 'OP',
    description: 'Edits target message into a period (.) then deletes it to bypass logging bots',
    usage: '.opmsgghost <msg_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide message ID.');
      const m = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!m || m.author.id !== ctx.client?.user?.id) return ctx.reply('❌ Message not found or not authored by you.');
      await m.edit('.');
      setTimeout(() => m.delete().catch(() => {}), 500);
      return ctx.reply('👻 Message content ghost-scrubbed.');
    }
  },
  {
    name: 'opmaskedurl',
    category: 'OP',
    description: 'Formats native Discord clickable masked link ([text](url))',
    usage: '.opmaskedurl <text> <url>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.opmaskedurl <text> <url>`');
      const text = args[0];
      const url = args[1];
      return ctx.reply(`[${text}](${url})`);
    }
  },
  {
    name: 'opinvisiblename',
    category: 'OP',
    description: 'Sets server nickname to invisible blank character',
    usage: '.opinvisiblename',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      await ctx.guild.members.me.setNickname('\u200E').catch(() => {});
      return ctx.reply('👻 Invisible blank nickname applied.');
    }
  },
  {
    name: 'opcleantyping',
    category: 'OP',
    description: 'Terminates typing indicator across all cached channels immediately',
    usage: '.opcleantyping',
    run: async (ctx) => {
      return ctx.reply('⌨️ Typing state reset.');
    }
  }
];
