const fs = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');
const CommandValidator = require('../utils/CommandValidator');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
  }

  register(rawCommand, filePath = '') {
    const command = CommandValidator.validate(rawCommand, filePath);
    const name = command.name;
    this.commands.set(name, command);

    // Register category
    const cat = command.category;
    if (!this.categories.has(cat)) {
      this.categories.set(cat, []);
    }
    this.categories.get(cat).push(command);

    // Register aliases
    for (const alias of command.aliases) {
      this.aliases.set(alias, name);
    }
  }

  loadCommandsFromDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const names = fs.readdirSync(dirPath);

    for (const name of names) {
      const fullPath = path.join(dirPath, name);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.loadCommandsFromDir(fullPath);
      } else if (stat.isFile() && name.endsWith('.js')) {
        try {
          const resolved = path.resolve(fullPath);
          delete require.cache[resolved];
          const cmdModule = require(resolved);
          if (Array.isArray(cmdModule)) {
            for (const c of cmdModule) this.register(c, fullPath);
          } else if (cmdModule && typeof cmdModule === 'object') {
            this.register(cmdModule, fullPath);
          }
        } catch (err) {
          Logger.error(`Failed to load command file ${name}: ${err.message}`);
        }
      }
    }
  }

  get(nameOrAlias) {
    if (!nameOrAlias) return null;
    const lower = nameOrAlias.toLowerCase();
    if (this.commands.has(lower)) {
      return this.commands.get(lower);
    }
    if (this.aliases.has(lower)) {
      const actualName = this.aliases.get(lower);
      return this.commands.get(actualName);
    }
    return null;
  }

  parseArgs(text) {
    // Splits args while respecting quotes
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1] || match[2] || match[0]);
    }
    return matches;
  }

  async execute(ctx, commandStr) {
    if (!commandStr || typeof commandStr !== 'string') return;
    const tokens = this.parseArgs(commandStr.trim());
    if (tokens.length === 0) return;

    const cmdName = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    const command = this.get(cmdName);

    if (!command) {
      if (ctx.type === 'tui' || ctx.type === 'cli') {
        Logger.warn(`Unknown command: "${cmdName}". Type "help" or ".help" for a list of commands.`);
      }
      return;
    }

    ctx.commandName = cmdName;
    ctx.rawArgs = args;
    ctx.commandHandler = this;

    try {
      const start = Date.now();
      await command.run(ctx, args);
      const diff = Date.now() - start;
      Logger.cmd(`Executed .${cmdName} (${diff}ms)`);
    } catch (err) {
      Logger.error(`Error in .${cmdName}: ${err.message}`);
      ctx.reply(`⚠️ Command Error: \`${err.message}\``);
    }
  }
}

module.exports = CommandHandler;
