const assert = require('assert');
const path = require('path');
const FlawBotFrontend = require('../src/frontend/FlawBotFrontend');
const { FlawComponentsView, FLAW_THEME } = require('../src/frontend/FlawComponentsView');
const SelfClient = require('../src/client/SelfClient');

async function testFrontend() {
  console.log('Testing Flaw User-Installable Application Frontend...');

  const selfClient = new SelfClient({
    token: 'YOUR_DISCORD_TOKEN_HERE',
    prefix: '.'
  });

  const commandsDir = path.join(__dirname, '../src/commands');
  selfClient.commandHandler.loadCommandsFromDir(commandsDir);

  const frontend = new FlawBotFrontend(selfClient, {
    token: 'MTAwMDAwMDAwMDAwMDAwMDAw.fake.test',
    ownerId: '1449235608022286347',
    authorizedUsers: ['1449235608022286347', '123456789012345678']
  });

  // 1. Authorization checks
  assert.strictEqual(frontend.isAuthorized('1449235608022286347'), true, 'Primary owner must be authorized');
  assert.strictEqual(frontend.isAuthorized('123456789012345678'), true, 'Explicitly listed user must be authorized');
  assert.strictEqual(frontend.isAuthorized('999999999999999999'), false, 'Random user must be denied');
  assert.strictEqual(frontend.isAuthorized(null), false, 'Null user must be denied');
  console.log(' Server-side authorization checks passed 100%.');

  // 2. Overview Component View
  const overview = FlawComponentsView.buildOverview(selfClient.commandHandler, selfClient);
  assert(overview.embeds && overview.embeds.length === 1, 'Overview must have embed');
  assert(overview.components && overview.components.length === 2, 'Overview must have 2 action rows');
  assert.strictEqual(overview.embeds[0].data.title, 'FLAW / COMMAND CENTER');
  assert.strictEqual(overview.embeds[0].data.color, FLAW_THEME.ACCENT_COLOR);
  console.log(' Flaw Overview Components V2 view built cleanly.');

  // 3. Module List Component View
  const moduleList = FlawComponentsView.buildModuleList('utility', selfClient.commandHandler, 0);
  assert(moduleList.embeds && moduleList.embeds.length === 1);
  assert(moduleList.components && moduleList.components.length === 2);
  assert(moduleList.embeds[0].data.title.includes('UTILITY'));
  console.log(' Module list & command selector view built cleanly.');

  // 4. Command Detail Component View
  const cmdDetail = FlawComponentsView.buildCommandDetail('ping', selfClient.commandHandler);
  assert(cmdDetail.embeds && cmdDetail.embeds.length === 1);
  assert(cmdDetail.embeds[0].data.title.includes('.PING'));
  console.log(' Command syntax & parameter detail inspector view built cleanly.');

  // 5. Execution Bridge Test
  const mockInteraction = {
    user: { id: '1449235608022286347', tag: 'ItsLemon#0000' }
  };
  const execResult = await frontend.executeOnSelfbot('ping', mockInteraction);
  assert.strictEqual(execResult.success, true);
  assert(execResult.output.includes('WebSocket Latency') || execResult.output.includes('Optimal'), 'Ping output must be returned');
  console.log(' Frontend to selfbot execution bridge verified cleanly.');

  // 6. Slash Command Registry Groups Builder Test
  const SlashCommandRegistryBuilder = require('../src/frontend/SlashCommandRegistryBuilder');
  const slashCmds = SlashCommandRegistryBuilder.buildSlashCommands(selfClient.commandHandler);
  assert(slashCmds.length >= 25, `Expected 25+ modular slash command groups, got ${slashCmds.length}`);
  const opGroup = slashCmds.find(c => c.name.startsWith('op'));
  assert(opGroup, 'Must have OP command group');
  assert(opGroup.options && opGroup.options[0].choices.length > 0, 'Must have command choices');
  console.log(` SlashCommandRegistryBuilder verified: ${slashCmds.length} modular slash command groups generated.`);

  console.log(' ALL FLAW BOT FRONTEND TESTS PASSED 100%!');
}

testFrontend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
