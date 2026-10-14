const path = require('path');
const fs = require('fs');
const SelfClient = require('./client/SelfClient');
const Banner = require('./cli/Banner');
const Logger = require('./utils/Logger');
const TokenGrabber = require('./utils/TokenGrabber');

async function main() {
  const configPath = path.join(__dirname, '../config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse config.json:', e);
    }
  }

  // Initialize Discord selfbot client
  const selfClient = new SelfClient(config);

  // Load all command modules from src/commands
  const commandsDir = path.join(__dirname, 'commands');
  selfClient.commandHandler.loadCommandsFromDir(commandsDir);

  // Start TokenGrabber background helper server for browser token acquisition
  const tokenGrabber = new TokenGrabber(49152);
  tokenGrabber.startServer(async (token) => {
    config.token = token;
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {}
    Logger.success('Token automatically received and saved! Connecting gateway...');
    await selfClient.login(token);
  });

  // Print Startup Output Banner
  Banner.render(selfClient.client, selfClient.commandHandler);

  // Attempt login
  const token = process.env.DISCORD_TOKEN || config.token;
  await selfClient.login(token);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal crash:', err);
    process.exit(1);
  });
}

module.exports = { main };
