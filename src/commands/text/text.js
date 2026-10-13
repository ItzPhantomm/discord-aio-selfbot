const TextEffects = require('../../utils/TextEffects');

module.exports = [
  {
    name: 'ascii',
    category: 'Text',
    description: 'Create ASCII art frame for text',
    usage: '.ascii <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      const t = args.join(' ');
      const frame = `+${'-'.repeat(t.length + 2)}+\n| ${t} |\n+${'-'.repeat(t.length + 2)}+`;
      return ctx.reply(`\`\`\`\n${frame}\n\`\`\``);
    }
  },
  {
    name: 'mock',
    category: 'Text',
    description: 'Convert text to SpOnGeBoB case',
    usage: '.mock <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.mock(args.join(' ')));
    }
  },
  {
    name: 'reverse',
    category: 'Text',
    description: 'Reverse characters of text string',
    usage: '.reverse <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.reverse(args.join(' ')));
    }
  },
  {
    name: 'vaporwave',
    category: 'Text',
    description: 'Convert text to fullwidth vaporwave aesthetic',
    usage: '.vaporwave <text>',
    aliases: ['wide'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.vaporwave(args.join(' ')));
    }
  },
  {
    name: 'leet',
    category: 'Text',
    description: 'Convert text to 1337 5p34k',
    usage: '.leet <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.leet(args.join(' ')));
    }
  },
  {
    name: 'morse',
    category: 'Text',
    description: 'Convert text to Morse code',
    usage: '.morse <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(`\`${TextEffects.morse(args.join(' '))}\``);
    }
  },
  {
    name: 'binary',
    category: 'Text',
    description: 'Convert text to 8-bit binary',
    usage: '.binary <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(`\`${TextEffects.binary(args.join(' '))}\``);
    }
  },
  {
    name: 'clap',
    category: 'Text',
    description: 'Add claps between words',
    usage: '.clap <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.clap(args.join(' ')));
    }
  },
  {
    name: 'emojify',
    category: 'Text',
    description: 'Convert text to regional indicator emoji letters',
    usage: '.emojify <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.emojify(args.join(' ')));
    }
  },
  {
    name: 'spoiler',
    category: 'Text',
    description: 'Wrap every character inside spoiler tags',
    usage: '.spoiler <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      const res = args.join(' ').split('').map(c => `||${c}||`).join('');
      return ctx.reply(res);
    }
  },
  {
    name: 'upsidedown',
    category: 'Text',
    description: 'Flip text upside down',
    usage: '.upsidedown <text>',
    aliases: ['flip'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.upsidedown(args.join(' ')));
    }
  },
  {
    name: 'zalgo',
    category: 'Text',
    description: 'Glitch / corrupt text with Zalgo diacritics',
    usage: '.zalgo <text>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.zalgo(args.join(' ')));
    }
  },
  {
    name: 'owo',
    category: 'Text',
    description: 'UwU-ify / OwO text filter',
    usage: '.owo <text>',
    aliases: ['uwu'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Text required.');
      return ctx.reply(TextEffects.owo(args.join(' ')));
    }
  },
  {
    name: 'shrug',
    category: 'Text',
    description: 'Append shrug emoticon ¯\\_(ツ)_/¯',
    usage: '.shrug [text]',
    run: async (ctx, args) => {
      const text = args.join(' ');
      return ctx.reply(`${text ? text + ' ' : ''}¯\\_(ツ)_/¯`);
    }
  },
  {
    name: 'tableflip',
    category: 'Text',
    description: 'Append tableflip emoticon (╯°□°)╯︵ ┻━┻',
    usage: '.tableflip [text]',
    run: async (ctx, args) => {
      const text = args.join(' ');
      return ctx.reply(`${text ? text + ' ' : ''}(╯°□°)╯︵ ┻━┻`);
    }
  },
  {
    name: 'unflip',
    category: 'Text',
    description: 'Append unflip emoticon ┬─┬ノ( º _ ºノ)',
    usage: '.unflip [text]',
    run: async (ctx, args) => {
      const text = args.join(' ');
      return ctx.reply(`${text ? text + ' ' : ''}┬─┬ノ( º _ ºノ)`);
    }
  },
  {
    name: 'say',
    category: 'Text',
    description: 'Echo message and delete command invocation',
    usage: '.say <message>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      await ctx.deleteTrigger(0);
      return ctx.reply(args.join(' '));
    }
  },
  {
    name: 'ghostping',
    category: 'Text',
    description: 'Send and immediately delete ping',
    usage: '.ghostping <user>',
    run: async (ctx, args) => {
      if (!args[0] || !ctx.channel) return;
      const sent = await ctx.channel.send(args[0]);
      await sent.delete().catch(() => {});
    }
  },
  {
    name: 'tiny',
    category: 'Text',
    description: 'Convert characters to superscript',
    usage: '.tiny <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      const map = {
        a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ',
        i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ',
        q: 'ᑫ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ',
        y: 'ʸ', z: 'ᶻ'
      };
      const res = args.join(' ').toLowerCase().split('').map(c => map[c] || c).join('');
      return ctx.reply(res);
    }
  },
  {
    name: 'bold',
    category: 'Text',
    description: 'Format text as bold markdown',
    usage: '.bold <text>',
    run: async (ctx, args) => {
      return ctx.reply(`**${args.join(' ')}**`);
    }
  },
  {
    name: 'italic',
    category: 'Text',
    description: 'Format text as italic markdown',
    usage: '.italic <text>',
    run: async (ctx, args) => {
      return ctx.reply(`*${args.join(' ')}*`);
    }
  },
  {
    name: 'strike',
    category: 'Text',
    description: 'Format text with strikethrough',
    usage: '.strike <text>',
    run: async (ctx, args) => {
      return ctx.reply(`~~${args.join(' ')}~~`);
    }
  },
  {
    name: 'quote',
    category: 'Text',
    description: 'Format text or message ID as markdown quote',
    usage: '.quote <text_or_msg_id>',
    run: async (ctx, args) => {
      return ctx.reply(`> ${args.join(' ')}`);
    }
  },
  {
    name: 'cowsay',
    category: 'Text',
    description: 'Display ASCII cow speech bubble',
    usage: '.cowsay <text>',
    run: async (ctx, args) => {
      const text = args.join(' ') || 'Moo!';
      return ctx.reply(`\`\`\`\n${TextEffects.cowsay(text)}\n\`\`\``);
    }
  },
  {
    name: 'figlet',
    category: 'Text',
    description: 'Render stylized ascii font block',
    usage: '.figlet <text>',
    run: async (ctx, args) => {
      const text = args.join(' ') || 'Figlet';
      return ctx.reply(`\`\`\`\n==================\n  ${text.toUpperCase()}\n==================\n\`\`\``);
    }
  },
  {
    name: 'boxtext',
    category: 'Text',
    description: 'Wrap text inside an ASCII double-line border box',
    usage: '.boxtext <text>',
    run: async (ctx, args) => {
      const text = args.join(' ') || 'BOX';
      const len = text.length;
      const top = '╔' + '═'.repeat(len + 2) + '╗';
      const mid = '║ ' + text + ' ║';
      const bot = '╚' + '═'.repeat(len + 2) + '╝';
      return ctx.reply(`\`\`\`\n${top}\n${mid}\n${bot}\n\`\`\``);
    }
  },
  {
    name: 'codelang',
    category: 'Text',
    description: 'Format code inside a syntax-highlighted markdown code block',
    usage: '.codelang <language> <code>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.codelang <js|py|json|sh> <code>`');
      const lang = args[0];
      const code = args.slice(1).join(' ');
      return ctx.reply(`\`\`\`${lang}\n${code}\n\`\`\``);
    }
  },
  {
    name: 'spoilertext',
    category: 'Text',
    description: 'Wrap entire message body inside Discord spoiler tags',
    usage: '.spoilertext <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      return ctx.reply(`||${args.join(' ')}||`);
    }
  },
  {
    name: 'morsewords',
    category: 'Text',
    description: 'Format morse code with distinct space separators',
    usage: '.morsewords <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      const morse = TextEffects.morse(args.join(' '), true);
      return ctx.reply(`\`${morse}\``);
    }
  },
  {
    name: 'strikeboth',
    category: 'Text',
    description: 'Format text with bold and strikethrough styling',
    usage: '.strikeboth <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      return ctx.reply(`**~~${args.join(' ')}~~**`);
    }
  },
  {
    name: 'headersize',
    category: 'Text',
    description: 'Format text with Discord heading level (1, 2, or 3)',
    usage: '.headersize <1|2|3> <text>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.headersize <1|2|3> <text>`');
      const level = args[0] === '1' ? '#' : (args[0] === '2' ? '##' : '###');
      return ctx.reply(`${level} ${args.slice(1).join(' ')}`);
    }
  },
  {
    name: 'subtext',
    category: 'Text',
    description: 'Format text using Discord small subtext markdown (-# text)',
    usage: '.subtext <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      return ctx.reply(`-# ${args.join(' ')}`);
    }
  },
  {
    name: 'asciicheck',
    category: 'Text',
    description: 'Check whether string contains non-ASCII or invisible Unicode characters',
    usage: '.asciicheck <text>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      const text = args.join(' ');
      const nonAscii = text.split('').filter(c => c.charCodeAt(0) > 127);
      return ctx.reply(`### 🔤 ASCII INTEGRITY CHECK\n* **Total Characters:** \`${text.length}\`\n* **Pure ASCII:** \`${nonAscii.length === 0 ? 'YES' : 'NO'}\`\n* **Non-ASCII Characters:** \`${nonAscii.length}\``);
    }
  },
  {
    name: 'bulletlist',
    category: 'Text',
    description: 'Format comma-separated list into clean markdown bullet points',
    usage: '.bulletlist <item1, item2, item3...>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      const items = args.join(' ').split(',').map(s => s.trim()).filter(Boolean);
      return ctx.reply(items.map(i => `* ${i}`).join('\n'));
    }
  },
  {
    name: 'numlist',
    category: 'Text',
    description: 'Format comma-separated list into numbered list',
    usage: '.numlist <item1, item2, item3...>',
    run: async (ctx, args) => {
      if (!args[0]) return;
      const items = args.join(' ').split(',').map(s => s.trim()).filter(Boolean);
      return ctx.reply(items.map((it, idx) => `${idx + 1}. ${it}`).join('\n'));
    }
  }
];
