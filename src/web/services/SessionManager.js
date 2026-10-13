const crypto = require('crypto');

/**
 * SessionManager
 * Handles secure session cookies, CSRF tokens, and login rate limiting.
 */
class SessionManager {
  constructor(secretKey = null) {
    this.secretKey = secretKey || crypto.randomBytes(32).toString('hex');
    this.sessions = new Map(); // token -> { createdAt, expiresAt, ip }
    this.csrfTokens = new Map(); // token -> csrfToken
    this.loginAttempts = new Map(); // ip -> { count, resetAt }
  }

  createSession(ip = '127.0.0.1') {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    this.sessions.set(sessionToken, {
      createdAt: now,
      expiresAt,
      ip
    });
    this.csrfTokens.set(sessionToken, csrfToken);

    return { sessionToken, csrfToken };
  }

  isValidSession(sessionToken) {
    if (!sessionToken || !this.sessions.has(sessionToken)) return false;
    const session = this.sessions.get(sessionToken);
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionToken);
      this.csrfTokens.delete(sessionToken);
      return false;
    }
    return true;
  }

  getCsrfToken(sessionToken) {
    return this.csrfTokens.get(sessionToken) || null;
  }

  destroySession(sessionToken) {
    if (sessionToken) {
      this.sessions.delete(sessionToken);
      this.csrfTokens.delete(sessionToken);
    }
  }

  isRateLimited(ip) {
    const now = Date.now();
    const attempt = this.loginAttempts.get(ip);
    if (!attempt || now > attempt.resetAt) {
      this.loginAttempts.set(ip, { count: 1, resetAt: now + 60000 });
      return false;
    }
    attempt.count++;
    return attempt.count > 10; // max 10 login attempts per minute
  }

  resetRateLimit(ip) {
    this.loginAttempts.delete(ip);
  }
}

module.exports = SessionManager;
