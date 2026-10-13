const assert = require('assert');
const path = require('path');
const fs = require('fs');
const SelfClient = require('../src/client/SelfClient');
const Context = require('../src/client/Context');
const Logger = require('../src/utils/Logger');

async function runIntegrationSuite() {
  console.log('=== Running Full Discord AIO Selfbot Integration Test Suite ===');

  const configPath = path.join(__dirname, '../config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const selfClient = new SelfClient(config);
  const cmdsDir = path.join(__dirname, '../src/commands');
  selfClient.commandHandler.loadCommandsFromDir(cmdsDir);

  console.log(`[PASS] Loaded ${selfClient.commandHandler.commands.size} commands.`);
  assert(selfClient.commandHandler.commands.size >= 660, 'Command count under 660');

  // Verify execution of commands through Context in TUI mode
  console.log('Testing representative command executions...');

  const executedLogs = [];
  const fakeCtx = new Context({
    type: 'tui',
    client: selfClient.client,
    log: (msg) => executedLogs.push(msg)
  });

  // Test agent commands
  await selfClient.commandHandler.execute(fakeCtx, 'agentmodels');
  await selfClient.commandHandler.execute(fakeCtx, 'agenttools');
  await selfClient.commandHandler.execute(fakeCtx, 'agent Check server demographics and calculate 5 * 5');

  // Test ping
  await selfClient.commandHandler.execute(fakeCtx, 'ping');
  
  // Test help
  await selfClient.commandHandler.execute(fakeCtx, 'help');
  
  // Test calc
  await selfClient.commandHandler.execute(fakeCtx, 'calc 10 * 5 + 2');

  // Test text mock
  await selfClient.commandHandler.execute(fakeCtx, 'mock hello world');

  // Test base64 encode/decode
  await selfClient.commandHandler.execute(fakeCtx, 'base64 encode secret_test');

  // Test reverse
  await selfClient.commandHandler.execute(fakeCtx, 'reverse racecar');

  // Test autoresponder add & list
  await selfClient.commandHandler.execute(fakeCtx, 'autoresponder add test_trigger test_reply');
  await selfClient.commandHandler.execute(fakeCtx, 'autoresponder list');

  // Test todo add & list
  await selfClient.commandHandler.execute(fakeCtx, 'todo add Buy coffee');
  await selfClient.commandHandler.execute(fakeCtx, 'todo list');

  // Test reload
  await selfClient.commandHandler.execute(fakeCtx, 'reload');

  // Verify Web Dashboard Subsystem
  console.log('Testing Web Dashboard subsystem...');
  const WebServer = require('../src/web/WebServer');
  selfClient.config.dashboard = { port: 8085, host: '127.0.0.1', requirePassword: false };
  const webServer = new WebServer(selfClient);
  const webPort = await webServer.start();
  assert(webPort > 0, 'WebServer must start on valid port');
  const dashRes = await fetch(`http://127.0.0.1:${webPort}/api/dashboard`);
  assert.strictEqual(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert(dashData.counts.commands_total >= 660, 'Dashboard counts must reflect all commands');
  await webServer.stop();
  console.log(' Web Dashboard subsystem verified successfully.');

  console.log(' All representative command executions passed without error!');
  console.log('=== INTEGRATION TEST SUITE PASSED (100% GREEN) ===');
}

runIntegrationSuite().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
