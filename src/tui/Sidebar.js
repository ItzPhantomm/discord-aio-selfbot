const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createSidebar(screen) {
  const sidebar = blessed.list({
    parent: screen,
    top: 3,
    left: 0,
    width: '24%',
    height: '100%-6',
    border: {
      type: 'line'
    },
    label: ` ${Theme.boldColor('◈ COMMAND INDEX', Theme.palette.white)} `,
    tags: true,
    mouse: true,
    keys: true,
    vi: true,
    style: {
      bg: Theme.palette.surface,
      border: {
        fg: Theme.palette.panelBorder
      },
      selected: {
        bg: Theme.palette.elevated,
        fg: Theme.palette.white,
        bold: true
      },
      item: {
        fg: Theme.palette.textSecondary,
        hover: {
          bg: Theme.palette.elevated,
          fg: Theme.palette.textPrimary
        }
      }
    },
    scrollbar: {
      ch: '▐',
      style: {
        bg: Theme.palette.panelBorder,
        fg: Theme.palette.white
      }
    }
  });

  return sidebar;
}

module.exports = { createSidebar };
