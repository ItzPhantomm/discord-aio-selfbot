const blessed = require('blessed');
const Theme = require('../utils/Theme');

class CommandPalette {
  constructor(screen, commandHandler, onSelect) {
    this.screen = screen;
    this.commandHandler = commandHandler;
    this.onSelect = onSelect;
    this.visible = false;

    this.modal = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '60%',
      height: '60%',
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
      label: ` ${Theme.boldColor('◈ COMMAND PALETTE (ESC to close)', Theme.palette.white)} `
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
        this.filterCommands(query);
      }, 10);
    });

    this.list.on('select', (item) => {
      if (!item) return;
      const raw = item.getText ? item.getText() : item.content;
      const match = raw.match(/^\.([a-z0-9_-]+)/i);
      if (match) {
        this.hide();
        this.onSelect(match[1]);
      }
    });

    this.modal.key(['escape'], () => {
      this.hide();
    });
    this.input.key(['escape'], () => {
      this.hide();
    });
  }

  filterCommands(query = '') {
    const matched = [];
    for (const [name, cmd] of this.commandHandler.commands.entries()) {
      if (!query || name.includes(query) || (cmd.description && cmd.description.toLowerCase().includes(query))) {
        matched.push(`.${name} - ${Theme.color(cmd.description || '', Theme.palette.textMuted)}`);
      }
    }
    this.list.setItems(matched.slice(0, 50));
    this.screen.render();
  }

  show() {
    this.visible = true;
    this.modal.show();
    this.filterCommands('');
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

module.exports = CommandPalette;
