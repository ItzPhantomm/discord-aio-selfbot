const os = require('os');

module.exports = [
  {
    name: 'osinfo',
    category: 'System',
    description: 'Detailed Host OS machine architecture, kernel version, and platform',
    usage: '.osinfo',
    run: async (ctx) => {
      return ctx.reply(`### 🖥️ HOST SYSTEM DIAGNOSTICS\n* **Platform:** \`${os.platform()} (${os.arch()})\`\n* **Release / Kernel:** \`${os.release()}\`\n* **Hostname:** \`${os.hostname()}\`\n* **CPUs:** \`${os.cpus().length} logical cores\` (\`${os.cpus()[0]?.model || 'Generic'}\`)\n* **System Uptime:** \`${Math.floor(os.uptime() / 3600)} hours\``);
    }
  },
  {
    name: 'cpuload',
    category: 'System',
    description: 'Show host machine 1m, 5m, and 15m load averages',
    usage: '.cpuload',
    run: async (ctx) => {
      const load = os.loadavg();
      return ctx.reply(`📊 **CPU Load Averages:** \`1m: ${load[0].toFixed(2)}\` │ \`5m: ${load[1].toFixed(2)}\` │ \`15m: ${load[2].toFixed(2)}\``);
    }
  },
  {
    name: 'rammetrics',
    category: 'System',
    description: 'Inspect total, free, and used system RAM and Node heap',
    usage: '.rammetrics',
    run: async (ctx) => {
      const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const free = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const used = (total - free).toFixed(2);
      const heap = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      return ctx.reply(`### 🧠 MEMORY UTILIZATION\n* **Total RAM:** \`${total} GB\`\n* **Used RAM:** \`${used} GB\` (${Math.round((used/total)*100)}%)\n* **Free RAM:** \`${free} GB\`\n* **Node V8 Heap:** \`${heap} MB\``);
    }
  },
  {
    name: 'netinterfaces',
    category: 'System',
    description: 'List local active network interfaces and IP addresses',
    usage: '.netinterfaces',
    run: async (ctx) => {
      const ifaces = os.networkInterfaces();
      const rows = [];
      for (const name in ifaces) {
        for (const net of ifaces[name]) {
          if (!net.internal) {
            rows.push(`* **${name}**: \`${net.address}\` (${net.family})`);
          }
        }
      }
      return ctx.reply(`### 🌐 NETWORK INTERFACES\n${rows.slice(0, 10).join('\n') || '> Only internal loopback active.'}`);
    }
  },
  {
    name: 'v8stats',
    category: 'System',
    description: 'Detailed Node.js V8 engine memory heap statistics',
    usage: '.v8stats',
    run: async (ctx) => {
      const mem = process.memoryUsage();
      return ctx.reply(`### ⚙️ V8 ENGINE MEMORY\n* **RSS Resident:** \`${(mem.rss/1024/1024).toFixed(2)} MB\`\n* **Heap Total:** \`${(mem.heapTotal/1024/1024).toFixed(2)} MB\`\n* **Heap Used:** \`${(mem.heapUsed/1024/1024).toFixed(2)} MB\`\n* **External C++:** \`${(mem.external/1024/1024).toFixed(2)} MB\``);
    }
  },
  {
    name: 'processenvcount',
    category: 'System',
    description: 'Count number of environment variables loaded in process',
    usage: '.processenvcount',
    run: async (ctx) => {
      const count = Object.keys(process.env).length;
      return ctx.reply(`📦 **Process Environment:** \`${count}\` variables registered.`);
    }
  },
  {
    name: 'eventlooplag',
    category: 'System',
    description: 'Measure current Node.js asynchronous event loop lag in milliseconds',
    usage: '.eventlooplag',
    run: async (ctx) => {
      const start = Date.now();
      setImmediate(() => {
        const lag = Date.now() - start;
        return ctx.reply(`⏱️ **Event Loop Lag:** \`${lag}ms\` (${lag < 5 ? 'Excellent' : 'Congested'})`);
      });
    }
  },
  {
    name: 'sysuser',
    category: 'System',
    description: 'Show host machine active executing user identity and homedir',
    usage: '.sysuser',
    run: async (ctx) => {
      const user = os.userInfo();
      return ctx.reply(`👤 **Host OS User:** \`${user.username}\` (Home: \`${user.homedir}\`)`);
    }
  },
  {
    name: 'tempdir',
    category: 'System',
    description: 'Print host operating system temporary files directory',
    usage: '.tempdir',
    run: async (ctx) => {
      return ctx.reply(`📁 **OS Temp Directory:** \`${os.tmpdir()}\``);
    }
  },
  {
    name: 'uptimehost',
    category: 'System',
    description: 'Show host server hardware uptime vs selfbot runtime',
    usage: '.uptimehost',
    run: async (ctx) => {
      const hostHours = Math.floor(os.uptime() / 3600);
      const botHours = Math.floor(process.uptime() / 3600);
      return ctx.reply(`⏱️ **Uptime Metrics:**\n* **Host Machine:** \`${hostHours} hours\`\n* **Selfbot Process:** \`${botHours} hours\``);
    }
  }
];
