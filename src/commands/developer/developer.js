const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = [
  {
    name: 'gitcommitmsg',
    category: 'Developer',
    description: 'Format conventional commit message (feat, fix, refactor, docs)',
    usage: '.gitcommitmsg <type> <scope> <description>',
    run: async (ctx, args) => {
      if (args.length < 3) return ctx.reply('❌ Usage: `.gitcommitmsg <feat|fix|docs|refactor> <scope> <message>`');
      const type = args[0];
      const scope = args[1];
      const msg = args.slice(2).join(' ');
      return ctx.reply(`\`\`\`git\n${type}(${scope}): ${msg}\n\`\`\``);
    }
  },
  {
    name: 'npmscript',
    category: 'Developer',
    description: 'Format package.json script entry block',
    usage: '.npmscript <script_name> <command>',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.npmscript <name> <command>`');
      const name = args[0];
      const cmd = args.slice(1).join(' ');
      return ctx.reply(`\`\`\`json\n"${name}": "${cmd}"\n\`\`\``);
    }
  },
  {
    name: 'dockerfiletmpl',
    category: 'Developer',
    description: 'Generate multi-stage production Node.js Dockerfile template',
    usage: '.dockerfiletmpl',
    run: async (ctx) => {
      const tmpl = `FROM node:22-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\n\nFROM node:22-alpine\nWORKDIR /app\nCOPY --from=builder /app .\nUSER node\nCMD ["node", "src/index.js"]`;
      return ctx.reply(`\`\`\`dockerfile\n${tmpl}\n\`\`\``);
    }
  },
  {
    name: 'gitignoregen',
    category: 'Developer',
    description: 'Generate clean standard Node.js .gitignore template',
    usage: '.gitignoregen',
    run: async (ctx) => {
      const tmpl = `node_modules/\n.env\n*.log\ndata/backups/*.tmp\n.DS_Store\ncoverage/\nbuild/\ndist/`;
      return ctx.reply(`\`\`\`gitignore\n${tmpl}\n\`\`\``);
    }
  },
  {
    name: 'sqlcreate',
    category: 'Developer',
    description: 'Generate SQL CREATE TABLE template with primary key and timestamps',
    usage: '.sqlcreate <table_name> <col1:type> <col2:type>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Usage: `.sqlcreate <table_name> [col:type...]`');
      const tbl = args[0];
      const cols = args.slice(1).map(c => {
        const [name, type] = c.split(':');
        return `  ${name} ${type || 'VARCHAR(255)'}`;
      });
      cols.unshift('  id SERIAL PRIMARY KEY');
      cols.push('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      return ctx.reply(`\`\`\`sql\nCREATE TABLE ${tbl} (\n${cols.join(',\n')}\n);\n\`\`\``);
    }
  },
  {
    name: 'regexesc',
    category: 'Developer',
    description: 'Escape characters in string for safe inclusion in RegExp constructor',
    usage: '.regexesc <string>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide string.');
      const escaped = args.join(' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return ctx.reply(`\`${escaped}\``);
    }
  },
  {
    name: 'semvercheck',
    category: 'Developer',
    description: 'Validate Semantic Versioning string (e.g. 1.2.3, 2.0.0-beta.1)',
    usage: '.semvercheck <version>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide version string.');
      const v = args[0];
      const valid = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(v);
      return ctx.reply(`### 🏷️ SEMVER VALIDATION: ${v}\n* **Compliant:** \`${valid ? 'VALID SEMVER 2.0.0' : 'INVALID SYNTAX'}\``);
    }
  },
  {
    name: 'csstriangle',
    category: 'Developer',
    description: 'Generate CSS border-hack triangle generator snippet',
    usage: '.csstriangle <up|down|left|right> [size_px] [color_hex]',
    run: async (ctx, args) => {
      const dir = args[0]?.toLowerCase() || 'up';
      const size = args[1] || '10px';
      const color = args[2] || '#ffffff';
      let css = `width: 0;\nheight: 0;\nborder-style: solid;\n`;
      if (dir === 'up') css += `border-width: 0 ${size} ${size} ${size};\nborder-color: transparent transparent ${color} transparent;`;
      else if (dir === 'down') css += `border-width: ${size} ${size} 0 ${size};\nborder-color: ${color} transparent transparent transparent;`;
      else if (dir === 'left') css += `border-width: ${size} ${size} ${size} 0;\nborder-color: transparent ${color} transparent transparent;`;
      else css += `border-width: ${size} 0 ${size} ${size};\nborder-color: transparent transparent transparent ${color};`;
      return ctx.reply(`\`\`\`css\n${css}\n\`\`\``);
    }
  },
  {
    name: 'bashifblock',
    category: 'Developer',
    description: 'Generate bash script conditional if-statement block',
    usage: '.bashifblock <file|dir|var> <target>',
    run: async (ctx, args) => {
      const type = args[0]?.toLowerCase() || 'file';
      const target = args[1] || 'path/to/target';
      let check = `-f "${target}"`;
      if (type === 'dir') check = `-d "${target}"`;
      if (type === 'var') check = `-z "${target}"`;
      return ctx.reply(`\`\`\`bash\nif [ ${check} ]; then\n  echo "Condition matched for ${target}"\nfi\n\`\`\``);
    }
  },
  {
    name: 'cronexpr',
    category: 'Developer',
    description: 'Explain standard 5-part UNIX cron schedule expression (* * * * *)',
    usage: '.cronexpr <cron_string>',
    run: async (ctx, args) => {
      const expr = args.join(' ') || '0 0 * * *';
      return ctx.reply(`### ⏰ CRON SCHEDULE: \`${expr}\`\n* Format: \`[minute] [hour] [day_of_month] [month] [day_of_week]\`\n* Default Evaluation: Daily at 00:00 UTC`);
    }
  },
  {
    name: 'licensecheck',
    category: 'Developer',
    description: 'Inspect open-source software license characteristics (MIT, Apache, GPL, BSD)',
    usage: '.licensecheck <mit|apache|gpl|bsd>',
    run: async (ctx, args) => {
      const type = args[0]?.toLowerCase() || 'mit';
      const licenses = {
        'mit': 'Permissive. Allows commercial use, distribution, modification, and private use with notice preservation.',
        'apache': 'Permissive. Grants copyright and patent rights. Requires preservation of copyright notices and modification disclosures.',
        'gpl': 'Strong Copyleft. Derivative work and modified versions must be released under the same open GPL license.',
        'bsd': 'Permissive. Minimal restrictions similar to MIT with non-endorsement stipulations.'
      };
      return ctx.reply(`### 📜 LICENSE REVIEW: ${type.toUpperCase()}\n* **Summary:** ${licenses[type] || 'Standard Open-Source License'}`);
    }
  },
  {
    name: 'httpcurl',
    category: 'Developer',
    description: 'Generate formatted cURL command line snippet with custom headers',
    usage: '.httpcurl <method> <url> [auth_token]',
    run: async (ctx, args) => {
      if (args.length < 2) return ctx.reply('❌ Usage: `.httpcurl <GET|POST> <url> [token]`');
      const method = args[0].toUpperCase();
      const url = args[1];
      const token = args[2] ? `  -H "Authorization: ${args[2]}" \\\n` : '';
      return ctx.reply(`\`\`\`bash\ncurl -X ${method} "${url}" \\\n  -H "Content-Type: application/json" \\\n${token}  --silent\n\`\`\``);
    }
  },
  {
    name: 'asciicodes',
    category: 'Developer',
    description: 'Show ASCII character decimal, hex, and character representation table',
    usage: '.asciicodes <character>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide character.');
      const char = args[0][0];
      const dec = char.charCodeAt(0);
      const hex = dec.toString(16).toUpperCase();
      const bin = dec.toString(2).padStart(8, '0');
      return ctx.reply(`### 🔠 ASCII CODE FOR '${char}'\n* **Decimal:** \`${dec}\`\n* **Hexadecimal:** \`0x${hex}\`\n* **Binary Byte:** \`${bin}\``);
    }
  },
  {
    name: 'es6arrow',
    category: 'Developer',
    description: 'Convert traditional function definition to modern ES6 arrow function',
    usage: '.es6arrow <func_name> <param1,param2>',
    run: async (ctx, args) => {
      const name = args[0] || 'handler';
      const params = args[1] || 'a, b';
      return ctx.reply(`\`\`\`js\nconst ${name} = (${params}) => {\n  // Implementation\n};\n\`\`\``);
    }
  },
  {
    name: 'envvarcheck',
    category: 'Developer',
    description: 'Sanitized summary of Node.js execution runtime environment keys',
    usage: '.envvarcheck',
    run: async (ctx) => {
      const keys = Object.keys(process.env).filter(k => !k.includes('TOKEN') && !k.includes('KEY') && !k.includes('SECRET'));
      return ctx.reply(`### 🌐 RUNTIME ENVIRONMENT KEYS (${keys.length})\n\`${keys.slice(0, 15).join(', ')}...\``);
    }
  }
];
