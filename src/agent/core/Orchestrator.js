const AgentEngine = require('./AgentEngine');
const Logger = require('../../utils/Logger');
const AuditLogger = require('./AuditLogger');

class Orchestrator {
  constructor(options = {}) {
    this.engine = new AgentEngine(options);
    this.specialists = new Map();
  }

  /**
   * Determine whether a request is multi-faceted needing sub-task decomposition
   */
  isMultiFaceted(prompt) {
    const lower = prompt.toLowerCase();
    const hasParallelMarkers = (lower.includes(' and ') || lower.includes(' also ') || lower.includes(' then ') || lower.includes(' concurrently ')) &&
      (lower.includes('search') || lower.includes('check') || lower.includes('audit') || lower.includes('inspect'));
    return hasParallelMarkers && prompt.length > 50;
  }

  /**
   * Orchestrate task execution (single direct ReAct or parallel specialist coordination)
   */
  async execute(params = {}) {
    const prompt = params.prompt;
    const onProgress = params.onProgress || (() => {});
    const signal = params.signal || null;

    // Fast path: Simple tasks bypass sub-agent overhead
    if (!this.isMultiFaceted(prompt) || params.forceSingle) {
      onProgress({ type: 'orchestrator_route', strategy: 'DIRECT_REACT' });
      return this.engine.run(params);
    }

    // Multi-faceted task decomposition
    onProgress({ type: 'orchestrator_route', strategy: 'SPECIALIST_PARALLEL_COORDINATION' });
    AuditLogger.log({
      type: 'ORCHESTRATOR_DECOMPOSE',
      action: 'decompose',
      details: { prompt },
      status: 'DECOMPOSING'
    });

    // Parse subtasks by splitting on conjunctions
    const subtaskPrompts = prompt
      .split(/(?:\band\b|\balso\b|\bthen\b)/i)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    if (subtaskPrompts.length <= 1) {
      return this.engine.run(params);
    }

    onProgress({
      type: 'subtasks_planned',
      count: subtaskPrompts.length,
      subtasks: subtaskPrompts
    });

    // Execute subtasks concurrently
    const subtaskPromises = subtaskPrompts.map(async (subPrompt, idx) => {
      const specialistRole = (subPrompt.toLowerCase().includes('search') || subPrompt.toLowerCase().includes('check') || subPrompt.toLowerCase().includes('audit'))
        ? 'ReconSpecialist'
        : 'ActionSpecialist';

      onProgress({
        type: 'specialist_start',
        specialist: specialistRole,
        index: idx + 1,
        prompt: subPrompt
      });

      try {
        const subResult = await this.engine.run({
          ...params,
          prompt: subPrompt,
          sessionId: `${params.sessionId || 'orch'}_sub_${idx + 1}`,
          onProgress: (p) => {
            onProgress({ ...p, specialist: specialistRole, subtaskIndex: idx + 1 });
          }
        });

        onProgress({
          type: 'specialist_done',
          specialist: specialistRole,
          index: idx + 1,
          result: subResult.finalAnswer
        });

        return { success: true, specialist: specialistRole, prompt: subPrompt, output: subResult.finalAnswer };
      } catch (err) {
        onProgress({
          type: 'specialist_error',
          specialist: specialistRole,
          index: idx + 1,
          error: err.message
        });
        return { success: false, specialist: specialistRole, prompt: subPrompt, error: err.message };
      }
    });

    const subResults = await Promise.allSettled(subtaskPromises);

    // Synthesis phase: consolidate all subtask outputs into unified presentation
    onProgress({ type: 'synthesis_start' });

    const consolidatedOutputs = subResults.map((r, i) => {
      const val = r.status === 'fulfilled' ? r.value : { error: r.reason?.message };
      return `### Subtask ${i + 1}: ${val.prompt || 'Action'}\n${val.output || val.error || 'No output'}`;
    }).join('\n\n');

    const finalAnswer = `## ◈ CONSOLIDATED AGENT ORCHESTRATION REPORT\n\n${consolidatedOutputs}`;

    onProgress({ type: 'complete', finalAnswer, consolidated: true });

    return {
      sessionId: params.sessionId || 'orch_consolidated',
      finalAnswer,
      strategy: 'SPECIALIST_PARALLEL_COORDINATION',
      subtasksCount: subtaskPrompts.length
    };
  }
}

module.exports = Orchestrator;
