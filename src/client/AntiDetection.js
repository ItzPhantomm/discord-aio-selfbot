const Logger = require('../utils/Logger');

/**
 * Account Hardening & Anti-Detection Engine
 * Mitigates Discord automated heuristics, token leakage detection,
 * and Cloudflare rate-limit flags that cause account resets or suspensions.
 */
class AntiDetection {
  constructor(config = {}) {
    this.safetyConfig = config.safety || {};
    this.minDeleteDelay = this.safetyConfig.minDeleteDelay || 1100; // ms
    this.maxDeleteDelay = this.safetyConfig.maxDeleteDelay || 1800; // ms
    this.triggerDeleteDelay = this.safetyConfig.triggerDeleteDelay || 900; // ms
    this.humanTyping = this.safetyConfig.humanTyping !== false;
    this.recentActions = [];
    this.isBackoffActive = false;
    this.backoffUntil = 0;
  }

  // Generate randomized human-like jitter between min and max
  getRandomJitter(min = this.minDeleteDelay, max = this.maxDeleteDelay) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Sleep utility
  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Wait if global 429 backoff is active
  async checkBackoff() {
    if (this.isBackoffActive && Date.now() < this.backoffUntil) {
      const waitTime = this.backoffUntil - Date.now();
      Logger.sec(`Rate-limit backoff active: waiting ${Math.round(waitTime / 1000)}s to protect account.`);
      await this.sleep(waitTime);
      this.isBackoffActive = false;
    }
  }

  // Register an action into the sliding window rate limiter
  async throttleAction() {
    await this.checkBackoff();

    const now = Date.now();
    // Keep actions from the last 10 seconds
    this.recentActions = this.recentActions.filter(t => now - t < 10000);

    // If more than 8 actions in 10 seconds, apply protective brake
    if (this.recentActions.length >= 8) {
      const brakeDelay = this.getRandomJitter(1500, 2500);
      Logger.sec(`Burst protection: Throttling action (${this.recentActions.length} actions/10s). Pausing ${brakeDelay}ms.`);
      await this.sleep(brakeDelay);
    }

    this.recentActions.push(Date.now());
  }

  // Handle HTTP 429 Rate Limit from Discord
  handleRateLimit(retryAfterMs) {
    const penaltyMs = (retryAfterMs || 3000) + 1000;
    this.isBackoffActive = true;
    this.backoffUntil = Date.now() + penaltyMs;
    Logger.sec(`⚠️ Discord API rate limit hit! Account protection engaged for ${Math.round(penaltyMs / 1000)}s.`);
  }

  // Safe human-paced message deletion
  async safeDelete(message, customDelayMs = null) {
    if (!message || typeof message.delete !== 'function' || !message.deletable) return;

    await this.throttleAction();

    const delay = customDelayMs !== null ? customDelayMs : this.getRandomJitter();
    if (delay > 0) {
      await this.sleep(delay);
    }

    try {
      await message.delete();
    } catch (err) {
      if (err.status === 429 || err.message?.includes('429')) {
        const retryAfter = (err.rawError?.retry_after || 3) * 1000;
        this.handleRateLimit(retryAfter);
      }
    }
  }

  // Schedule safe trigger deletion with natural human delay (not 0ms)
  scheduleTriggerDelete(message) {
    if (!message || !message.deletable) return;

    // A human takes at least 800ms - 1500ms to send and delete a message
    const delay = this.getRandomJitter(800, 1500);
    setTimeout(async () => {
      try {
        await message.delete();
      } catch (err) {
        if (err.status === 429) {
          this.handleRateLimit(3000);
        }
      }
    }, delay);
  }

  // Simulate human typing indicator before replying
  async simulateTyping(channel, messageLength = 20) {
    if (!this.humanTyping || !channel || typeof channel.sendTyping !== 'function') return;

    try {
      await channel.sendTyping();
      // Realistic human typing duration based on message length (400ms - 1200ms)
      const typingDuration = Math.min(Math.max(messageLength * 15, 400), 1200);
      await this.sleep(typingDuration);
    } catch {}
  }
}

module.exports = AntiDetection;
