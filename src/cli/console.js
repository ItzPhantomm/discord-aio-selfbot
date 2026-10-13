#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const SelfClient = require('../client/SelfClient');
const Context = require('../client/Context');
const Logger = require('../utils/Logger');

async function runConsole() {
  const configPath = path.join(__dirname, '../../config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  const selfClient = new SelfClient(config);
  const commandsDir = path.join(__dirname, '../commands');
  selfClient.commandHandler.loadCommandsFromDir(commandsDir);

  // Background non-blocking login
  selfClient.login().catch(() => {});

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[1m\x1b[96mselfbot❯\x1b[0m '
  });

  console.log('\n\x1b[1m\x1b[37m⚡ INTERACTIVE SELFBOT COMMAND CONSOLE\x1b[0m');
  console.log('\x1b[90mType any command (e.g. "ping", "help", "userinfo") or "exit" to quit.\x1b[0m\n');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('Exiting console.');
      process.exit(0);
    }

    const cleanInput = input.replace(/^\.+/, '');
    const ctx = new Context({
      type: 'cli',
      client: selfClient.client,
      channel: selfClient.activeChannel,
      guild: selfClient.activeChannel?.guild || null,
      commandHandler: selfClient.commandHandler
    });

    try {
      await selfClient.commandHandler.execute(ctx, cleanInput);
    } catch (err) {
      Logger.error(`Command failed: ${err.message}`);
    }

    rl.prompt();
  });

  rl.on('SIGINT', () => {
    process.exit(0);
  });
}

if (require.main === module) {
  runConsole().catch(err => {
    console.error('Console fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runConsole };
