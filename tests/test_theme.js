const assert = require('assert');
const Theme = require('../src/utils/Theme');

async function testTheme() {
  console.log('Testing Obsidian Monochrome Theme Engine...');

  assert(Theme.palette.bg === '#000000', 'Theme bg color mismatch');
  assert(Theme.palette.white === '#FFFFFF', 'Theme white mismatch');

  const interpolated = Theme.interpolate('#000000', '#ffffff', 0.5);
  console.log('Interpolated mid-gray:', interpolated);
  assert(interpolated === '#808080', 'Interpolation failed');

  const grad = Theme.gradientText('COMMAND CENTER');
  assert(grad.includes('-fg}'), 'Gradient text formatting missing tags');

  const bar = Theme.progressBar(50, 100, 10);
  assert(bar.includes('50%'), 'Progress bar formatting mismatch');

  const spark = Theme.sparkline([1, 2, 5, 8, 3, 4, 7]);
  assert(spark.length > 0, 'Sparkline output empty');

  console.log(' Obsidian Aurora Theme Engine tests passed 100%!');
}

testTheme().catch(err => {
  console.error('Theme test failed:', err);
  process.exit(1);
});
