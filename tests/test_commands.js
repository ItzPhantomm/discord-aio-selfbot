const assert = require('assert');
const path = require('path');
const CommandHandler = require('../src/client/CommandHandler');

async function testAllCommands() {
  console.log('Testing Command Loading & Registry Counts...');
  const handler = new CommandHandler(null);
  const cmdsDir = path.join(__dirname, '../src/commands');
  
  handler.loadCommandsFromDir(cmdsDir);
  
  console.log(`Total Commands Loaded: ${handler.commands.size}`);
  console.log(`Total Categories: ${handler.categories.size}`);
  
  for (const [cat, cmds] of handler.categories.entries()) {
    console.log(` - ${cat}: ${cmds.length} commands`);
  }

  assert(handler.commands.size >= 660, `Expected at least 660 commands, got ${handler.commands.size}`);
  assert(handler.categories.size >= 10, `Expected at least 10 categories, got ${handler.categories.size}`);

  // Validate command schema on all commands
  for (const [name, cmd] of handler.commands.entries()) {
    assert(cmd.name, `Command missing name: ${name}`);
    assert(cmd.category, `Command ${name} missing category`);
    assert(typeof cmd.run === 'function', `Command ${name} missing run function`);
  }

  console.log(' All commands verified successfully with valid schemas and run methods!');
}

testAllCommands().catch(err => {
  console.error('Command verification failed:', err);
  process.exit(1);
});
