const blessed = require('blessed');
const Theme = require('../utils/Theme');

function createInspectorPane(screen) {
  const inspector = blessed.box({
    parent: screen,
    top: 3,
    left: '70%',
    width: '30%',
    height: '100%-6',
    border: {
      type: 'line'
    },
    label: ` ${Theme.boldColor('◈ COMMAND INSPECTOR', Theme.palette.white)} `,
    tags: true,
    mouse: true,
    scrollable: true,
    scrollbar: {
      ch: '▐',
      style: {
        bg: Theme.palette.panelBorder,
        fg: Theme.palette.white
      }
    },
    style: {
      bg: Theme.palette.surface,
      border: {
        fg: Theme.palette.panelBorder
      }
    },
    content: `{center}\n\n${Theme.boldColor('◈ NO COMMAND SELECTED', Theme.palette.textMuted)}\n\n${Theme.color('Browse the sidebar categories or\npress [Enter] on a command to inspect.', Theme.palette.textSecondary)}{/center}`
  });

  return inspector;
}

module.exports = { createInspectorPane };
