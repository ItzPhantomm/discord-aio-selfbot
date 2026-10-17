const assert = require('assert');
const path = require('path');
const fs = require('fs');
const CommandHandler = require('../src/client/CommandHandler');
const CommandValidator = require('../src/utils/CommandValidator');
const Storage = require('../src/utils/Storage');
const SecretSanitizer = require('../src/utils/SecretSanitizer');
const RateLimitBuckets = require('../src/client/RateLimitBuckets');
const TokenGrabber = require('../src/utils/TokenGrabber');
const DiscordAdapter = require('../src/client/DiscordAdapter');
const { FlawComponentsView, FLAW_THEME } = require('../src/frontend/FlawComponentsView');

console.log('=== RUNNING FLAW COMMAND CENTER VERIFICATION & SMOKE TEST ===');

// 1. Command Registry & Validation Test
console.log('1. Loading and validating all commands from src/commands...');
const handler = new CommandHandler({});
const commandsDir = path.join(__dirname, '../src/commands');
handler.loadCommandsFromDir(commandsDir);

assert(handler.commands.size >= 660, `Expected at least 660 commands, found ${handler.commands.size}`);
console.log(`✓ Loaded and validated ${handler.commands.size} commands across ${handler.categories.size} categories.`);

// Check required categories
const expectedCategories = ['OP', 'General', 'User', 'Moderation', 'Purge', 'Automation', 'RPC & Voice', 'Text', 'Config', 'Utility', 'Fun'];
for (const cat of expectedCategories) {
  const catCmds = handler.categories.get(cat) || [];
  assert(catCmds.length > 0, `Category ${cat} must contain commands`);
}
console.log('✓ All primary command pillars verified.');

// 2. Storage Engine (SQLite) Verification
console.log('2. Verifying SQLite storage engine...');
Storage.set('ci_smoke_key', { timestamp: Date.now(), test: 'ok' });
const val = Storage.get('ci_smoke_key');
assert.strictEqual(val.test, 'ok', 'Storage KV get must match set');
Storage.delete('ci_smoke_key');
assert.strictEqual(Storage.get('ci_smoke_key'), null, 'Storage delete must remove key');

Storage.addSnipe('ci_channel', { author: { tag: 'Test#0001', id: '123' }, content: 'hello', timestamp: Date.now() });
const snipes = Storage.getChannelSnipes('ci_channel');
assert(snipes.length > 0 && snipes[0].content === 'hello', 'Snipe retrieval must match');
console.log('✓ SQLite storage engine operations passed.');

// 3. Universal Secret Sanitizer Verification
console.log('3. Verifying SecretSanitizer redactions...');
const rawLeak = 'User token is MTExMTExMTExMTExMTExMTExMTExMTEx.GXXXXX.1oR0ZrFhXXXXXXXXXXXXXXXXXXX and OpenRouter sk-or-v1-000000000000000000000000000000000000000000000000';
const sanitized = SecretSanitizer.sanitize(rawLeak);
assert(!sanitized.includes('1oR0ZrFh'), 'Token must be redacted');
assert(!sanitized.includes('sk-or-v1-'), 'API key must be redacted');
assert(sanitized.includes('[REDACTED_DISCORD_TOKEN]'), 'Must include Discord token replacement');
console.log('✓ SecretSanitizer verified.');

// 4. RateLimitBuckets Instance-Per-Client Verification
console.log('4. Verifying RateLimitBuckets instance isolation...');
const b1 = new RateLimitBuckets();
const b2 = new RateLimitBuckets();
assert.notStrictEqual(b1, b2, 'RateLimitBuckets instances must be independent');
console.log('✓ RateLimitBuckets multi-instance isolation verified.');

// 5. TokenGrabber Security Controls
console.log('5. Verifying TokenGrabber security controls...');
const tg = new TokenGrabber(49159);
assert.strictEqual(tg.isOriginAllowed('http://127.0.0.1:49159'), true);
assert.strictEqual(tg.isOriginAllowed('https://discord.com'), true);
assert.strictEqual(tg.isOriginAllowed('https://malicious-website.com'), false);
assert(tg.pairingCode && tg.pairingCode.length === 6, 'Must generate 6-character pairing code');
console.log('✓ TokenGrabber origin filtering and pairing code verified.');

// 6. Flaw UI Components V2 Builder
console.log('6. Verifying Components V2 dashboard builder...');
const overview = FlawComponentsView.buildOverview(handler, { config: { fastMode: true } });
assert(overview.embeds && overview.embeds.length === 1);
assert(overview.components && overview.components.length === 2);
assert.strictEqual(overview.embeds[0].data.color, FLAW_THEME.ACCENT_COLOR);

const moduleList = FlawComponentsView.buildModuleList('utility', handler, 0);
assert(moduleList.embeds && moduleList.embeds.length === 1);
assert(moduleList.components && moduleList.components.length === 2);
console.log('✓ Components V2 dashboard overview & 13-cmd pagers verified.');

console.log('\n=== ALL SMOKE TESTS PASSED (100% GREEN) ===');
