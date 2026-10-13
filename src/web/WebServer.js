const http = require('http');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const SessionManager = require('./services/SessionManager');
const WebSocketManager = require('./services/WebSocketManager');
const createApiRouter = require('./routes/api');
const Logger = require('../utils/Logger');

/**
 * WebServer
 * Production-grade Nighty-inspired web control center server.
 */
class WebServer {
  constructor(selfClient) {
    this.selfClient = selfClient;
    this.port = selfClient.config?.dashboard?.port || process.env.PORT || 8080;
    this.host = selfClient.config?.dashboard?.host || '0.0.0.0';

    this.app = express();
    this.server = null;
    this.sessionManager = new SessionManager(selfClient.config?.dashboard?.secretKey);

    this.setupApp();
  }

  setupApp() {
    this.app.use(express.json({ limit: '5mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '5mb' }));
    this.app.use(cookieParser());

    // Security & CORS Headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    // Public directory path
    const publicDir = path.join(__dirname, 'public');

    // Mount API Router under /api
    const apiRouter = createApiRouter(this.selfClient, this.sessionManager);
    this.app.use('/api', apiRouter);

    // Static Assets serving under /app and root
    this.app.use('/app', express.static(publicDir));
    this.app.use(express.static(publicDir));

    // SPA Fallback: Any other non-API GET route returns index.html
    const indexPath = path.join(publicDir, 'index.html');
    this.app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(indexPath);
      }
      next();
    });

    // Central error boundary
    this.app.use((err, req, res, next) => {
      Logger.error(`Dashboard API Error: ${err.message}`);
      res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      if (this.server) return resolve(this.port);

      const tryBind = (portToTry, attemptsLeft = 5) => {
        const server = http.createServer(this.app);

        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
            Logger.warn(`Port ${portToTry} is in use, trying fallback port ${portToTry + 1}...`);
            tryBind(portToTry + 1, attemptsLeft - 1);
          } else {
            Logger.error(`Failed to start Web Dashboard on port ${portToTry}: ${err.message}`);
            reject(err);
          }
        });

        server.once('listening', () => {
          this.server = server;
          this.port = portToTry;
          // Attach WebSocket server on /api/ws
          WebSocketManager.attach(this.server, '/api/ws');
          Logger.success(`⚡ Web Control Center listening on http://localhost:${this.port}`);
          resolve(this.port);
        });

        server.listen(portToTry, this.host);
      };

      tryBind(this.port);
    });
  }

  stop() {
    return new Promise((resolve) => {
      WebSocketManager.close();
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = WebServer;
