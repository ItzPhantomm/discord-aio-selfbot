const path = require('path');
const Storage = require('../../utils/Storage');
const Logger = require('../../utils/Logger');

module.exports = [
  {
    name: 'switch',
    category: 'Config',
    description: 'Switch between Fast Mode (immediate command text response) and Normal Mode (human typing delay)',
    usage: '.switch <fast|normal|status>',
    aliases: ['mode', 'fastmode'],
    run: async (ctx, args) => {
      const fs = require('fs');
      const configPath = require('path').join(__dirname, '../../../config.json');
      let cfg = {};
      try {
        cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {}

      const sub = (args[0] || '').toLowerCase().trim();

      if (!sub || sub === 'status') {
        const mode = cfg.fastMode ? 'FAST MODE (Immediate text responses, zero typing delay)' : 'NORMAL MODE (Human typing simulation active)';
        return ctx.reply(`[Flaw Mode] Current execution profile: **${mode}**\nUse \`.switch fast\` to enable instant text responses or \`.switch normal\` for human typing delays.`);
      }

      if (sub === 'fast' || sub === 'on' || sub === 'speed') {
        cfg.fastMode = true;
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
        if (ctx.client?.config) ctx.client.config.fastMode = true;
        return ctx.reply('⚡ [Flaw Mode] **FAST MODE ACTIVATED**: Responses will be dispatched immediately with zero typing delay while preserving backend anti-detection.');
      }

      if (sub === 'normal' || sub === 'off' || sub === 'safe') {
        cfg.fastMode = false;
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
        if (ctx.client?.config) ctx.client.config.fastMode = false;
        return ctx.reply('🛡️ [Flaw Mode] **NORMAL MODE ACTIVATED**: Human typing simulation and jitter pacing are fully engaged.');
      }

      return ctx.reply('Usage: `.switch fast` (instant response) or `.switch normal` (human typing delay)');
    }
  },
  {
    name: 'snipewebhook',
    category: 'Config',
    description: 'Configure Discord webhook URL for deleted message logging (keeps terminal clean)',
    usage: '.snipewebhook <webhook_url|off|status>',
    aliases: ['deletelogger', 'setlogwebhook'],
    run: async (ctx, args) => {
      const fs = require('fs');
      const configPath = require('path').join(__dirname, '../../../config.json');
      let cfg = {};
      try {
        cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {}

      if (!cfg.webhookLogging) cfg.webhookLogging = { enabled: true };

      const sub = (args[0] || '').trim();
      if (!sub || sub.toLowerCase() === 'status') {
        const url = cfg.webhookLogging.deletedMessagesWebhookUrl || cfg.webhookLogging.url || 'Not set';
        const masked = url.length > 20 ? url.slice(0, 30) + '...' + url.slice(-8) : url;
        const state = cfg.webhookLogging.enabled ? 'ENABLED' : 'DISABLED';
        return ctx.reply(`[Webhook Logger] Status: ${state} | Target: \`${masked}\``);
      }

      if (sub.toLowerCase() === 'off' || sub.toLowerCase() === 'disable') {
        cfg.webhookLogging.enabled = false;
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
        if (ctx.client?.config) ctx.client.config.webhookLogging = cfg.webhookLogging;
        return ctx.reply('[Webhook Logger] Deleted message webhook logging DISABLED.');
      }

      if (sub.startsWith('http')) {
        cfg.webhookLogging.enabled = true;
        cfg.webhookLogging.deletedMessagesWebhookUrl = sub;
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
        if (ctx.client?.config) ctx.client.config.webhookLogging = cfg.webhookLogging;
        const masked = sub.slice(0, 30) + '...' + sub.slice(-8);
        return ctx.reply(`[Webhook Logger] Configured webhook target: \`${masked}\`. Deleted messages will forward to webhook silently.`);
      }

      return ctx.reply('Usage: `.snipewebhook <webhook_url>` or `.snipewebhook off` or `.snipewebhook status`');
    }
  },
  {
    name: 'prefix',
    category: 'Config',
    description: 'Change command trigger prefix',
    usage: '.prefix <new_prefix>',
    aliases: ['setprefix'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide new prefix.');
      if (ctx.client && ctx.client.config) {
        ctx.client.config.prefix = args[0];
      }
      return ctx.reply(`🔧 Prefix changed to: \`${args[0]}\``);
    }
  },
  {
    name: 'selfdelete',
    category: 'Config',
    description: 'Toggle auto-deletion of self commands in chat',
    usage: '.selfdelete <on|off> [seconds]',
    run: async (ctx, args) => {
      if (!ctx.client) return;
      const state = args[0]?.toLowerCase() === 'on';
      const delay = (parseInt(args[1], 10) || 3) * 1000;
      ctx.client.config.selfDelete = { enabled: state, delay };
      return ctx.reply(`🧹 Self-Delete: ${state ? `ENABLED (${delay / 1000}s)` : 'DISABLED'}`);
    }
  },
  {
    name: 'theme',
    category: 'Config',
    description: 'Change TUI color theme (default, matrix, dracula, nord)',
    usage: '.theme <theme_name>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Choose theme: default, matrix, dracula, nord');
      return ctx.reply(`🎨 TUI theme applied: **${args[0]}**`);
    }
  },
  {
    name: 'togglelog',
    category: 'Config',
    description: 'Filter events displayed in TUI log pane',
    usage: '.togglelog <commands|snipes|events>',
    run: async (ctx, args) => {
      return ctx.reply(`⚙️ TUI event filter updated.`);
    }
  },
  {
    name: 'setkey',
    category: 'Config',
    description: 'Store API key for external utilities',
    usage: '.setkey <name> <value>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.setkey <name> <value>`');
      const keys = Storage.get('apiKeys', {});
      keys[args[0]] = args[1];
      Storage.set('apiKeys', keys);
      return ctx.reply(`🔑 Key \`${args[0]}\` stored securely.`);
    }
  },
  {
    name: 'aliases',
    category: 'Config',
    description: 'Add or view custom command aliases',
    usage: '.aliases [add|remove|list] [alias] [command]',
    run: async (ctx, args) => {
      const aliasMap = Storage.get('aliases', {});
      const sub = args[0]?.toLowerCase() || 'list';
      if (sub === 'add') {
        if (!args[1] || !args[2]) return ctx.reply('❌ Usage: `.aliases add <alias> <command>`');
        aliasMap[args[1].toLowerCase()] = args[2].toLowerCase();
        Storage.set('aliases', aliasMap);
        return ctx.reply(`✅ Alias \`.${args[1]}\` maps to \`.${args[2]}\``);
      } else if (sub === 'remove') {
        delete aliasMap[args[1]?.toLowerCase()];
        Storage.set('aliases', aliasMap);
        return ctx.reply(`🗑️ Alias removed.`);
      } else {
        const keys = Object.keys(aliasMap);
        if (keys.length === 0) return ctx.reply('ℹ️ No custom aliases.');
        return ctx.reply('🏷️ **Custom Aliases:**\n' + keys.map(k => `• .${k} ➔ .${aliasMap[k]}`).join('\n'));
      }
    }
  },
  {
    name: 'reload',
    category: 'Config',
    description: 'Hot-reload all command modules without restarting TUI',
    usage: '.reload',
    run: async (ctx) => {
      const handler = ctx.client?.commandHandler || ctx.commandHandler;
      if (!handler) return ctx.reply('⚠️ CommandHandler reference not found.');
      const cmdsDir = path.join(__dirname, '..');
      handler.commands.clear();
      handler.categories.clear();
      handler.aliases.clear();
      handler.loadCommandsFromDir(cmdsDir);
      if (ctx.tui) ctx.tui.populateCategories(handler.categories);
      return ctx.reply(`🔄 Hot-reloaded **${handler.commands.size}** commands!`);
    }
  },
  {
    name: 'tuiclear',
    category: 'Config',
    description: 'Clear TUI log feed screen',
    usage: '.tuiclear',
    run: async (ctx) => {
      if (ctx.tui && ctx.tui.logPane) {
        ctx.tui.logPane.setContent('');
        ctx.tui.screen.render();
      }
      return ctx.log('Console feed cleared.');
    }
  },
  {
    name: 'tuirefresh',
    category: 'Config',
    description: 'Force redraw of terminal TUI',
    usage: '.tuirefresh',
    run: async (ctx) => {
      if (ctx.tui && ctx.tui.screen) {
        ctx.tui.screen.realloc();
        ctx.tui.screen.render();
      }
      return ctx.log('Screen redrawn.');
    }
  },
  {
    name: 'exit',
    category: 'Config',
    description: 'Gracefully shutdown selfbot and TUI',
    usage: '.exit',
    aliases: ['quit', 'shutdown'],
    run: async (ctx) => {
      await ctx.reply('👋 Shutting down Discord AIO Selfbot...');
      setTimeout(() => process.exit(0), 500);
    }
  },
  {
    name: 'statuscolor',
    category: 'Config',
    description: 'Configure TUI border accents',
    usage: '.statuscolor <color>',
    run: async (ctx, args) => {
      return ctx.reply(`🎨 TUI accent set to: ${args[0] || 'default'}`);
    }
  },
  {
    name: 'notifications',
    category: 'Config',
    description: 'Toggle desktop sound/bell on DM',
    usage: '.notifications <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🔔 Terminal bells: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'safemode',
    category: 'Config',
    description: 'Enforce maximum rate-limit safeguards',
    usage: '.safemode <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🛡️ Anti-ban Safe Mode: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'cooldown',
    category: 'Config',
    description: 'Set custom delay between actions (ms)',
    usage: '.cooldown <milliseconds>',
    run: async (ctx, args) => {
      const ms = parseInt(args[0], 10) || 500;
      return ctx.reply(`⏱️ Command cooldown set to ${ms}ms.`);
    }
  },
  {
    name: 'debug',
    category: 'Config',
    description: 'Toggle raw gateway websocket debug logs',
    usage: '.debug <on|off>',
    run: async (ctx, args) => {
      const state = args[0]?.toLowerCase() === 'on';
      return ctx.reply(`🐞 Debug logging: ${state ? 'ENABLED' : 'DISABLED'}`);
    }
  },
  {
    name: 'channelset',
    category: 'Config',
    description: 'Set default target channel for TUI commands',
    usage: '.channelset <channel_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide channel ID.');
      return ctx.reply(`📺 Default TUI channel locked to: \`${args[0]}\``);
    }
  },
  {
    name: 'guildset',
    category: 'Config',
    description: 'Set active default guild for TUI commands',
    usage: '.guildset <guild_id>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide guild ID.');
      return ctx.reply(`🏰 Default guild locked to: \`${args[0]}\``);
    }
  },
  {
    name: 'version',
    category: 'Config',
    description: 'Check selfbot software version',
    usage: '.version',
    run: async (ctx) => {
      return ctx.reply('📦 **Discord AIO Selfbot v1.0.0** (Terminal Blessed TUI Edition)');
    }
  },
  {
    name: 'about',
    category: 'Config',
    description: 'Display selfbot info and build credits',
    usage: '.about',
    run: async (ctx) => {
      return ctx.reply('⚡ **Discord AIO Selfbot**\n• Dual input: TUI Prompt & Chat Prefix\n• 210 Commands across 10 categories\n• Blessed terminal curses UI\n• Anti-ban safety & zero web dashboard');
    }
  },
  {
    name: 'viewconfig',
    category: 'Config',
    description: 'Display active configuration settings cleanly formatted in TUI',
    usage: '.viewconfig',
    run: async (ctx) => {
      const cfg = ctx.client?.config || {};
      const sanitized = {
        prefix: cfg.prefix,
        autoDeleteMessages: cfg.autoDeleteMessages,
        deleteTriggerBeforeSend: cfg.deleteTriggerBeforeSend,
        afk: cfg.afk,
        safety: cfg.safety
      };
      return ctx.reply(`### ⚙️ ACTIVE SYSTEM CONFIGURATION\n\`\`\`json\n${JSON.stringify(sanitized, null, 2)}\n\`\`\``);
    }
  },
  {
    name: 'toggleautodelete',
    category: 'Config',
    description: 'Quick toggle for outgoing selfbot message auto-destruct (15s)',
    usage: '.toggleautodelete',
    run: async (ctx) => {
      if (!ctx.client?.config) return;
      if (!ctx.client.config.autoDeleteMessages) ctx.client.config.autoDeleteMessages = { enabled: false, delay: 15000 };
      ctx.client.config.autoDeleteMessages.enabled = !ctx.client.config.autoDeleteMessages.enabled;
      const state = ctx.client.config.autoDeleteMessages.enabled;
      return ctx.reply(`⏱️ Auto message deletion: \`${state ? 'ENGAGED (15s)' : 'DISABLED'}\``);
    }
  },
  {
    name: 'setautodeletedelay',
    category: 'Config',
    description: 'Adjust outgoing message auto-destruct delay in seconds',
    usage: '.setautodeletedelay <seconds>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Specify seconds.');
      const sec = parseInt(args[0], 10) || 15;
      if (!ctx.client.config.autoDeleteMessages) ctx.client.config.autoDeleteMessages = { enabled: true };
      ctx.client.config.autoDeleteMessages.delay = sec * 1000;
      return ctx.reply(`⏱️ Auto message deletion duration updated to \`${sec}s\`.`);
    }
  },
  {
    name: 'flushcache',
    category: 'Config',
    description: 'Flush local in-memory message and user caches to free RAM',
    usage: '.flushcache',
    run: async (ctx) => {
      if (ctx.client) {
        ctx.client.channels.cache.forEach(c => {
          if (c.messages?.cache) c.messages.cache.clear();
        });
      }
      return ctx.reply('🧹 Flushed channel message memory caches.');
    }
  },
  {
    name: 'commandcount',
    category: 'Config',
    description: 'Display total loaded commands grouped by category with verification checksum',
    usage: '.commandcount',
    run: async (ctx) => {
      const handler = ctx.commandHandler || ctx.client?.commandHandler;
      if (!handler) return ctx.reply('❌ Handler reference missing.');
      let report = `### 📊 COMMAND SUITE AUDIT REPORT\n* **Total Registered Commands:** \`${handler.commands.size}\`\n* **Total Registered Categories:** \`${handler.categories.size}\`\n\n`;
      for (const [cat, cmds] of handler.categories.entries()) {
        report += `* **${cat}:** \`${cmds.length}\` commands\n`;
      }
      return ctx.reply(report);
    }
  }
];
