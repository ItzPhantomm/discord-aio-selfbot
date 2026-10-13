const assert = require('assert');
const { renderMarkdown } = require('../src/utils/Markdown');
const TokenGrabber = require('../src/utils/TokenGrabber');

async function testNewFeatures() {
  console.log('Testing Markdown Renderer & TokenGrabber...');

  // 1. Test Markdown conversion
  const mdSample = '**Bold text** and *italic* and `code`\n> Blockquote here\n### Heading 3\n* Bullet item';
  const rendered = renderMarkdown(mdSample);
  assert(rendered.includes('Bold text'), 'Markdown bold failed');
  assert(rendered.includes('Blockquote here'), 'Markdown quote failed');
  assert(rendered.includes('Heading 3'), 'Markdown heading failed');
  console.log(' Markdown renderer verified.');

  // 2. Test TokenGrabber snippet & bookmarklet generation
  const snippet = TokenGrabber.getConsoleSnippet(49152);
  assert(snippet.includes('webpackChunkdiscord_app'), 'Snippet missing discord chunk extraction');
  assert(snippet.includes('127.0.0.1:49152'), 'Snippet port binding missing');

  const bookmarklet = TokenGrabber.getBookmarklet(49152);
  assert(bookmarklet.startsWith('javascript:'), 'Bookmarklet prefix missing');
  console.log(' TokenGrabber snippet and bookmarklet generator verified.');

  console.log(' ALL NEW FEATURES UNIT TESTS PASSED!');
}

testNewFeatures().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
