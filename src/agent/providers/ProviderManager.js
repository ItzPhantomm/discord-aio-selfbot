const fs = require('fs');
const path = require('path');
const ModelRegistry = require('./ModelRegistry');
const AuditLogger = require('../core/AuditLogger');
const Logger = require('../../utils/Logger');

class ProviderManager {
  constructor(options = {}) {
    this.configPath = path.join(__dirname, '../../../config.json');
    this.providers = {
      openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY || null,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct'
      },
      nvidia: {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY || null,
        defaultModel: 'meta/llama-3.3-70b-instruct'
      }
    };

    this.primaryProvider = options.primaryProvider || 'openrouter';
    this.fallbackProvider = options.fallbackProvider || 'nvidia';
    this.maxRetries = options.maxRetries || 2;

    this.loadFromConfig();
  }

  loadFromConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const cfg = JSON.parse(raw);
        const agentCfg = cfg.agent || {};

        if (agentCfg.primaryProvider) this.primaryProvider = agentCfg.primaryProvider;
        if (agentCfg.fallbackProvider) this.fallbackProvider = agentCfg.fallbackProvider;

        if (agentCfg.openrouterApiKey) this.providers.openrouter.apiKey = agentCfg.openrouterApiKey;
        if (agentCfg.openrouterModel) this.providers.openrouter.defaultModel = agentCfg.openrouterModel;

        if (agentCfg.nvidiaApiKey) this.providers.nvidia.apiKey = agentCfg.nvidiaApiKey;
        if (agentCfg.nvidiaModel) this.providers.nvidia.defaultModel = agentCfg.nvidiaModel;
      }
    } catch (e) {
      console.error('[ProviderManager loadFromConfig Error]', e.message);
    }
  }

  saveToConfig() {
    try {
      let cfg = {};
      if (fs.existsSync(this.configPath)) {
        cfg = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
      if (!cfg.agent) cfg.agent = {};

      cfg.agent.primaryProvider = this.primaryProvider;
      cfg.agent.fallbackProvider = this.fallbackProvider;
      cfg.agent.openrouterApiKey = this.providers.openrouter.apiKey || '';
      cfg.agent.openrouterModel = this.providers.openrouter.defaultModel;
      cfg.agent.nvidiaApiKey = this.providers.nvidia.apiKey || '';
      cfg.agent.nvidiaModel = this.providers.nvidia.defaultModel;

      fs.writeFileSync(this.configPath, JSON.stringify(cfg, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('[ProviderManager saveToConfig Error]', e.message);
      return false;
    }
  }

  getMaskedKey(providerId) {
    const key = this.providers[providerId]?.apiKey;
    if (!key || key.length < 8) return 'Not configured (None)';
    const prefix = key.slice(0, 6);
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
  }

  setApiKey(providerId, apiKey) {
    if (this.providers[providerId]) {
      this.providers[providerId].apiKey = apiKey;
      this.saveToConfig();
      AuditLogger.log({
        type: 'PROVIDER_KEY_UPDATE',
        action: 'setApiKey',
        details: { provider: providerId },
        status: 'SUCCESS'
      });
      return true;
    }
    return false;
  }

  setModel(providerId, modelName) {
    if (this.providers[providerId]) {
      this.providers[providerId].defaultModel = modelName;
      this.saveToConfig();
      return true;
    }
    return false;
  }

  setPrimary(providerId) {
    if (this.providers[providerId]) {
      this.primaryProvider = providerId;
      this.fallbackProvider = providerId === 'openrouter' ? 'nvidia' : 'openrouter';
      this.saveToConfig();
      return true;
    }
    return false;
  }

  hasValidKey(providerId) {
    const key = this.providers[providerId]?.apiKey;
    return Boolean(key && key.length > 8 && !key.includes('YOUR_'));
  }

  /**
   * Execute chat completion with automatic provider failover on rate-limit/quota errors
   */
  async chatCompletion(params = {}) {
    const requestedModel = params.model;
    let targetProvider = this.primaryProvider;

    // If specific model provided, infer provider
    if (requestedModel) {
      const modelMeta = ModelRegistry.get(requestedModel);
      if (modelMeta?.provider) {
        targetProvider = modelMeta.provider;
      }
    }

    const backupProvider = targetProvider === 'openrouter' ? 'nvidia' : 'openrouter';
    const onProgress = params.onProgress || (() => {});

    // Check if any provider has a real valid API key configured
    const hasPrimaryKey = this.hasValidKey(targetProvider);
    const hasBackupKey = this.hasValidKey(backupProvider);

    // If neither provider has an API key configured, directly use the intelligent local assistant without false failover warning
    if (!hasPrimaryKey && !hasBackupKey) {
      return this._executeLocalMock(params);
    }

    // If primary provider has no key but backup provider does, switch directly to backup
    if (!hasPrimaryKey && hasBackupKey) {
      targetProvider = backupProvider;
    }

    // Try Target Provider first
    try {
      return await this._executeWithProvider(targetProvider, params);
    } catch (primaryErr) {
      const isLimit = this._isRateLimitOrQuotaError(primaryErr);

      // Only failover if target provider hit an actual rate-limit/quota error AND backup provider has a valid key
      if (isLimit && hasBackupKey && backupProvider !== targetProvider) {
        const fromModel = params.model || this.providers[targetProvider].defaultModel;
        const toModel = this.providers[backupProvider].defaultModel;

        const failoverNotice = `⚠️ Provider [${this.providers[targetProvider].name}] reached rate limit / quota. Failing over to [${this.providers[backupProvider].name}] with model [${toModel}]...`;
        Logger.warn(failoverNotice);

        onProgress({
          type: 'provider_failover',
          fromProvider: targetProvider,
          toProvider: backupProvider,
          fromModel,
          toModel,
          reason: primaryErr.message
        });

        AuditLogger.log({
          type: 'PROVIDER_FAILOVER',
          action: 'failover',
          details: { fromProvider: targetProvider, toProvider: backupProvider, error: primaryErr.message },
          status: 'FAILOVER'
        });

        // Try Fallback Provider
        try {
          return await this._executeWithProvider(backupProvider, {
            ...params,
            model: toModel
          });
        } catch (backupErr) {
          Logger.error(`Fallback provider [${backupProvider}] also failed: ${backupErr.message}`);
          return this._executeLocalMock(params);
        }
      }

      // If no other provider is configured or available, fall back to smart local execution
      return this._executeLocalMock(params);
    }
  }

  _isRateLimitOrQuotaError(err) {
    if (!err) return false;
    const msg = String(err.message || '').toLowerCase();
    const status = err.status || 0;
    return (
      status === 429 ||
      status === 402 ||
      status === 503 ||
      status === 504 ||
      msg.includes('429') ||
      msg.includes('402') ||
      msg.includes('rate limit') ||
      msg.includes('quota') ||
      msg.includes('credits') ||
      msg.includes('insufficient_quota') ||
      msg.includes('exceeded') ||
      msg.includes('overloaded')
    );
  }

  async _executeWithProvider(providerId, params) {
    const prov = this.providers[providerId];
    const apiKey = prov.apiKey;
    const model = params.model || prov.defaultModel;

    // Check if provider has valid API key
    if (!apiKey || apiKey.length < 8 || apiKey.includes('YOUR_')) {
      const err = new Error(`Provider [${prov.name}] API key is not configured.`);
      err.status = 401;
      throw err;
    }

    const payload = {
      model,
      messages: params.messages || [],
      temperature: params.temperature !== undefined ? params.temperature : 0.2,
      max_tokens: params.max_tokens || 2048,
      stream: Boolean(params.stream)
    };

    if (params.tools && params.tools.length > 0) {
      payload.tools = params.tools;
      payload.tool_choice = 'auto';
    }

    const url = new URL(`${prov.baseUrl.replace(/\/$/, '')}/chat/completions`);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Discord-AIO-Selfbot/1.0'
    };

    if (providerId === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/discord-selfbot';
      headers['X-Title'] = 'Discord AIO Command Center';
    }

    const signal = params.signal || null;

    if (payload.stream && params.onChunk) {
      return this._streamResponse(url, headers, payload, params.onChunk, signal);
    } else {
      return this._standardResponse(url, headers, payload, signal);
    }
  }

  async _standardResponse(url, headers, payload, signal) {
    const bodyStr = JSON.stringify(payload);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: bodyStr,
      signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const err = new Error(`API Error [${res.status}]: ${errText.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }

    const json = await res.json();
    const choice = json.choices?.[0];
    return {
      content: choice?.message?.content || '',
      tool_calls: choice?.message?.tool_calls || null,
      usage: json.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      finish_reason: choice?.finish_reason || 'stop'
    };
  }

  async _streamResponse(url, headers, payload, onChunk, signal) {
    const bodyStr = JSON.stringify(payload);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: bodyStr,
      signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const err = new Error(`Stream Error [${res.status}]: ${errText.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }

    let fullContent = '';
    const toolCallsMap = new Map();
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      if (signal?.aborted) {
        reader.cancel().catch(() => {});
        throw new Error('Operation was aborted by user.');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              fullContent += delta.content;
              onChunk({ type: 'token', text: delta.content });
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index || 0;
                if (!toolCallsMap.has(idx)) {
                  toolCallsMap.set(idx, {
                    id: tc.id || `call_${idx}`,
                    type: 'function',
                    function: { name: tc.function?.name || '', arguments: '' }
                  });
                }
                const existing = toolCallsMap.get(idx);
                if (tc.function?.name) existing.function.name = tc.function.name;
                if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
              }
            }
          } catch {}
        }
      }
    }

    const tool_calls = toolCallsMap.size > 0 ? Array.from(toolCallsMap.values()) : null;
    return {
      content: fullContent,
      tool_calls,
      usage: {
        prompt_tokens: Math.round(bodyStr.length / 4),
        completion_tokens: Math.round(fullContent.length / 4),
        total_tokens: Math.round((bodyStr.length + fullContent.length) / 4)
      },
      finish_reason: tool_calls ? 'tool_calls' : 'stop'
    };
  }

  async _executeLocalMock({ messages, tools, stream, onChunk, signal }) {
    if (signal?.aborted) throw new Error('Operation was aborted by user.');

    const lastMsg = messages[messages.length - 1];
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1];
    const userPrompt = lastUserMsg?.content || '';
    const lastRole = lastMsg?.role;
    const lower = userPrompt.toLowerCase().trim();

    // 1. If previous turn was a tool execution, format all recent tool observations into a clean human response
    if (lastRole === 'tool') {
      const toolMessages = [];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'tool') toolMessages.unshift(messages[i]);
        else break;
      }

      const formattedSections = [];
      for (const tMsg of toolMessages) {
        try {
          const parsed = JSON.parse(tMsg.content);
          if (parsed.error) {
            formattedSections.push(`⚠️ ${parsed.error}`);
          } else if (parsed.tag && parsed.id) {
            // get_user_info output
            formattedSections.push(`👤 **Account Dossier:** \`${parsed.tag}\`\n* **Snowflake ID:** \`${parsed.id}\`\n* **Account Created:** ${parsed.created_at ? new Date(parsed.created_at).toUTCString() : 'N/A'}\n* **Bot Account:** \`${parsed.bot ? 'Yes' : 'No'}\`\n* **Badges:** \`${parsed.badges && parsed.badges.length ? parsed.badges.join(', ') : 'None'}\`\n* **Avatar Asset:** ${parsed.avatar_url || 'Default'}`);
          } else if (parsed.most_active) {
            // get_most_active_server output
            const ma = parsed.most_active;
            const runners = parsed.runner_ups && parsed.runner_ups.length ? parsed.runner_ups.map((r, i) => `  ${i + 2}. **${r.name}** (\`${r.members?.toLocaleString() || r.members}\` members)`).join('\n') : '';
            formattedSections.push(`🏆 **Most Active Server:** **${ma.name}**\n* **Server ID:** \`${ma.id}\`\n* **Total Members:** \`${ma.members?.toLocaleString() || ma.members}\`\n* **Boost Tier:** Tier ${ma.boost_tier} (${ma.boost_count} boosts)\n* **Channels:** \`${ma.channels}\` total\n* **Roles:** \`${ma.roles}\` registered\n\n**Top Runner-Ups:**\n${runners || '> None'}`);
          } else if (parsed.total_joined !== undefined && parsed.servers) {
            // list_user_servers output
            const rows = parsed.servers.map(s => `${s.rank}. **${s.name}** (\`${s.id}\`) - \`${s.members?.toLocaleString() || s.members}\` members (Tier ${s.boost_tier})`).join('\n');
            formattedSections.push(`🏰 **Your Joined Servers (${parsed.total_joined} total):**\n${rows}`);
          } else if (parsed.name && parsed.channels_count !== undefined && parsed.success) {
            // create_server output
            formattedSections.push(`🎉 **Discord Server Created Successfully!**\n* **Server Name:** **${parsed.name}**\n* **Server ID:** \`${parsed.id}\`\n* **Channels Initialized:** \`${parsed.channels_count}\`\n* **Ownership:** Granted to your account.`);
          } else if (parsed.name && parsed.member_count !== undefined) {
            // get_server_info output
            formattedSections.push(`🏰 **Server Overview: ${parsed.name}**\n* **ID:** \`${parsed.id}\`\n* **Members:** \`${parsed.member_count?.toLocaleString() || parsed.member_count}\` (${parsed.human_count} humans, ${parsed.bot_count} bots)\n* **Boost Tier:** Tier ${parsed.boost_tier} (${parsed.boost_count} boosts)\n* **Channels:** \`${parsed.channels_count}\` total\n* **Roles:** \`${parsed.roles_count}\` registered`);
          } else if (parsed.messages && Array.isArray(parsed.messages)) {
            // search_messages or fetch_recent_messages output
            const list = parsed.messages.map(m => `* **${m.author}**: ${m.content.slice(0, 80)}`).join('\n');
            formattedSections.push(`💬 **Recent Messages (${parsed.messages.length}):**\n${list || '> No messages found.'}`);
          } else if (parsed.expression && parsed.result !== undefined) {
            // calculate output
            formattedSections.push(`🧮 **Calculation:** \`${parsed.expression}\` = **${parsed.result}**`);
          } else if (parsed.channel && parsed.permissions) {
            // check_permissions output
            formattedSections.push(`🛡️ **Permissions in #${parsed.channel}:**\n\`${parsed.permissions.slice(0, 15).join(', ')}\``);
          } else if (parsed.topic !== undefined) {
            // get_channel_info output
            formattedSections.push(`📺 **Channel Info:** #${parsed.name}\n* ID: \`${parsed.id}\`\n* Topic: ${parsed.topic || 'None'}\n* Slowmode: \`${parsed.slowmode_seconds}s\``);
          } else {
            formattedSections.push(`Verified tool output:\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``);
          }
        } catch {
          formattedSections.push(tMsg.content);
        }
      }

      const formattedResponse = formattedSections.join('\n\n');
      if (stream && onChunk) {
        for (const word of formattedResponse.split(' ')) {
          onChunk({ type: 'token', text: word + ' ' });
          await new Promise(r => setTimeout(r, 10));
        }
      }
      return {
        content: formattedResponse,
        tool_calls: null,
        usage: { prompt_tokens: 120, completion_tokens: 50, total_tokens: 170 },
        finish_reason: 'stop'
      };
    }

    // 2. Exact greetings
    if (/^(hi|hey|hello|yo|sup|greetings|hola)\s*$/i.test(lower)) {
      const greeting = `👋 Hey there! I'm your Discord Autonomous Agent. What can I do for you? You can ask me to inspect your account ("who am i"), analyze your servers ("which is my most active server", "list my servers"), search chat, or execute commands!`;
      if (stream && onChunk) {
        for (const word of greeting.split(' ')) {
          onChunk({ type: 'token', text: word + ' ' });
          await new Promise(r => setTimeout(r, 10));
        }
      }
      return { content: greeting, tool_calls: null, usage: { prompt_tokens: 20, completion_tokens: 30, total_tokens: 50 }, finish_reason: 'stop' };
    }

    // 3. Multi-intent tool matcher
    const toolCalls = [];

    // User Identity check
    if (/(\bwho\s+am\s+i\b|\b2ho\s+am\s+i\b|\bwhoami\b|\bmy\s+profile\b|\bmy\s+account\b|\bmy\s+info\b)/i.test(lower)) {
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_u`,
        type: 'function',
        function: { name: 'get_user_info', arguments: JSON.stringify({ user_id: 'self' }) }
      });
    }

    // Create new server intent
    if (/(\bmake\s+a\s+server\b|\bcreate\s+a\s+server\b|\bnew\s+server\b|\bmake\s+server\b|\bcreate\s+server\b|\bmake\s+guild\b|\bcreate\s+guild\b)/i.test(lower)) {
      const nameMatch = userPrompt.match(/(?:named?|called)\s+["']?([^"'\n]+)["']?/i);
      const serverName = nameMatch ? nameMatch[1].trim() : 'Community Server';
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_cs`,
        type: 'function',
        function: { name: 'create_server', arguments: JSON.stringify({ name: serverName }) }
      });
    }

    // Most active server check
    else if (lower.includes('most active server') || lower.includes('biggest server') || lower.includes('largest server') || lower.includes('most active') || (lower.includes('active server') && !lower.includes('list all'))) {
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_ma`,
        type: 'function',
        function: { name: 'get_most_active_server', arguments: '{}' }
      });
    }

    // List all joined servers check
    else if (lower.includes('all servers') || lower.includes('my servers') || lower.includes('servers i') || lower.includes('joined servers') || lower.includes('list servers') || lower.includes('servers am in') || lower.includes('servers i ak') || lower.includes('servers i m in') || lower.includes('what servers') || lower.includes('which servers')) {
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_ls`,
        type: 'function',
        function: { name: 'list_user_servers', arguments: JSON.stringify({ limit: 15, sort_by: 'members' }) }
      });
    }

    // Current server overview (if not querying all servers)
    else if ((lower.includes('server') || lower.includes('guild') || lower.includes('demographics')) && toolCalls.length === 0) {
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_s`,
        type: 'function',
        function: { name: 'get_server_info', arguments: '{}' }
      });
    }

    // User dossier for specific ID or mention
    if ((lower.includes('user') || lower.includes('whois') || lower.includes('avatar')) && !toolCalls.some(tc => tc.function.name === 'get_user_info')) {
      const match = userPrompt.match(/<@!?([0-9]+)>|([0-9]{17,20})/);
      const targetId = match ? (match[1] || match[2]) : 'self';
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_u2`,
        type: 'function',
        function: { name: 'get_user_info', arguments: JSON.stringify({ user_id: targetId }) }
      });
    }

    // Channel check
    if (lower.includes('channel') || lower.includes('topic') || lower.includes('slowmode')) {
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_c`,
        type: 'function',
        function: { name: 'get_channel_info', arguments: '{}' }
      });
    }

    // Message search
    if (lower.includes('search') || lower.includes('find') || lower.includes('messages') || lower.includes('chatter')) {
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_m`,
        type: 'function',
        function: { name: 'fetch_recent_messages', arguments: JSON.stringify({ limit: 10 }) }
      });
    }

    // Calculation
    if (lower.includes('calc') || lower.includes('math') || /[0-9]+\s*[\+\-\*\/]\s*[0-9]+/.test(lower)) {
      const exprMatch = userPrompt.match(/([0-9\.\s\+\-\*\/\(\)\^]+)/);
      const expr = exprMatch ? exprMatch[1].trim() : '2 + 2';
      toolCalls.push({
        id: `call_${Date.now().toString(36)}_calc`,
        type: 'function',
        function: { name: 'calculate', arguments: JSON.stringify({ expression: expr }) }
      });
    }

    // If tools were selected, dispatch them
    if (toolCalls.length > 0) {
      if (stream && onChunk) {
        const names = toolCalls.map(tc => `\`${tc.function.name}\``).join(', ');
        onChunk({ type: 'token', text: `Analyzing task and dispatching ${toolCalls.length} tool(s): ${names}... ` });
      }
      return {
        content: `Executing tools.`,
        tool_calls: toolCalls,
        usage: { prompt_tokens: 40, completion_tokens: 15, total_tokens: 55 },
        finish_reason: 'tool_calls'
      };
    }

    // General help
    if (lower.includes('help') || lower.includes('who are you') || lower.includes('what are you')) {
      const helpMsg = `🤖 **Discord Autonomous Agent (Codex)**\nI can execute actions and inspect Discord entities directly. Try asking:\n• "Who am I?"\n• "Which is my most active server?"\n• "List all servers I am in"\n• "Show recent messages in this channel"\n• Or use \`/setup\` to connect your OpenRouter or NVIDIA NIM API key for full multi-model LLM reasoning!`;
      if (stream && onChunk) {
        for (const word of helpMsg.split(' ')) {
          onChunk({ type: 'token', text: word + ' ' });
          await new Promise(r => setTimeout(r, 10));
        }
      }
      return { content: helpMsg, tool_calls: null, usage: { prompt_tokens: 40, completion_tokens: 60, total_tokens: 100 }, finish_reason: 'stop' };
    }

    // Conversational fallback
    const defaultReply = `I received your prompt: "${userPrompt.slice(0, 100)}". You can ask me to inspect users ("who am i"), check your servers ("which is my most active server", "list my servers"), search chat, or execute selfbot commands.`;
    if (stream && onChunk) {
      for (const word of defaultReply.split(' ')) {
        onChunk({ type: 'token', text: word + ' ' });
        await new Promise(r => setTimeout(r, 10));
      }
    }
    return {
      content: defaultReply,
      tool_calls: null,
      usage: { prompt_tokens: 40, completion_tokens: 30, total_tokens: 70 },
      finish_reason: 'stop'
    };
  }
}

module.exports = new ProviderManager();
module.exports.ProviderManager = ProviderManager;
