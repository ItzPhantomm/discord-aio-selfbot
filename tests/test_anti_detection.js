const assert = require('assert');
const AntiDetection = require('../src/client/AntiDetection');

async function runTests() {
  console.log('Testing Anti-Detection & Account Hardening Engine...');

  const ad = new AntiDetection({
    safety: {
      minDeleteDelay: 50,
      maxDeleteDelay: 100,
      triggerDeleteDelay: 80,
      humanTyping: true
    }
  });

  // Test jitter generator
  const jitter = ad.getRandomJitter(50, 100);
  assert(jitter >= 50 && jitter <= 100, 'Jitter within bounds');
  console.log(` Humanized jitter calculation verified: ${jitter}ms.`);

  // Test rate-limit backoff handler
  ad.handleRateLimit(200);
  assert(ad.isBackoffActive === true, 'Backoff must be active after 429');
  assert(ad.backoffUntil > Date.now(), 'Backoff timer must be set into future');
  console.log(' 429 rate limit backoff engaged correctly.');

  // Wait out backoff
  await ad.checkBackoff();
  assert(ad.isBackoffActive === false, 'Backoff must expire after wait');
  console.log(' Rate limit backoff recovery verified.');

  // Test safe delete simulation
  let deleted = false;
  const mockMsg = {
    deletable: true,
    delete: async () => { deleted = true; }
  };
  await ad.safeDelete(mockMsg, 20);
  assert.strictEqual(deleted, true, 'Message must be deleted safely');
  console.log(' Safe humanized message deletion verified.');

  console.log(' AntiDetection tests passed 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
