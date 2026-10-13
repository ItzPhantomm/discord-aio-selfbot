const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/web/public');

// Read files in dependency order
const order = [
  'common.js',
  'ui.js',
  'state.js',
  'views-home.js',
  'views-cmd.js',
  'views-auto.js',
  'views-b.js',
  'views-c.js',
  'views-presence.js',
  'views-d.js',
  'views-auth.js'
];

let bundleCode = '"use strict";\n\n';

for (const f of order) {
  let content = fs.readFileSync(path.join(srcDir, f), 'utf-8');
  // Strip "use strict";
  content = content.replace(/"use strict";\s*/g, '');
  // Strip emojis
  content = content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}]/gu, '');
  bundleCode += `/* === BUNDLE: ${f} === */\n` + content + '\n\n';
}

// Now append app.js shell and router logic
let appCode = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf-8');
appCode = appCode.replace(/"use strict";\s*/g, '');
appCode = appCode.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}]/gu, '');
bundleCode += '/* === BUNDLE: app.js === */\n' + appCode + '\n';

// Write to app.bundle.js
const outPath = path.join(srcDir, 'app.bundle.js');
fs.writeFileSync(outPath, bundleCode, 'utf-8');
console.log('Generated app.bundle.js successfully. Size:', (bundleCode.length / 1024).toFixed(1), 'KB');
