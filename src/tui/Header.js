const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createHeader(screen) {
  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
      bg: Theme.palette.surface,
      border: {
        fg: Theme.palette.panelBorder
      }
    },
    border: {
      type: 'line'
    }
  });

  return container;
}

module.exports = { createHeader };
