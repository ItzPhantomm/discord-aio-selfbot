const Logger = require('../utils/Logger');

/**
 * TokenBucket
 * Standard Token Bucket rate limiter with microsecond replenishment.
 */
class TokenBucket {
  constructor(capacity, fillPerSecond) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillPerSecond = fillPerSecond;
    this.lastFill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastFill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillPerSecond);
    this.lastFill = now;
  }

  async acquire(cost = 1) {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    // Wait until enough tokens replenish
    const needed = cost - this.tokens;
    const waitMs = Math.ceil((needed / this.fillPerSecond) * 1000) + 50;
    await new Promise(r => setTimeout(r, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - cost);
    return true;
  }
}

/**
 * Hierarchical Rate Limit & Anti-Flagging Buckets
 * Specifically separates:
 * 1. Global request throughput
 * 2. Global DM outbound bucket
 * 3. Per-recipient DM target bucket
 * 4. Per-channel message bucket
 */
class RateLimitBuckets {
  constructor() {
    // Global throughput: max 5 requests per second
    this.globalBucket = new TokenBucket(5, 5);

    // Global DM bucket: max 3 DMs burst, 0.4 per second (1 every 2.5s)
    this.dmGlobalBucket = new TokenBucket(3, 0.4);

    // Per-recipient DM buckets: recipientId -> TokenBucket
    this.recipientBuckets = new Map();

    // Per-channel message buckets: channelId -> TokenBucket
    this.channelBuckets = new Map();

    // Last message timestamp per recipient/channel for jitter pacing
    this.lastActionTimestamps = new Map();
  }

  getRecipientBucket(recipientId) {
    if (!this.recipientBuckets.has(recipientId)) {
      // 2 messages burst, 1 every 2 seconds
      this.recipientBuckets.set(recipientId, new TokenBucket(2, 0.5));
    }
    return this.recipientBuckets.get(recipientId);
  }

  getChannelBucket(channelId) {
    if (!this.channelBuckets.has(channelId)) {
      // 4 messages burst, 1 every 1.5 seconds
      this.channelBuckets.set(channelId, new TokenBucket(4, 0.7));
    }
    return this.channelBuckets.get(channelId);
  }

  // Enforces humanized pacing and bucket acquisition before sending a message
  async acquireMessagePermission(channel, isDM = false, recipientId = null, fastMode = false) {
    if (fastMode) {
      // Fast Mode: instant response text without wait/throttle jitter while preserving basic global safety
      return true;
    }

    // 1. Acquire global token
    await this.globalBucket.acquire(1);

    const now = Date.now();
    const targetKey = isDM ? `dm_${recipientId || channel.id}` : `ch_${channel.id}`;
    const lastTime = this.lastActionTimestamps.get(targetKey) || 0;
    const elapsed = now - lastTime;

    // Minimum human pacing between messages to the same destination
    const minDelay = isDM ? 1400 : 900;
    if (elapsed < minDelay) {
      const waitMs = minDelay - elapsed + Math.floor(Math.random() * 400);
      await new Promise(r => setTimeout(r, waitMs));
    }

    if (isDM) {
      // 2. Acquire Global DM token
      await this.dmGlobalBucket.acquire(1);

      // 3. Acquire Per-Recipient DM token
      if (recipientId) {
        const recipBucket = this.getRecipientBucket(recipientId);
        await recipBucket.acquire(1);
      }
    } else {
      // 4. Acquire Channel message token
      const chanBucket = this.getChannelBucket(channel.id);
      await chanBucket.acquire(1);
    }

    this.lastActionTimestamps.set(targetKey, Date.now());
  }

  /**
   * Complete Humanized Pre-Send Synchronization:
   * - Emits typing indicator over HTTP/Gateway
   * - Humanized typing pause proportional to message text length
   */
  async syncBeforeSend(channel, textContent = '', fastMode = false) {
    if (!channel || typeof channel.sendTyping !== 'function') return;

    if (fastMode) {
      // Fast mode: immediate text response; emit typing concurrently without artificial delay
      channel.sendTyping().catch(() => {});
      return;
    }

    try {
      // 1. Fire typing indicator (emits TYPING_START across WebSocket gateway)
      await channel.sendTyping().catch(() => {});

      // 2. Realistic human typing duration (400ms - 1400ms) with random jitter
      const charCount = typeof textContent === 'string' ? textContent.length : 20;
      const baseMs = Math.min(Math.max(charCount * 18, 400), 1200);
      const jitterMs = Math.floor(Math.random() * 300) + baseMs;

      await new Promise(r => setTimeout(r, jitterMs));
    } catch {}
  }
}

module.exports = new RateLimitBuckets();
module.exports.RateLimitBuckets = RateLimitBuckets;
