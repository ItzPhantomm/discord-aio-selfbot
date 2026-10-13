const assert = require('assert');
const path = require('path');
const fs = require('fs');
const SessionManager = require('../src/agent/core/SessionManager');
const AuditLogger = require('../src/agent/core/AuditLogger');

async function runTests() {
  console.log('Testing SessionManager & AuditLogger...');

  // Test AuditLogger sanitization of Discord tokens and API keys
  const sensitiveString = 'User token is MTExMTExMTExMTExMTExMTExMTExMTEx.GXXXXX.1oR0ZrFhXXXXXXXXXXXXXXXXXXX and key nvapi-abcdef1234567890abcdef1234567890';
  const sanitized = AuditLogger.sanitize(sensitiveString);

  assert(!sanitized.includes('1oR0ZrFh'), 'Discord token must be redacted');
  assert(!sanitized.includes('nvapi-abcdef'), 'NVIDIA key must be redacted');
  assert(sanitized.includes('[REDACTED_DISCORD_TOKEN]'));
  assert(sanitized.includes('[REDACTED_NVIDIA_KEY]'));
  console.log(' AuditLogger token and key sanitization verified.');

  // Test AuditLogger logging
  AuditLogger.log({
    type: 'TEST_AUDIT',
    action: 'verify_privacy',
    details: { sample: 'safe content' }
  });
  const logs = AuditLogger.getRecentLogs(5);
  assert(logs.length > 0, 'Audit logs must be written');
  console.log(` Audit logs active and accessible (${logs.length} entries).`);

  // Test SessionManager session lifecycle
  const testId = `test_sess_${Date.now()}`;
  const sess = SessionManager.createSession(testId, { purpose: 'testing' });
  assert.strictEqual(sess.id, testId);

  SessionManager.addMessage(testId, { role: 'user', content: 'Hello agent' });
  SessionManager.addMessage(testId, { role: 'assistant', content: 'Hello user' });

  const fetched = SessionManager.getSession(testId);
  assert.strictEqual(fetched.messages.length, 2);

  // Test context pruning
  for (let i = 0; i < 40; i++) {
    SessionManager.addMessage(testId, { role: 'user', content: `Message ${i}` });
  }
  const pruned = SessionManager.pruneContext(testId, 15);
  assert.strictEqual(pruned.length, 15);
  console.log(' SessionManager context sliding window pruning verified.');

  // Clean up test session
  SessionManager.deleteSession(testId);
  assert(SessionManager.getSession(testId) === null);
  console.log(' SessionManager session lifecycle and persistence verified.');

  console.log(' SessionManager & AuditLogger tests passed 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
