const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createScreen() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'DISCORD AIO // COMMAND CENTER',
    dockBorders: true,
    fullUnicode: true,
    autoPadding: false,
    warnings: false,
    terminal: process.env.TERM || 'xterm-256color'
  });

  // Enable mouse tracking
  screen.enableMouse();

  // Global key bindings
  screen.key(['C-c'], () => {
    return process.exit(0);
  });

  return screen;
}

module.exports = { createScreen };
