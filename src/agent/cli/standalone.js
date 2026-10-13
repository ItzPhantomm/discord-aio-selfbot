#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const CodexChatbox = require('./CodexChatbox');
const SelfClient = require('../../client/SelfClient');

async function run() {
  const configPath = path.join(__dirname, '../../../config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  const selfClient = new SelfClient(config);
  const commandsDir = path.join(__dirname, '../../commands');
  selfClient.commandHandler.loadCommandsFromDir(commandsDir);

  // Background non-blocking login attempt
  selfClient.login().catch(() => {});

  const chatbox = new CodexChatbox({
    ctx: {
      client: selfClient.client,
      author: selfClient.client?.user || null,
      channel: selfClient.activeChannel,
      guild: selfClient.activeChannel?.guild || null,
      commandHandler: selfClient.commandHandler
    }
  });

  chatbox.start();
}

if (require.main === module) {
  run().catch(err => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}

module.exports = { run };
