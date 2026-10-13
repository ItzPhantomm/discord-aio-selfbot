const assert = require('assert');
const ModelRegistry = require('../src/agent/providers/ModelRegistry');
const NvidiaNimClient = require('../src/agent/providers/NvidiaNimClient');

async function runTests() {
  console.log('Testing ModelRegistry & NvidiaNimClient...');

  // Test ModelRegistry catalog
  const models = ModelRegistry.list();
  assert(models.length >= 5, 'Model catalog must list at least 5 models');
  const defaultModel = ModelRegistry.get();
  assert(defaultModel.name.includes('nemotron') || defaultModel.name.includes('llama'), 'Default model name match');

  const highBudget = ModelRegistry.getBudget('high');
  assert.strictEqual(highBudget.maxSteps, 12);
  assert.strictEqual(highBudget.tokenBudget, 8192);

  const lowBudget = ModelRegistry.getBudget('low');
  assert.strictEqual(lowBudget.maxSteps, 4);

  console.log(' ModelRegistry catalogs and reasoning budgets verified.');

  // Test NimClient deterministic fallback
  const client = new NvidiaNimClient({ apiKey: 'none' });
  client.apiKey = null;
  const mockTools = [
    {
      type: 'function',
      function: {
        name: 'get_server_info',
        description: 'Server metrics',
        parameters: { type: 'object', properties: {} }
      }
    }
  ];

  const res = await client.chatCompletion({
    messages: [{ role: 'user', content: 'Inspect the server demographics and member counts' }],
    tools: mockTools
  });

  assert(res.tool_calls !== null, 'Client should return tool_calls for server inquiry');
  assert.strictEqual(res.tool_calls[0].function.name, 'get_server_info');
  console.log(' Client fallback intent parser correctly matched tool_calls.');

  // Test streaming token output
  let streamCount = 0;
  await client.chatCompletion({
    messages: [
      { role: 'user', content: 'What is the server info?' },
      { role: 'tool', tool_call_id: 'call_1', content: '{"name": "Alpha", "members": 50}' }
    ],
    stream: true,
    onChunk: (chunk) => {
      if (chunk.text) streamCount++;
    }
  });

  assert(streamCount > 0, 'Streaming onChunk must receive token stream');
  console.log(` Client streaming token delivery verified (${streamCount} chunks).`);

  console.log(' ModelRegistry & NvidiaNimClient tests passed 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
