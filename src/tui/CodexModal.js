const blessed = require('blessed');
const Theme = require('../utils/Theme');
const Orchestrator = require('../agent/core/Orchestrator');
const ModelRegistry = require('../agent/providers/ModelRegistry');
const ProviderManager = require('../agent/providers/ProviderManager');

class CodexModal {
  constructor(screen, selfClient) {
    this.screen = screen;
    this.selfClient = selfClient;
    this.orchestrator = new Orchestrator();
    this.visible = false;
    this.isRunning = false;
    this.currentAbortController = null;
    this.model = ProviderManager.providers[ProviderManager.primaryProvider]?.defaultModel || 'meta-llama/llama-3.3-70b-instruct';
    this.reasoning = 'medium';
    this.autonomy = 'confirm_actions';
    this.sessionId = `tui_agent_${Date.now().toString(36)}`;

    // Modal frame
    this.modal = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '78%',
      height: '78%',
      tags: true,
      hidden: true,
      border: {
        type: 'line'
      },
      style: {
        bg: Theme.palette.elevated,
        border: {
          fg: Theme.palette.white
        }
      },
      label: ` ${Theme.boldColor('◈ CODEX AI AGENT INTERFACE (Ctrl+A / ESC to close)', Theme.palette.white)} `
    });

    // Top status / model header
    this.statusHeader = blessed.box({
      parent: this.modal,
      top: 0,
      left: 1,
      width: '98%',
      height: 2,
      tags: true,
      style: {
        bg: Theme.palette.surface,
        fg: Theme.palette.textSecondary
      }
    });

    // Output conversation log area
    this.output = blessed.log({
      parent: this.modal,
      top: 2,
      left: 1,
      width: '98%',
      height: '100%-6',
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      scrollbar: {
        ch: '▐',
        style: {
          bg: Theme.palette.panelBorder,
          fg: Theme.palette.white
        }
      },
      style: {
        bg: Theme.palette.surface,
        border: {
          fg: Theme.palette.panelBorder
        }
      }
    });

    // Bottom input textbox
    this.input = blessed.textbox({
      parent: this.modal,
      bottom: 0,
      left: 1,
      width: '98%',
      height: 3,
      inputOnFocus: true,
      border: {
        type: 'line'
      },
      style: {
        fg: Theme.palette.textPrimary,
        bg: Theme.palette.surface,
        border: {
          fg: Theme.palette.panelBorder
        },
        focus: {
          border: {
            fg: Theme.palette.white
          }
        }
      }
    });

    this.updateHeader();
    this.setupEvents();
  }

  updateHeader() {
    const status = this.isRunning ? '{#FFFF00-fg}RUNNING{/#FFFF00-fg}' : '{#00FF00-fg}IDLE{/#00FF00-fg}';
    const primary = ProviderManager.primaryProvider.toUpperCase();
    const text = ` {bold}Provider:{/bold} ${primary} │ {bold}Model:{/bold} ${this.model.split('/').pop()} │ {bold}Reasoning:{/bold} ${this.reasoning.toUpperCase()} │ {bold}State:{/bold} ${status} │ [/setup, /search, /model]`;
    this.statusHeader.setContent(text);
    this.screen.render();
  }

  setupEvents() {
    this.modal.key(['escape'], () => this.hide());
    this.input.key(['escape'], () => this.hide());

    // Enter key submits prompt
    this.input.key(['enter'], async () => {
      const val = this.input.getValue().trim();
      this.input.clearValue();
      this.input.focus();

      if (!val) {
        this.screen.render();
        return;
      }

      // Handle Slash Commands
      if (val.startsWith('/')) {
        this.handleSlashCommand(val);
        this.screen.render();
        return;
      }

      // Execute Agent query
      await this.runAgent(val);
    });

    // Ctrl+C in input interrupts active run if running
    this.input.key(['C-c'], () => {
      if (this.isRunning && this.currentAbortController) {
        this.output.log('{#FF4444-fg}[!] User interrupted active agent run.{/#FF4444-fg}');
        this.currentAbortController.abort();
      }
    });
  }

  handleSlashCommand(cmdStr) {
    const parts = cmdStr.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1]?.toLowerCase();

    if (cmd === '/setup') {
      const orKey = ProviderManager.getMaskedKey('openrouter');
      const nimKey = ProviderManager.getMaskedKey('nvidia');
      const primary = ProviderManager.primaryProvider.toUpperCase();
      this.output.log('{bold}⚙️ AI PROVIDER CREDENTIALS & FAILOVER STATUS:{/bold}');
      this.output.log(`  1. {#5296FF-fg}OpenRouter{/#5296FF-fg}: Key: \`${orKey}\` │ Model: \`${ProviderManager.providers.openrouter.defaultModel}\` [${primary === 'OPENROUTER' ? '{#57E6A5-fg}PRIMARY{/#57E6A5-fg}' : '{#8994AC-fg}FALLBACK{/#8994AC-fg}'}]`);
      this.output.log(`  2. {#A78BFA-fg}NVIDIA NIM{/#A78BFA-fg}: Key: \`${nimKey}\` │ Model: \`${ProviderManager.providers.nvidia.defaultModel}\` [${primary === 'NVIDIA' ? '{#57E6A5-fg}PRIMARY{/#57E6A5-fg}' : '{#8994AC-fg}FALLBACK{/#8994AC-fg}'}]`);
      this.output.log('  ⚡ {#57E6A5-fg}Automatic Failover:{/#57E6A5-fg} Enabled (auto-switches on 429/quota limits)');
      this.output.log('Commands: /search <query>, /provider <or|nim>, /model <id>');
    } else if (cmd === '/search') {
      const q = parts.slice(1).join(' ').trim();
      if (!q) {
        this.output.log('Usage: /search <model_keyword>');
      } else {
        const matches = ModelRegistry.search(q);
        this.output.log(`{bold}Model Search Results for "${q}" (${matches.length}):{/bold}`);
        matches.forEach(m => {
          this.output.log(`  * {bold}${m.id}{/bold} [{#8994AC-fg}${m.provider.toUpperCase()}{/#8994AC-fg}] - ${m.description} (${m.contextWindow.toLocaleString()} ctx)`);
        });
      }
    } else if (cmd === '/provider') {
      const targetProv = (arg === 'or' || arg === 'openrouter') ? 'openrouter' : ((arg === 'nim' || arg === 'nvidia') ? 'nvidia' : null);
      if (!targetProv) {
        this.output.log('Usage: /provider <openrouter|nvidia>');
      } else {
        const list = ModelRegistry.list(targetProv);
        this.output.log(`{bold}${targetProv.toUpperCase()} Models (${list.length}):{/bold}`);
        list.forEach(m => this.output.log(`  * {bold}${m.id}{/bold} (${m.contextWindow.toLocaleString()} ctx) - ${m.description}`));
      }
    } else if (cmd === '/model') {
      if (arg) {
        const m = ModelRegistry.get(parts[1]);
        this.model = m.id || m.name;
        this.output.log(`{#57E6A5-fg}✔ Model switched to: ${this.model}{/#57E6A5-fg}`);
      } else {
        this.output.log('{bold}Available Models in Catalog:{/bold}');
        ModelRegistry.list().forEach(m => {
          this.output.log(`  * ${m.id} [${m.provider.toUpperCase()}] (${m.contextWindow.toLocaleString()} ctx)`);
        });
      }
      this.updateHeader();
    } else if (cmd === '/reasoning') {
      if (['low', 'medium', 'high'].includes(arg)) {
        this.reasoning = arg;
        this.output.log(`{#57E6A5-fg}✔ Reasoning effort set to: ${this.reasoning.toUpperCase()}{/#57E6A5-fg}`);
        this.updateHeader();
      } else {
        this.output.log('Usage: /reasoning <low|medium|high>');
      }
    } else if (cmd === '/autonomy') {
      if (['read_only', 'confirm_actions', 'full'].includes(arg)) {
        this.autonomy = arg;
        this.output.log(`{#57E6A5-fg}✔ Autonomy set to: ${this.autonomy.toUpperCase()}{/#57E6A5-fg}`);
        this.updateHeader();
      } else {
        this.output.log('Usage: /autonomy <read_only|confirm_actions|full>');
      }
    } else if (cmd === '/clear') {
      this.output.setContent('');
      this.output.log('{bold}Codex conversation log cleared.{/bold}');
    } else if (cmd === '/tools') {
      const defs = this.orchestrator.engine.toolRegistry.getDefinitions();
      this.output.log(`{bold}Registered Discord Tools (${defs.length}):{/bold}`);
      defs.forEach(d => this.output.log(`  * {bold}${d.function.name}{/bold}: ${d.function.description}`));
    } else {
      this.output.log(`{#FF647C-fg}Unknown command: ${cmd}. Available: /model, /reasoning, /autonomy, /tools, /clear{/#FF647C-fg}`);
    }
  }

  async runAgent(prompt) {
    this.isRunning = true;
    this.currentAbortController = new AbortController();
    this.updateHeader();

    this.output.log(`\n{bold}{#FFFFFF-fg}USER ❯{/#FFFFFF-fg}{/bold} ${prompt}`);

    const ctx = {
      client: this.selfClient?.client,
      author: this.selfClient?.client?.user || null,
      channel: this.selfClient?.activeChannel,
      guild: this.selfClient?.activeChannel?.guild || null,
      commandHandler: this.selfClient?.commandHandler
    };

    let streamBuffer = '';

    try {
      const res = await this.orchestrator.execute({
        prompt,
        sessionId: this.sessionId,
        ctx,
        model: this.model,
        reasoning: this.reasoning,
        autonomy: this.autonomy,
        stream: true,
        signal: this.currentAbortController.signal,
        onProgress: (p) => {
          if (p.type === 'provider_failover') {
            this.output.log(`{#FFD166-fg}⚡ [FAILOVER] ${p.fromProvider.toUpperCase()} limit reached! Switched to ${p.toProvider.toUpperCase()} [${p.toModel}]{/#FFD166-fg}`);
          } else if (p.type === 'orchestrator_route') {
            this.output.log(`{#8994AC-fg}◈ Strategy: ${p.strategy}{/#8994AC-fg}`);
          } else if (p.type === 'subtasks_planned') {
            this.output.log(`{#5296FF-fg}◇ Decomposed into ${p.count} parallel subtasks:{/#5296FF-fg}`);
            p.subtasks.forEach((st, i) => this.output.log(`   ${i + 1}. ${st}`));
          } else if (p.type === 'specialist_start') {
            this.output.log(`{#A78BFA-fg}[${p.specialist}] Starting Subtask ${p.index}: "${p.prompt}"{/#A78BFA-fg}`);
          } else if (p.type === 'tool_start') {
            this.output.log(`  {#FFD166-fg}⚡ [TOOL CALL] ${p.name}...{/#FFD166-fg}`);
          } else if (p.type === 'tool_end') {
            const color = p.result.status === 'SUCCESS' ? '#57E6A5' : '#FF647C';
            const sum = JSON.stringify(p.result.result || p.result.error || p.result.reason).slice(0, 100);
            this.output.log(`  {${color}-fg}└─ [${p.result.status}] (${p.result.duration_ms || 0}ms) ${sum}...{/${color}-fg}`);
          }
          this.screen.render();
        }
      });

      this.output.log(`\n{bold}{#57E6A5-fg}CODEX ❯{/#57E6A5-fg}{/bold} ${res.finalAnswer}\n`);
    } catch (err) {
      if (err.message.includes('interrupted') || this.currentAbortController?.signal?.aborted) {
        this.output.log('{#FFD166-fg}[!] Agent execution interrupted by user.{/#FFD166-fg}');
      } else {
        this.output.log(`{#FF647C-fg}[!] Error: ${err.message}{/#FF647C-fg}`);
      }
    } finally {
      this.isRunning = false;
      this.currentAbortController = null;
      this.updateHeader();
      this.screen.render();
    }
  }

  show() {
    this.visible = true;
    this.modal.show();
    this.input.clearValue();
    this.input.focus();
    this.updateHeader();
    this.screen.render();
  }

  hide() {
    this.visible = false;
    this.modal.hide();
    this.screen.render();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }
}

module.exports = CodexModal;
