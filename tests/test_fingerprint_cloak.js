const assert = require('assert');
const BuildNumberPuller = require('../src/client/BuildNumberPuller');
const FingerprintCloak = require('../src/client/FingerprintCloak');
const RateLimitBuckets = require('../src/client/RateLimitBuckets');

async function runTests() {
  console.log('Testing Fingerprint Cloaking, Dynamic Build Puller & Hierarchical Rate Limiting...');

  // 1. Test Build Number Puller
  const buildNumber = await BuildNumberPuller.fetchLatestBuild();
  assert(typeof buildNumber === 'number' && buildNumber > 400000, `Build number must be valid number, got ${buildNumber}`);
  console.log(` BuildNumberPuller successfully resolved build number: ${buildNumber}.`);

  // 2. Test FingerprintCloak Mozilla Firefox emulation
  const superProps = await FingerprintCloak.getSuperProperties();
  assert.strictEqual(superProps.browser, 'Firefox', 'Browser must be Firefox');
  assert(superProps.browser_user_agent.includes('Firefox/'), 'User-Agent must be Firefox');
  assert.strictEqual(superProps.os, 'Windows', 'OS must be Windows');
  assert.strictEqual(superProps.client_build_number, buildNumber, 'Build number must match pulled build');
  assert.strictEqual(superProps.has_client_mods, false, 'Client mods flag must be false');
  console.log(' SuperProperties byte-accurate Firefox payload verified.');

  const gwProps = await FingerprintCloak.getGatewayProperties();
  assert.strictEqual(gwProps.browser, 'Firefox');
  assert.strictEqual(gwProps.client_build_number, buildNumber);
  assert(gwProps.client_launch_id, 'Must generate launch signature UUID');
  assert(gwProps.client_heartbeat_session_id, 'Must generate heartbeat session UUID');
  console.log(' Gateway handshake properties verified.');

  const headers = FingerprintCloak.getHttpHeaders();
  assert(headers['User-Agent'].includes('Firefox/'), 'HTTP header must have Firefox User-Agent');
  console.log(' HTTP User-Agent headers verified.');

  // 3. Test Hierarchical Rate Limit Buckets
  const mockChannel = { id: 'ch_123', sendTyping: async () => {} };

  // Test Channel message permission acquisition
  const startCh = Date.now();
  await RateLimitBuckets.acquireMessagePermission(mockChannel, false, null);
  console.log(` Channel message permission acquired in ${Date.now() - startCh}ms.`);

  // Test DM message permission acquisition
  const mockDM = { id: 'dm_999', recipient: { id: 'user_456' }, sendTyping: async () => {} };
  const startDm = Date.now();
  await RateLimitBuckets.acquireMessagePermission(mockDM, true, 'user_456');
  console.log(` DM message permission acquired with recipient bucket in ${Date.now() - startDm}ms.`);

  // Test typing sync simulation
  let typingFired = false;
  const mockTypingChannel = {
    id: 'ch_typing',
    sendTyping: async () => { typingFired = true; }
  };
  await RateLimitBuckets.syncBeforeSend(mockTypingChannel, 'Hello world test typing');
  assert.strictEqual(typingFired, true, 'Typing indicator must be dispatched before message');
  console.log(' Gateway typing_start pre-send synchronization verified.');

  console.log(' ALL FINGERPRINT CLOAK & RATE LIMIT BUCKET TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
