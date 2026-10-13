const assert = require('assert');
const ModelRegistry = require('../src/agent/providers/ModelRegistry');
const ProviderManager = require('../src/agent/providers/ProviderManager');

async function runTests() {
  console.log('Testing Multi-Provider Support, Model Search & Automatic Failover...');

  // 1. Test Model Search by Name
  console.log('1. Testing Model Search...');
  const claudeResults = ModelRegistry.search('claude');
  assert(claudeResults.length > 0, 'Must find Claude models');
  assert.strictEqual(claudeResults[0].provider, 'openrouter');

  const llamaResults = ModelRegistry.search('llama');
  assert(llamaResults.length >= 2, 'Must find multiple Llama models across providers');

  const nimOnlyResults = ModelRegistry.search('llama', 'nvidia');
  assert(nimOnlyResults.every(m => m.provider === 'nvidia'), 'Must filter by provider');
  console.log(` Model search verified (${claudeResults.length} Claude, ${llamaResults.length} Llama matches).`);

  // 2. Test Masked API Keys
  console.log('2. Testing Masked API Keys...');
  ProviderManager.setApiKey('openrouter', 'sk-or-v1-abcdef1234567890abcdef1234567890');
  ProviderManager.setApiKey('nvidia', 'nvapi-1234567890abcdef1234567890abcdef');

  const orMasked = ProviderManager.getMaskedKey('openrouter');
  const nimMasked = ProviderManager.getMaskedKey('nvidia');
  assert(orMasked.startsWith('sk-or-'), 'OpenRouter masked key format');
  assert(orMasked.includes('...'), 'Must contain mask ellipsis');
  assert(nimMasked.startsWith('nvapi-'), 'NVIDIA masked key format');
  console.log(` Masked keys verified (OpenRouter: ${orMasked}, NVIDIA: ${nimMasked}).`);

  // 3. Test Automatic Failover on 429 / Rate Limit
  console.log('3. Testing Automatic Provider Failover...');
  let failoverEmitted = false;
  let failoverDetails = null;

  // Temporarily stub _executeWithProvider to simulate 429 on primary
  const originalExecute = ProviderManager._executeWithProvider.bind(ProviderManager);
  ProviderManager._executeWithProvider = async (providerId, params) => {
    if (providerId === 'openrouter') {
      const rateLimitErr = new Error('Rate limit exceeded (HTTP 429): Free quota exhausted');
      rateLimitErr.status = 429;
      throw rateLimitErr;
    }
    // Fallback provider succeeds
    return {
      content: `Response delivered by fallback provider [${providerId}]!`,
      tool_calls: null,
      usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
      finish_reason: 'stop'
    };
  };

  ProviderManager.setPrimary('openrouter');

  const res = await ProviderManager.chatCompletion({
    messages: [{ role: 'user', content: 'Test prompt' }],
    onProgress: (p) => {
      if (p.type === 'provider_failover') {
        failoverEmitted = true;
        failoverDetails = p;
      }
    }
  });

  // Restore original execution method and clean keys
  ProviderManager._executeWithProvider = originalExecute;
  ProviderManager.setApiKey('openrouter', '');
  ProviderManager.setApiKey('nvidia', '');
  ProviderManager.saveToConfig();

  assert(failoverEmitted, 'Failover event must be emitted when primary hits limit');
  assert.strictEqual(failoverDetails.fromProvider, 'openrouter');
  assert.strictEqual(failoverDetails.toProvider, 'nvidia');
  assert(res.content.includes('fallback provider [nvidia]'), 'Must return response from fallback provider');

  console.log(` Automatic Failover verified: [${failoverDetails.fromProvider}] ➔ [${failoverDetails.toProvider}] seamlessly executed!`);
  console.log(' Multi-Provider & Automatic Failover tests passed 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
