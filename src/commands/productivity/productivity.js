const Storage = require('../../utils/Storage');

module.exports = [
  {
    name: 'bookmarkadd',
    category: 'Productivity',
    description: 'Save a Discord message URL or note to your personal bookmark vault',
    usage: '.bookmarkadd <label> | <url_or_content>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.bookmarkadd <label> | <url_or_content>`');
      const label = parts[0].trim();
      const content = parts[1].trim();
      const bmarks = Storage.get('bookmarks', {});
      bmarks[label] = { content, timestamp: Date.now() };
      Storage.set('bookmarks', bmarks);
      return ctx.reply(`🔖 Saved bookmark: **${label}**`);
    }
  },
  {
    name: 'bookmarklist',
    category: 'Productivity',
    description: 'List all saved bookmarks in personal vault',
    usage: '.bookmarklist',
    run: async (ctx) => {
      const bmarks = Storage.get('bookmarks', {});
      const keys = Object.keys(bmarks);
      if (keys.length === 0) return ctx.reply('ℹ️ Bookmark vault is empty.');
      const rows = keys.map(k => `* **${k}**: ${bmarks[k].content}`);
      return ctx.reply(`### 🔖 BOOKMARK VAULT (${keys.length})\n${rows.join('\n')}`);
    }
  },
  {
    name: 'bookmarkdel',
    category: 'Productivity',
    description: 'Delete bookmark by label',
    usage: '.bookmarkdel <label>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide label.');
      const bmarks = Storage.get('bookmarks', {});
      delete bmarks[args.join(' ').trim()];
      Storage.set('bookmarks', bmarks);
      return ctx.reply(`🗑️ Bookmark removed.`);
    }
  },
  {
    name: 'pomodoro',
    category: 'Productivity',
    description: 'Start 25-minute Pomodoro focus timer with alert completion',
    usage: '.pomodoro [minutes]',
    run: async (ctx, args) => {
      const mins = parseInt(args[0], 10) || 25;
      ctx.reply(`🍅 **Pomodoro Focus Session Started:** \`${mins} minutes\` remaining.`);
      setTimeout(() => {
        ctx.reply('🔔 **POMODORO COMPLETE:** Time for a 5-minute break!');
      }, mins * 60 * 1000);
    }
  },
  {
    name: 'snippetadd',
    category: 'Productivity',
    description: 'Save reusable text snippet trigger (e.g. .snippet get <name>)',
    usage: '.snippetadd <name> | <content>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.snippetadd <name> | <content>`');
      const name = parts[0].trim().toLowerCase();
      const content = parts[1].trim();
      const snippets = Storage.get('snippets', {});
      snippets[name] = content;
      Storage.set('snippets', snippets);
      return ctx.reply(`📝 Snippet **${name}** saved.`);
    }
  },
  {
    name: 'snippetget',
    category: 'Productivity',
    description: 'Fetch and send saved snippet content',
    usage: '.snippetget <name>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide snippet name.');
      const snippets = Storage.get('snippets', {});
      const content = snippets[args[0].toLowerCase()];
      if (!content) return ctx.reply(`❌ Snippet \`${args[0]}\` not found.`);
      return ctx.reply(content);
    }
  },
  {
    name: 'snippetlist',
    category: 'Productivity',
    description: 'List all saved snippet names',
    usage: '.snippetlist',
    run: async (ctx) => {
      const snippets = Storage.get('snippets', {});
      const keys = Object.keys(snippets);
      return ctx.reply(`### 📝 REUSABLE SNIPPETS (${keys.length})\n` + (keys.map(k => `* \`${k}\``).join('\n') || '> No snippets saved.'));
    }
  },
  {
    name: 'quickcalc',
    category: 'Productivity',
    description: 'Inline rapid math calculator with memory storage',
    usage: '.quickcalc <expr>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide expression.');
      const expr = args.join(' ').replace(/[^0-9+\-*/().^ ]/g, '');
      try {
        const res = Function(`'use strict'; return (${expr})`)();
        return ctx.reply(`🧮 \`${expr}\` = **${res}**`);
      } catch (e) {
        return ctx.reply('❌ Error evaluating calculation.');
      }
    }
  },
  {
    name: 'worklog',
    category: 'Productivity',
    description: 'Append timestamped line item to daily personal worklog',
    usage: '.worklog <entry>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide log text.');
      const logs = Storage.get('worklog', []);
      const entry = `[${new Date().toLocaleTimeString()}] ${args.join(' ')}`;
      logs.push(entry);
      Storage.set('worklog', logs);
      return ctx.reply(`✅ Logged: "${entry}"`);
    }
  },
  {
    name: 'worklogview',
    category: 'Productivity',
    description: 'View current session worklog entries',
    usage: '.worklogview',
    run: async (ctx) => {
      const logs = Storage.get('worklog', []);
      if (logs.length === 0) return ctx.reply('📋 Worklog is currently empty.');
      return ctx.reply(`### 📋 TODAY'S WORKLOG (${logs.length})\n` + logs.slice(-15).join('\n'));
    }
  }
];
