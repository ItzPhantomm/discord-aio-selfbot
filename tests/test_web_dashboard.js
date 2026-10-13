const assert = require('assert');
const path = require('path');
const http = require('http');
const { WebSocket } = require('ws');
const SelfClient = require('../src/client/SelfClient');
const WebServer = require('../src/web/WebServer');

async function testWebDashboard() {
  console.log('Testing Web Dashboard & Nighty Control Center...');

  // Initialize selfclient with dummy config
  const selfClient = new SelfClient({
    token: 'YOUR_DISCORD_TOKEN_HERE',
    prefix: '.',
    dashboard: {
      port: 8086,
      host: '127.0.0.1',
      requirePassword: false
    }
  });

  // Load commands
  const commandsDir = path.join(__dirname, '../src/commands');
  selfClient.commandHandler.loadCommandsFromDir(commandsDir);

  const server = new WebServer(selfClient);
  const port = await server.start();
  console.log(` WebServer successfully bound and listening on port ${port}.`);

  const baseUrl = `http://127.0.0.1:${port}`;

  // Helper fetch json
  async function fetchJson(endpoint, options = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  }

  // 1. Test /api/auth/me
  const me = await fetchJson('/api/auth/me');
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.data.authenticated, true);
  console.log(' GET /api/auth/me passed.');

  // 2. Test /api/client/state
  const state = await fetchJson('/api/client/state');
  assert.strictEqual(state.status, 200);
  assert.strictEqual(state.data.prefix, '.');
  assert(state.data.control_state, 'Must have control_state');
  assert(state.data.connection_state, 'Must have connection_state');
  console.log(` GET /api/client/state passed (control_state: ${state.data.control_state}).`);

  // 3. Test /api/dashboard
  const dash = await fetchJson('/api/dashboard');
  assert.strictEqual(dash.status, 200);
  assert(dash.data.counts, 'Dashboard must have counts');
  assert(dash.data.counts.commands_total >= 600, 'Must reflect 600+ registered commands');
  console.log(` GET /api/dashboard passed (${dash.data.counts.commands_total} commands reflected).`);

  // 4. Test /api/commands
  const cmds = await fetchJson('/api/commands');
  assert.strictEqual(cmds.status, 200);
  assert(Array.isArray(cmds.data.commands), 'Commands must be an array');
  assert(cmds.data.commands.length >= 600, `Expected 600+ commands, got ${cmds.data.commands.length}`);
  const pingCmd = cmds.data.commands.find(c => c.name === 'ping');
  assert(pingCmd, 'Must find ping command');
  assert.strictEqual(pingCmd.category, 'General');
  console.log(` GET /api/commands passed (Discovered ${cmds.data.commands.length} commands).`);

  // 5. Test /api/presence
  const pres = await fetchJson('/api/presence');
  assert.strictEqual(pres.status, 200);
  assert(pres.data.status, 'Presence must have status');
  console.log(' GET /api/presence passed.');

  const updatePres = await fetchJson('/api/presence', {
    method: 'PUT',
    body: JSON.stringify({
      status: 'idle',
      activity: { type: 'playing', name: 'Testing Control Center' }
    })
  });
  assert.strictEqual(updatePres.status, 200);
  assert.strictEqual(updatePres.data.ok, true);
  console.log(' PUT /api/presence passed.');

  // 6. Test /api/console/execute
  const exec = await fetchJson('/api/console/execute', {
    method: 'POST',
    body: JSON.stringify({ command: 'help' })
  });
  assert.strictEqual(exec.status, 200);
  assert.strictEqual(exec.data.ok, true);
  assert(exec.data.output.includes('COMMAND'), 'Output must contain command help directory');
  console.log(' POST /api/console/execute passed (Executed ".help" remotely).');

  // 7. Test /api/console/complete
  const complete = await fetchJson('/api/console/complete?q=pin');
  assert.strictEqual(complete.status, 200);
  assert(Array.isArray(complete.data.suggestions));
  assert(complete.data.suggestions.some(s => s.name === 'ping'), 'Must complete "ping"');
  console.log(' GET /api/console/complete passed.');

  // 8. Test /api/themes and /api/themes/active
  const themes = await fetchJson('/api/themes');
  assert.strictEqual(themes.status, 200);
  assert(themes.data.themes.length >= 5, 'Must have at least 5 built-in themes');
  console.log(` GET /api/themes passed (${themes.data.themes.length} themes available).`);

  // 9. Test /api/backups (Create, List, Diff, Delete)
  const createBackup = await fetchJson('/api/backups', {
    method: 'POST',
    body: JSON.stringify({ label: 'Test Web Backup' })
  });
  assert.strictEqual(createBackup.status, 200);
  assert(createBackup.data.id, 'Must return backup with id');
  const backupId = createBackup.data.id;
  console.log(` POST /api/backups created backup ID ${backupId}.`);

  const listBackups = await fetchJson('/api/backups');
  assert(listBackups.data.backups.some(b => b.id === backupId), 'Must find created backup in list');
  console.log(' GET /api/backups list verified.');

  const delBackup = await fetchJson(`/api/backups/${backupId}`, { method: 'DELETE' });
  assert.strictEqual(delBackup.data.ok, true);
  console.log(' DELETE /api/backups/:id passed.');

  // 10. Test Static Asset Serving
  const htmlRes = await fetch(`${baseUrl}/`);
  assert.strictEqual(htmlRes.status, 200);
  const htmlText = await htmlRes.text();
  assert(htmlText.includes('Discord AIO'), 'HTML must contain dashboard brand');
  console.log(' GET / served index.html cleanly.');

  const cssRes = await fetch(`${baseUrl}/app/app.css`);
  assert.strictEqual(cssRes.status, 200);
  const cssText = await cssRes.text();
  assert(cssText.includes('--color-brand'), 'CSS must contain design system tokens');
  console.log(' GET /app/app.css served stylesheet cleanly.');

  // 11. Test Real-time WebSocket connection on /api/ws
  const ws = new WebSocket(`ws://127.0.0.1:${port}/api/ws`);
  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      ws.send('ping');
    });
    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'pong') {
        ws.close();
        resolve();
      }
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('WS connection timeout')), 3000);
  });
  console.log(' WebSocket /api/ws verified ping/pong protocol.');

  // Clean shutdown
  await server.stop();
  console.log(' WebServer stopped cleanly.');
  console.log(' ALL WEB DASHBOARD TESTS PASSED 100%!');
}

testWebDashboard().catch((err) => {
  console.error('Web Dashboard test failed:', err);
  process.exit(1);
});
