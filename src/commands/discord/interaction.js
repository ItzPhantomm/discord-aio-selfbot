/**
 * Discord Chat Interaction & Poll Tools
 */

module.exports = [
  {
    name: 'pollmulti',
    category: 'Utility',
    description: 'Create multi-choice reaction poll with up to 10 choices using regional indicator emojis',
    usage: '.pollmulti <question> | <opt1> | <opt2> [| opt3...]',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length < 3) return ctx.reply('❌ Usage: `.pollmulti <Question> | <Choice 1> | <Choice 2> [| Choice 3...]`');

      const question = parts[0];
      const choices = parts.slice(1, 11);
      const letterEmojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'];

      let pollText = `📊 **POLL: ${question}**\n\n`;
      choices.forEach((c, i) => {
        pollText += `${letterEmojis[i]} **${c}**\n`;
      });

      const sent = await ctx.reply(pollText);
      if (sent && sent.react) {
        for (let i = 0; i < choices.length; i++) {
          await sent.react(letterEmojis[i]).catch(() => {});
        }
      }
    }
  },
  {
    name: 'quickreact',
    category: 'Utility',
    description: 'Instantly add up to 3 reactions to target message ID (or reply)',
    usage: '.quickreact <msg_id> <emoji1> [emoji2] [emoji3]',
    run: async (ctx, args) => {
      let targetId = args[0];
      let emojis = args.slice(1);
      if (ctx.message?.reference && (!targetId || targetId.length < 15)) {
        targetId = ctx.message.reference.messageId;
        emojis = args;
      }
      if (!targetId || emojis.length === 0) return ctx.reply('❌ Usage: `.quickreact <msg_id> <emoji1> [emoji2]` (or reply to message).');

      const m = await ctx.channel.messages.fetch(targetId).catch(() => null);
      if (!m) return ctx.reply('❌ Message not found.');

      for (const e of emojis.slice(0, 3)) {
        await m.react(e).catch(() => {});
      }
      return ctx.reply('✅ Reactions added.');
    }
  },
  {
    name: 'clapwords',
    category: 'Text',
    description: 'Add clap emoji between words with custom prefix and suffix',
    usage: '.clapwords <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const words = args.join(' ').trim().split(/\s+/);
      return ctx.reply(`👏 ${words.join(' 👏 ')} 👏`);
    }
  },
  {
    name: 'mockcase',
    category: 'Text',
    description: 'Convert text to alternating uppercase/lowercase mock case',
    usage: '.mockcase <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const res = args.join(' ').split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
      return ctx.reply(res);
    }
  },
  {
    name: 'asciibox',
    category: 'Text',
    description: 'Draw clean unicode double-line box frame around text message',
    usage: '.asciibox <text>',
    run: async (ctx, args) => {
      const text = args.join(' ') || 'BOX';
      const len = text.length;
      const top = '╔' + '═'.repeat(len + 4) + '╗';
      const mid = '║  ' + text + '  ║';
      const bot = '╚' + '═'.repeat(len + 4) + '╝';
      return ctx.reply(`\`\`\`\n${top}\n${mid}\n${bot}\n\`\`\``);
    }
  },
  {
    name: 'bigtext',
    category: 'Text',
    description: 'Convert characters to Discord regional indicator letter emojis',
    usage: '.bigtext <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide text.');
      const res = args.join(' ').toLowerCase().split('').map(c => {
        if (c >= 'a' && c <= 'z') return `:regional_indicator_${c}:`;
        if (c === ' ') return '   ';
        return c;
      }).join(' ');
      return ctx.reply(res);
    }
  },
  {
    name: 'invisibleping',
    category: 'Text',
    description: 'Ghost ping that vanishes with zero-width invisible text wrapper',
    usage: '.invisibleping <user_mention_or_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return;
      const target = args[0];
      const sent = await ctx.channel.send(`${target}\u200B`);
      await sent.delete().catch(() => {});
    }
  },
  {
    name: 'reactquote',
    category: 'Utility',
    description: 'Quote target message with jump link and auto-react to original',
    usage: '.reactquote <msg_id> <reaction_emoji>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.reactquote <msg_id> <emoji>`');
      const m = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!m) return ctx.reply('❌ Message not found.');

      await m.react(args[1]).catch(() => {});
      const guildId = ctx.guild?.id || '@me';
      const link = `https://discord.com/channels/${guildId}/${ctx.channel.id}/${m.id}`;
      return ctx.reply(`> ${m.content || '[Media]'}\n— **${m.author.tag}** ([Jump](${link}))`);
    }
  }
];
