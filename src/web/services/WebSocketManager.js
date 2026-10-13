const { WebSocketServer } = require('ws');

/**
 * WebSocketManager
 * Manages real-time client connections and broadcasts live status, logs, and events.
 */
class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.heartbeatInterval = null;
    this.logHistory = [];
    this.maxLogHistory = 300;
  }

  attach(server, path = '/api/ws') {
    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (ws, req) => {
      ws.isAlive = true;
      this.clients.add(ws);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (msg) => {
        const str = msg.toString();
        if (str === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    this.heartbeatInterval = setInterval(() => {
      for (const ws of this.clients) {
        if (ws.isAlive === false) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        ws.isAlive = false;
        try {
          ws.ping();
        } catch {}
      }
    }, 30000);
  }

  broadcast(messageObj) {
    if (!this.wss || this.clients.size === 0) return;
    const payload = JSON.stringify(messageObj);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        try {
          client.send(payload);
        } catch {}
      }
    }
  }

  broadcastStatus(data) {
    this.broadcast({ type: 'status', data });
  }

  broadcastClientState(data) {
    this.broadcast({ type: 'client_state', data });
  }

  broadcastEvent(data) {
    this.broadcast({ type: 'event', data });
  }

  broadcastNotification(data) {
    this.broadcast({ type: 'notification', data });
  }

  broadcastLog(logEntry) {
    this.logHistory.unshift(logEntry);
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.pop();
    }
    this.broadcast({
      type: 'event',
      data: {
        event_type: `log.${logEntry.level || 'info'}`,
        message: logEntry.message,
        source: logEntry.source || 'system',
        timestamp: logEntry.timestamp,
        level: logEntry.level || 'info'
      }
    });
  }

  broadcastTheme(vars) {
    this.broadcast({ type: 'theme', data: { vars } });
  }

  broadcastRefresh() {
    this.broadcast({ type: 'refresh' });
  }

  close() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }
}

module.exports = new WebSocketManager();
module.exports.WebSocketManager = WebSocketManager;
