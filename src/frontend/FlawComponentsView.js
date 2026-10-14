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
  { id: 'utility', label: 'Utility', category: 'Utility', desc: 'Everyday tools, snipes, and shortcuts' },
  { id: 'user', label: 'Social & User', category: 'User', desc: 'Profiles, presence, friends and interactions' },
  { id: 'moderation', label: 'Moderation', category: 'Moderation', desc: 'Server management, bans, timeouts and kicks' },
  { id: 'op', label: 'OP Powerhouse', category: 'OP', desc: 'Ghost wipes, reconnaissance and superweapons' },
  { id: 'general', label: 'General', category: 'General', desc: 'User & server intelligence, avatars and bots' },
  { id: 'purge', label: 'Purge', category: 'Purge', desc: 'Message cleaners, link purges and mass wipes' },
  { id: 'automation', label: 'Automation', category: 'Automation', desc: 'Auto-responders, reactors and schedulers' },
  { id: 'voice', label: 'Voice & RPC', category: 'RPC & Voice', desc: 'Spotify rich presence, streams and voice' },
  { id: 'text', label: 'Text & Ciphers', category: 'Text', desc: 'Zalgo, mock, morse and formatting tools' },
  { id: 'config', label: 'System & Config', category: 'Config', desc: 'Fast mode, prefixes, webhooks and safety' },
  { id: 'developer', label: 'Developer Tools', category: 'Developer', desc: 'Technical utilities, encoders and builders' },
  { id: 'crypto', label: 'Crypto & Hash', category: 'Crypto', desc: 'AES, SHA-256, RSA and cryptography' },
  { id: 'fun', label: 'Fun & Casino', category: 'Fun', desc: 'Games, blackjack, slots, trivia and rizz' }
];

class FlawComponentsView {
  /**
   * Main Overview Menu matching the design reference screenshot
   */
  static buildOverview(commandHandler, selfClient) {
    const totalCmds = commandHandler?.commands?.size || 664;
    const modulesCount = MODULE_DEFINITIONS.length;
    const isOnline = Boolean(selfClient?.client?.user);
    const userTag = isOnline ? selfClient.client.user.tag : 'Offline';
    const statusText = isOnline ? 'ONLINE' : 'CONNECTING';
    const isFastMode = Boolean(selfClient?.config?.fastMode);
    const modeBadge = isFastMode ? 'FAST MODE (INSTANT TEXT)' : 'NORMAL MODE (HUMAN TYPING)';

    const embed = new EmbedBuilder()
      .setColor(FLAW_THEME.ACCENT_COLOR)
      .setTitle('FLAW / COMMAND CENTER')
      .setDescription(
        `\`PERSONAL TOOLKIT · COMMAND INDEX\` \`[${FLAW_THEME.VERSION}]\`\n\n` +
        `**OVERVIEW**\n` +
        `\`\`\`asciidoc\n` +
        `Commands :: ${totalCmds}\n` +
        `Modules  :: ${modulesCount < 10 ? '0' + modulesCount : modulesCount}\n` +
        `Profile  :: ${modeBadge}\n` +
        `Status   :: ${statusText} (${userTag})\n` +
        `\`\`\`\n` +
        `**COMMAND MODULES**\n` +
        `Select a module below to inspect commands (13 per page with interactive pagers).`
      )
      .setFooter({ text: 'Explore commands · inspect syntax · view examples' });

    // Category Select Menu
    const selectOptions = MODULE_DEFINITIONS.slice(0, 25).map(m => {
      const count = (commandHandler?.categories?.get(m.category) || []).length;
      return {
        label: `${m.label} (${count} CMD)`,
        value: `mod_${m.id}`,
        description: m.desc.slice(0, 50)
      };
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('flaw_module_select')
      .setPlaceholder('Select a command module...')
      .addOptions(selectOptions);

    const row1 = new ActionRowBuilder().addComponents(selectMenu);

    // Fast Mode toggle button & navigation buttons
    const btnModeToggle = new ButtonBuilder()
      .setCustomId('flaw_toggle_mode')
      .setLabel(isFastMode ? 'Mode: Fast (Instant)' : 'Mode: Normal (Typing)')
      .setStyle(isFastMode ? ButtonStyle.Success : ButtonStyle.Secondary);

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

    const row2 = new ActionRowBuilder().addComponents(btnModeToggle, btnSearch, btnExec, btnRefresh);

    return { embeds: [embed], components: [row1, row2] };
  }

  /**
   * Module Category Commands List View
   * Exactly 13 commands per page with back-and-forth interactive navigation
   */
  static buildModuleList(moduleId, commandHandler, page = 0) {
    const mod = MODULE_DEFINITIONS.find(m => m.id === moduleId) || MODULE_DEFINITIONS[0];
    const cmds = commandHandler?.categories?.get(mod.category) || [];

    const pageSize = 13; // Exactly 13 commands per page
    const totalPages = Math.max(1, Math.ceil(cmds.length / pageSize));
    const safePage = Math.min(Math.max(0, page), totalPages - 1);
    const startIndex = safePage * pageSize;
    const pageCmds = cmds.slice(startIndex, startIndex + pageSize);

    const embed = new EmbedBuilder()
      .setColor(FLAW_THEME.ACCENT_COLOR)
      .setTitle(`FLAW / ${mod.label.toUpperCase()}`)
      .setDescription(
        `\`${mod.desc.toUpperCase()}\`\n\n` +
        `**COMMANDS IN THIS MODULE (${cmds.length} TOTAL · PAGE ${safePage + 1}/${totalPages}):**\n\n` +
        pageCmds.map((c, i) => `**\`${startIndex + i + 1}.\`** \`.${c.name}\` — ${c.description || 'No description provided.'}`).join('\n')
      )
      .setFooter({ text: `Page ${safePage + 1} of ${totalPages} · Select below to inspect syntax` });

    // Command picker select menu for the exact 13 commands on this page
    const selectOptions = pageCmds.map(c => ({
      label: `.${c.name}`,
      value: `cmd_${c.name}`,
      description: (c.description || 'No description provided.').slice(0, 50)
    }));

    const cmdSelect = new StringSelectMenuBuilder()
      .setCustomId('flaw_cmd_select')
      .setPlaceholder(`Pick one of ${pageCmds.length} commands to inspect...`)
      .addOptions(selectOptions);

    const row1 = new ActionRowBuilder().addComponents(cmdSelect);

    // Pagination buttons (Back and Forth)
    const btnHome = new ButtonBuilder()
      .setCustomId('flaw_nav_home')
      .setLabel('Main Menu')
      .setStyle(ButtonStyle.Secondary);

    const btnPrev = new ButtonBuilder()
      .setCustomId(`flaw_page_${mod.id}_${safePage - 1}`)
      .setLabel(`◀ Page ${safePage}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safePage <= 0);

    const btnNext = new ButtonBuilder()
      .setCustomId(`flaw_page_${mod.id}_${safePage + 1}`)
      .setLabel(`Page ${safePage + 2} ▶`)
      .setStyle(ButtonStyle.Primary)
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
        `**Cooldown:** \`${cmd.cooldown ? cmd.cooldown + 's' : '0s (Standard Pacing)'}\``
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
  static buildExecutionResult(cmdName, output, durationMs, success = true, isFastMode = false) {
    const embed = new EmbedBuilder()
      .setColor(success ? FLAW_THEME.ACCENT_COLOR : 0xFF4545)
      .setTitle(`FLAW / EXECUTION: .${cmdName}`)
      .setDescription(
        `\`\`\`\n${(output || 'Executed without output.').slice(0, 1900)}\n\`\`\`\n` +
        `**Status:** \`${success ? 'SUCCESS' : 'FAILED'}\` | **Duration:** \`${durationMs}ms\` | **Profile:** \`${isFastMode ? 'Fast Mode' : 'Normal'}\``
      )
      .setFooter({ text: 'Flaw Anti-Detection Pacing Active' });

    const btnHome = new ButtonBuilder()
      .setCustomId('flaw_nav_home')
      .setLabel('Back to Center')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btnHome);

    return { embeds: [embed], components: [row] };
  }
}

module.exports = { FlawComponentsView, FLAW_THEME, MODULE_DEFINITIONS };
