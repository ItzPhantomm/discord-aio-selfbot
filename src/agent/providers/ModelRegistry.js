/**
 * Multi-Provider Model Registry & Configuration Catalog
 * Supports OpenRouter and NVIDIA NIM model endpoints with search and parameter specifications.
 */

const PROVIDER_MODELS = {
  openrouter: [
    {
      id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      name: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      label: 'NVIDIA Nemotron 3 Ultra 550B (Free Tier)',
      provider: 'openrouter',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Ultra-large 550B open parameter model with native tool-calling on OpenRouter free tier'
    },
    {
      id: 'meta-llama/llama-3.3-70b-instruct',
      name: 'meta-llama/llama-3.3-70b-instruct',
      label: 'Llama 3.3 70B Instruct (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Top-tier open-weight model with strong function calling and reasoning performance'
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'anthropic/claude-3.5-sonnet',
      label: 'Claude 3.5 Sonnet (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      defaultReasoning: 'high',
      supportsToolCalling: true,
      description: 'Industry-leading reasoning, coding, and autonomous tool orchestration model'
    },
    {
      id: 'deepseek/deepseek-r1',
      name: 'deepseek/deepseek-r1',
      label: 'DeepSeek R1 (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 131072,
      maxOutputTokens: 8192,
      defaultReasoning: 'high',
      supportsToolCalling: true,
      description: 'Elite open reasoning model with transparent chain-of-thought problem solving'
    },
    {
      id: 'openai/gpt-4o',
      name: 'openai/gpt-4o',
      label: 'GPT-4o (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'High-speed flagship multimodal model with reliable function calling'
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'openai/gpt-4o-mini',
      label: 'GPT-4o Mini (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      defaultReasoning: 'low',
      supportsToolCalling: true,
      description: 'Fast, lightweight, and cost-effective model for rapid task resolution'
    },
    {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'google/gemini-2.0-flash-exp:free',
      label: 'Gemini 2.0 Flash (Free Tier)',
      provider: 'openrouter',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      defaultReasoning: 'low',
      supportsToolCalling: true,
      description: 'High-speed 1M context window model on OpenRouter free tier'
    },
    {
      id: 'meta-llama/llama-3.1-8b-instruct:free',
      name: 'meta-llama/llama-3.1-8b-instruct:free',
      label: 'Llama 3.1 8B (Free Tier)',
      provider: 'openrouter',
      contextWindow: 131072,
      maxOutputTokens: 2048,
      defaultReasoning: 'low',
      supportsToolCalling: true,
      description: 'Lightweight free model for simple Discord queries and quick tool execution'
    },
    {
      id: 'qwen/qwen-2.5-72b-instruct',
      name: 'qwen/qwen-2.5-72b-instruct',
      label: 'Qwen 2.5 72B Instruct (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Powerful multilingual open model with high math and instruction fidelity'
    },
    {
      id: 'mistralai/mistral-large-2407',
      name: 'mistralai/mistral-large-2407',
      label: 'Mistral Large (OpenRouter)',
      provider: 'openrouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Mistral flagship model with precise reasoning and JSON tool execution'
    }
  ],
  nvidia: [
    {
      id: 'nvidia/nemotron-3-ultra-550b-a55b',
      name: 'nvidia/nemotron-3-ultra-550b-a55b',
      label: 'NVIDIA Nemotron 3 Ultra 550B',
      provider: 'nvidia',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Ultra-large 550B parameter foundation model optimized for multi-step reasoning and function calling'
    },
    {
      id: 'meta/llama-3.3-70b-instruct',
      name: 'meta/llama-3.3-70b-instruct',
      label: 'Llama 3.3 70B Instruct (NVIDIA NIM)',
      provider: 'nvidia',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Flagship open-weight model with high-fidelity tool-calling and reasoning'
    },
    {
      id: 'meta/llama-3.1-70b-instruct',
      name: 'meta/llama-3.1-70b-instruct',
      label: 'Llama 3.1 70B Instruct (NVIDIA NIM)',
      provider: 'nvidia',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'High-accuracy generalist model for complex multi-step reasoning and Discord orchestration'
    },
    {
      id: 'meta/llama-3.1-8b-instruct',
      name: 'meta/llama-3.1-8b-instruct',
      label: 'Llama 3.1 8B Instruct (NVIDIA NIM)',
      provider: 'nvidia',
      contextWindow: 131072,
      maxOutputTokens: 2048,
      defaultReasoning: 'low',
      supportsToolCalling: true,
      description: 'Ultra-fast low-latency model for quick queries and single-turn task routing'
    },
    {
      id: 'deepseek-ai/deepseek-r1',
      name: 'deepseek-ai/deepseek-r1',
      label: 'DeepSeek R1 (NVIDIA NIM)',
      provider: 'nvidia',
      contextWindow: 131072,
      maxOutputTokens: 8192,
      defaultReasoning: 'high',
      supportsToolCalling: true,
      description: 'Open reasoning model specialized in multi-step deductive decomposition'
    },
    {
      id: 'mistralai/mixtral-8x22b-instruct-v0.1',
      name: 'mistralai/mixtral-8x22b-instruct-v0.1',
      label: 'Mixtral 8x22B Instruct (NVIDIA NIM)',
      provider: 'nvidia',
      contextWindow: 65536,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'Sparse mixture of experts model with balanced speed and complex tool integration'
    },
    {
      id: 'nvidia/llama-3.1-nemotron-70b-instruct',
      name: 'nvidia/llama-3.1-nemotron-70b-instruct',
      label: 'Nemotron 70B Instruct (NVIDIA NIM)',
      provider: 'nvidia',
      contextWindow: 131072,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: 'NVIDIA-aligned model optimized for conversational refinement and safety'
    }
  ]
};

class ModelRegistry {
  static get(modelName, provider = null) {
    if (!modelName) {
      return provider === 'openrouter' ? PROVIDER_MODELS.openrouter[0] : PROVIDER_MODELS.nvidia[0];
    }

    const clean = modelName.trim().toLowerCase();

    // Check OpenRouter
    for (const m of PROVIDER_MODELS.openrouter) {
      if (m.name.toLowerCase() === clean || m.id.toLowerCase() === clean) return m;
    }

    // Check NVIDIA
    for (const m of PROVIDER_MODELS.nvidia) {
      if (m.name.toLowerCase() === clean || m.id.toLowerCase() === clean) return m;
    }

    // If custom model
    const inferredProvider = provider || (modelName.includes(':') || modelName.includes('free') ? 'openrouter' : 'nvidia');
    return {
      id: modelName,
      name: modelName,
      label: modelName,
      provider: inferredProvider,
      contextWindow: 65536,
      maxOutputTokens: 4096,
      defaultReasoning: 'medium',
      supportsToolCalling: true,
      description: `Custom ${inferredProvider.toUpperCase()} model`
    };
  }

  static list(provider = null) {
    if (provider === 'openrouter') return PROVIDER_MODELS.openrouter;
    if (provider === 'nvidia') return PROVIDER_MODELS.nvidia;
    return [...PROVIDER_MODELS.openrouter, ...PROVIDER_MODELS.nvidia];
  }

  static search(query = '', provider = null) {
    const list = this.list(provider);
    if (!query) return list;
    const q = query.toLowerCase().trim();
    return list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.label.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }

  static getBudget(reasoning = 'medium') {
    switch (reasoning.toLowerCase()) {
      case 'low':
        return { maxSteps: 4, tokenBudget: 2048, temperature: 0.1 };
      case 'high':
        return { maxSteps: 12, tokenBudget: 8192, temperature: 0.4 };
      case 'medium':
      default:
        return { maxSteps: 7, tokenBudget: 4096, temperature: 0.2 };
    }
  }

  /**
   * Fetch live models dynamically from OpenRouter API if API key is provided
   */
  static async fetchOpenRouterModels(apiKey = null) {
    try {
      const headers = { 'User-Agent': 'Discord-AIO-Selfbot/1.0' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
      if (!res.ok) return PROVIDER_MODELS.openrouter;
      const json = await res.json();
      if (!Array.isArray(json.data)) return PROVIDER_MODELS.openrouter;

      const dynamicModels = json.data.slice(0, 30).map(m => ({
        id: m.id,
        name: m.id,
        label: m.name || m.id,
        provider: 'openrouter',
        contextWindow: m.context_length || 65536,
        maxOutputTokens: m.top_provider?.max_completion_tokens || 4096,
        defaultReasoning: 'medium',
        supportsToolCalling: true,
        description: m.description ? m.description.slice(0, 120) : 'OpenRouter endpoint model'
      }));

      // Cache / merge into openrouter catalog
      for (const dm of dynamicModels) {
        if (!PROVIDER_MODELS.openrouter.some(x => x.id === dm.id)) {
          PROVIDER_MODELS.openrouter.push(dm);
        }
      }
      return PROVIDER_MODELS.openrouter;
    } catch {
      return PROVIDER_MODELS.openrouter;
    }
  }
}

module.exports = ModelRegistry;
module.exports.PROVIDER_MODELS = PROVIDER_MODELS;
