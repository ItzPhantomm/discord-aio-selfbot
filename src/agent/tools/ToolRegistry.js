const DiscordTools = require('./DiscordTools');
const SafetyGate = require('../core/SafetyGate');
const AuditLogger = require('../core/AuditLogger');
const Logger = require('../../utils/Logger');

class ToolRegistry {
  constructor(options = {}) {
    this.safetyGate = new SafetyGate(options);
    this.tools = new Map();
    this.definitions = [];

    this.registerDefaults();
  }

  registerDefaults() {
    const defs = DiscordTools.getDefinitions();
    for (const def of defs) {
      this.register(def, DiscordTools.execute);
    }
  }

  register(schema, handler) {
    const name = schema.function?.name;
    if (!name) throw new Error('Tool schema missing function.name');
    this.tools.set(name, { schema, handler });
    this.definitions.push(schema);
  }

  getDefinitions() {
    return this.definitions;
  }

  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Execute a tool call with permission checks, error handling and audit logging
   */
  async executeCall(call, ctx = null) {
    const toolName = call.function?.name || call.name;
    let args = {};

    try {
      if (typeof call.function?.arguments === 'string') {
        args = JSON.parse(call.function.arguments || '{}');
      } else if (typeof call.arguments === 'object') {
        args = call.arguments || {};
      }
    } catch (e) {
      return {
        tool_call_id: call.id,
        name: toolName,
        error: `Malformed JSON arguments: ${e.message}`,
        status: 'ERROR'
      };
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      AuditLogger.log({
        type: 'TOOL_ERROR',
        action: toolName,
        details: { reason: 'Tool not found in registry', args },
        status: 'FAILED'
      });
      return {
        tool_call_id: call.id,
        name: toolName,
        error: `Tool "${toolName}" is not registered in the system.`,
        status: 'ERROR'
      };
    }

    // Safety Gate & Permissions check
    const permCheck = await this.safetyGate.checkPermission(toolName, args, ctx);
    if (!permCheck.allowed) {
      AuditLogger.log({
        type: 'TOOL_BLOCKED',
        action: toolName,
        details: { reason: permCheck.reason, args },
        status: 'BLOCKED'
      });
      return {
        tool_call_id: call.id,
        name: toolName,
        blocked: true,
        reason: permCheck.reason,
        status: 'PERMISSION_DENIED'
      };
    }

    // Execute tool handler with error boundary
    const start = Date.now();
    try {
      const result = await tool.handler(toolName, args, ctx);
      const durationMs = Date.now() - start;

      AuditLogger.log({
        type: 'TOOL_EXECUTE',
        action: toolName,
        details: { args, durationMs },
        status: result?.error ? 'ERROR' : 'SUCCESS'
      });

      return {
        tool_call_id: call.id,
        name: toolName,
        result,
        duration_ms: durationMs,
        status: result?.error ? 'ERROR' : 'SUCCESS'
      };
    } catch (err) {
      const durationMs = Date.now() - start;
      Logger.error(`Tool ${toolName} threw an unhandled exception: ${err.message}`);

      AuditLogger.log({
        type: 'TOOL_CRASH',
        action: toolName,
        details: { error: err.message, stack: err.stack, args, durationMs },
        status: 'CRASH'
      });

      return {
        tool_call_id: call.id,
        name: toolName,
        error: `Internal tool execution exception: ${err.message}`,
        duration_ms: durationMs,
        status: 'EXCEPTION'
      };
    }
  }
}

module.exports = ToolRegistry;
