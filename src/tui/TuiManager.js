const { createScreen } = require('./Screen');
const { createHeader } = require('./Header');
const { createSidebar } = require('./Sidebar');
const { createLogPane } = require('./LogPane');
const { createInspectorPane } = require('./InspectorPane');
const { createStatusBar } = require('./StatusBar');
const { createInputPrompt } = require('./InputPrompt');
const CommandPalette = require('./CommandPalette');
const ChannelSwitcher = require('./ChannelSwitcher');
const CodexModal = require('./CodexModal');
const Logger = require('../utils/Logger');
const Storage = require('../utils/Storage');
const Theme = require('../utils/Theme');

class TuiManager {
  constructor(selfClient) {
    this.selfClient = selfClient;
    this.screen = createScreen();
    this.header = createHeader(this.screen);
    this.sidebar = createSidebar(this.screen);
    this.logPane = createLogPane(this.screen);
    this.inspector = createInspectorPane(this.screen);
    this.statusBar = createStatusBar(this.screen);
    const { form, input } = createInputPrompt(this.screen);
    this.form = form;
    this.input = input;

    this.startTime = Date.now();
    this.currentCategory = null;
    this.categoriesMap = new Map();
    this.pulseState = false;

    // Connect logger
    Logger.setTuiPane(this.logPane);

    // Command palette modal (Ctrl+P)
    this.palette = new CommandPalette(
      this.screen,
      this.selfClient.commandHandler,
      (cmdName) => this.showCommandDetails(cmdName)
    );

    // Channel switcher modal (Ctrl+K)
    this.channelSwitcher = new ChannelSwitcher(
      this.screen,
      this.selfClient,
      (channelObj) => {
        this.selfClient.activeChannel = channelObj.channelRef;
        Logger.info(`Locked active target channel to: ${channelObj.name} [ID: ${channelObj.id}]`);
        this.updateHeader();
      }
    );

    // Codex AI Agent Modal (Ctrl+A / F4)
    this.codexModal = new CodexModal(this.screen, this.selfClient);

    this.setupInteractivity();
    this.setupResponsiveness();
    this.startMetricsTimer();
  }

  setupInteractivity() {
    this.sidebar.focus();

    // Tab key: Toggle focus between Sidebar and Input
    this.screen.key(['tab'], () => {
      if (this.sidebar.focused) {
        this.input.focus();
      } else if (this.input.focused) {
        this.sidebar.focus();
      } else {
        this.sidebar.focus();
      }
      this.screen.render();
    });

    // Command Palette hotkey: Ctrl+P
    this.screen.key(['C-p'], () => {
      this.palette.toggle();
    });

    // Channel Switcher hotkey: Ctrl+K
    this.screen.key(['C-k'], () => {
      this.channelSwitcher.toggle();
    });

    // Codex AI Agent Modal hotkey: Ctrl+A or F4
    this.screen.key(['C-a', 'f4'], () => {
      this.codexModal.toggle();
    });

    // Pause/Resume Log Stream: F3 or Ctrl+S
    this.screen.key(['f3', 'C-s'], () => {
      const paused = Logger.togglePause();
      this.logPane.setLabel(` ${Theme.boldColor(paused ? '⏸ STREAM PAUSED (F3 to resume)' : '◈ ACTIVITY & EVENT FEED', paused ? Theme.palette.warning : Theme.palette.silver)} `);
      this.screen.render();
    });

    // Quick scroll for LogPane
    this.screen.key(['pageup'], () => {
      this.logPane.scroll(-5);
      this.screen.render();
    });

    this.screen.key(['pagedown'], () => {
      this.logPane.scroll(5);
      this.screen.render();
    });

    // Command Autocomplete inside input
    this.input.on('keypress', (ch, key) => {
      if (key && (key.name === 'tab' || (key.ctrl && key.name === 'i'))) {
        const val = this.input.getValue().trim();
        if (val && !val.includes(' ')) {
          const clean = val.replace(/^\.+/, '').toLowerCase();
          const matches = [];
          for (const name of this.selfClient.commandHandler.commands.keys()) {
            if (name.startsWith(clean)) {
              matches.push(name);
            }
          }
          if (matches.length === 1) {
            this.input.setValue('.' + matches[0] + ' ');
            this.screen.render();
          } else if (matches.length > 1) {
            Logger.info(`Autocomplete hints: ${matches.slice(0, 8).join(', ')}`);
          }
        }
      }
    });

    // Input submission
    this.input.key(['enter'], () => {
      const value = this.input.getValue().trim();
      this.input.clearValue();
      this.input.focus();
      if (value) {
        Logger.cmd(`> ${value}`);
        if (value.toLowerCase() === 'exit' || value.toLowerCase() === 'quit') {
          process.exit(0);
        }
        if (this.selfClient) {
          this.selfClient.executeTuiCommand(value);
        }
      }
      this.screen.render();
    });

    // Sidebar navigation
    this.sidebar.on('select', (item) => {
      const text = item.getText ? item.getText() : item.content;
      this.handleSidebarSelect(text);
    });

    this.screen.render();
  }

  setupResponsiveness() {
    this.screen.on('resize', () => {
      const width = this.screen.width;
      if (width < 90) {
        // Narrow/Termux viewport: Stack into high-density 2-pane view
        this.sidebar.width = '35%';
        this.logPane.left = '35%';
        this.logPane.width = '65%';
        this.inspector.hide();
      } else {
        // Desktop widescreen: 3-pane obsidian layout
        this.sidebar.width = '24%';
        this.logPane.left = '24%';
        this.logPane.width = '46%';
        this.inspector.left = '70%';
        this.inspector.width = '30%';
        this.inspector.show();
      }
      this.screen.render();
    });
  }

  populateCategories(categoriesMap) {
    this.categoriesMap = categoriesMap;
    const items = [];
    const iconMap = {
      'OP': '🔥',
      'General': '◈',
      'Utility': '🛠',
      'User': '👤',
      'Moderation': '🛡',
      'Purge': '🧹',
      'Text': '✎',
      'Automation': '⚡',
      'RPC & Voice': '🔊',
      'Backup': '💾',
      'Config': '⚙',
      'Developer': '💻',
      'Crypto': '🔐',
      'Web': '🌐',
      'Math': '📐',
      'System': '🖥',
      'Productivity': '📋',
      'Media': '🖼',
      'Admin': '👑',
      'Fun': '🎲'
    };

    for (const [catName, cmds] of categoriesMap.entries()) {
      const icon = iconMap[catName] || '◆';
      const countStr = Theme.color(`(${cmds.length})`, Theme.palette.textMuted);
      items.push(`${icon}  ${catName.padEnd(14, ' ')} ${countStr}`);
    }
    this.sidebar.setItems(items);
    this.screen.render();
  }

  handleSidebarSelect(selectedText) {
    if (!selectedText) return;
    const clean = selectedText.replace(/\{[^}]+\}/g, '').trim();

    const catMatch = clean.match(/^[◈🛠👤🛡🧹✎⚡🔊💾⚙◆\s]+([A-Za-z\s&]+?)\s*\((\d+)\)/);
    if (catMatch) {
      const catName = catMatch[1].trim();
      const cmds = this.categoriesMap.get(catName) || [];
      const items = [`${Theme.boldColor('⬅ [BACK TO CATEGORIES]', Theme.palette.white)}`];
      for (const cmd of cmds) {
        items.push(`• .${cmd.name.padEnd(14, ' ')} ${Theme.color(cmd.description || '', Theme.palette.textMuted)}`);
      }
      this.sidebar.setItems(items);
      this.screen.render();
      return;
    }

    if (clean.includes('[BACK TO CATEGORIES]')) {
      this.populateCategories(this.categoriesMap);
      return;
    }

    const cmdMatch = clean.match(/\.([a-z0-9_-]+)/i);
    if (cmdMatch) {
      this.showCommandDetails(cmdMatch[1].toLowerCase());
    }
  }

  showCommandDetails(cmdName) {
    const cmd = this.selfClient.commandHandler.get(cmdName);
    if (!cmd) return;

    const title = Theme.gradientText(`◈ .${cmd.name.toUpperCase()}`, ['#FFFFFF', '#CCCCCC', '#888888']);
    const divider = Theme.divider(26, ['#FFFFFF', '#666666', '#222222']);

    const content = `
${title}
${divider}

${Theme.boldColor('CATEGORY:', Theme.palette.white)}
 ${Theme.color(cmd.category, Theme.palette.textSecondary)}

${Theme.boldColor('USAGE SYNTAX:', Theme.palette.white)}
 ${Theme.boldColor(cmd.usage || '.' + cmd.name, Theme.palette.snow)}

${Theme.boldColor('DESCRIPTION:', Theme.palette.white)}
 ${Theme.color(cmd.description || 'No description provided.', Theme.palette.silver)}

${Theme.boldColor('ALIASES:', Theme.palette.white)}
 ${Theme.color(cmd.aliases && cmd.aliases.length > 0 ? cmd.aliases.map(a => '.' + a).join(', ') : 'None', Theme.palette.steel)}

${Theme.boldColor('INPUT DISPATCH:', Theme.palette.white)}
 ${Theme.color('Dual Supported (In-Chat + TUI Prompt)', Theme.palette.textSecondary)}

${divider}
${Theme.color('Execute by typing into bottom prompt\nor issuing prefix command in Discord chat.', Theme.palette.textMuted)}
`.trim();

    this.inspector.setContent(content);
    this.screen.render();
  }

  updateHeader() {
    const client = this.selfClient.client;
    const isOnline = client && client.user;
    this.pulseState = !this.pulseState;

    const pulseDot = isOnline
      ? (this.pulseState ? Theme.color('●', Theme.palette.white) : Theme.color('○', Theme.palette.white))
      : Theme.color('○', Theme.palette.charcoal);

    const statusBadge = isOnline
      ? `{${Theme.palette.white}-bg}{#000000-fg}{bold} ONLINE {/bold}{/${Theme.palette.white}-bg}`
      : `{#222222-bg}{#666666-fg}{bold} OFFLINE {/bold}{/#222222-bg}`;

    const tag = isOnline ? client.user.tag : 'Unconnected';
    const ping = isOnline && client.ws && client.ws.ping >= 0 ? Math.round(client.ws.ping) : 0;
    const guilds = isOnline && client.guilds ? client.guilds.cache.size : 0;
    const dms = isOnline && client.channels ? client.channels.cache.filter(c => c.type === 'DM').size : 0;
    const targetChannel = this.selfClient.activeChannel
      ? (this.selfClient.activeChannel.type === 'DM' ? `@${this.selfClient.activeChannel.recipient?.tag || 'DM'}` : `#${this.selfClient.activeChannel.name}`)
      : 'None';

    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const hrs = String(Math.floor(uptimeSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((uptimeSec % 3600) / 60)).padStart(2, '0');
    const secs = String(uptimeSec % 60).padStart(2, '0');
    const uptimeStr = `${hrs}:${mins}:${secs}`;

    const logo = Theme.gradientText('DISCORD AIO // COMMAND CENTER', ['#FFFFFF', '#AAAAAA', '#666666']);
    const metrics = `${pulseDot} ${statusBadge}  ${Theme.color('USER:', Theme.palette.textMuted)} {bold}${tag}{/bold}  ${Theme.color('PING:', Theme.palette.textMuted)} {bold}${ping}ms{/bold}  ${Theme.color('CHANNEL:', Theme.palette.textMuted)} {bold}${targetChannel}{/bold}  ${Theme.color('GUILDS:', Theme.palette.textMuted)} {bold}${guilds}{/bold}  ${Theme.color('UP:', Theme.palette.textMuted)} {bold}${uptimeStr}{/bold}`;

    this.header.setContent(` ${logo}  │  ${metrics}`);
    this.screen.render();
  }

  updateStatusBar() {
    const config = this.selfClient.config || {};
    const afkStatus = config.afk?.enabled ? Theme.color('ON', Theme.palette.white) : Theme.color('OFF', Theme.palette.textMuted);
    const selfDelete = config.selfDelete?.enabled ? Theme.color(`${config.selfDelete.delay / 1000}s`, Theme.palette.white) : Theme.color('OFF', Theme.palette.textMuted);
    const respondersCount = Object.keys(Storage.get('autoresponders', {})).length;
    const snipesCount = Object.keys(Storage.get('snipes', {})).length;
    const prefix = config.prefix || '.';

    Logger.shiftBuckets();
    const activityLine = Theme.sparkline(Logger.historyBuckets, Theme.palette.white);

    const leftPart = ` ${Theme.boldColor('◈ STATUS:', Theme.palette.textSecondary)} AFK: ${afkStatus} │ PURGE: ${selfDelete} │ RESPONDERS: {bold}${respondersCount}{/bold} │ SNIPES: {bold}${snipesCount}{/bold} │ PREFIX: {bold}${prefix}{/bold}`;
    const rightPart = `ACTIVITY: ${activityLine} │ ${Theme.boldColor('[Ctrl+A]', Theme.palette.white)} Codex │ ${Theme.boldColor('[Ctrl+K]', Theme.palette.white)} Switch │ ${Theme.boldColor('[Ctrl+P]', Theme.palette.white)} Cmds │ ${Theme.boldColor('[F3]', Theme.palette.silver)} Pause │ ${Theme.boldColor('[Tab]', Theme.palette.silver)} Focus │ ${Theme.boldColor('[Ctrl+C]', Theme.palette.steel)} Exit `;

    this.statusBar.setContent(`${leftPart}    ${rightPart}`);
    this.screen.render();
  }

  startMetricsTimer() {
    setInterval(() => {
      this.updateHeader();
      this.updateStatusBar();
    }, 2000);
  }
}

module.exports = TuiManager;
