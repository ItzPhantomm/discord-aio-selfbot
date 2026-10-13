const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createLogPane(screen) {
  const logPane = blessed.log({
    parent: screen,
    top: 3,
    left: '24%',
    width: '46%',
    height: '100%-6',
    border: {
      type: 'line'
    },
    label: ` ${Theme.boldColor('◈ ACTIVITY & EVENT FEED', Theme.palette.silver)} `,
    tags: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: '▐',
      style: {
        bg: Theme.palette.panelBorder,
        fg: Theme.palette.silver
      }
    },
    style: {
      bg: Theme.palette.surface,
      border: {
        fg: Theme.palette.panelBorder
      }
    }
  });

  return logPane;
}

module.exports = { createLogPane };
