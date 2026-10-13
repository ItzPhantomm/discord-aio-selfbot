const blessed = require('blessed');
const Theme = require('../utils/Theme');

class ChannelSwitcher {
  constructor(screen, selfClient, onSelect) {
    this.screen = screen;
    this.selfClient = selfClient;
    this.onSelect = onSelect;
    this.visible = false;
    this.channels = [];

    this.modal = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '65%',
      height: '65%',
      tags: true,
      hidden: true,
      border: {
        type: 'line'
      },
      style: {
        bg: Theme.palette.elevated,
        border: {
          fg: Theme.palette.white
        }
      },
      label: ` ${Theme.boldColor('◈ JUMP TO CHANNEL / DM (Ctrl+K) [ESC to close]', Theme.palette.white)} `
    });

    this.input = blessed.textbox({
      parent: this.modal,
      top: 1,
      left: 2,
      width: '95%',
      height: 1,
      inputOnFocus: true,
      style: {
        fg: Theme.palette.textPrimary,
        bg: Theme.palette.surface
      }
    });

    this.list = blessed.list({
      parent: this.modal,
      top: 3,
      left: 1,
      width: '98%',
      height: '100%-4',
      tags: true,
      keys: true,
      mouse: true,
      style: {
        bg: Theme.palette.elevated,
        selected: {
          bg: Theme.palette.surface,
          fg: Theme.palette.white,
          bold: true
        },
        item: {
          fg: Theme.palette.textSecondary
        }
      }
    });

    this.setupEvents();
  }

  setupEvents() {
    this.input.on('keypress', () => {
      setTimeout(() => {
        const query = this.input.getValue().trim().toLowerCase();
        this.filterChannels(query);
      }, 10);
    });

    this.list.on('select', (item) => {
      if (!item) return;
      const raw = item.getText ? item.getText() : item.content;
      const clean = raw.replace(/\{[^}]+\}/g, '').trim();
      const match = clean.match(/\[([0-9]+)\]/);
      if (match) {
        const channelId = match[1];
        const target = this.channels.find(c => c.id === channelId);
        this.hide();
        if (target && this.onSelect) {
          this.onSelect(target);
        }
      }
    });

    this.modal.key(['escape'], () => this.hide());
    this.input.key(['escape'], () => this.hide());
  }

  refreshChannels() {
    this.channels = [];
    const client = this.selfClient?.client;
    if (!client || !client.channels) return;

    for (const channel of client.channels.cache.values()) {
      if (channel.type === 'GUILD_TEXT' || channel.type === 'DM' || channel.type === 'GUILD_NEWS') {
        const isDm = channel.type === 'DM';
        const name = isDm ? `@${channel.recipient?.tag || 'DirectMessage'}` : `#${channel.name}`;
        const guildName = isDm ? 'Private' : (channel.guild?.name || 'Guild');
        this.channels.push({
          id: channel.id,
          name,
          guildName,
          channelRef: channel,
          type: channel.type
        });
      }
    }
  }

  filterChannels(query = '') {
    const matched = [];
    for (const c of this.channels) {
      if (!query || c.name.toLowerCase().includes(query) || c.guildName.toLowerCase().includes(query) || c.id.includes(query)) {
        matched.push(`${c.name.padEnd(25, ' ')} ${Theme.color(`[${c.guildName}]`, Theme.palette.textMuted)} ${Theme.color(`[${c.id}]`, Theme.palette.steel)}`);
      }
    }
    this.list.setItems(matched.slice(0, 60));
    this.screen.render();
  }

  show() {
    this.refreshChannels();
    this.visible = true;
    this.modal.show();
    this.filterChannels('');
    this.input.clearValue();
    this.input.focus();
    this.screen.render();
  }

  hide() {
    this.visible = false;
    this.modal.hide();
    this.screen.render();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }
}

module.exports = ChannelSwitcher;
