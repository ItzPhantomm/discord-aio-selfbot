const http = require('http');
const Logger = require('../utils/Logger');

/**
 * Mobile-Optimized Discord Token Extractor & Auto-Sync Server
 * Starts an interactive web portal accessible from phone browsers.
 * Features 1-Tap Bookmarklet, Instant Console Copy, and Direct Browser Session Extractor.
 */
class TokenGrabber {
  constructor(port = 49152) {
    this.port = port;
    this.server = null;
    this.tokenReceivedCallback = null;
  }

  // Pure JavaScript browser snippet for extracting Discord token
  static getConsoleSnippet(localPort = 49152) {
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
      const targetHost = (window.location && window.location.hostname && window.location.hostname !== 'discord.com') ? window.location.hostname : '127.0.0.1';
      fetch('http://' + targetHost + ':${localPort}/submit?token=' + encodeURIComponent(token), { mode: 'no-cors' }).catch(()=>{});
      fetch('http://127.0.0.1:${localPort}/submit?token=' + encodeURIComponent(token), { mode: 'no-cors' }).catch(()=>{});
      alert('✅ Discord Token Captured & Transferred to Selfbot!\n\nToken: ' + token.slice(0, 15) + '...');
      return token;
    } else {
      alert('⚠️ Could not extract token. Please ensure you are logged into discord.com/app in this browser tab!');
    }
  } catch(e) {
    alert('Extraction Error: ' + e.message);
  }
})();`.replace(/\n\s*/g, ' ');
  }

  static getBookmarklet(localPort = 49152) {
    return `javascript:${encodeURIComponent(TokenGrabber.getConsoleSnippet(localPort))}`;
  }

  startServer(onTokenReceived) {
    if (this.server) return;
    this.tokenReceivedCallback = onTokenReceived;

    this.server = http.createServer((req, res) => {
      // Enable CORS for cross-origin mobile browser submission
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
      }

      const urlObj = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

      // Token submission endpoint
      if (urlObj.pathname === '/submit') {
        const token = urlObj.searchParams.get('token');
        if (token && token.length > 20) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Token Received</title>
  <style>
    body { background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; }
    .card { background: #111; border: 1px solid #333; border-radius: 12px; padding: 30px; max-width: 450px; margin: 0 auto; }
    h2 { color: #57E6A5; margin-top: 0; }
    p { color: #aaa; font-size: 15px; line-height: 1.5; }
    .badge { background: #222; border: 1px solid #444; border-radius: 6px; padding: 10px; font-family: monospace; word-break: break-all; margin: 15px 0; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <h2>✅ TOKEN RECEIVED</h2>
    <p>Your authorization token was transferred to the Discord Selfbot and saved to config.json automatically.</p>
    <div class="badge">${token.slice(0, 15)}...${token.slice(-6)}</div>
    <p>You can close this tab and return to your terminal.</p>
  </div>
</body>
</html>`);

          Logger.success(`Token received via Mobile Browser Portal! Account connecting...`);
          if (this.tokenReceivedCallback) {
            this.tokenReceivedCallback(token);
          }
          return;
        }
      }

      // Root Mobile Token Extractor Portal
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const jsSnippet = TokenGrabber.getConsoleSnippet(this.port);
      const bookmarkletLink = TokenGrabber.getBookmarklet(this.port);

      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>Discord Mobile Token Extractor</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #000000;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 520px;
      background: #080808;
      border: 1px solid #222222;
      border-radius: 16px;
      padding: 24px;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 20px;
      margin: 0 0 8px 0;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #888888;
      font-size: 13px;
      margin: 0;
      line-height: 1.4;
    }
    .step-card {
      background: #111111;
      border: 1px solid #222222;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .step-card h3 {
      font-size: 14px;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      color: #FFFFFF;
    }
    .badge-num {
      background: #FFFFFF;
      color: #000000;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      margin-right: 8px;
    }
    .desc {
      font-size: 13px;
      color: #999999;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: #FFFFFF;
      color: #000000;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:active {
      opacity: 0.8;
    }
    .btn-secondary {
      background: #1A1A1A;
      color: #FFFFFF;
      border: 1px solid #333333;
    }
    .code-box {
      background: #000000;
      border: 1px solid #222222;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 11px;
      color: #CCCCCC;
      word-break: break-all;
      max-height: 90px;
      overflow-y: auto;
      margin-bottom: 10px;
    }
    .status-area {
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      background: #111111;
      border: 1px dashed #333333;
      font-size: 12px;
      color: #777777;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #57E6A5;
      color: #000000;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>◈ DISCORD TOKEN EXTRACTOR</h1>
      <p>1-Tap Mobile Browser Extraction & Auto-Sync to Terminal</p>
    </div>

    <!-- METHOD 1: Mobile 1-Tap Copy & Discord Launch -->
    <div class="step-card">
      <h3><span class="badge-num">1</span> Recommended for Mobile (Chrome / Kiwi / Safari)</h3>
      <div class="desc">
        Click below to copy the JS extractor. Then open Discord Web, paste into URL bar with <code>javascript:</code> in front (or inspect console), and your token auto-syncs!
      </div>
      <button class="btn" onclick="copyJsCode()">📋 Copy JS Extractor Code</button>
      <div style="height: 10px;"></div>
      <a href="https://discord.com/app" target="_blank" class="btn btn-secondary">🌐 Open Discord Web in New Tab</a>
    </div>

    <!-- METHOD 2: Direct Token Input & Sync -->
    <div class="step-card">
      <h3><span class="badge-num">2</span> Manual / Direct Token Paste</h3>
      <div class="desc">
        Already have your token? Paste it directly here and tap Sync to transfer it into the running terminal selfbot without restarting.
      </div>
      <input type="text" id="manualToken" placeholder="Paste Discord token here..." style="width:100%;padding:12px;background:#000;border:1px solid #333;color:#fff;border-radius:8px;font-size:13px;margin-bottom:10px;">
      <button class="btn btn-secondary" onclick="submitManualToken()">⚡ Sync Token to Selfbot</button>
    </div>

    <!-- Raw JS Reference -->
    <div class="step-card">
      <h3><span class="badge-num">3</span> Extractor Code Reference</h3>
      <div class="code-box" id="codeText">${jsSnippet}</div>
      <button class="btn btn-secondary" style="font-size:12px;padding:8px;" onclick="copyBookmarklet()">Copy Bookmarklet URL</button>
    </div>

    <div class="status-area" id="statusMsg">
      🟢 Bridge Server Active on Port ${this.port}
    </div>
  </div>

  <div class="toast" id="toast">Copied to Clipboard!</div>

  <script>
    const jsCode = ${JSON.stringify(jsSnippet)};
    const bookmarkletUrl = ${JSON.stringify(bookmarkletLink)};

    function showToast(text) {
      const t = document.getElementById('toast');
      t.innerText = text;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 2500);
    }

    function copyJsCode() {
      navigator.clipboard.writeText(jsCode).then(() => {
        showToast('✅ Extractor Code Copied! Now open Discord Web');
      }).catch(() => {
        showToast('Please copy code manually from box below');
      });
    }

    function copyBookmarklet() {
      navigator.clipboard.writeText(bookmarkletUrl).then(() => {
        showToast('✅ Bookmarklet URL Copied!');
      });
    }

    function submitManualToken() {
      const val = document.getElementById('manualToken').value.trim();
      if (!val) return alert('Please enter token.');
      window.location.href = '/submit?token=' + encodeURIComponent(val);
    }
  </script>
</body>
</html>`);
    });

    // Listen on 0.0.0.0 so phone on same Wi-Fi / localhost can connect
    this.server.listen(this.port, '0.0.0.0', () => {
      Logger.info(`Mobile Token Extractor Web Portal ready on http://localhost:${this.port}`);
    }).on('error', (err) => {
      // Ignore if port already occupied
    });
  }

  stopServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = TokenGrabber;
