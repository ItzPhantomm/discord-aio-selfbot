const Orchestrator = require('../../agent/core/Orchestrator');
const ModelRegistry = require('../../agent/providers/ModelRegistry');
const ProviderManager = require('../../agent/providers/ProviderManager');
const Logger = require('../../utils/Logger');

let sharedOrchestrator = null;

function getOrchestrator() {
  if (!sharedOrchestrator) {
    sharedOrchestrator = new Orchestrator();
  }
  return sharedOrchestrator;
}

module.exports = [
  {
    name: 'agent',
    category: 'General',
    description: 'Launch autonomous AI Agent with dynamic tool-calling, planning, and verification',
    usage: '.agent [--model=name] [--reasoning=low|med|high] [--autonomy=read_only|confirm_actions|full] <prompt>',
    aliases: ['ai', 'codex', 'askagent'],
    run: async (ctx, rawArgs) => {
      if (!rawArgs || rawArgs.length === 0) {
        return ctx.reply('### 🤖 DISCORD AUTONOMOUS AGENT\nUsage: `.agent <prompt>`\n* Options: `--model=<name>`, `--reasoning=<low|medium|high>`, `--autonomy=<read_only|confirm_actions|full>`\n* Model & Provider Setup: `.modelsetup`\n* Example: `.agent Find the 3 most active chatters in this channel and analyze their profiles`');
      }

      // Parse CLI flags and prompt
      let model = null;
      let reasoning = 'medium';
      let autonomy = 'confirm_actions';
      let maxSteps = 8;
      const promptParts = [];

      for (const arg of rawArgs) {
        if (arg.startsWith('--model=')) {
          model = arg.split('=')[1];
        } else if (arg.startsWith('--reasoning=')) {
          reasoning = arg.split('=')[1];
        } else if (arg.startsWith('--autonomy=')) {
          autonomy = arg.split('=')[1];
        } else if (arg.startsWith('--steps=')) {
          maxSteps = parseInt(arg.split('=')[1], 10) || 8;
        } else {
          promptParts.push(arg);
        }
      }

      const prompt = promptParts.join(' ').trim();
      if (!prompt) {
        return ctx.reply('❌ Please supply a prompt for the agent to execute.');
      }

      const orch = getOrchestrator();
      const effectiveModel = model || ProviderManager.providers[ProviderManager.primaryProvider]?.defaultModel || 'meta-llama/llama-3.3-70b-instruct';

      const statusMsg = await ctx.reply(`🧠 **Agent Dispatched:** *"${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"*\n> *Thinking & assembling plan...* (Model: \`${effectiveModel.split('/').pop()}\`, Provider: \`${ProviderManager.primaryProvider.toUpperCase()}\`, Reasoning: \`${reasoning.toUpperCase()}\`)`);

      try {
        const result = await orch.execute({
          prompt,
          ctx,
          model: effectiveModel,
          reasoning,
          autonomy,
          maxSteps,
          onProgress: (p) => {
            if (p.type === 'provider_failover') {
              Logger.warn(`[Failover] Switched from ${p.fromProvider} to ${p.toProvider}`);
            } else if (p.type === 'tool_start') {
              Logger.info(`[Agent Tool Start] ${p.name}`);
            } else if (p.type === 'tool_end') {
              Logger.info(`[Agent Tool Done] ${p.name} (${p.result?.status})`);
            }
          }
        });

        const output = `### 🤖 AGENT EXECUTION COMPLETED\n${result.finalAnswer}`;
        return ctx.reply(output);
      } catch (err) {
        Logger.error(`Agent run failed: ${err.message}`);
        return ctx.reply(`⚠️ **Agent Error:** \`${err.message}\``);
      }
    }
  },
  {
    name: 'modelsetup',
    category: 'General',
    description: 'Configure OpenRouter & NVIDIA NIM API keys, view masked credentials, and search models by name',
    usage: '.modelsetup [openrouter|nvidia|search|key|primary|model] [args...]',
    aliases: ['setupmodels', 'providers', 'aimodels'],
    run: async (ctx, args) => {
      const sub = args[0]?.toLowerCase();

      // Subcommand: .modelsetup openrouter -> View OpenRouter models
      if (sub === 'openrouter') {
        const models = ModelRegistry.list('openrouter');
        const rows = models.map(m => `* **${m.id}**\n  > ${m.description} (\`${m.contextWindow.toLocaleString()} tokens\`)`);
        return ctx.reply(`### 🌐 OPENROUTER MODEL CATALOG (${models.length})\n${rows.join('\n')}\n\n> To search by name: \`.modelsetup search <query>\`\n> To set active model: \`.modelsetup model openrouter <model_id>\``);
      }

      // Subcommand: .modelsetup nvidia -> View NVIDIA NIM models
      if (sub === 'nvidia') {
        const models = ModelRegistry.list('nvidia');
        const rows = models.map(m => `* **${m.id}**\n  > ${m.description} (\`${m.contextWindow.toLocaleString()} tokens\`)`);
        return ctx.reply(`### ⚡ NVIDIA NIM MODEL CATALOG (${models.length})\n${rows.join('\n')}\n\n> To search by name: \`.modelsetup search <query>\`\n> To set active model: \`.modelsetup model nvidia <model_id>\``);
      }

      // Subcommand: .modelsetup search <query> -> Search across all models
      if (sub === 'search') {
        const query = args.slice(1).join(' ').trim();
        if (!query) return ctx.reply('❌ Usage: `.modelsetup search <model_name>`');
        const results = ModelRegistry.search(query);
        if (results.length === 0) return ctx.reply(`🔍 No models found matching "${query}".`);

        const rows = results.map(m => `* **${m.id}** [Provider: \`${m.provider.toUpperCase()}\`]\n  > ${m.description} (Context: \`${m.contextWindow.toLocaleString()}\`)`);
        return ctx.reply(`### 🔍 MODEL SEARCH RESULTS FOR "${query}" (${results.length})\n${rows.join('\n')}`);
      }

      // Subcommand: .modelsetup key <provider> <key> -> Store API key
      if (sub === 'key') {
        const prov = args[1]?.toLowerCase();
        const key = args[2]?.trim();
        if (!['openrouter', 'nvidia'].includes(prov) || !key) {
          return ctx.reply('❌ Usage: `.modelsetup key <openrouter|nvidia> <your_api_key>`');
        }
        ProviderManager.setApiKey(prov, key);
        return ctx.reply(`✅ API key for **${prov.toUpperCase()}** stored securely. Masked: \`${ProviderManager.getMaskedKey(prov)}\``);
      }

      // Subcommand: .modelsetup primary <provider> -> Set primary provider
      if (sub === 'primary') {
        const prov = args[1]?.toLowerCase();
        if (!['openrouter', 'nvidia'].includes(prov)) {
          return ctx.reply('❌ Usage: `.modelsetup primary <openrouter|nvidia>`');
        }
        ProviderManager.setPrimary(prov);
        return ctx.reply(`✅ Primary provider set to **${prov.toUpperCase()}**. Fallback automatically set to **${ProviderManager.fallbackProvider.toUpperCase()}**.`);
      }

      // Subcommand: .modelsetup model <provider> <model_name> -> Set default model
      if (sub === 'model') {
        const prov = args[1]?.toLowerCase();
        const modelName = args[2]?.trim();
        if (!['openrouter', 'nvidia'].includes(prov) || !modelName) {
          return ctx.reply('❌ Usage: `.modelsetup model <openrouter|nvidia> <model_name>`');
        }
        ProviderManager.setModel(prov, modelName);
        return ctx.reply(`✅ Default model for **${prov.toUpperCase()}** updated to: \`${modelName}\``);
      }

      // Default: Display Provider Overview & Masked Keys
      const orKey = ProviderManager.getMaskedKey('openrouter');
      const nimKey = ProviderManager.getMaskedKey('nvidia');
      const orModel = ProviderManager.providers.openrouter.defaultModel;
      const nimModel = ProviderManager.providers.nvidia.defaultModel;
      const primary = ProviderManager.primaryProvider.toUpperCase();
      const fallback = ProviderManager.fallbackProvider.toUpperCase();

      let overview = `### ⚙️ MULTI-PROVIDER AI MODEL SETUP\n`;
      overview += `* **1. OpenRouter Provider**\n`;
      overview += `  * API Key: \`${orKey}\`\n`;
      overview += `  * Default Model: \`${orModel}\`\n`;
      overview += `  * Role: ${primary === 'OPENROUTER' ? '👑 **ACTIVE PRIMARY**' : '🛡️ **FALLBACK BACKUP**'}\n\n`;

      overview += `* **2. NVIDIA NIM Provider**\n`;
      overview += `  * API Key: \`${nimKey}\`\n`;
      overview += `  * Default Model: \`${nimModel}\`\n`;
      overview += `  * Role: ${primary === 'NVIDIA' ? '👑 **ACTIVE PRIMARY**' : '🛡️ **FALLBACK BACKUP**'}\n\n`;

      overview += `* **⚡ Automatic Failover Policy:** \`ENABLED\`\n`;
      overview += `  > If **${primary}** reaches rate-limits (HTTP 429), quota limits (HTTP 402), or server load, the agent will **automatically fail over to ${fallback}** and complete the task without crashing.\n\n`;

      overview += `### 📖 SETUP COMMANDS:\n`;
      overview += `* \`.modelsetup openrouter\` - View all OpenRouter models\n`;
      overview += `* \`.modelsetup nvidia\` - View all NVIDIA NIM models\n`;
      overview += `* \`.modelsetup search <query>\` - Search models across providers by name\n`;
      overview += `* \`.modelsetup key <openrouter|nvidia> <key>\` - Save API key\n`;
      overview += `* \`.modelsetup primary <openrouter|nvidia>\` - Toggle primary provider\n`;
      overview += `* \`.modelsetup model <openrouter|nvidia> <name>\` - Set configured model\n`;

      return ctx.reply(overview);
    }
  },
  {
    name: 'agentmodels',
    category: 'General',
    description: 'List available OpenRouter and NVIDIA NIM models for the AI Agent',
    usage: '.agentmodels [openrouter|nvidia]',
    run: async (ctx, args) => {
      const prov = args[0]?.toLowerCase();
      const models = ModelRegistry.list(prov);
      const list = models.map(m => `* **${m.id}** [${m.provider.toUpperCase()}]\n  > ${m.description} (Context: \`${m.contextWindow.toLocaleString()} tokens\`)`).slice(0, 15).join('\n');
      return ctx.reply(`### 🧠 AI MODEL CATALOG (${models.length})\n${list}\n\n> For search & key setup: \`.modelsetup\`\n> To run: \`.agent --model=<name> <prompt>\``);
    }
  },
  {
    name: 'agentmemory',
    category: 'General',
    description: 'Inspect or configure cross-session persistent agent memory in SQLite',
    usage: '.agentmemory [set|get|clear|all] [key] [value]',
    aliases: ['aimemory', 'memory'],
    run: async (ctx, args) => {
      const Storage = require('../../utils/Storage');
      const action = args[0]?.toLowerCase();

      if (action === 'set' && args[1]) {
        const key = args[1];
        const val = args.slice(2).join(' ');
        Storage.setMemory(key, val);
        return ctx.reply(`🧠 **Agent Memory Saved**: \`${key}\` ➔ "${val}"`);
      }

      if (action === 'get' && args[1]) {
        const val = Storage.getMemory(args[1]);
        return ctx.reply(`🧠 **Agent Memory [${args[1]}]**: ${val !== null ? JSON.stringify(val) : '*Not found*'}`);
      }

      const all = Storage.getAllMemory();
      const keys = Object.keys(all);
      if (keys.length === 0) {
        return ctx.reply('🧠 **Agent Memory**: No persistent cross-session memories saved yet. Use `.agentmemory set <key> <value>`.');
      }

      let text = `### 🧠 PERSISTENT AGENT MEMORY (${keys.length} ENTRIES)\n`;
      keys.forEach(k => {
        text += `* **\`${k}\`**: ${JSON.stringify(all[k])}\n`;
      });
      return ctx.reply(text);
    }
  },
  {
    name: 'standinggoals',
    category: 'General',
    description: 'Manage persistent standing goals and scheduled instructions for the ReAct agent',
    usage: '.standinggoals [add|list|delete|start|stop] [args...]',
    aliases: ['goals', 'standinggoal'],
    run: async (ctx, args) => {
      const StandingGoalsManager = require('../../agent/core/StandingGoalsManager');
      const orch = getOrchestrator();
      StandingGoalsManager.setEngine(orch.engine);

      const action = args[0]?.toLowerCase();

      if (action === 'add' && args.length > 1) {
        const instruction = args.slice(1).join(' ');
        const goal = StandingGoalsManager.addGoal({
          title: instruction.slice(0, 30),
          instruction,
          channelId: ctx.channel?.id,
          guildId: ctx.guild?.id,
          intervalSec: 300
        });
        StandingGoalsManager.start(ctx);
        return ctx.reply(`🎯 **Standing Goal Registered [ID ${goal.id}]**:\n* Title: \`${goal.title}\`\n* Interval: \`5 minutes\`\n* Standing instruction is now active in background.`);
      }

      if (action === 'delete' && args[1]) {
        const id = parseInt(args[1], 10);
        StandingGoalsManager.deleteGoal(id);
        return ctx.reply(`🎯 **Standing Goal [ID ${id}]** removed.`);
      }

      const goals = StandingGoalsManager.listGoals();
      if (goals.length === 0) {
        return ctx.reply('🎯 **Standing Goals**: No active standing instructions. Use `.standinggoals add <instruction>` to register a persistent background monitor.');
      }

      let text = `### 🎯 ACTIVE STANDING GOALS (${goals.length})\n`;
      goals.forEach(g => {
        text += `* **[ID ${g.id}]** \`${g.title}\` (Every ${Math.round(g.interval_sec / 60)}m) · Last Status: *${g.last_status || 'Pending'}*\n  > ${g.instruction}\n`;
      });
      return ctx.reply(text);
    }
  },
  {
    name: 'agenttools',
    category: 'General',
    description: 'List all structured Discord tools available to the AI Agent',
    usage: '.agenttools',
    run: async (ctx) => {
      const tools = getOrchestrator().engine.toolRegistry.getDefinitions();
      const list = tools.map(t => `* \`${t.function.name}\` - ${t.function.description}`).join('\n');
      return ctx.reply(`### 🛠️ REGISTERED AGENT TOOLS (${tools.length})\n${list}`);
    }
  }
];
