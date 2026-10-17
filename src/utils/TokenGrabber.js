const http = require('http');
const crypto = require('crypto');
const Logger = require('./Logger');

/**
 * Hardened Local Discord Token Extractor & Auto-Sync Server
 * - Binds strictly to 127.0.0.1 (loopback interface only)
 * - Requires a cryptographically generated one-time pairing code
 * - Validates Origin/Referer to reject unauthorized origins
 * - Automatically shuts down after first successful token submission or after 5-minute timeout
 */
class TokenGrabber {
  constructor(port = 49152) {
    this.port = port;
    this.server = null;
    this.tokenReceivedCallback = null;
    this.pairingCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex code
    this.timeoutTimer = null;
    this.isCompleted = false;
  }

  // Pure JavaScript browser snippet for extracting Discord token with pairing code verification
  static getConsoleSnippet(localPort = 49152, pairingCode = '') {
    return `(function(){
  try {
    let token = null;
    if (window.webpackChunkdiscord_app) {
      window.webpackChunkdiscord_app.push([
        [Math.random()], {}, (req) => {
          for (const m of Object.keys(req.c)) {
            if (req.c[m].exports && req.c[m].exports.default && req.c[m].exports.default.getToken) {
              token = req.c[m].exports.default.getToken();
              break;
            }
          }
        }
      ]);
    }
    if (!token) {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      token = iframe.contentWindow.localStorage.token ? JSON.parse(iframe.contentWindow.localStorage.token) : null;
      document.body.removeChild(iframe);
    }
    if (token) {
      console.log('%c[TOKEN CAPTURED]', 'color:#00ff00;font-weight:bold;font-size:16px;', token);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(token).catch(()=>{});
      }
      const codeParam = encodeURIComponent('${pairingCode}');
      const tokenParam = encodeURIComponent(token);
      fetch('http://127.0.0.1:${localPort}/submit?token=' + tokenParam + '&code=' + codeParam, { mode: 'cors' })
        .then(() => alert('Discord Token securely verified & transferred to Selfbot!'))
        .catch(() => alert('Transferred to local loopback listener.'));
      return token;
    } else {
      alert('Could not extract token. Please ensure you are logged into discord.com/app in this browser tab.');
    }
  } catch(e) {
    alert('Extraction Error: ' + e.message);
  }
})();`.replace(/\n\s*/g, ' ');
  }

  static getBookmarklet(localPort = 49152, pairingCode = '') {
    return `javascript:${encodeURIComponent(TokenGrabber.getConsoleSnippet(localPort, pairingCode))}`;
  }

  isOriginAllowed(origin) {
    if (!origin) return true; // Direct local navigation without origin header
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') return true;
      if (parsed.hostname === 'discord.com' || parsed.hostname.endsWith('.discord.com')) return true;
    } catch {
      return false;
    }
    return false;
  }

  startServer(onTokenReceived) {
    if (this.server || this.isCompleted) return;
    this.tokenReceivedCallback = onTokenReceived;

    this.server = http.createServer((req, res) => {
      const origin = req.headers.origin || req.headers.referer;

      if (origin && !this.isOriginAllowed(origin)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Forbidden: Unauthorized Origin');
      }

      // Restrict CORS strictly to allowed origins
      const allowedOrigin = (origin && this.isOriginAllowed(origin)) ? origin : `http://127.0.0.1:${this.port}`;
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      const urlObj = new URL(req.url, `http://127.0.0.1:${this.port}`);

      // Token submission endpoint with pairing code verification
      if (urlObj.pathname === '/submit') {
        const token = urlObj.searchParams.get('token');
        const code = urlObj.searchParams.get('code');

        if (!code || code.toUpperCase() !== this.pairingCode) {
          Logger.warn(`TokenGrabber rejected unauthorized submission attempt (invalid pairing code).`);
          res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(`<!DOCTYPE html><html><body style="background:#000;color:#ff5555;font-family:sans-serif;text-align:center;padding:50px;">
            <h2>401 Unauthorized</h2>
            <p>Invalid or missing one-time pairing code.</p>
          </body></html>`);
        }

        if (token && token.length > 20) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Token Received</title>
  <style>
    body { background: #0b0c0e; color: #fff; font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; }
    .card { background: #121418; border: 1px solid #222; border-radius: 12px; padding: 30px; max-width: 450px; margin: 0 auto; }
    h2 { color: #C8FF64; margin-top: 0; }
    p { color: #aaa; font-size: 15px; line-height: 1.5; }
    .badge { background: #1a1d24; border: 1px solid #333; border-radius: 6px; padding: 10px; font-family: monospace; word-break: break-all; margin: 15px 0; color: #C8FF64; }
  </style>
</head>
<body>
  <div class="card">
    <h2>AUTHENTICATED & TRANSFERRED</h2>
    <p>Pairing code verified. Your authorization token was safely transferred to the Flaw engine.</p>
    <div class="badge">${token.slice(0, 15)}...${token.slice(-6)}</div>
    <p>The local helper server is now closed. Return to your terminal.</p>
  </div>
</body>
</html>`);

          Logger.success(`Token successfully verified with pairing code ${this.pairingCode}! Connecting gateway...`);
          this.isCompleted = true;

          // Dispatch callback
          if (this.tokenReceivedCallback) {
            this.tokenReceivedCallback(token);
          }

          // Automatically shut down server immediately after first use
          setImmediate(() => {
            this.stopServer();
            Logger.info('TokenGrabber helper server closed automatically after successful acquisition.');
          });
          return;
        }
      }

      // Root Local Token Extractor Portal (requires pairing code in query or shows pairing prompt)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const jsSnippet = TokenGrabber.getConsoleSnippet(this.port, this.pairingCode);
      const bookmarkletLink = TokenGrabber.getBookmarklet(this.port, this.pairingCode);

      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>Flaw Token Setup</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #0b0c0e; color: #FFFFFF; font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; }
    .container { width: 100%; max-width: 520px; background: #111317; border: 1px solid #222; border-radius: 14px; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 6px 0; color: #C8FF64; }
    p { font-size: 13px; color: #888; margin: 0 0 16px 0; }
    .pin-box { background: #1a1d24; border: 1px dashed #C8FF64; border-radius: 8px; padding: 12px; margin-bottom: 20px; text-align: center; }
    .pin-code { font-family: monospace; font-size: 20px; font-weight: bold; color: #C8FF64; letter-spacing: 3px; }
    .card { background: #16191f; border: 1px solid #252830; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .btn { background: #C8FF64; color: #000; font-weight: bold; border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 13px; }
    .btn-secondary { background: #222630; color: #fff; margin-top: 8px; }
    input { width: 100%; padding: 10px; background: #0b0c0e; border: 1px solid #333; color: #fff; border-radius: 6px; font-size: 13px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>FLAW TOKEN HELPER</h1>
    <p>Local loopback token transfer with one-time authentication.</p>
    <div class="pin-box">
      <div style="font-size:11px;color:#aaa;margin-bottom:4px;">ONE-TIME PAIRING CODE</div>
      <div class="pin-code">${this.pairingCode}</div>
    </div>
    <div class="card">
      <div style="font-weight:bold;font-size:14px;margin-bottom:8px;">1. Browser Extractor</div>
      <p>Copy the verified snippet and run it in your logged-in discord.com tab:</p>
      <button class="btn" onclick="copyJsCode()">Copy Authenticated Snippet</button>
    </div>
    <div class="card">
      <div style="font-weight:bold;font-size:14px;margin-bottom:8px;">2. Direct Paste</div>
      <input type="text" id="manualToken" placeholder="Paste Discord token here...">
      <button class="btn btn-secondary" onclick="submitManualToken()">Verify & Sync</button>
    </div>
  </div>
  <script>
    const jsCode = ${JSON.stringify(jsSnippet)};
    function copyJsCode() {
      navigator.clipboard.writeText(jsCode).then(() => alert('Snippet copied! Paste into discord.com browser console.')).catch(() => prompt('Copy code manually:', jsCode));
    }
    function submitManualToken() {
      const val = document.getElementById('manualToken').value.trim();
      if (!val) return alert('Token required');
      window.location.href = '/submit?token=' + encodeURIComponent(val) + '&code=' + encodeURIComponent('${this.pairingCode}');
    }
  </script>
</body>
</html>`);
    });

    // Bind strictly to 127.0.0.1 (never 0.0.0.0)
    this.server.listen(this.port, '127.0.0.1', () => {
      Logger.info(`Token Setup Helper listening on http://127.0.0.1:${this.port} [Pairing Code: ${this.pairingCode}]`);
    }).on('error', () => {
      // Port in use or permission denied
    });

    // Auto-close after 5 minutes to prevent leaving server open indefinitely
    this.timeoutTimer = setTimeout(() => {
      if (!this.isCompleted && this.server) {
        Logger.info('TokenGrabber 5-minute timeout reached. Closing listener.');
        this.stopServer();
      }
    }, 5 * 60 * 1000);
  }

  stopServer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = TokenGrabber;
