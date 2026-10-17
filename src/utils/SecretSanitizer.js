/**
 * Universal Secret Sanitizer
 * Intercepts and scrubs sensitive credentials (Discord user tokens, OpenRouter keys,
 * NVIDIA NIM keys, webhook tokens, passwords) from all logs, terminal outputs, and chat messages.
 */

class SecretSanitizer {
  constructor() {
    this.patterns = [
      // Standard Discord user token (24-char id . 6-char timestamp . 27-38 char hmac)
      /[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38}/g,
      // Discord MFA tokens
      /mfa\.[A-Za-z0-9_-]{80,}/g,
      // OpenRouter API Keys (sk-or-v1-...)
      /sk-or-(?:v1-)?[A-Za-z0-9_-]{32,}/gi,
      // NVIDIA NIM API Keys (nvapi-...)
      /nvapi-[A-Za-z0-9_-]{32,}/gi,
      // Generic bearer or secret assignments
      /(?:authorization|bearer|token|secret|password|api_key|apikey)["']?\s*[:=]\s*["']?([A-Za-z0-9_\-\.]{16,})["']?/gi
    ];
  }

  sanitize(input) {
    if (input === null || input === undefined) return input;
    let text = typeof input === 'string' ? input : JSON.stringify(input);

    text = text.replace(this.patterns[0], '[REDACTED_DISCORD_TOKEN]');
    text = text.replace(this.patterns[1], '[REDACTED_DISCORD_MFA_TOKEN]');
    text = text.replace(this.patterns[2], '[REDACTED_OPENROUTER_KEY]');
    text = text.replace(this.patterns[3], '[REDACTED_NVIDIA_KEY]');
    text = text.replace(this.patterns[4], (match, p1) => {
      return match.replace(p1, '[REDACTED_CREDENTIAL]');
    });

    return text;
  }

  containsSecret(input) {
    if (input === null || input === undefined) return false;
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    for (const pat of this.patterns) {
      pat.lastIndex = 0;
      if (pat.test(text)) return true;
    }
    return false;
  }
}

module.exports = new SecretSanitizer();
module.exports.SecretSanitizer = SecretSanitizer;
