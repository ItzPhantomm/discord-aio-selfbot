const assert = require('assert');
const { createScreen } = require('../src/tui/Screen');
const { createHeader } = require('../src/tui/Header');
const { createSidebar } = require('../src/tui/Sidebar');
const { createLogPane } = require('../src/tui/LogPane');
const { createStatusBar } = require('../src/tui/StatusBar');
const { createInputPrompt } = require('../src/tui/InputPrompt');

async function testTui() {
  console.log('Testing TUI Headless Components...');
  const screen = createScreen();
  assert(screen !== null, 'Screen failed to initialize');

  const header = createHeader(screen);
  assert(header !== null, 'Header component failed');

  const sidebar = createSidebar(screen);
  assert(sidebar !== null, 'Sidebar component failed');

  const logPane = createLogPane(screen);
  assert(logPane !== null, 'LogPane component failed');

  const statusBar = createStatusBar(screen);
  assert(statusBar !== null, 'StatusBar component failed');

  const { form, input } = createInputPrompt(screen);
  assert(form !== null && input !== null, 'InputPrompt component failed');

  // Destroy screen safely after headless validation
  screen.destroy();
  console.log(' TUI components initialized and rendered cleanly in headless mode!');
}

testTui().catch(err => {
  console.error('TUI Test failed:', err);
  process.exit(1);
});
