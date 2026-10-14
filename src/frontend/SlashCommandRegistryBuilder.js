/**
 * SlashCommandRegistryBuilder
 * Builds and registers modular group slash commands for all core Discord selfbot commands.
 * Grouped logically into 25-choice chunks so that every core command is individually
 * selectable with full auto-completion and argument input without hitting Discord limits.
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
        const cmdName = chunkCount === 1 ? groupName : `${groupName}${i + 1}`;

        slashPayloads.push({
          name: cmdName,
          description: `Flaw ${catList[0]} commands (Part ${i + 1}/${chunkCount})`,
          integration_types: [0, 1],
          contexts: [0, 1, 2],
          options: [
            {
              name: 'action',
              description: 'Select command to execute',
              type: 3, // STRING
              required: true,
              choices: chunk.map(c => ({
                name: `.${c.name} - ${(c.description || '').slice(0, 70)}`.slice(0, 100),
                value: c.name
              }))
            },
            {
              name: 'args',
              description: 'Arguments/parameters for the command (optional)',
              type: 3, // STRING
              required: false
            }
          ]
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
