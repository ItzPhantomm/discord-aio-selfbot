const ProviderManager = require('../providers/ProviderManager');
const ModelRegistry = require('../providers/ModelRegistry');
const ToolRegistry = require('../tools/ToolRegistry');
const SessionManager = require('./SessionManager');
const AuditLogger = require('./AuditLogger');
const Logger = require('../../utils/Logger');

class AgentEngine {
  constructor(options = {}) {
    this.client = options.client || ProviderManager;
    this.toolRegistry = options.toolRegistry || new ToolRegistry(options);
    this.sessionManager = options.sessionManager || SessionManager;
    this.defaultModel = options.model || ProviderManager.providers[ProviderManager.primaryProvider]?.defaultModel || 'meta-llama/llama-3.3-70b-instruct';
    this.defaultReasoning = options.reasoning || 'medium';
    this.defaultAutonomy = options.autonomy || 'confirm_actions';
  }

  getSystemPrompt(ctx = null) {
    const guildName = ctx?.guild ? ctx.guild.name : 'Direct Message / Private Session';
    const channelName = ctx?.channel ? (ctx.channel.name || 'DM') : 'None';
    const userTag = ctx?.author ? (ctx.author.tag || ctx.author.username) : 'Owner';

    return `You are an elite, highly capable Discord Autonomous Operations Agent powered by DeepSeek Harness with OpenRouter & NVIDIA NIM Multi-Provider Intelligence.
Current Environment:
- Active User: ${userTag}
- Current Guild: ${guildName}
- Current Channel: #${channelName}
- Autonomy Policy: ${this.toolRegistry.safetyGate.autonomy.toUpperCase()}

Mission Guidelines:
1. Interpret user requests systematically. Deconstruct complex multi-step objectives into logical phases.
2. Select and chain the most specific Discord tools dynamically.
3. Validate and verify every action. Always inspect tool output before concluding a task.
4. When consequential or destructive actions (such as kicking, banning, nuking, mass purging) are needed:
   - Verify permissions first.
   - If in confirm_actions mode, request explicit confirmation or provide the "confirm: true" parameter if the user already authorized it in their request.
5. Provide clear, structured, well-formatted Discord markdown responses.
6. Never expose credentials, secret keys, or authentication tokens in your thoughts or responses.`.trim();
  }

  /**
   * Run the autonomous Agent ReAct execution loop
   * @param {Object} params
   * @param {string} params.prompt
   * @param {string} [params.sessionId]
   * @param {Object} [params.ctx] - Discord Context
   * @param {string} [params.model]
   * @param {string} [params.reasoning]
   * @param {string} [params.autonomy]
   * @param {number} [params.maxSteps]
   * @param {AbortSignal} [params.signal]
   * @param {Function} [params.onProgress]
   */
  async run(params = {}) {
    const prompt = params.prompt;
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Agent run requires a non-empty prompt string.');
    }

    const sessionId = params.sessionId || `agent_${Date.now().toString(36)}`;
    const ctx = params.ctx || null;
    const model = params.model || this.defaultModel;
    const reasoning = params.reasoning || this.defaultReasoning;
    const autonomy = params.autonomy || this.defaultAutonomy;
    const signal = params.signal || null;
    const onProgress = params.onProgress || (() => {});

    // Set safety gate autonomy level for this run
    this.toolRegistry.safetyGate.setAutonomy(autonomy);

    const budget = ModelRegistry.getBudget(reasoning);
    const maxSteps = params.maxSteps || budget.maxSteps;

    // Get or initialize persistent session
    let session = this.sessionManager.getSession(sessionId);
    if (!session) {
      session = this.sessionManager.createSession(sessionId, { model, reasoning, autonomy });
      this.sessionManager.addMessage(sessionId, {
        role: 'system',
        content: this.getSystemPrompt(ctx)
      });
    }

    // Append user input
    this.sessionManager.addMessage(sessionId, { role: 'user', content: prompt });
    AuditLogger.log({
      type: 'AGENT_START',
      action: 'run',
      details: { sessionId, prompt, model, reasoning, autonomy },
      status: 'INITIATED'
    });

    onProgress({ type: 'start', sessionId, model, reasoning, autonomy, maxSteps });

    let currentStep = 0;
    let finalAnswer = '';
    const tools = this.toolRegistry.getDefinitions();

    while (currentStep < maxSteps) {
      if (signal?.aborted) {
        onProgress({ type: 'cancelled', message: 'Agent loop cancelled by user.' });
        AuditLogger.log({ type: 'AGENT_CANCELLED', action: 'abort', details: { sessionId }, status: 'ABORTED' });
        throw new Error('Agent execution was interrupted.');
      }

      currentStep++;
      onProgress({ type: 'step', step: currentStep, maxSteps });

      // Prune history if needed
      const messages = this.sessionManager.pruneContext(sessionId, 24);

      let stepResult;
      try {
        stepResult = await this.client.chatCompletion({
          model,
          messages,
          tools,
          temperature: budget.temperature,
          max_tokens: budget.tokenBudget,
          stream: Boolean(params.stream),
          onProgress,
          onChunk: (chunk) => {
            onProgress({ type: 'stream_token', text: chunk.text });
          },
          signal
        });
      } catch (err) {
        onProgress({ type: 'error', error: err.message });
        AuditLogger.log({ type: 'AGENT_LLM_ERROR', action: 'chatCompletion', details: { error: err.message }, status: 'ERROR' });
        throw err;
      }

      // Record token consumption
      if (stepResult.usage) {
        this.sessionManager.updateTokenUsage(sessionId, stepResult.usage);
      }

      const content = stepResult.content || '';
      const toolCalls = stepResult.tool_calls || [];

      // If the model generated text alongside tool calls, notify
      if (content) {
        onProgress({ type: 'thought', text: content });
      }

      // Check if model decided to call tools
      if (toolCalls && toolCalls.length > 0) {
        // Record assistant's tool-call intent into message history
        this.sessionManager.addMessage(sessionId, {
          role: 'assistant',
          content: content || null,
          tool_calls: toolCalls
        });

        onProgress({ type: 'tool_calls', calls: toolCalls });

        // Execute all tool calls
        for (const call of toolCalls) {
          if (signal?.aborted) throw new Error('Agent execution was interrupted.');

          const toolName = call.function?.name || 'unknown';
          onProgress({ type: 'tool_start', name: toolName, callId: call.id });

          const execResult = await this.toolRegistry.executeCall(call, ctx);
          onProgress({ type: 'tool_end', name: toolName, callId: call.id, result: execResult });

          // Record tool execution in session history
          this.sessionManager.recordToolExecution(sessionId, execResult);

          // Append tool observation to conversation context
          const toolContent = JSON.stringify(execResult.result || { error: execResult.error, blocked: execResult.blocked });
          this.sessionManager.addMessage(sessionId, {
            role: 'tool',
            tool_call_id: call.id,
            content: toolContent
          });
        }
        // Continue ReAct cycle to let model inspect observation
        continue;
      } else {
        // Model provided final text answer
        finalAnswer = content;
        this.sessionManager.addMessage(sessionId, { role: 'assistant', content: finalAnswer });
        break;
      }
    }

    if (!finalAnswer && currentStep >= maxSteps) {
      finalAnswer = `[Execution limit reached]: Agent completed ${currentStep} reasoning steps without final convergence. All interim tool actions have been recorded.`;
    }

    onProgress({ type: 'complete', finalAnswer, steps: currentStep });
    AuditLogger.log({
      type: 'AGENT_COMPLETE',
      action: 'finish',
      details: { sessionId, steps: currentStep, answerLength: finalAnswer.length },
      status: 'SUCCESS'
    });

    return {
      sessionId,
      finalAnswer,
      steps: currentStep,
      model,
      reasoning
    };
  }
}

module.exports = AgentEngine;
