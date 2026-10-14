const Logger = require('../utils/Logger');
const { renderMarkdown } = require('../utils/Markdown');
const { splitMessage } = require('../utils/MessageSplitter');
const SecretSanitizer = require('../utils/SecretSanitizer');
const RateLimitBuckets = require('./RateLimitBuckets');

class Context {
  constructor(options = {}) {
    this.type = options.type || 'message'; // 'message' | 'cli'
    this.client = options.client;
    this.message = options.message || null;
    this.author = options.author || (this.message ? this.message.author : (this.client ? this.client.user : null));
    this.channel = options.channel || (this.message ? this.message.channel : null);
    this.guild = options.guild || (this.message ? this.message.guild : null);
    this.cli = options.cli || null;
    this.commandHandler = options.commandHandler || (this.client ? this.client.commandHandler : null);
    this.commandName = options.commandName || '';
    this.rawArgs = options.rawArgs || [];
  }

  async reply(content, options = {}) {
    if (this.type === 'message' && this.channel) {
      try {
        const autoDeleteConfig = this.client?.config?.autoDeleteMessages;
        const ttl = autoDeleteConfig?.delay || 15000;
        // Anti-Detection: Add randomized humanized jitter to prevent fixed heartbeat detection
        const jitter = Math.floor(Math.random() * 3000) - 1500;
        const effectiveTtl = Math.max(5000, ttl + jitter);

        const isDM = this.channel.type === 'DM';
        const recipientId = isDM ? (this.channel.recipient?.id || null) : null;
        const fastMode = Boolean(this.client?.config?.fastMode);

        if (typeof content === 'object') {
          // Acquire token from rate limit bucket
          await RateLimitBuckets.acquireMessagePermission(this.channel, isDM, recipientId, fastMode);
          if (this.client?.config?.safety?.humanTyping !== false && !fastMode) {
            await RateLimitBuckets.syncBeforeSend(this.channel, 'payload', false);
          }

          const sent = await this.channel.send(content);
          if (autoDeleteConfig && autoDeleteConfig.enabled && sent && typeof sent.delete === 'function') {
            setTimeout(async () => {
              try { await sent.delete(); } catch (e) {}
            }, effectiveTtl);
          }
          return sent;
        }

        // Sanitize any secrets before dispatching into Discord
        const sanitized = SecretSanitizer.sanitize(String(content));
        const chunks = splitMessage(sanitized, { maxLength: 1900 });
        const sentMessages = [];

        for (const chunk of chunks) {
          // Acquire token from hierarchical rate limit bucket (Global, DM, Recipient, Channel)
          await RateLimitBuckets.acquireMessagePermission(this.channel, isDM, recipientId, fastMode);

          // In normal mode: simulate human typing pause. In fast mode: instant text response without delay
          if (this.client?.config?.safety?.humanTyping !== false) {
            await RateLimitBuckets.syncBeforeSend(this.channel, chunk, fastMode);
          }

          const sent = await this.channel.send(chunk, options);
          sentMessages.push(sent);

          if (autoDeleteConfig && autoDeleteConfig.enabled && sent && typeof sent.delete === 'function') {
            setTimeout(async () => {
              try { await sent.delete(); } catch (e) {}
            }, effectiveTtl);
          }
        }

        return sentMessages[0];
      } catch (err) {
        Logger.error(`Failed to send message: ${err.message}`);
        this.log(`[Error] ${err.message}`);
      }
    } else {
      // CLI invocation output - format with markdown & sanitize
      const sanitized = SecretSanitizer.sanitize(typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content));
      const rendered = renderMarkdown(sanitized);
      this.log(rendered);
    }
  }

  log(text) {
    Logger.log('OUT', text, '\x1b[37m', '\x1b[47m\x1b[30m');
  }

  async deleteTrigger(delayMs = 0) {
    if (this.type === 'message' && this.message && this.message.deletable) {
      if (delayMs > 0) {
        setTimeout(async () => {
          try {
            await this.message.delete();
          } catch (e) {}
        }, delayMs);
      } else {
        try {
          await this.message.delete();
        } catch (e) {}
      }
    }
  }
}

module.exports = Context;
