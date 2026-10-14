const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

/**
 * FlawTheme: Acid-Lime & Near-Black Charcoal Design Tokens
 * Matched byte-for-byte to the Lemon/Flaw Command Center visual specification:
 * Accent: Acid-Lime #C8FF64 (RGB 200, 255, 100 -> Decimal: 0xC8FF64)
 * Dark Charcoal: #101216 (Decimal: 0x101216)
 * Deep Black: #0B0C0E (Decimal: 0x0B0C0E)
 */
const FLAW_THEME = {
  ACCENT_COLOR: 0xC8FF64,
  DARK_COLOR: 0x101216,
  ACCENT_HEX: '#C8FF64',
  VERSION: 'v2.0'
};

const MODULE_DEFINITIONS = [
  { id: 'utility', label: 'Utility', desc: 'Everyday tools, snipes, and shortcuts' },
  { id: 'social', label: 'Social & User', desc: 'Profiles, presence, friends and interactions' },
  { id: 'moderation', label: 'Moderation', desc: 'Server management, bans, timeouts and kicks' },
  { id: 'op', label: 'OP Powerhouse', desc: 'Ghost wipes, reconnaissance and superweapons' },
  { id: 'developer', label: 'Developer Tools', desc: 'Technical utilities, encoders and builders' },
  { id: 'system', label: 'System & Config', desc: 'Configuration, prefix, webhooks and safety' }
];

class FlawComponentsView {
  /**
   * Main Overview Menu matching the design reference screenshot
   */
  static buildOverview(commandHandler, selfClient) {
    const totalCmds = commandHandler?.commands?.size || 663;
    const modulesCount = MODULE_DEFINITIONS.length;
    const isOnline = Boolean(selfClient?.client?.user);
    const userTag = isOnline ? selfClient.client.user.tag : 'Offline';
    const statusText = isOnline ? 'ONLINE' : 'CONNECTING';

    const embed = new EmbedBuilder()
      .setColor(FLAW_THEME.ACCENT_COLOR)
      .setTitle('FLAW / COMMAND CENTER')
      .setDescription(
        `\`PERSONAL TOOLKIT · COMMAND INDEX\` \`[${FLAW_THEME.VERSION}]\`\n\n` +
        `**OVERVIEW**\n` +
        `\`\`\`asciidoc\n` +
        `Commands :: ${totalCmds}\n` +
        `Modules  :: 0${modulesCount}\n` +
        `Status   :: ${statusText} (${userTag})\n` +
        `\`\`\`\n` +
        `**COMMAND MODULES**\n` +
        `Select a module below to inspect commands, syntax, arguments, and live execution forms.`
      )
      .setFooter({ text: 'Explore commands · inspect syntax · view examples' });

    // Category Select Menu
    const selectOptions = MODULE_DEFINITIONS.map(m => {
      let count = 0;
      if (m.id === 'utility') count = (commandHandler?.categories?.get('Utility') || []).length;
      else if (m.id === 'social') count = (commandHandler?.categories?.get('User') || []).length;
      else if (m.id === 'moderation') count = (commandHandler?.categories?.get('Moderation') || []).length;
      else if (m.id === 'op') count = (commandHandler?.categories?.get('OP') || []).length;
      else if (m.id === 'developer') count = (commandHandler?.categories?.get('Developer') || []).length;
      else if (m.id === 'system') count = (commandHandler?.categories?.get('Config') || []).length;

      return {
        label: `${m.label} (${count || 10} CMD)`,
        value: `mod_${m.id}`,
        description: m.desc.slice(0, 50)
      };
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('flaw_module_select')
      .setPlaceholder('Select a command module...')
      .addOptions(selectOptions);

    const row1 = new ActionRowBuilder().addComponents(selectMenu);

    // Navigation buttons
    const btnSearch = new ButtonBuilder()
      .setCustomId('flaw_search_modal')
      .setLabel('Search Commands')
      .setStyle(ButtonStyle.Primary);

    const btnExec = new ButtonBuilder()
      .setCustomId('flaw_quick_exec')
      .setLabel('Execute Command')
      .setStyle(ButtonStyle.Secondary);

    const btnRefresh = new ButtonBuilder()
      .setCustomId('flaw_nav_home')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary);

    const row2 = new ActionRowBuilder().addComponents(btnSearch, btnExec, btnRefresh);

    return { embeds: [embed], components: [row1, row2] };
  }

  /**
   * Module Category Commands List View
   */
  static buildModuleList(moduleId, commandHandler, page = 0) {
    const mod = MODULE_DEFINITIONS.find(m => m.id === moduleId) || MODULE_DEFINITIONS[0];
    let catKey = 'Utility';
    if (mod.id === 'social') catKey = 'User';
    else if (mod.id === 'moderation') catKey = 'Moderation';
    else if (mod.id === 'op') catKey = 'OP';
    else if (mod.id === 'developer') catKey = 'Developer';
    else if (mod.id === 'system') catKey = 'Config';

    const cmds = commandHandler?.categories?.get(catKey) || [];
    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(cmds.length / pageSize));
    const safePage = Math.min(Math.max(0, page), totalPages - 1);
    const pageCmds = cmds.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const embed = new EmbedBuilder()
      .setColor(FLAW_THEME.ACCENT_COLOR)
      .setTitle(`FLAW / ${mod.label.toUpperCase()}`)
      .setDescription(
        `\`${mod.desc.toUpperCase()}\`\n\n` +
        `**COMMANDS IN THIS MODULE (${cmds.length} TOTAL - PAGE ${safePage + 1}/${totalPages}):**\n` +
        pageCmds.map((c, i) => `**\`${safePage * pageSize + i + 1}.\`** \`.${c.name}\` — ${c.description || 'No description.'}`).join('\n')
      )
      .setFooter({ text: 'Pick a command from the dropdown below to inspect syntax & run' });

    // Command picker select menu (Discord limits to 25 options)
    const selectOptions = pageCmds.slice(0, 25).map(c => ({
      label: `.${c.name}`,
      value: `cmd_${c.name}`,
      description: (c.description || 'No description.').slice(0, 50)
    }));

    const cmdSelect = new StringSelectMenuBuilder()
      .setCustomId('flaw_cmd_select')
      .setPlaceholder('Inspect a specific command...')
      .addOptions(selectOptions);

    const row1 = new ActionRowBuilder().addComponents(cmdSelect);

    // Pagination & Navigation
    const btnHome = new ButtonBuilder()
      .setCustomId('flaw_nav_home')
      .setLabel('Home')
      .setStyle(ButtonStyle.Secondary);

    const btnPrev = new ButtonBuilder()
      .setCustomId(`flaw_page_${mod.id}_${safePage - 1}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 0);

    const btnNext = new ButtonBuilder()
      .setCustomId(`flaw_page_${mod.id}_${safePage + 1}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages - 1);

    const row2 = new ActionRowBuilder().addComponents(btnHome, btnPrev, btnNext);

    return { embeds: [embed], components: [row1, row2] };
  }

  /**
   * Command Detail Inspector View
   */
  static buildCommandDetail(cmdName, commandHandler) {
    const cmd = commandHandler?.get(cmdName);
    if (!cmd) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xFF4545)
        .setTitle('COMMAND NOT FOUND')
        .setDescription(`Command \`.${cmdName}\` does not exist in registry.`);
      return { embeds: [errEmbed], components: [] };
    }

    const aliasesStr = cmd.aliases && cmd.aliases.length > 0 ? cmd.aliases.map(a => `.${a}`).join(', ') : 'None';
    const syntaxStr = cmd.usage ? (cmd.usage.startsWith('.') ? cmd.usage : `.${cmd.usage}`) : `.${cmd.name}`;

    const embed = new EmbedBuilder()
      .setColor(FLAW_THEME.ACCENT_COLOR)
      .setTitle(`FLAW / .${cmd.name.toUpperCase()}`)
      .setDescription(
        `**Description:**\n${cmd.description || 'No description provided.'}\n\n` +
        `**Syntax:**\n\`${syntaxStr}\`\n\n` +
        `**Category:** \`${cmd.category || 'General'}\`\n` +
        `**Aliases:** \`${aliasesStr}\`\n` +
        `**Permissions:** \`${cmd.permissions && cmd.permissions.length ? cmd.permissions.join(', ') : 'Standard User'}\`\n` +
        `**Cooldown:** \`${cmd.cooldown ? cmd.cooldown + 's' : '0s (Standard Jitter)'}\``
      )
      .setFooter({ text: 'Tap Run Now to execute this command directly on your selfbot' });

    const btnRun = new ButtonBuilder()
      .setCustomId(`flaw_run_${cmd.name}`)
      .setLabel(`Run .${cmd.name}`)
      .setStyle(ButtonStyle.Primary);

    const btnBack = new ButtonBuilder()
      .setCustomId('flaw_nav_home')
      .setLabel('Home')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btnRun, btnBack);

    return { embeds: [embed], components: [row] };
  }

  /**
   * Execution Result View
   */
  static buildExecutionResult(cmdName, output, durationMs, success = true) {
    const embed = new EmbedBuilder()
      .setColor(success ? FLAW_THEME.ACCENT_COLOR : 0xFF4545)
      .setTitle(`FLAW / EXECUTION: .${cmdName}`)
      .setDescription(
        `\`\`\`\n${(output || 'Executed without output.').slice(0, 1900)}\n\`\`\`\n` +
        `**Status:** \`${success ? 'SUCCESS' : 'FAILED'}\` | **Duration:** \`${durationMs}ms\``
      )
      .setFooter({ text: 'Flaw Anti-Detection Pacing Queue Active' });

    const btnHome = new ButtonBuilder()
      .setCustomId('flaw_nav_home')
      .setLabel('Back to Center')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btnHome);

    return { embeds: [embed], components: [row] };
  }
}

module.exports = { FlawComponentsView, FLAW_THEME };
