const { Client } = require('discord.js-selfbot-v13');
const CommandHandler = require('./CommandHandler');
const Context = require('./Context');
const AntiDetection = require('./AntiDetection');
const WebhookLogger = require('./WebhookLogger');
const Logger = require('../utils/Logger');
const Storage = require('../utils/Storage');
const fs = require('fs');
const path = require('path');

class SelfClient {
  constructor(config = {}) {
    this.config = config;
    this.antiDetection = new AntiDetection(config);
    this.webhookLogger = new WebhookLogger(config);

    this.client = new Client({
      checkUpdate: false,
      autoRedeemNitro: false,
      patchVoice: true,
      syncStatus: false,
      ws: {
        properties: {
          os: 'Windows',
          browser: 'Discord Client',
          release_channel: 'stable',
          client_version: '1.0.9210',
          os_version: '10.0.19044',
          system_locale: 'en-US'
        }
      }
    });
    this.commandHandler = new CommandHandler(this.client);
    this.activeChannel = null;
    this.tuiManager = null;

    this.setupEvents();
  }

  setTui(tuiManager) {
    this.tuiManager = tuiManager;
  }

  setupEvents() {
    this.client.on('ready', () => {
      Logger.success(`Logged in as ${this.client.user.tag} (ID: ${this.client.user.id})`);
      if (this.tuiManager) {
        this.tuiManager.updateHeader();
      }
    });

    this.client.on('messageCreate', async (message) => {
      // Track last active channel for TUI context
      if (message.guild || message.channel.type === 'DM') {
        this.activeChannel = message.channel;
      }

      // Snipe tracking: AFK mentions
      if (this.config.afk && this.config.afk.enabled && message.author.id !== this.client.user?.id) {
        if (message.mentions.has(this.client.user)) {
          Logger.afk(`Mention from ${message.author.tag} in #${message.channel.name || 'DM'}: "${message.content}"`);
          message.reply(`[Auto-AFK] I am currently AFK: ${this.config.afk.reason}`).catch(() => {});
        }
      }

      // Auto-responder check
      const responders = Storage.get('autoresponders', {});
      const lowerContent = message.content.toLowerCase();
      if (responders[lowerContent] && message.author.id !== this.client.user?.id) {
        message.channel.send(responders[lowerContent]).catch(() => {});
      }

      // Live message traffic logger (if enabled)
      if (this.config.cli?.logChat !== false && message.author.id !== this.client.user?.id) {
        const chName = message.channel.type === 'DM' ? `@${message.author.username}` : `#${message.channel.name}`;
        const preview = message.content ? (message.content.slice(0, 80) + (message.content.length > 80 ? '...' : '')) : '[Attachment/Embed]';
        Logger.msg(`[${chName}] ${message.author.tag}: ${preview}`);
      }

      // Check self-command prefix
      const prefix = this.config.prefix || '.';
      if (message.author.id === this.client.user?.id && message.content.startsWith(prefix)) {
        const body = message.content.slice(prefix.length).trim();
        const ctx = new Context({
          type: 'message',
          client: this.client,
          message: message,
          channel: message.channel,
          guild: message.guild,
          antiDetection: this.antiDetection
        });

        // Anti-Detection: Schedule humanized trigger deletion (not robotic 0ms)
        if (this.config.deleteTriggerBeforeSend !== false && message.deletable) {
          this.antiDetection.scheduleTriggerDelete(message);
        }

        // Anti-Detection: Human typing simulation if enabled
        if (this.config.safety?.humanTyping !== false && message.channel) {
          await this.antiDetection.simulateTyping(message.channel, body.length);
        }

        // Trigger execution
        await this.commandHandler.execute(ctx, body);
      }
    });

    // Message delete snipe listener
    this.client.on('messageDelete', (message) => {
      if (!message.channel) return;
      const snipes = Storage.get('snipes', {});
      if (!snipes[message.channel.id]) snipes[message.channel.id] = [];
      snipes[message.channel.id].unshift({
        author: message.author ? { tag: message.author.tag, id: message.author.id, avatar: message.author.displayAvatarURL() } : { tag: 'Unknown' },
        content: message.content || '[No text content / embed / attachment]',
        timestamp: Date.now()
      });
      // Cap at 20 snipes per channel
      if (snipes[message.channel.id].length > 20) snipes[message.channel.id].pop();
      Storage.set('snipes', snipes);

      // Separate Webhook Logging: Forward to Discord webhook (Never clutter CLI terminal with deleted messages)
      this.webhookLogger.logDeletedMessage(message);
    });

    // Message edit snipe listener
    this.client.on('messageUpdate', (oldMsg, newMsg) => {
      if (!oldMsg.channel || oldMsg.content === newMsg.content) return;
      const editSnipes = Storage.get('editSnipes', {});
      if (!editSnipes[oldMsg.channel.id]) editSnipes[oldMsg.channel.id] = [];
      editSnipes[oldMsg.channel.id].unshift({
        author: oldMsg.author ? { tag: oldMsg.author.tag, id: oldMsg.author.id } : { tag: 'Unknown' },
        oldContent: oldMsg.content,
        newContent: newMsg.content,
        timestamp: Date.now()
      });
      if (editSnipes[oldMsg.channel.id].length > 20) editSnipes[oldMsg.channel.id].pop();
      Storage.set('editSnipes', editSnipes);
    });

    this.client.on('error', (err) => {
      Logger.error(`Client Error: ${err.message}`);
    });
  }

  async login(token) {
    const effectiveToken = token || this.config.token;
    if (!effectiveToken || effectiveToken.includes('YOUR_DISCORD_TOKEN')) {
      Logger.warn('No valid Discord token provided in config.json. Running in Offline/TUI Preview mode.');
      return false;
    }
    try {
      const FingerprintCloak = require('./FingerprintCloak');
      const gwProps = await FingerprintCloak.getGatewayProperties();
      if (this.client.options && this.client.options.ws) {
        this.client.options.ws.properties = gwProps;
      }
      if (this.client.options && this.client.options.http) {
        this.client.options.http.headers = {
          ...this.client.options.http.headers,
          ...FingerprintCloak.getHttpHeaders()
        };
      }
      Logger.info(`Fingerprint Cloak active: Mozilla Firefox v${FingerprintCloak.browserVersion} (Build: ${gwProps.client_build_number})`);

      await this.client.login(effectiveToken);
      return true;
    } catch (err) {
      Logger.error(`Login failed: ${err.message}`);
      return false;
    }
  }

  executeTuiCommand(inputStr) {
    const ctx = new Context({
      type: 'tui',
      client: this.client,
      channel: this.activeChannel,
      guild: this.activeChannel?.guild || null,
      tui: this.tuiManager
    });
    return this.commandHandler.execute(ctx, inputStr);
  }
}

module.exports = SelfClient;
