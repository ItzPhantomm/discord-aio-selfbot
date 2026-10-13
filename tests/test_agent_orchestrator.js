const assert = require('assert');
const Orchestrator = require('../src/agent/core/Orchestrator');
const AgentEngine = require('../src/agent/core/AgentEngine');

async function runTests() {
  console.log('Testing AgentEngine & Orchestrator...');

  const orch = new Orchestrator();

  // Test 1: Single Direct ReAct run with Tool Execution
  console.log('1. Testing Direct ReAct Execution...');
  const progressEvents = [];
  const res1 = await orch.execute({
    prompt: 'Check the server demographics and list total members',
    reasoning: 'medium',
    onProgress: (p) => progressEvents.push(p.type)
  });

  assert(res1.finalAnswer, 'Agent must produce final answer');
  assert(progressEvents.includes('start'), 'Must emit start event');
  assert(progressEvents.includes('tool_start') || progressEvents.includes('complete'), 'Must process execution steps');
  console.log(' Direct ReAct loop completed and verified.');

  // Test 2: Multi-Agent Parallel Decomposition
  console.log('2. Testing Multi-Agent Specialist Decomposition...');
  const multiPrompt = 'Please search recent messages in this channel and also inspect server member demographics';
  const specialistEvents = [];

  const res2 = await orch.execute({
    prompt: multiPrompt,
    onProgress: (p) => {
      if (p.specialist) specialistEvents.push(p.specialist);
    }
  });

  assert.strictEqual(res2.strategy, 'SPECIALIST_PARALLEL_COORDINATION');
  assert(res2.subtasksCount >= 2, 'Must decompose into at least 2 subtasks');
  assert(res2.finalAnswer.includes('CONSOLIDATED AGENT ORCHESTRATION REPORT'));
  console.log(` Parallel Specialist coordination passed (${res2.subtasksCount} subtasks consolidated).`);

  // Test 3: Interrupt / AbortController cancellation
  console.log('3. Testing Interrupt / Cancel Mechanism...');
  const controller = new AbortController();
  controller.abort(); // Pre-abort

  let aborted = false;
  try {
    await orch.execute({
      prompt: 'Do a very long calculation',
      signal: controller.signal
    });
  } catch (err) {
    aborted = true;
  }
  assert(aborted, 'Engine must abort when signal is triggered');
  console.log(' Cancellation mechanism verified.');

  console.log(' AgentEngine & Orchestrator tests passed 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
