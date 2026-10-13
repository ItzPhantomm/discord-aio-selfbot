const assert = require('assert');
const CommandHandler = require('../src/client/CommandHandler');
const Context = require('../src/client/Context');

async function testCommandHandler() {
  console.log('Testing CommandHandler & Context...');
  const handler = new CommandHandler(null);

  let executed = false;
  let receivedArgs = [];

  handler.register({
    name: 'testcmd',
    aliases: ['tcmd', 'testalias'],
    category: 'General',
    description: 'Test command for test suite',
    run: async (ctx, args) => {
      executed = true;
      receivedArgs = args;
      ctx.reply(`Result: ${args.join(' ')}`);
    }
  });

  assert(handler.get('testcmd') !== null, 'Command testcmd not found');
  assert(handler.get('tcmd') !== null, 'Alias tcmd not found');
  assert(handler.get('testalias') !== null, 'Alias testalias not found');
  assert(handler.categories.get('General').length === 1, 'Category General count mismatch');

  // Test argument parsing
  const tokens = handler.parseArgs('hello "world with spaces" --flag');
  assert.deepStrictEqual(tokens, ['hello', 'world with spaces', '--flag']);

  // Test execution via Context (TUI mode)
  const outputs = [];
  const ctx = new Context({
    type: 'tui',
    log: (text) => outputs.push(text)
  });

  await handler.execute(ctx, 'testcmd arg1 "second arg"');
  assert(executed === true, 'Command failed to execute');
  assert.deepStrictEqual(receivedArgs, ['arg1', 'second arg']);

  console.log(' CommandHandler & Context tests passed successfully!');
}

testCommandHandler().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
