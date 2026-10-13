const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createInputPrompt(screen) {
  const form = blessed.form({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: {
      type: 'line'
    },
    label: ` ${Theme.boldColor('❯ COMMAND TERMINAL', Theme.palette.white)} `,
    style: {
      bg: Theme.palette.surface,
      border: {
        fg: Theme.palette.panelBorder
      }
    }
  });

  const input = blessed.textbox({
    parent: form,
    bottom: 0,
    left: 1,
    height: 1,
    width: '98%',
    inputOnFocus: true,
    style: {
      fg: Theme.palette.textPrimary,
      bg: Theme.palette.surface,
      focus: {
        bg: Theme.palette.elevated
      }
    }
  });

  return { form, input };
}

module.exports = { createInputPrompt };
