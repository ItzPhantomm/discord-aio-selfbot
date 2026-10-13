const Logger = require('../utils/Logger');

/**
 * WebhookLogger
 * Forwards deleted message events and audit alerts directly to a configured
 * Discord Webhook instead of cluttering the CLI terminal.
 */
class WebhookLogger {
  constructor(config = {}) {
    this.config = config;
  }

  getWebhookUrl() {
    return this.config.webhookLogging?.deletedMessagesWebhookUrl ||
           this.config.webhookLogging?.url ||
           null;
  }

  isEnabled() {
    const url = this.getWebhookUrl();
    const enabled = this.config.webhookLogging?.enabled !== false;
    return Boolean(url && enabled && url.startsWith('http'));
  }

  async logDeletedMessage(message) {
    if (!this.isEnabled()) return;

    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) return;

    try {
      const author = message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown User';
      const channel = message.channel ? (message.channel.name ? `#${message.channel.name}` : `DM (${message.channel.id})`) : 'Unknown Channel';
      const guild = message.guild ? message.guild.name : 'Direct Message';
      const content = message.content ? message.content.slice(0, 1900) : '[No text content / embed / attachment]';

      const payload = {
        username: 'Deleted Message Logger',
        embeds: [
          {
            title: 'Message Deleted',
            color: 0x1f232b, // Sleek dark slate
            fields: [
              { name: 'Author', value: author, inline: true },
              { name: 'Channel', value: channel, inline: true },
              { name: 'Server', value: guild, inline: true },
              { name: 'Content', value: content || '[Empty]' }
            ],
            footer: { text: `Message ID: ${message.id || 'N/A'}` },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Silently ignore webhook delivery errors or log as internal warning
    }
  }
}

module.exports = WebhookLogger;
