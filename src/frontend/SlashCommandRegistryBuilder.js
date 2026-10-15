/**
 * SlashCommandRegistryBuilder
 * Builds and registers modular group slash commands with native Discord Subcommands.
 * Commands appear directly as:
 * /moderation ban user:@user reason:rule_violation
 * /moderation kick user:@user
 * /general ping
 * /utility calc expression:10*5
 *
 * Each core category is partitioned into chunks of up to 25 SUB_COMMANDs (e.g. /moderation, /moderation2).
 */
class SlashCommandRegistryBuilder {
  static getCoreCategories() {
    return {
      'general': ['General'],
      'user': ['User'],
      'utility': ['Utility'],
      'moderation': ['Moderation'],
      'purge': ['Purge'],
      'op': ['OP'],
      'voice': ['RPC & Voice'],
      'text': ['Text'],
      'automation': ['Automation'],
      'backup': ['Backup'],
      'config': ['Config'],
      'admin': ['Admin'],
      'fun': ['Fun']
    };
  }

  static parseUsageToOptions(usage, cmdName) {
    if (!usage) return [];
    const clean = usage.replace(/^\.+/, '').replace(new RegExp('^' + cmdName + '\\s*'), '').trim();
    if (!clean) return [];

    const paramRegex = /(<[^>]+>|\[[^\]]+\])/g;
    const matches = clean.match(paramRegex);
    if (!matches) {
      if (clean.length > 0) {
        return [{
          name: 'input',
          description: clean.slice(0, 100),
          type: 3,
          required: false
        }];
      }
      return [];
    }

    const options = [];
    const seenNames = new Set();

    for (let i = 0; i < Math.min(matches.length, 5); i++) {
      const m = matches[i];
      const isRequired = m.startsWith('<');
      let rawName = m.slice(1, -1).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 32);
      if (!rawName || !/^[a-z0-9_]+$/.test(rawName)) rawName = 'param_' + (i + 1);
      while (seenNames.has(rawName)) rawName += '_' + (i + 1);
      seenNames.add(rawName);

      options.push({
        name: rawName,
        description: `Parameter ${m}`.slice(0, 100),
        type: 3, // String type allows mentions (@user), numbers, IDs, and free text
        required: isRequired
      });
    }

    // Discord enforces that all required options must precede optional options
    let hasOptional = false;
    for (const opt of options) {
      if (!opt.required) hasOptional = true;
      else if (hasOptional) opt.required = false;
    }

    return options;
  }

  static buildSlashCommands(commandHandler) {
    const slashPayloads = [
      {
        name: 'flaw',
        description: 'Open Flaw Command Center dashboard & interactive toolkit',
        integration_types: [0, 1],
        contexts: [0, 1, 2]
      },
      {
        name: 'exec',
        description: 'Execute any Flaw selfbot command by name and arguments',
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
          {
            name: 'command',
            description: 'Command name and arguments (e.g. ping, userinfo, help)',
            type: 3,
            required: true
          }
        ]
      }
    ];

    const coreCategories = this.getCoreCategories();

    for (const [groupName, catList] of Object.entries(coreCategories)) {
      let cmds = [];
      for (const cat of catList) {
        cmds.push(...(commandHandler?.categories?.get(cat) || []));
      }

      const chunkSize = 25;
      const chunkCount = Math.ceil(cmds.length / chunkSize);

      for (let i = 0; i < chunkCount; i++) {
        const chunk = cmds.slice(i * chunkSize, (i + 1) * chunkSize);
        const rootName = (i === 0) ? groupName : `${groupName}${i + 1}`;

        const subcommands = chunk.map(c => {
          const subName = c.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 32);
          const subOptions = this.parseUsageToOptions(c.usage, c.name);
          return {
            name: subName,
            description: (c.description || `Execute .${c.name}`).slice(0, 100),
            type: 1, // SUB_COMMAND
            options: subOptions
          };
        });

        slashPayloads.push({
          name: rootName,
          description: `Flaw ${catList[0]} subcommands (Group ${i + 1}/${chunkCount})`,
          type: 1,
          integration_types: [0, 1],
          contexts: [0, 1, 2],
          options: subcommands
        });
      }
    }

    return slashPayloads;
  }

  static async syncWithDiscord(botToken, clientId, commandHandler) {
    if (!botToken || !clientId) return false;

    const payloads = this.buildSlashCommands(commandHandler);
    try {
      const res = await fetch(`https://discord.com/api/v10/applications/${clientId}/commands`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bot ' + botToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloads)
      });

      return res.ok;
    } catch {
      return false;
    }
  }
}

module.exports = SlashCommandRegistryBuilder;
