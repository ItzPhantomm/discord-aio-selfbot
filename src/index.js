const path = require('path');
const fs = require('fs');
const SelfClient = require('./client/SelfClient');
const Banner = require('./cli/Banner');
const Logger = require('./utils/Logger');
const TokenGrabber = require('./utils/TokenGrabber');
const FlawBotFrontend = require('./frontend/FlawBotFrontend');

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

  // Initialize Discord selfbot client (Flaw Engine)
  const selfClient = new SelfClient(config);

  // Load all command modules from src/commands
  const commandsDir = path.join(__dirname, 'commands');
  selfClient.commandHandler.loadCommandsFromDir(commandsDir);

  // Initialize & Start Flaw User-Installable App Frontend
  const frontendConfig = config.frontend || {};
  const botToken = process.env.DISCORD_BOT_TOKEN || frontendConfig.botToken || config.botToken;
  if (botToken) {
    const flawFrontend = new FlawBotFrontend(selfClient, {
      token: botToken,
      ownerId: frontendConfig.ownerId || config.ownerId || '1449235608022286347',
      authorizedUsers: frontendConfig.authorizedUsers || config.authorizedUsers || ['1449235608022286347']
    });
    selfClient.frontend = flawFrontend;
    await flawFrontend.start();
  } else {
    Logger.info('Flaw User-Installable App Frontend waiting for botToken in config.json or DISCORD_BOT_TOKEN');
  }

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
