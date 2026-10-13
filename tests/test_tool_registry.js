const assert = require('assert');
const ToolRegistry = require('../src/agent/tools/ToolRegistry');

async function runTests() {
  console.log('Testing ToolRegistry & SafetyGate...');

  const registry = new ToolRegistry();
  const defs = registry.getDefinitions();

  assert(defs.length >= 10, `Expected at least 10 tool definitions, got ${defs.length}`);
  console.log(` Tool definitions registered: ${defs.length}`);

  // Test tool schema structure
  for (const def of defs) {
    assert(def.type === 'function', 'Tool type must be function');
    assert(def.function.name, 'Tool must have name');
    assert(def.function.description, 'Tool must have description');
    assert(def.function.parameters, 'Tool must have parameters schema');
  }
  console.log(' All tool schemas conform to OpenAI/NVIDIA function calling standard.');

  // Test math calculation tool
  const mathCall = {
    id: 'call_math_1',
    function: {
      name: 'calculate',
      arguments: JSON.stringify({ expression: '25 * 4 + 10' })
    }
  };

  const mathRes = await registry.executeCall(mathCall, null);
  assert.strictEqual(mathRes.status, 'SUCCESS');
  assert.strictEqual(mathRes.result.result, 110);
  console.log(' Tool execution (calculate) verified successfully.');

  // Test read_only autonomy gate
  registry.safetyGate.setAutonomy('read_only');
  const sendCall = {
    id: 'call_send_1',
    function: {
      name: 'send_message',
      arguments: JSON.stringify({ content: 'Test message' })
    }
  };

  const sendRes = await registry.executeCall(sendCall, null);
  assert.strictEqual(sendRes.status, 'PERMISSION_DENIED');
  assert(sendRes.blocked === true);
  console.log(' SafetyGate correctly blocked mutating tool under read_only autonomy.');

  console.log(' ToolRegistry & SafetyGate tests passed 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
