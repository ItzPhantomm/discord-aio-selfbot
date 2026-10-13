const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { Storage } = require('../src/utils/Storage');
const Logger = require('../src/utils/Logger');
const TextEffects = require('../src/utils/TextEffects');

async function testUtils() {
  console.log('Testing Storage...');
  const testStorePath = path.join(__dirname, 'test_storage.json');
  if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
  
  const store = new Storage(testStorePath);
  store.set('foo', 'bar');
  assert.strictEqual(store.get('foo'), 'bar');
  assert.strictEqual(store.get('nonexistent', 'def'), 'def');
  store.push('list', 1);
  store.push('list', 2);
  assert.deepStrictEqual(store.get('list'), [1, 2]);
  store.delete('foo');
  assert.strictEqual(store.get('foo'), null);
  if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
  console.log(' Storage tests passed.');

  console.log('Testing TextEffects...');
  assert.strictEqual(TextEffects.reverse('hello'), 'olleh');
  assert.strictEqual(TextEffects.clap('foo bar'), 'foo 👏 bar');
  assert.strictEqual(TextEffects.mock('test'), 'tEsT');
  assert.strictEqual(TextEffects.leet('leet'), 'l337');
  const morse = TextEffects.morse('SOS');
  assert.strictEqual(morse, '... --- ...');
  assert.strictEqual(TextEffects.morse(morse, false), 'SOS');
  console.log(' TextEffects tests passed.');

  console.log('Testing Logger...');
  let loggedMsg = null;
  const mockPane = {
    log: (msg) => { loggedMsg = msg; }
  };
  Logger.setTuiPane(mockPane);
  Logger.cmd('Test message');
  assert(loggedMsg.includes('Test message'), 'Logger did not format output');
  console.log(' Logger tests passed.');
}

testUtils().then(() => {
  console.log('ALL UTILS TESTS PASSED!');
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
