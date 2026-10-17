const Logger = require('../utils/Logger');
const SecretSanitizer = require('../utils/SecretSanitizer');
const { splitMessage } = require('../utils/MessageSplitter');

/**
 * DiscordAdapter
 * Unified abstraction layer bridging discord.js v14 (official Bot frontend)
 * and discord.js-selfbot-v13 (user execution engine).
 * Standardizes messaging, fetching, user models, and error handling across both client ecosystems.
 */
class DiscordAdapter {
  constructor(client) {
    this.client = client;
    this.isBot = Boolean(client?.user?.bot);
    this.isSelfbot = Boolean(!this.isBot);
  }

  get user() {
    return this.client?.user || null;
  }

  get userId() {
    return this.client?.user?.id || null;
  }

  get userTag() {
    return this.client?.user?.tag || 'Unknown#0000';
  }

  get ping() {
    return Math.round(this.client?.ws?.ping ?? 0);
  }

  get guilds() {
    return this.client?.guilds?.cache || new Map();
  }

  get channels() {
    return this.client?.channels?.cache || new Map();
  }

  async fetchUser(userId) {
    if (!this.client?.users) return null;
    try {
      return await this.client.users.fetch(userId);
    } catch {
      return null;
    }
  }

  async fetchGuild(guildId) {
    if (!this.client?.guilds) return null;
    try {
      return await this.client.guilds.fetch(guildId);
    } catch {
      return null;
    }
  }

  async fetchChannel(channelId) {
    if (!this.client?.channels) return null;
    try {
      return await this.client.channels.fetch(channelId);
    } catch {
      return null;
    }
  }

  /**
   * Unified send method that normalizes content and embeds across v13 and v14
   */
  async send(channel, content, options = {}) {
    if (!channel || typeof channel.send !== 'function') {
      throw new Error('Target channel is not valid or does not support sending messages.');
    }

    if (typeof content === 'object' && content !== null) {
      return await channel.send({ ...content, ...options });
    }

    const sanitized = SecretSanitizer.sanitize(String(content));
    const chunks = splitMessage(sanitized, { maxLength: 1900 });
    const results = [];

    for (const chunk of chunks) {
      const sent = await channel.send(chunk, options);
      results.push(sent);
    }

    return results[0] || null;
  }
}

module.exports = DiscordAdapter;
