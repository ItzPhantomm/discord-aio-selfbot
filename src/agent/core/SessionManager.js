const fs = require('fs');
const path = require('path');
const AuditLogger = require('./AuditLogger');

class SessionManager {
  constructor(storageDir = path.join(__dirname, '../../../data/agent_sessions')) {
    this.storageDir = storageDir;
    this.activeSessions = new Map();
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  createSession(id = null, metadata = {}) {
    const sessionId = id || `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      messages: [],
      tokenUsage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      toolHistory: []
    };
    this.activeSessions.set(sessionId, session);
    this.saveSession(sessionId);
    return session;
  }

  getSession(sessionId) {
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId);
    }
    // Attempt load from disk
    const filePath = path.join(this.storageDir, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const session = JSON.parse(raw);
        this.activeSessions.set(sessionId, session);
        return session;
      } catch {}
    }
    return null;
  }

  addMessage(sessionId, message) {
    const session = this.getSession(sessionId) || this.createSession(sessionId);
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    this.saveSession(sessionId);
    return session;
  }

  recordToolExecution(sessionId, toolRecord) {
    const session = this.getSession(sessionId);
    if (session) {
      session.toolHistory.push({
        timestamp: new Date().toISOString(),
        ...toolRecord
      });
      this.saveSession(sessionId);
    }
  }

  updateTokenUsage(sessionId, usage) {
    const session = this.getSession(sessionId);
    if (session && usage) {
      session.tokenUsage.prompt_tokens += usage.prompt_tokens || 0;
      session.tokenUsage.completion_tokens += usage.completion_tokens || 0;
      session.tokenUsage.total_tokens += usage.total_tokens || 0;
      this.saveSession(sessionId);
    }
  }

  saveSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    try {
      const filePath = path.join(this.storageDir, `${sessionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (e) {
      console.error('[SessionManager Error saving session]', e.message);
    }
  }

  listSessions() {
    try {
      const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
      return files.map(f => {
        const id = f.replace('.json', '');
        return this.getSession(id);
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  deleteSession(sessionId) {
    this.activeSessions.delete(sessionId);
    const filePath = path.join(this.storageDir, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * Prune messages if exceeding max context tokens (sliding window)
   */
  pruneContext(sessionId, maxMessages = 30) {
    const session = this.getSession(sessionId);
    if (!session) return [];
    if (session.messages.length > maxMessages) {
      const systemMsg = session.messages.find(m => m.role === 'system');
      const tail = session.messages.slice(-maxMessages + (systemMsg ? 1 : 0));
      session.messages = systemMsg ? [systemMsg, ...tail] : tail;
      this.saveSession(sessionId);
    }
    return session.messages;
  }
}

module.exports = new SessionManager();
module.exports.SessionManager = SessionManager;
