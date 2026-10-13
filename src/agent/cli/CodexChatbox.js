const readline = require('readline');
const Orchestrator = require('../core/Orchestrator');
const ModelRegistry = require('../providers/ModelRegistry');
const ProviderManager = require('../providers/ProviderManager');
const Theme = require('../../utils/Theme');
const Logger = require('../../utils/Logger');

class CodexChatbox {
  constructor(options = {}) {
    this.orchestrator = options.orchestrator || new Orchestrator(options);
    this.ctx = options.ctx || null;
    this.model = options.model || ProviderManager.providers[ProviderManager.primaryProvider]?.defaultModel || 'meta-llama/llama-3.3-70b-instruct';
    this.reasoning = options.reasoning || 'medium';
    this.autonomy = options.autonomy || 'confirm_actions';
    this.sessionId = `codex_${Date.now().toString(36)}`;
    this.currentAbortController = null;
    this.isRunning = false;
    this.rl = null;
  }

  printHeader() {
    const w = 76;
    const border = '─'.repeat(w);
    const primaryProv = ProviderManager.primaryProvider.toUpperCase();
    const fallbackProv = ProviderManager.fallbackProvider.toUpperCase();
    console.log(`\n\x1b[90m┌${border}┐\x1b[0m`);
    console.log(`\x1b[90m│\x1b[0m \x1b[1m\x1b[37m◈ CODEX AGENT INTERFACE // OPENROUTER & NVIDIA NIM\x1b[0m` + ' '.repeat(w - 51) + `\x1b[90m│\x1b[0m`);
    const statusLine = `Primary: ${primaryProv} (${this.model.split('/').pop()}) │ Fallback: ${fallbackProv} │ Autonomy: ${this.autonomy.toUpperCase()}`;
    console.log(`\x1b[90m│\x1b[0m \x1b[36m${statusLine.padEnd(w - 1, ' ')}\x1b[0m\x1b[90m│\x1b[0m`);
    const helpLine = `Commands: /setup, /search <name>, /model <id>, /reasoning, /clear │ Ctrl+C: Cancel`;
    console.log(`\x1b[90m│\x1b[0m \x1b[90m${helpLine.padEnd(w - 1, ' ')}\x1b[0m\x1b[90m│\x1b[0m`);
    console.log(`\x1b[90m└${border}┘\x1b[0m\n`);
  }

  start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[1m\x1b[37mcodex❯\x1b[0m '
    });

    this.printHeader();
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }

      // Handle Slash Commands
      if (input.startsWith('/')) {
        await this.handleCommand(input);
        this.rl.prompt();
        return;
      }

      // Execute Agent Request
      await this.runQuery(input);
      this.rl.prompt();
    });

    this.rl.on('SIGINT', () => {
      if (this.isRunning && this.currentAbortController) {
        console.log('\n\x1b[33m[!] Interrupt signal received: Cancelling active agent workflow...\x1b[0m');
        this.currentAbortController.abort();
      } else {
        console.log('\nExiting Codex interface.');
        this.close();
      }
    });
  }

  close() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  async handleCommand(cmdStr) {
    const tokens = cmdStr.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const arg = tokens[1]?.toLowerCase();

    switch (cmd) {
      case '/help':
        console.log('\x1b[36mSlash Commands:\x1b[0m');
        console.log('  /setup              - View provider credentials, masked API keys, and failover status');
        console.log('  /search <query>     - Search models across OpenRouter & NVIDIA by name');
        console.log('  /model [id]         - View or switch active model');
        console.log('  /provider <or|nim>  - View all models for specific provider (openrouter or nvidia)');
        console.log('  /reasoning <l|m|h>  - Set reasoning effort (low, medium, high)');
        console.log('  /autonomy <level>   - Set autonomy (read_only, confirm_actions, full)');
        console.log('  /tools              - List all registered Discord tool definitions');
        console.log('  /session            - View active session metadata & token usage');
        console.log('  /clear              - Clear terminal console screen');
        console.log('  /exit, /quit        - Exit Codex interface');
        break;

      case '/setup':
        console.log('\x1b[1m\x1b[37m⚙️ AI PROVIDER CREDENTIALS & FAILOVER STATUS:\x1b[0m');
        console.log(`  1. \x1b[36mOpenRouter\x1b[0m:`);
        console.log(`     * Key: \x1b[33m${ProviderManager.getMaskedKey('openrouter')}\x1b[0m`);
        console.log(`     * Configured Model: \x1b[1m${ProviderManager.providers.openrouter.defaultModel}\x1b[0m`);
        console.log(`     * Role: ${ProviderManager.primaryProvider === 'openrouter' ? '\x1b[32m[ACTIVE PRIMARY]\x1b[0m' : '\x1b[90m[FALLBACK BACKUP]\x1b[0m'}`);
        console.log(`  2. \x1b[35mNVIDIA NIM\x1b[0m:`);
        console.log(`     * Key: \x1b[33m${ProviderManager.getMaskedKey('nvidia')}\x1b[0m`);
        console.log(`     * Configured Model: \x1b[1m${ProviderManager.providers.nvidia.defaultModel}\x1b[0m`);
        console.log(`     * Role: ${ProviderManager.primaryProvider === 'nvidia' ? '\x1b[32m[ACTIVE PRIMARY]\x1b[0m' : '\x1b[90m[FALLBACK BACKUP]\x1b[0m'}`);
        console.log(`  ⚡ \x1b[32mAutomatic Failover Policy:\x1b[0m If primary hits rate limit (429) or quota (402), it immediately auto-switches to the fallback provider!`);
        console.log(`\nTo search models by name: /search <name>\nTo switch provider models: /provider openrouter or /provider nvidia`);
        break;

      case '/search':
        const query = tokens.slice(1).join(' ').trim();
        if (!query) {
          console.log('Usage: /search <model_keyword>');
          break;
        }
        const matches = ModelRegistry.search(query);
        console.log(`\x1b[36mSearch Results for "${query}" (${matches.length}):\x1b[0m`);
        matches.forEach(m => {
          const provTag = m.provider === 'openrouter' ? '\x1b[36m[OpenRouter]\x1b[0m' : '\x1b[35m[NVIDIA]\x1b[0m';
          console.log(`  * \x1b[1m${m.id}\x1b[0m ${provTag} - ${m.description} (${m.contextWindow.toLocaleString()} ctx)`);
        });
        break;

      case '/provider':
        const targetProv = (arg === 'or' || arg === 'openrouter') ? 'openrouter' : ((arg === 'nim' || arg === 'nvidia') ? 'nvidia' : null);
        if (!targetProv) {
          console.log('Usage: /provider <openrouter|nvidia>');
          break;
        }
        const provModels = ModelRegistry.list(targetProv);
        console.log(`\x1b[36m${targetProv.toUpperCase()} Models (${provModels.length}):\x1b[0m`);
        provModels.forEach(m => {
          console.log(`  * \x1b[1m${m.id}\x1b[0m: ${m.description} (${m.contextWindow.toLocaleString()} ctx)`);
        });
        break;

      case '/model':
        if (arg) {
          const m = ModelRegistry.get(tokens[1]);
          this.model = m.id || m.name;
          console.log(`\x1b[32m✔ Active model set to:\x1b[0m ${this.model} [${(m.provider || 'custom').toUpperCase()}]`);
        } else {
          console.log('\x1b[36mAvailable Models in Catalog:\x1b[0m');
          ModelRegistry.list().forEach(m => {
            const current = (m.id === this.model || m.name === this.model) ? ' \x1b[32m(Active)\x1b[0m' : '';
            console.log(`  * \x1b[1m${m.id}\x1b[0m [${m.provider.toUpperCase()}]${current} - ${m.description}`);
          });
        }
        break;

      case '/reasoning':
        if (['low', 'medium', 'high'].includes(arg)) {
          this.reasoning = arg;
          console.log(`\x1b[32m✔ Reasoning effort set to:\x1b[0m ${this.reasoning.toUpperCase()}`);
        } else {
          console.log('Usage: /reasoning <low|medium|high>');
        }
        break;

      case '/autonomy':
        if (['read_only', 'confirm_actions', 'full'].includes(arg)) {
          this.autonomy = arg;
          console.log(`\x1b[32m✔ Autonomy level set to:\x1b[0m ${this.autonomy.toUpperCase()}`);
        } else {
          console.log('Usage: /autonomy <read_only|confirm_actions|full>');
        }
        break;

      case '/tools':
        const tools = this.orchestrator.engine.toolRegistry.getDefinitions();
        console.log(`\x1b[36mRegistered Discord Tools (${tools.length}):\x1b[0m`);
        tools.forEach(t => console.log(`  * \x1b[1m${t.function.name}\x1b[0m: ${t.function.description}`));
        break;

      case '/session':
        const sess = this.orchestrator.engine.sessionManager.getSession(this.sessionId);
        console.log(`\x1b[36mSession Info:\x1b[0m`);
        console.log(`  ID: ${this.sessionId}`);
        console.log(`  Total Messages: ${sess?.messages?.length || 0}`);
        console.log(`  Tokens: ${JSON.stringify(sess?.tokenUsage || {})}`);
        break;

      case '/clear':
        console.clear();
        this.printHeader();
        break;

      case '/exit':
      case '/quit':
        this.close();
        break;

      default:
        console.log(`\x1b[31mUnknown slash command:\x1b[0m ${cmd}. Type /help or /setup for available options.`);
    }
  }

  async runQuery(prompt) {
    this.isRunning = true;
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    console.log(`\n\x1b[90m┌─ User Prompt ──────────────────────────────────────────\x1b[0m`);
    console.log(`│ ${prompt}`);
    console.log(`\x1b[90m└────────────────────────────────────────────────────────\x1b[0m\n`);

    try {
      const res = await this.orchestrator.execute({
        prompt,
        sessionId: this.sessionId,
        ctx: this.ctx,
        model: this.model,
        reasoning: this.reasoning,
        autonomy: this.autonomy,
        stream: true,
        signal,
        onProgress: (p) => {
          this.renderProgress(p);
        }
      });

      console.log(`\n\n\x1b[1m\x1b[32m✔ Final Agent Response:\x1b[0m`);
      console.log(res.finalAnswer + '\n');
    } catch (err) {
      if (err.message.includes('interrupted') || signal.aborted) {
        console.log('\n\x1b[33m[!] Task was safely cancelled.\x1b[0m\n');
      } else {
        console.log(`\n\x1b[31m[!] Agent Execution Error:\x1b[0m ${err.message}\n`);
      }
    } finally {
      this.isRunning = false;
      this.currentAbortController = null;
    }
  }

  renderProgress(event) {
    switch (event.type) {
      case 'provider_failover':
        console.log(`\n\x1b[33m⚡ [PROVIDER FAILOVER] ${event.fromProvider.toUpperCase()} reached quota/limit! Automatically switched to ${event.toProvider.toUpperCase()} model [${event.toModel}]...\x1b[0m`);
        break;
      case 'orchestrator_route':
        console.log(`\x1b[90m[Route: ${event.strategy}]\x1b[0m`);
        break;
      case 'subtasks_planned':
        console.log(`\x1b[36m◇ Decomposed into ${event.count} parallel subtasks:\x1b[0m`);
        event.subtasks.forEach((st, i) => console.log(`  ${i + 1}. ${st}`));
        break;
      case 'specialist_start':
        console.log(`\x1b[35m[${event.specialist}] Starting Subtask ${event.index}: "${event.prompt}"\x1b[0m`);
        break;
      case 'step':
        process.stdout.write(`\x1b[90m[Step ${event.step}/${event.maxSteps}]\x1b[0m `);
        break;
      case 'stream_token':
        process.stdout.write(event.text);
        break;
      case 'thought':
        console.log(`\n\x1b[90m◇ Thought:\x1b[0m ${event.text}`);
        break;
      case 'tool_start':
        console.log(`\n  \x1b[33m⚡ [TOOL CALL]\x1b[0m \x1b[1m${event.name}\x1b[0m (ID: ${event.callId.slice(-6)})...`);
        break;
      case 'tool_end':
        const statusColor = event.result.status === 'SUCCESS' ? '\x1b[32m' : '\x1b[31m';
        const summary = JSON.stringify(event.result.result || event.result.error || event.result.reason).slice(0, 120);
        console.log(`  ${statusColor}└─ [${event.result.status}]\x1b[0m (${event.result.duration_ms || 0}ms) ${summary}...`);
        break;
      case 'complete':
        break;
    }
  }
}

module.exports = CodexChatbox;

