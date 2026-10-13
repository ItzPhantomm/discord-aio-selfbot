const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(logPath = path.join(__dirname, '../../../data/agent_audit.log')) {
    this.logPath = logPath;
    this.ensureLogDir();
  }

  ensureLogDir() {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  sanitize(text) {
    if (typeof text !== 'string') {
      try {
        text = JSON.stringify(text);
      } catch {
        text = String(text);
      }
    }
    // Mask Discord tokens (e.g. 59-72 char base64 strings with dots)
    text = text.replace(/[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38}/g, '[REDACTED_DISCORD_TOKEN]');
    // Mask NVIDIA and OpenRouter API keys
    text = text.replace(/nvapi-[A-Za-z0-9_-]{32,}/gi, '[REDACTED_NVIDIA_KEY]');
    text = text.replace(/sk-or-(?:v1-)?[A-Za-z0-9_-]{32,}/gi, '[REDACTED_OPENROUTER_KEY]');
    text = text.replace(/(?:key|token|secret|password)["']?\s*[:=]\s*["']?([A-Za-z0-9_\-\.]{8,})["']?/gi, '$1:[REDACTED_CREDENTIAL]');
    return text;
  }

  log(event) {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        id: event.id || Date.now().toString(36),
        type: event.type || 'AGENT_EVENT',
        agent: event.agent || 'Coordinator',
        action: event.action || 'info',
        details: this.sanitize(event.details || {}),
        status: event.status || 'OK'
      };

      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logPath, line, 'utf-8');
    } catch (err) {
      // Non-blocking fallback
      console.error('[AuditLogger Error]', err.message);
    }
  }

  getRecentLogs(limit = 20) {
    try {
      if (!fs.existsSync(this.logPath)) return [];
      const content = fs.readFileSync(this.logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-limit).map(l => {
        try { return JSON.parse(l); } catch { return { raw: l }; }
      });
    } catch {
      return [];
    }
  }
}

module.exports = new AuditLogger();
module.exports.AuditLogger = AuditLogger;
