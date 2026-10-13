/**
 * Discord Chat, Message & Attachment Utilities
 */

module.exports = [
  {
    name: 'msglink',
    category: 'Utility',
    description: 'Generate direct Discord jump URL for target message ID (or replied message)',
    usage: '.msglink [msg_id]',
    run: async (ctx, args) => {
      let msgId = args[0];
      if (!msgId && ctx.message?.reference) {
        msgId = ctx.message.reference.messageId;
      }
      if (!msgId && ctx.channel?.lastMessageId) {
        msgId = ctx.channel.lastMessageId;
      }
      if (!msgId) return ctx.reply('❌ Provide message ID or reply to a message.');
      const guildId = ctx.guild?.id || '@me';
      const link = `https://discord.com/channels/${guildId}/${ctx.channel.id}/${msgId}`;
      return ctx.reply(`🔗 **Jump URL:** ${link}`);
    }
  },
  {
    name: 'msginfo',
    category: 'Utility',
    description: 'Detailed metadata breakdown for a message (author, timestamp, attachments, embeds, reactions)',
    usage: '.msginfo [msg_id]',
    run: async (ctx, args) => {
      let targetId = args[0];
      if (!targetId && ctx.message?.reference) {
        targetId = ctx.message.reference.messageId;
      }
      if (!targetId) return ctx.reply('❌ Provide message ID or reply to a message.');

      try {
        const m = await ctx.channel.messages.fetch(targetId);
        const createdDate = new Date(m.createdTimestamp).toUTCString();
        const editedDate = m.editedTimestamp ? new Date(m.editedTimestamp).toUTCString() : 'Never';
        const hasEmbeds = m.embeds.length > 0 ? `Yes (${m.embeds.length})` : 'No';
        const hasAttach = m.attachments.size > 0 ? `Yes (${m.attachments.size})` : 'No';
        const reactionCount = m.reactions.cache.reduce((acc, r) => acc + r.count, 0);

        return ctx.reply(`### 📄 MESSAGE DOSSIER: \`${m.id}\`\n* **Author:** \`${m.author.tag}\` (ID: \`${m.author.id}\`)\n* **Created:** \`${createdDate}\` (<t:${Math.floor(m.createdTimestamp / 1000)}:R>)\n* **Edited:** \`${editedDate}\`\n* **Content Length:** \`${m.content?.length || 0} characters\`\n* **Attachments:** \`${hasAttach}\`\n* **Embeds:** \`${hasEmbeds}\`\n* **Reactions:** \`${reactionCount}\` total`);
      } catch (err) {
        return ctx.reply(`❌ Could not fetch message: ${err.message}`);
      }
    }
  },
  {
    name: 'lastedit',
    category: 'Utility',
    description: 'Display the most recently edited message in channel with before & after content',
    usage: '.lastedit',
    run: async (ctx) => {
      const Storage = require('../../utils/Storage');
      const editSnipes = Storage.get('editSnipes', {})[ctx.channel?.id] || [];
      const latest = editSnipes[0];
      if (!latest) return ctx.reply('ℹ️ No edited messages logged in this channel yet.');

      return ctx.reply(`### ✏️ RECENT EDIT IN #${ctx.channel?.name || 'DM'}\n* **Author:** \`${latest.author?.tag || 'Unknown'}\`\n* **Before:**\n> ${latest.oldContent || '[Empty]'}\n* **After:**\n> ${latest.newContent || '[Empty]'}`);
    }
  },
  {
    name: 'pin',
    category: 'Utility',
    description: 'Pin a message in current channel by ID (or reply)',
    usage: '.pin <msg_id>',
    run: async (ctx, args) => {
      let targetId = args[0];
      if (!targetId && ctx.message?.reference) {
        targetId = ctx.message.reference.messageId;
      }
      if (!targetId) return ctx.reply('❌ Provide message ID or reply to a message.');

      try {
        const m = await ctx.channel.messages.fetch(targetId);
        await m.pin();
        return ctx.reply(`📌 Pinned message \`${m.id}\`.`);
      } catch (err) {
        return ctx.reply(`❌ Failed to pin: ${err.message}`);
      }
    }
  },
  {
    name: 'unpin',
    category: 'Utility',
    description: 'Unpin a message in current channel by ID',
    usage: '.unpin <msg_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide message ID.');
      try {
        const m = await ctx.channel.messages.fetch(args[0]);
        await m.unpin();
        return ctx.reply(`📌 Unpinned message \`${m.id}\`.`);
      } catch (err) {
        return ctx.reply(`❌ Failed to unpin: ${err.message}`);
      }
    }
  },
  {
    name: 'pins',
    category: 'Utility',
    description: 'List pinned messages in the active channel',
    usage: '.pins',
    run: async (ctx) => {
      if (!ctx.channel) return;
      try {
        const pinned = await ctx.channel.messages.fetchPinned();
        if (pinned.size === 0) return ctx.reply('ℹ️ No pinned messages in this channel.');

        const rows = pinned.map(m => `* **${m.author.tag}**: ${m.content ? m.content.slice(0, 50) + (m.content.length > 50 ? '...' : '') : '[Attachment/Embed]'} (\`${m.id}\`)`);
        return ctx.reply(`### 📌 PINNED MESSAGES (${pinned.size})\n${rows.slice(0, 15).join('\n')}`);
      } catch (err) {
        return ctx.reply(`❌ Error fetching pins: ${err.message}`);
      }
    }
  },
  {
    name: 'copymsg',
    category: 'Utility',
    description: 'Extract raw unformatted text content of target message',
    usage: '.copymsg <msg_id>',
    run: async (ctx, args) => {
      let targetId = args[0];
      if (!targetId && ctx.message?.reference) {
        targetId = ctx.message.reference.messageId;
      }
      if (!targetId) return ctx.reply('❌ Provide message ID or reply to message.');

      try {
        const m = await ctx.channel.messages.fetch(targetId);
        return ctx.reply(`\`\`\`\n${m.content || '[No text content]'}\n\`\`\``);
      } catch (err) {
        return ctx.reply(`❌ Failed to fetch message: ${err.message}`);
      }
    }
  },
  {
    name: 'chathistory',
    category: 'Utility',
    description: 'Export last N messages in channel as formatted reading log',
    usage: '.chathistory [limit]',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = Math.min(parseInt(args[0], 10) || 10, 50);
      try {
        const msgs = await ctx.channel.messages.fetch({ limit: count });
        const list = Array.from(msgs.values()).reverse().map(m => {
          const time = new Date(m.createdTimestamp).toTimeString().split(' ')[0];
          return `[${time}] ${m.author.tag}: ${m.content || '[Media]'}`;
        });
        return ctx.reply(`### 📜 CHAT LOG (Last ${list.length} messages)\n\`\`\`\n${list.join('\n')}\n\`\`\``);
      } catch (err) {
        return ctx.reply(`❌ Error fetching history: ${err.message}`);
      }
    }
  },
  {
    name: 'attachmentlist',
    category: 'Utility',
    description: 'Scan recent channel history and list all uploaded attachment URLs',
    usage: '.attachmentlist [limit]',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = Math.min(parseInt(args[0], 10) || 50, 100);
      try {
        const msgs = await ctx.channel.messages.fetch({ limit: count });
        const urls = [];
        msgs.forEach(m => {
          m.attachments.forEach(att => {
            urls.push(`* **${att.name || 'File'}** (${(att.size / 1024).toFixed(1)} KB): ${att.url}`);
          });
        });
        if (urls.length === 0) return ctx.reply(`ℹ️ No file attachments found in the last ${count} messages.`);
        return ctx.reply(`### 📎 ATTACHMENTS DETECTED (${urls.length})\n${urls.slice(0, 15).join('\n')}`);
      } catch (err) {
        return ctx.reply(`❌ Error: ${err.message}`);
      }
    }
  },
  {
    name: 'findinvites',
    category: 'Utility',
    description: 'Scan recent messages in channel for Discord invite links',
    usage: '.findinvites [limit]',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = Math.min(parseInt(args[0], 10) || 50, 100);
      try {
        const msgs = await ctx.channel.messages.fetch({ limit: count });
        const invites = [];
        msgs.forEach(m => {
          const match = m.content.match(/(discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+)/gi);
          if (match) {
            match.forEach(inv => invites.push(`* ${m.author.tag}: \`${inv}\``));
          }
        });
        if (invites.length === 0) return ctx.reply(`ℹ️ No invite links found in the last ${count} messages.`);
        return ctx.reply(`### 🔗 DISCORD INVITES FOUND (${invites.length})\n${invites.slice(0, 15).join('\n')}`);
      } catch (err) {
        return ctx.reply(`❌ Error: ${err.message}`);
      }
    }
  },
  {
    name: 'findlinks',
    category: 'Utility',
    description: 'Scan recent messages in channel for HTTP/HTTPS web links',
    usage: '.findlinks [limit]',
    run: async (ctx, args) => {
      if (!ctx.channel) return;
      const count = Math.min(parseInt(args[0], 10) || 50, 100);
      try {
        const msgs = await ctx.channel.messages.fetch({ limit: count });
        const links = [];
        msgs.forEach(m => {
          const match = m.content.match(/https?:\/\/[^\s]+/gi);
          if (match) {
            match.forEach(url => links.push(`* [${m.author.tag}]: <${url}>`));
          }
        });
        if (links.length === 0) return ctx.reply(`ℹ️ No web links found in the last ${count} messages.`);
        return ctx.reply(`### 🌐 WEB LINKS FOUND (${links.length})\n${links.slice(0, 15).join('\n')}`);
      } catch (err) {
        return ctx.reply(`❌ Error: ${err.message}`);
      }
    }
  },
  {
    name: 'spoilertrick',
    category: 'Text',
    description: 'Create a deceptive spoiler message with visible teaser text and hidden spoiler reveal',
    usage: '.spoilertrick <visible_text> | <hidden_text>',
    run: async (ctx, args) => {
      const parts = args.join(' ').split('|');
      if (parts.length < 2) return ctx.reply('❌ Usage: `.spoilertrick <visible text> | <hidden text>`');
      const visible = parts[0].trim();
      const hidden = parts[1].trim();
      return ctx.reply(`${visible} ||${'\u200B'.repeat(30)}${hidden}||`);
    }
  },
  {
    name: 'charcountmsg',
    category: 'Utility',
    description: 'Count characters, words, lines, and emojis in target message',
    usage: '.charcountmsg [msg_id]',
    run: async (ctx, args) => {
      let targetId = args[0];
      if (!targetId && ctx.message?.reference) {
        targetId = ctx.message.reference.messageId;
      }
      if (!targetId) return ctx.reply('❌ Provide message ID or reply to a message.');

      try {
        const m = await ctx.channel.messages.fetch(targetId);
        const text = m.content || '';
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text.split('\n').length;
        const emojiMatches = text.match(/<a?:[a-zA-Z0-9_]+:[0-9]+>/g);
        const emojiCount = emojiMatches ? emojiMatches.length : 0;

        return ctx.reply(`### 📊 MESSAGE LENGTH METRICS\n* **Characters:** \`${chars}\`\n* **Words:** \`${words}\`\n* **Lines:** \`${lines}\`\n* **Custom Emojis:** \`${emojiCount}\``);
      } catch (err) {
        return ctx.reply(`❌ Failed to fetch message: ${err.message}`);
      }
    }
  },
  {
    name: 'firstmsglink',
    category: 'Utility',
    description: 'Fetch direct jump URL and creation date of the very first message in the channel',
    usage: '.firstmsglink',
    run: async (ctx) => {
      if (!ctx.channel) return;
      try {
        const msgs = await ctx.channel.messages.fetch({ after: '0', limit: 1 });
        const first = msgs.first();
        if (!first) return ctx.reply('❌ Could not locate earliest message.');
        const guildId = ctx.guild?.id || '@me';
        const link = `https://discord.com/channels/${guildId}/${ctx.channel.id}/${first.id}`;
        return ctx.reply(`### 📌 EARLIEST CHANNEL MESSAGE\n* **Author:** \`${first.author.tag}\`\n* **Sent Date:** <t:${Math.floor(first.createdTimestamp / 1000)}:F> (<t:${Math.floor(first.createdTimestamp / 1000)}:R>)\n* **Direct Link:** ${link}`);
      } catch (err) {
        return ctx.reply(`❌ Error: ${err.message}`);
      }
    }
  }
];
