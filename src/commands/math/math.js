module.exports = [
  {
    name: 'factorial',
    category: 'Math',
    description: 'Calculate integer factorial (n!)',
    usage: '.factorial <integer>',
    run: async (ctx, args) => {
      const n = parseInt(args[0], 10);
      if (isNaN(n) || n < 0 || n > 170) return ctx.reply('❌ Provide integer between 0 and 170.');
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return ctx.reply(`🔢 **${n}!** = \`${res.toLocaleString()}\``);
    }
  },
  {
    name: 'fibonacci',
    category: 'Math',
    description: 'Calculate the Nth Fibonacci sequence number',
    usage: '.fibonacci <n>',
    run: async (ctx, args) => {
      const n = parseInt(args[0], 10);
      if (isNaN(n) || n < 0 || n > 100) return ctx.reply('❌ Provide integer between 0 and 100.');
      let a = 0n, b = 1n;
      for (let i = 0; i < n; i++) {
        const temp = a + b;
        a = b;
        b = temp;
      }
      return ctx.reply(`🔢 **Fibonacci(${n}):** \`${a.toString()}\``);
    }
  },
  {
    name: 'isprime',
    category: 'Math',
    description: 'Test whether number is prime with trial factorization',
    usage: '.isprime <number>',
    run: async (ctx, args) => {
      const n = parseInt(args[0], 10);
      if (isNaN(n) || n < 2) return ctx.reply(`❌ ${n} is not prime.`);
      for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return ctx.reply(`🔢 **${n} is COMPOSITE** (Divisible by ${i})`);
      }
      return ctx.reply(`✨ **${n} is PRIME!**`);
    }
  },
  {
    name: 'gcdlcm',
    category: 'Math',
    description: 'Calculate Greatest Common Divisor and Least Common Multiple of two numbers',
    usage: '.gcdlcm <num1> <num2>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.gcdlcm <a> <b>`');
      const a = parseInt(args[0], 10);
      const b = parseInt(args[1], 10);
      function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
      const g = gcd(a, b);
      const l = (a * b) / g;
      return ctx.reply(`🔢 **GCD:** \`${g}\` │ **LCM:** \`${l}\``);
    }
  },
  {
    name: 'quadratic',
    category: 'Math',
    description: 'Solve quadratic equation ax^2 + bx + c = 0',
    usage: '.quadratic <a> <b> <c>',
    run: async (ctx, args) => {
      if (args.length < 3) return ctx.reply('❌ Usage: `.quadratic <a> <b> <c>`');
      const a = parseFloat(args[0]);
      const b = parseFloat(args[1]);
      const c = parseFloat(args[2]);
      const disc = b * b - 4 * a * c;
      if (disc < 0) return ctx.reply('❌ No real roots (complex roots exist).');
      const root1 = (-b + Math.sqrt(disc)) / (2 * a);
      const root2 = (-b - Math.sqrt(disc)) / (2 * a);
      return ctx.reply(`📐 **Roots for ${a}x² + ${b}x + ${c} = 0:**\n* x₁ = \`${root1.toFixed(4)}\`\n* x₂ = \`${root2.toFixed(4)}\``);
    }
  },
  {
    name: 'statistics',
    category: 'Math',
    description: 'Calculate mean, median, min, max, and standard deviation of comma-separated numbers',
    usage: '.statistics <1,2,3,4,5...>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide numbers separated by commas.');
      const nums = args.join(' ').split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (nums.length === 0) return ctx.reply('❌ No valid numbers.');
      nums.sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const median = nums.length % 2 === 0 ? (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2 : nums[Math.floor(nums.length / 2)];
      const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length;
      const stddev = Math.sqrt(variance);
      return ctx.reply(`### 📊 STATISTICAL SUMMARY (${nums.length} samples)\n* **Mean:** \`${mean.toFixed(2)}\`\n* **Median:** \`${median}\`\n* **Min / Max:** \`${nums[0]}\` / \`${nums[nums.length - 1]}\`\n* **Standard Deviation:** \`${stddev.toFixed(3)}\``);
    }
  },
  {
    name: 'degreesradians',
    category: 'Math',
    description: 'Convert angle between degrees and radians',
    usage: '.degreesradians <degrees|radians> <value>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.degreesradians <deg|rad> <value>`');
      const type = args[0].toLowerCase();
      const val = parseFloat(args[1]);
      if (type.startsWith('deg')) {
        const rad = (val * (Math.PI / 180)).toFixed(4);
        return ctx.reply(`📐 **${val}°** = \`${rad} rad\``);
      } else {
        const deg = (val * (180 / Math.PI)).toFixed(2);
        return ctx.reply(`📐 **${val} rad** = \`${deg}°\``);
      }
    }
  },
  {
    name: 'tempconvert',
    category: 'Math',
    description: 'Convert temperature across Celsius, Fahrenheit, and Kelvin',
    usage: '.tempconvert <value> <C|F|K>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.tempconvert <value> <C|F|K>`');
      const val = parseFloat(args[0]);
      const unit = args[1].toUpperCase();
      let c;
      if (unit === 'C') c = val;
      else if (unit === 'F') c = (val - 32) * (5 / 9);
      else if (unit === 'K') c = val - 273.15;
      else return ctx.reply('❌ Unit must be C, F, or K.');
      const f = c * (9 / 5) + 32;
      const k = c + 273.15;
      return ctx.reply(`🌡️ **Temperature Conversions:**\n* **Celsius:** \`${c.toFixed(2)} °C\`\n* **Fahrenheit:** \`${f.toFixed(2)} °F\`\n* **Kelvin:** \`${k.toFixed(2)} K\``);
    }
  },
  {
    name: 'speedconvert',
    category: 'Math',
    description: 'Convert speed across m/s, km/h, mph, and knots',
    usage: '.speedconvert <value> <kmh|mph|ms|knots>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.speedconvert <val> <kmh|mph|ms|knots>`');
      const val = parseFloat(args[0]);
      const unit = args[1].toLowerCase();
      let ms;
      if (unit === 'ms') ms = val;
      else if (unit === 'kmh') ms = val / 3.6;
      else if (unit === 'mph') ms = val * 0.44704;
      else if (unit === 'knots') ms = val * 0.514444;
      else return ctx.reply('❌ Unknown unit.');
      return ctx.reply(`🏎️ **Speed Equivalents:**\n* **m/s:** \`${ms.toFixed(2)} m/s\`\n* **km/h:** \`${(ms * 3.6).toFixed(2)} km/h\`\n* **mph:** \`${(ms / 0.44704).toFixed(2)} mph\`\n* **knots:** \`${(ms / 0.514444).toFixed(2)} kts\``);
    }
  },
  {
    name: 'byteconvert',
    category: 'Math',
    description: 'Convert byte quantities across KB, MB, GB, and TB scales',
    usage: '.byteconvert <bytes>',
    run: async (ctx, args) => {
      const b = parseFloat(args[0]);
      if (isNaN(b)) return ctx.reply('❌ Provide numerical bytes.');
      const kb = (b / 1024).toFixed(2);
      const mb = (b / 1024 / 1024).toFixed(2);
      const gb = (b / 1024 / 1024 / 1024).toFixed(3);
      return ctx.reply(`💾 **Data Volume Equivalents:**\n* \`${kb} KB\`\n* \`${mb} MB\`\n* \`${gb} GB\``);
    }
  }
];
