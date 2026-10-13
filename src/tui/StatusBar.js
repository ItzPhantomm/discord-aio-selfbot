const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createStatusBar(screen) {
  const statusBar = blessed.box({
    parent: screen,
    bottom: 3,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    style: {
      bg: Theme.palette.elevated,
      fg: Theme.palette.textSecondary
    },
    content: ''
  });

  return statusBar;
}

module.exports = { createStatusBar };
