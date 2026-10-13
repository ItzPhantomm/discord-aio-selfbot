const readline = require('readline');
const Banner = require('./Banner');
const Logger = require('../utils/Logger');
const Context = require('../client/Context');

class CliEngine {
  constructor(selfClient) {
    this.selfClient = selfClient;
    this.rl = null;
    this.activeChannel = null;

    // Connect Logger directly to CLI stream
    Logger.setCliHandler((formattedLine) => {
      this.writeLog(formattedLine);
    });
  }

  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[1m\x1b[96mselfbot❯\x1b[0m ',
      completer: (line) => this.completer(line)
    });

    // Render Clean ASCII Header
    Banner.render(this.selfClient?.client, this.selfClient?.commandHandler);
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }

      // 1. Handle Built-in CLI Slash Commands
      if (input.startsWith('/')) {
        await this.handleSlashCommand(input);
        this.rl.prompt();
        return;
      }

      // 2. Handle Selfbot Exit
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('\n\x1b[33m👋 Gracefully shutting down Discord Selfbot...\x1b[0m');
        process.exit(0);
      }

      // 3. Handle Standard Selfbot Command Execution
      await this.executeCommand(input);
      this.rl.prompt();
    });

    this.rl.on('SIGINT', () => {
      console.log('\n\x1b[90m(Use "exit" or press Ctrl+C again to quit)\x1b[0m');
      this.rl.prompt();
    });
  }

  writeLog(formattedLine) {
    if (!this.rl) {
      console.log(formattedLine);
      return;
    }
    // Cleanly clear line, print log, and re-prompt without messing up user input
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(formattedLine);
    this.rl.prompt(true);
  }

  completer(line) {
    const completions = [];
    const clean = line.replace(/^\.+/, '').toLowerCase();

    // Command names
    if (this.selfClient?.commandHandler) {
      for (const name of this.selfClient.commandHandler.commands.keys()) {
        completions.push('.' + name);
        completions.push(name);
      }
    }

    // Slash commands
    const slashCmds = ['/help', '/switch', '/channels', '/clear'];
    completions.push(...slashCmds);

    const hits = completions.filter(c => c.toLowerCase().startsWith(clean) || c.toLowerCase().startsWith(line.toLowerCase()));
    return [hits.length ? hits : completions.slice(0, 20), line];
  }

  async executeCommand(commandStr) {
    const handler = this.selfClient?.commandHandler;
    if (!handler) {
      console.log('\x1b[31m[Error] CommandHandler reference not ready.\x1b[0m');
      return;
    }

    const cleanInput = commandStr.replace(/^\.+/, '');
    const ctx = new Context({
      type: 'cli',
      client: this.selfClient.client,
      channel: this.activeChannel || this.selfClient.activeChannel,
      guild: (this.activeChannel || this.selfClient.activeChannel)?.guild || null,
      cli: this,
      commandHandler: handler
    });

    try {
      await handler.execute(ctx, cleanInput);
    } catch (err) {
      Logger.error(`Command execution failed: ${err.message}`);
    }
  }

  async handleSlashCommand(cmdStr) {
    const tokens = cmdStr.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const arg = tokens[1];

    switch (cmd) {
      case '/help':
        console.log('\x1b[1m\x1b[36mCLI Navigation & Controls:\x1b[0m');
        console.log('  /switch <channel_id>    - Lock active target channel for commands');
        console.log('  /channels               - List cached text channels in current guild');
        console.log('  /clear                  - Clear terminal console screen and redraw banner');
        console.log('  help, .help             - Show full selfbot command directory');
        console.log('  exit, quit              - Shutdown selfbot');
        break;

      case '/clear':
        console.clear();
        Banner.render(this.selfClient?.client, this.selfClient?.commandHandler);
        break;

      default:
        console.log(`\x1b[31mUnknown slash command: ${cmd}. Type /help for options.\x1b[0m`);
    }
  }
}

module.exports = CliEngine;
