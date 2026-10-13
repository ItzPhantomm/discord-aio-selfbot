/**
 * Obsidian & Monochrome Minimalist Design System
 * Inspired by ultra-high-end developer tools ($100,000 UI)
 * Pure obsidian backdrop, precision grays, bright white highlights, and monochrome gradient transitions.
 */

const PALETTE = {
  // Pure obsidian background & surface hierarchy
  bg: '#000000',
  surface: '#080808',
  elevated: '#121212',
  cardBg: '#181818',
  panelBorder: '#282828',
  panelBorderActive: '#FFFFFF',

  // Monochromatic typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#585858',
  textDim: '#383838',

  // High-contrast clean accent shades
  white: '#FFFFFF',
  snow: '#EEEEEE',
  silver: '#CCCCCC',
  steel: '#888888',
  charcoal: '#444444',
  black: '#000000',

  // Subtle clean status indicators
  success: '#E0E0E0',
  warning: '#C0C0C0',
  error: '#FF4444',
  info: '#FFFFFF',
  inactive: '#333333'
};

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function interpolateRgb(c1, c2, factor) {
  return {
    r: Math.round(c1.r + factor * (c2.r - c1.r)),
    g: Math.round(c1.g + factor * (c2.g - c1.g)),
    b: Math.round(c1.b + factor * (c2.b - c1.b))
  };
}

class ThemeEngine {
  constructor() {
    this.palette = PALETTE;
    this.reducedMotion = false;
  }

  interpolate(hex1, hex2, factor) {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    const res = interpolateRgb(c1, c2, factor);
    return rgbToHex(res.r, res.g, res.b);
  }

  gradientStops(colors, steps) {
    if (steps <= 1) return [colors[0]];
    const result = [];
    const segments = colors.length - 1;
    for (let i = 0; i < steps; i++) {
      const globalT = i / (steps - 1);
      const segmentIndex = Math.min(Math.floor(globalT * segments), segments - 1);
      const localT = (globalT - (segmentIndex / segments)) * segments;
      result.push(this.interpolate(colors[segmentIndex], colors[segmentIndex + 1], localT));
    }
    return result;
  }

  gradientText(text, colorStops = ['#FFFFFF', '#AAAAAA', '#666666']) {
    if (!text) return '';
    const chars = Array.from(text);
    const colors = this.gradientStops(colorStops, Math.max(chars.length, 2));
    return chars.map((char, i) => `{${colors[i]}-fg}${char}{/${colors[i]}-fg}`).join('');
  }

  color(text, hex) {
    return `{${hex}-fg}${text}{/${hex}-fg}`;
  }

  boldColor(text, hex) {
    return `{bold}{${hex}-fg}${text}{/${hex}-fg}{/bold}`;
  }

  divider(width = 30, colorStops = ['#FFFFFF', '#555555', '#222222']) {
    const line = '─'.repeat(width);
    return this.gradientText(line, colorStops);
  }

  progressBar(current, total, width = 16, colorStops = ['#FFFFFF', '#888888']) {
    const ratio = Math.max(0, Math.min(1, total > 0 ? current / total : 0));
    const filledCount = Math.round(ratio * width);
    const emptyCount = width - filledCount;

    const filledColors = this.gradientStops(colorStops, Math.max(filledCount, 2));
    const filledStr = Array.from({ length: filledCount }, (_, i) => `{${filledColors[i]}-fg}■{/${filledColors[i]}-fg}`).join('');
    const emptyStr = `{${PALETTE.panelBorder}-fg}${'·'.repeat(emptyCount)}{/${PALETTE.panelBorder}-fg}`;

    return `${filledStr}${emptyStr} {bold}${Math.round(ratio * 100)}%{/bold}`;
  }

  sparkline(values = [], color = '#FFFFFF') {
    if (values.length === 0) return '{#444444-fg}────────{/#444444-fg}';
    const glyphs = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const str = values.map(v => {
      const idx = Math.min(7, Math.max(0, Math.floor(((v - min) / range) * 7)));
      return glyphs[idx];
    }).join('');

    return `{${color}-fg}${str}{/${color}-fg}`;
  }
}

module.exports = new ThemeEngine();
module.exports.PALETTE = PALETTE;
module.exports.ThemeEngine = ThemeEngine;
