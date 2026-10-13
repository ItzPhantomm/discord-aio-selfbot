module.exports = [
  {
    name: 'svgcircle',
    category: 'Media',
    description: 'Generate SVG circle element code',
    usage: '.svgcircle [radius_px] [fill_hex]',
    run: async (ctx, args) => {
      const r = args[0] || '50';
      const fill = args[1] || '#ffffff';
      return ctx.reply(`\`\`\`xml\n<svg width="${r*2}" height="${r*2}" viewBox="0 0 ${r*2} ${r*2}">\n  <circle cx="${r}" cy="${r}" r="${r}" fill="${fill}" />\n</svg>\n\`\`\``);
    }
  },
  {
    name: 'svgrect',
    category: 'Media',
    description: 'Generate SVG rectangle element code',
    usage: '.svgrect [width] [height] [fill_hex]',
    run: async (ctx, args) => {
      const w = args[0] || '100';
      const h = args[1] || '60';
      const fill = args[2] || '#ffffff';
      return ctx.reply(`\`\`\`xml\n<svg width="${w}" height="${h}">\n  <rect width="${w}" height="${h}" rx="4" fill="${fill}" />\n</svg>\n\`\`\``);
    }
  },
  {
    name: 'aspectratio',
    category: 'Media',
    description: 'Calculate image or video aspect ratio from width and height dimensions',
    usage: '.aspectratio <width> <height>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.aspectratio <width> <height>`');
      const w = parseInt(args[0], 10);
      const h = parseInt(args[1], 10);
      if (!w || !h) return ctx.reply('❌ Invalid dimensions.');
      function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
      const divisor = gcd(w, h);
      return ctx.reply(`🖼️ **Aspect Ratio for ${w}x${h}:** \`${w / divisor}:${h / divisor}\` (${(w / h).toFixed(2)})`);
    }
  },
  {
    name: 'resizerecalc',
    category: 'Media',
    description: 'Recalculate proportional width or height maintaining aspect ratio',
    usage: '.resizerecalc <orig_w> <orig_h> <target_w>',
    run: async (ctx, args) => {
      if (args.length < 3) return ctx.reply('❌ Usage: `.resizerecalc <orig_w> <orig_h> <target_w>`');
      const ow = parseFloat(args[0]);
      const oh = parseFloat(args[1]);
      const tw = parseFloat(args[2]);
      const th = Math.round((oh / ow) * tw);
      return ctx.reply(`📐 **Proportional Resized Dimensions:** \`${tw} x ${th} px\``);
    }
  },
  {
    name: 'bitratecalc',
    category: 'Media',
    description: 'Estimate audio/video streaming file size from bitrate and duration',
    usage: '.bitratecalc <bitrate_kbps> <duration_sec>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.bitratecalc <kbps> <seconds>`');
      const kbps = parseFloat(args[0]);
      const sec = parseFloat(args[1]);
      const totalKbits = kbps * sec;
      const mbytes = (totalKbits / 8 / 1024).toFixed(2);
      return ctx.reply(`📊 **Estimated File Size:** \`${mbytes} MB\` (\`${kbps} kbps\` for \`${sec}s\`)`);
    }
  },
  {
    name: 'samplerateinfo',
    category: 'Media',
    description: 'Audio sample rate standard reference (44.1kHz, 48kHz, 96kHz)',
    usage: '.samplerateinfo <khz>',
    run: async (ctx, args) => {
      const rate = args[0] || '48';
      const rates = {
        '44.1': 'Red Book Audio CD standard. Nyquist limit at ~22.05 kHz.',
        '48': 'Professional digital video, broadcast, and Discord Opus voice gateway standard.',
        '96': 'High-resolution professional studio mastering audio sample rate.',
        '192': 'Ultra-fidelity studio acoustic capture standard.'
      };
      return ctx.reply(`🔊 **Sample Rate ${rate} kHz:** \`${rates[rate] || 'Standard PCM audio sampling frequency.'}\``);
    }
  },
  {
    name: 'decibelratio',
    category: 'Media',
    description: 'Convert decibel gain (dB) to linear voltage amplitude multiplier',
    usage: '.decibelratio <dB>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide dB gain value.');
      const db = parseFloat(args[0]);
      const linear = Math.pow(10, db / 20).toFixed(3);
      return ctx.reply(`📢 **${db} dB:** \`${linear}x\` linear amplitude factor`);
    }
  },
  {
    name: 'colorblend',
    category: 'Media',
    description: 'Calculate 50/50 linear RGB color blend of two hex values',
    usage: '.colorblend <hex1> <hex2>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.colorblend <hex1> <hex2>`');
      function p(h) {
        const c = parseInt(h.replace('#', ''), 16);
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
      }
      const [r1, g1, b1] = p(args[0]);
      const [r2, g2, b2] = p(args[1]);
      const res = '#' + [Math.round((r1+r2)/2), Math.round((g1+g2)/2), Math.round((b1+b2)/2)].map(x => x.toString(16).padStart(2, '0')).join('');
      return ctx.reply(`🎨 **Blended Color:** \`${res}\` (from ${args[0]} + ${args[1]})`);
    }
  },
  {
    name: 'rgbtocmyk',
    category: 'Media',
    description: 'Convert RGB color coordinates to CMYK print coordinates',
    usage: '.rgbtocmyk <r> <g> <b>',
    run: async (ctx, args) => {
      if (args.length < 3) return ctx.reply('❌ Usage: `.rgbtocmyk <r> <g> <b>`');
      const r = parseInt(args[0], 10) / 255;
      const g = parseInt(args[1], 10) / 255;
      const b = parseInt(args[2], 10) / 255;
      const k = 1 - Math.max(r, g, b);
      const c = k === 1 ? 0 : Math.round(((1 - r - k) / (1 - k)) * 100);
      const m = k === 1 ? 0 : Math.round(((1 - g - k) / (1 - k)) * 100);
      const y = k === 1 ? 0 : Math.round(((1 - b - k) / (1 - k)) * 100);
      return ctx.reply(`🖨️ **CMYK:** \`C:${c}% M:${m}% Y:${y}% K:${Math.round(k * 100)}%\``);
    }
  },
  {
    name: 'luminancecheck',
    category: 'Media',
    description: 'Calculate WCAG relative luminance and contrast score against black',
    usage: '.luminancecheck <hex_code>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide hex code.');
      const c = parseInt(args[0].replace('#', ''), 16);
      const r = (c >> 16) & 255;
      const g = (c >> 8) & 255;
      const b = c & 255;
      const lum = (0.2126 * (r/255) + 0.7152 * (g/255) + 0.0722 * (b/255)).toFixed(3);
      return ctx.reply(`💡 **Relative Luminance:** \`${lum}\` (${lum > 0.5 ? 'Light / Bright' : 'Dark / Shadow'})`);
    }
  }
];
