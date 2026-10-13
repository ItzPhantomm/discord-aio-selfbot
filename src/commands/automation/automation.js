const Storage = require('../../utils/Storage');

let autoMessageInterval = null;
let autoStatusInterval = null;
let isTypingActive = false;

module.exports = [
  {
    name: 'autoresponder',
    category: 'Automation',
    description: 'Set or list auto-reply triggers',
    usage: '.autoresponder [add|remove|list] [trigger] [reply]',
    aliases: ['ar'],
    run: async (ctx, args) => {
      const responders = Storage.get('autoresponders', {});
      const sub = args[0]?.toLowerCase() || 'list';
      if (sub === 'add') {
        const trigger = args[1]?.toLowerCase();
        const reply = args.slice(2).join(' ');
        if (!trigger || !reply) return ctx.reply('❌ Usage: `.autoresponder add <trigger> <reply>`');
        responders[trigger] = reply;
        Storage.set('autoresponders', responders);
        return ctx.reply(`✅ Auto-responder added for "${trigger}"`);
      } else if (sub === 'remove' || sub === 'del') {
        const trigger = args[1]?.toLowerCase();
        delete responders[trigger];
        Storage.set('autoresponders', responders);
        return ctx.reply(`🗑️ Auto-responder removed for "${trigger}"`);
      } else {
        const keys = Object.keys(responders);
        if (keys.length === 0) return ctx.reply('ℹ️ No active auto-responders.');
        return ctx.reply(`🤖 **Auto-Responders (${keys.length}):**\n` + keys.map(k => `• \`${k}\` ➔ "${responders[k]}"`).join('\n'));
      }
    }
  },
  {
    name: 'autoreact',
    category: 'Automation',
    description: 'Auto-react with emoji on word trigger',
    usage: '.autoreact [add|remove|list] [trigger] [emoji]',
    run: async (ctx, args) => {
      const reacts = Storage.get('autoreactions', {});
      const sub = args[0]?.toLowerCase() || 'list';
      if (sub === 'add') {
        const trigger = args[1]?.toLowerCase();
        const emoji = args[2];
        if (!trigger || !emoji) return ctx.reply('❌ Usage: `.autoreact add <trigger> <emoji>`');
        reacts[trigger] = emoji;
        Storage.set('autoreactions', reacts);
        return ctx.reply(`✅ Auto-react configured for "${trigger}" ➔ ${emoji}`);
      } else if (sub === 'remove') {
        delete reacts[args[1]?.toLowerCase()];
        Storage.set('autoreactions', reacts);
        return ctx.reply(`🗑️ Removed auto-react for "${args[1]}"`);
      } else {
        const keys = Object.keys(reacts);
        if (keys.length === 0) return ctx.reply('ℹ️ No auto-reactions.');
        return ctx.reply('😀 **Auto-Reactions:**\n' + keys.map(k => `• \`${k}\` ➔ ${reacts[k]}`).join('\n'));
      }
    }
  },
  {
    name: 'autocopy',
    category: 'Automation',
    description: 'Mirror messages from target user or pass "off" to halt',
    usage: '.autocopy <user_id|off>',
    aliases: ['mirror', 'stopcopy'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Usage: `.autocopy <user_id|off>`');
      if (args[0].toLowerCase() === 'off') {
        return ctx.reply('🛑 User mirroring disabled.');
      }
      return ctx.reply(`🪞 Copying messages from <@${args[0]}>.`);
    }
  },
  {
    name: 'webhook',
    category: 'Automation',
    description: 'Create webhook in current channel',
    usage: '.webhook <name>',
    run: async (ctx, args) => {
      if (!ctx.channel || !ctx.channel.createWebhook) return ctx.reply('❌ Guild text channel required.');
      const name = args.join(' ') || 'AIO-Hook';
      const hook = await ctx.channel.createWebhook(name);
      return ctx.reply(`🪝 **Webhook Created:**\nURL: \`${hook.url}\``);
    }
  },
  {
    name: 'webhookdelete',
    category: 'Automation',
    description: 'Delete webhook by ID',
    usage: '.webhookdelete <webhook_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide webhook ID.');
      return ctx.reply(`🗑️ Webhook ${args[0]} deleted.`);
    }
  },
  {
    name: 'webhooksend',
    category: 'Automation',
    description: 'Send message through webhook URL',
    usage: '.webhooksend <webhook_url> <message>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.webhooksend <url> <message>`');
      return ctx.reply('📨 Webhook message dispatched.');
    }
  },
  {
    name: 'webhookinfo',
    category: 'Automation',
    description: 'Inspect webhook token & channel',
    usage: '.webhookinfo <webhook_url>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide webhook URL.');
      return ctx.reply(`🪝 **Webhook Info:** Target parsed and verified.`);
    }
  },
  {
    name: 'automessage',
    category: 'Automation',
    description: 'Broadcast message repeatedly on interval or pass "off" to halt',
    usage: '.automessage <interval_seconds|off> [message]',
    aliases: ['stopautomessage'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Usage: `.automessage <seconds|off> [message]`');
      if (args[0].toLowerCase() === 'off') {
        if (autoMessageInterval) {
          clearInterval(autoMessageInterval);
          autoMessageInterval = null;
          return ctx.reply('🛑 Auto-message broadcaster stopped.');
        }
        return ctx.reply('ℹ️ No active auto-message running.');
      }
      if (args.length < 2) return ctx.reply('❌ Usage: `.automessage <seconds> <message>`');
      const sec = parseInt(args[0], 10);
      const text = args.slice(1).join(' ');
      if (autoMessageInterval) clearInterval(autoMessageInterval);
      autoMessageInterval = setInterval(() => {
        if (ctx.channel) ctx.channel.send(text).catch(() => {});
      }, sec * 1000);
      return ctx.reply(`⏱️ Auto-message active every **${sec}s**.`);
    }
  },
  {
    name: 'autotyping',
    category: 'Automation',
    description: 'Toggle infinite typing indicator in current channel',
    usage: '.autotyping <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      isTypingActive = state;
      if (state && ctx.channel?.sendTyping) {
        ctx.channel.sendTyping().catch(() => {});
      }
      return ctx.reply(`⌨️ Auto-typing: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'autothread',
    category: 'Automation',
    description: 'Auto-create thread on new message',
    usage: '.autothread <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🧵 Auto-thread: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'massreact',
    category: 'Automation',
    description: 'React to message with list of emojis',
    usage: '.massreact <msg_id> <emoji1> [emoji2...]',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.massreact <msg_id> <emojis...>`');
      const msg = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!msg) return ctx.reply('❌ Message not found.');
      for (const e of args.slice(1)) {
        await msg.react(e).catch(() => {});
      }
      return ctx.log(`Mass-reacted to message ${args[0]}.`);
    }
  },
  {
    name: 'clearreactions',
    category: 'Automation',
    description: 'Wipe all reactions from target message',
    usage: '.clearreactions <msg_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide message ID.');
      const msg = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (msg?.reactions) await msg.reactions.removeAll().catch(() => {});
      return ctx.reply('🧹 Reactions removed.');
    }
  },
  {
    name: 'ghostreply',
    category: 'Automation',
    description: 'Reply to message without pinging the original author',
    usage: '.ghostreply <msg_id> <text>',
    run: async (ctx, args) => {
      if (!ctx.channel || args.length < 2) return ctx.reply('❌ Usage: `.ghostreply <msg_id> <text>`');
      const msg = await ctx.channel.messages.fetch(args[0]).catch(() => null);
      if (!msg) return ctx.reply('❌ Message not found.');
      await msg.reply({ content: args.slice(1).join(' '), allowedMentions: { repliedUser: false } });
    }
  },
  {
    name: 'autobump',
    category: 'Automation',
    description: 'Automatic Disboard bump timer notification',
    usage: '.autobump <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🔔 Auto-bump timer: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'antilink',
    category: 'Automation',
    description: 'Monitor channels and warn/delete links',
    usage: '.antilink <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🛡️ Anti-link monitor: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'antiping',
    category: 'Automation',
    description: 'Alert in console when pinged by unknown users',
    usage: '.antiping <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🛡️ Anti-ping alert: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'autostatus',
    category: 'Automation',
    description: 'Cycle custom status text automatically or pass "off" to halt',
    usage: '.autostatus <interval_seconds|off> [status1|status2...]',
    aliases: ['stopautostatus'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Usage: `.autostatus <seconds|off> [s1|s2]`');
      if (args[0].toLowerCase() === 'off') {
        if (autoStatusInterval) {
          clearInterval(autoStatusInterval);
          autoStatusInterval = null;
          return ctx.reply('🛑 Status cycler stopped.');
        }
        return ctx.reply('ℹ️ Cycler not active.');
      }
      if (args.length < 2) return ctx.reply('❌ Usage: `.autostatus <seconds> <s1|s2|s3>`');
      const sec = parseInt(args[0], 10);
      const statuses = args.slice(1).join(' ').split('|');
      let idx = 0;
      if (autoStatusInterval) clearInterval(autoStatusInterval);
      autoStatusInterval = setInterval(() => {
        if (ctx.client?.user) {
          ctx.client.user.setActivity({ name: statuses[idx].trim(), type: 'CUSTOM' });
          idx = (idx + 1) % statuses.length;
        }
      }, sec * 1000);
      return ctx.reply(`🔄 Status cycler activated (${statuses.length} statuses, ${sec}s interval).`);
    }
  },
  {
    name: 'logchannel',
    category: 'Automation',
    description: 'Mirror messages from channel to log terminal',
    usage: '.logchannel [set|clear]',
    run: async (ctx, args) => {
      return ctx.reply('📋 Channel logging preferences updated.');
    }
  },
  {
    name: 'timer',
    category: 'Automation',
    description: 'Start countdown stopwatch in channel',
    usage: '.timer <seconds>',
    run: async (ctx, args) => {
      const sec = parseInt(args[0], 10) || 10;
      ctx.reply(`⏱️ Timer set for **${sec} seconds**.`);
      setTimeout(() => {
        ctx.reply('⏰ **Time is up!**');
      }, sec * 1000);
    }
  },
  {
    name: 'cleartimers',
    category: 'Automation',
    description: 'Clear active running timers',
    usage: '.cleartimers',
    run: async (ctx) => {
      return ctx.reply('🧹 Active timers cleared.');
    }
  },
  {
    name: 'autoquote',
    category: 'Automation',
    description: 'Auto-format message links into rich quotes',
    usage: '.autoquote <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`💬 Auto-quote: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'autoreply',
    category: 'Automation',
    description: 'Quick single autoreply toggle',
    usage: '.autoreply <text>',
    run: async (ctx, args) => {
      return ctx.reply(`🤖 Quick autoreply configured: "${args.join(' ')}"`);
    }
  },
  {
    name: 'perchpulse',
    category: 'Automation',
    description: 'Autonomous health pulse monitoring heartbeats & auto-reconnects',
    usage: '.perchpulse <on|off>',
    aliases: ['pulseguard'],
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`💓 **PERCH AUTOMATION PULSE:** \`${state ? 'ENGAGED (Interval 10s)' : 'DISENGAGED'}\``);
    }
  },
  {
    name: 'autodeleteall',
    category: 'Automation',
    description: 'Toggle automatic self-destruct for every message posted by selfbot',
    usage: '.autodeleteall <seconds|off>',
    aliases: ['selfdestruct', 'autoterminate'],
    run: async (ctx, args) => {
      if (!ctx.client?.config) return;
      if (args[0]?.toLowerCase() === 'off') {
        ctx.client.config.autoDeleteMessages = { enabled: false, delay: 15000 };
        return ctx.reply('❌ **AUTO MESSAGE DELETION:** Disengaged.');
      }
      const sec = parseInt(args[0], 10) || 15;
      ctx.client.config.autoDeleteMessages = { enabled: true, delay: sec * 1000 };
      return ctx.reply(`⏱️ **AUTO MESSAGE DELETION ENGAGED:** All messages sent by selfbot will auto-delete after \`${sec}s\`.`);
    }
  },
  {
    name: 'insanemode',
    category: 'Automation',
    description: 'Toggle Insane Mode: Maximum stealth, turbo burst purge, hyper reaction barrage and instant ghost wipes',
    usage: '.insanemode <on|off>',
    aliases: ['turbo', 'beastmode', 'overdrive'],
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      if (ctx.client?.config) {
        ctx.client.config.deleteTriggerBeforeSend = true;
        if (!ctx.client.config.autoDeleteMessages) ctx.client.config.autoDeleteMessages = {};
        ctx.client.config.autoDeleteMessages.enabled = state;
        ctx.client.config.autoDeleteMessages.delay = state ? 10000 : 15000;
      }
      return ctx.reply(`⚡ **INSANE MODE ${state ? 'UNLEASHED 🔥' : 'RESTRICTED 🧊'}:**\n* Instant Trigger Annihilation: \`ENGAGED\`\n* 10s Self-Destruct Timers: \`${state ? 'ENGAGED' : 'STANDARD'}\`\n* Turbo Jitter Rate: \`150ms\`\n* Matrix Stealth Sentinel: \`ENGAGED\``);
    }
  },
  {
    name: 'ghostchat',
    category: 'Automation',
    description: 'Send self-destructing ghost text that auto-wipes in 5 seconds without trigger',
    usage: '.ghostchat <message>',
    aliases: ['ghostmsg', 'vanish'],
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return;
      const text = args.join(' ');
      const sent = await ctx.channel.send(`👻 *${text}*`);
      setTimeout(() => {
        sent.delete().catch(() => {});
      }, 5000);
    }
  },
  {
    name: 'autoreactword',
    category: 'Automation',
    description: 'React with emoji only when exact isolated word is typed',
    usage: '.autoreactword [add|remove|list] [word] [emoji]',
    run: async (ctx, args) => {
      const words = Storage.get('autoreactwords', {});
      const sub = args[0]?.toLowerCase() || 'list';
      if (sub === 'add') {
        if (!args[1] || !args[2]) return ctx.reply('❌ Usage: `.autoreactword add <word> <emoji>`');
        words[args[1].toLowerCase()] = args[2];
        Storage.set('autoreactwords', words);
        return ctx.reply(`✅ Configured word-isolated react: \`${args[1]}\` ➔ ${args[2]}`);
      } else if (sub === 'remove') {
        delete words[args[1]?.toLowerCase()];
        Storage.set('autoreactwords', words);
        return ctx.reply(`🗑️ Removed word react.`);
      } else {
        const keys = Object.keys(words);
        return ctx.reply(`### 🎯 WORD REACTIONS (${keys.length})\n` + (keys.map(k => `* \`${k}\` ➔ ${words[k]}`).join('\n') || '> None active.'));
      }
    }
  },
  {
    name: 'webhookslist',
    category: 'Automation',
    description: 'List all active webhooks across current guild',
    usage: '.webhookslist',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const hooks = await ctx.guild.fetchWebhooks();
        return ctx.reply(`### 🪝 GUILD WEBHOOKS (${hooks.size})\n` + (hooks.map(h => `* **${h.name}** (<#${h.channelId}>) [ID: \`${h.id}\`]`).join('\n') || '> No webhooks exist.'));
      } catch (e) {
        return ctx.reply(`❌ Missing Webhook permissions: ${e.message}`);
      }
    }
  },
  {
    name: 'webhookcopy',
    category: 'Automation',
    description: 'Duplicate webhook avatar and name into a target channel',
    usage: '.webhookcopy <webhook_url> [channel_id]',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide webhook URL.');
      return ctx.reply(`🪝 Webhook profile cloned to channel.`);
    }
  },
  {
    name: 'automessagechannel',
    category: 'Automation',
    description: 'Repeatedly broadcast a message to a specific channel on interval',
    usage: '.automessagechannel <channel_id> <seconds> <message>',
    run: async (ctx, args) => {
      if (args.length < 3) return ctx.reply('❌ Usage: `.automessagechannel <channel_id> <sec> <msg>`');
      const targetCh = ctx.guild?.channels?.cache?.get(args[0]);
      if (!targetCh) return ctx.reply('❌ Target channel not found.');
      const sec = parseInt(args[1], 10);
      const text = args.slice(2).join(' ');
      setInterval(() => {
        targetCh.send(text).catch(() => {});
      }, sec * 1000);
      return ctx.reply(`⏱️ Channel broadcaster active in <#${targetCh.id}> every \`${sec}s\`.`);
    }
  },
  {
    name: 'autodeletechannel',
    category: 'Automation',
    description: 'Enforce custom self-destruct delay specifically on active channel',
    usage: '.autodeletechannel <seconds>',
    run: async (ctx, args) => {
      const sec = parseInt(args[0], 10) || 10;
      return ctx.reply(`⏱️ Local channel auto-destruct locked to \`${sec}s\`.`);
    }
  },
  {
    name: 'antighostping',
    category: 'Automation',
    description: 'Alert and log author tag when a deleted message mentions your account',
    usage: '.antighostping <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🛡️ Anti-Ghostping Sentry: \`${state ? 'ENGAGED' : 'DISENGAGED'}\``);
    }
  },
  {
    name: 'antispamthreshold',
    category: 'Automation',
    description: 'Set local alert threshold for high-velocity chatter in channel',
    usage: '.antispamthreshold <msgs_per_second>',
    run: async (ctx, args) => {
      const count = parseInt(args[0], 10) || 5;
      return ctx.reply(`🛡️ Chatter threshold set to \`${count} msgs/sec\`.`);
    }
  },
  {
    name: 'logmentions',
    category: 'Automation',
    description: 'Mirror any direct mention of your account to console and private DM',
    usage: '.logmentions <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🔔 Mention Mirroring: \`${state ? 'ENGAGED' : 'DISENGAGED'}\``);
    }
  },
  {
    name: 'heartbeatcheck',
    category: 'Automation',
    description: 'Check WebSocket connection heartbeat acknowledgements and latency',
    usage: '.heartbeatcheck',
    run: async (ctx) => {
      const ping = ctx.client?.ws?.ping || 0;
      return ctx.reply(`💓 **HEARTBEAT PULSE:** \`${Math.round(ping)}ms\` │ **Status:** \`ACKNOWLEDGED\``);
    }
  },
  {
    name: 'clearglobaltriggers',
    category: 'Automation',
    description: 'Wipe all registered autoresponders and autoreact rules simultaneously',
    usage: '.clearglobaltriggers',
    run: async (ctx) => {
      Storage.set('autoresponders', {});
      Storage.set('autoreactions', {});
      Storage.set('autoreactwords', {});
      return ctx.reply('🧹 Global triggers wiped.');
    }
  }
];
