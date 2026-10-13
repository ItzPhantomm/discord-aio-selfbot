const assert = require('assert');
const SecretSanitizer = require('../src/utils/SecretSanitizer');
const Logger = require('../src/utils/Logger');
const Banner = require('../src/cli/Banner');

async function testCliAndSecurity() {
  console.log('Testing Active CLI & Universal Secret Sanitizer...');

  // 1. Test SecretSanitizer redactions
  const fakeToken = 'MTExMTExMTExMTExMTExMTExMTExMTEx.GXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXX';
  const fakeOrKey = 'sk-or-v1-000000000000000000000000000000000000000000000000';
  const fakeNimKey = 'nvapi-000000000000000000000000000000000000000000000000';

  const rawLog = `Connecting with token ${fakeToken}, OpenRouter ${fakeOrKey}, and NIM ${fakeNimKey}`;
  const sanitized = SecretSanitizer.sanitize(rawLog);

  assert(!sanitized.includes(fakeToken), 'Discord token must be redacted');
  assert(!sanitized.includes(fakeOrKey), 'OpenRouter key must be redacted');
  assert(!sanitized.includes(fakeNimKey), 'NVIDIA key must be redacted');
  assert(sanitized.includes('[REDACTED_DISCORD_TOKEN]'));
  assert(sanitized.includes('[REDACTED_OPENROUTER_KEY]'));
  assert(sanitized.includes('[REDACTED_NVIDIA_KEY]'));
  console.log(' SecretSanitizer verified all credentials sanitized.');

  // 2. Test Logger CLI output hook
  let capturedLog = null;
  Logger.setCliHandler((line) => {
    capturedLog = line;
  });

  Logger.cmd(`Executing test command with token ${fakeToken}`);
  assert(capturedLog !== null, 'Logger CLI handler must receive log line');
  assert(!capturedLog.includes(fakeToken), 'Logger output must be sanitized');
  assert(capturedLog.includes('[REDACTED_DISCORD_TOKEN]'));
  assert(capturedLog.includes('CMD'));
  console.log(' Logger CLI stream hook and formatting verified.');

  // 3. Test Banner rendering
  console.log('Testing Banner rendering...');
  Banner.render(null, null);
  console.log(' Banner rendering completed cleanly.');

  console.log(' Active CLI & Security tests passed 100%!');
}

testCliAndSecurity().catch(err => {
  console.error('CLI test failed:', err);
  process.exit(1);
});
