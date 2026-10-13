const Logger = require('../../utils/Logger');

class SafetyGate {
  constructor(options = {}) {
    this.autonomy = options.autonomy || 'confirm_actions'; // 'read_only' | 'confirm_actions' | 'full'
    this.rateLimitDelay = options.rateLimitDelay || 600; // ms between mutating actions
    this.lastActionTime = 0;

    // Define dangerous actions that require explicit confirmation or elevation
    this.consequentialTools = new Set([
      'ban_member',
      'kick_member',
      'softban_member',
      'timeout_member',
      'nuke_channel',
      'delete_channel',
      'delete_role',
      'purge_messages',
      'mass_unban',
      'lockdown_server'
    ]);

    // Read-only safe tools
    this.readOnlyTools = new Set([
      'search_messages',
      'fetch_recent_messages',
      'get_user_info',
      'get_server_info',
      'get_channel_info',
      'list_roles',
      'get_audit_logs',
      'check_permissions',
      'get_voice_info',
      'get_friends_list',
      'list_user_servers',
      'get_most_active_server',
      'get_account_overview',
      'list_dms',
      'calculate',
      'inspect_token',
      'lookup_dns',
      'weather_report'
    ]);
  }

  setAutonomy(level) {
    if (['read_only', 'confirm_actions', 'full'].includes(level)) {
      this.autonomy = level;
      return true;
    }
    return false;
  }

  isConsequential(toolName) {
    return this.consequentialTools.has(toolName);
  }

  isReadOnly(toolName) {
    return this.readOnlyTools.has(toolName);
  }

  async checkPermission(toolName, args = {}, ctx = null) {
    // 1. Check autonomy level constraints
    if (this.autonomy === 'read_only' && !this.isReadOnly(toolName)) {
      return {
        allowed: false,
        reason: `Action "${toolName}" is rejected: Agent autonomy is set to READ_ONLY mode. Only inspection actions permitted.`
      };
    }

    // 2. Check consequential action confirmation
    if (this.isConsequential(toolName) && this.autonomy === 'confirm_actions') {
      if (!args.confirm && !args.confirmed) {
        return {
          allowed: false,
          needsConfirmation: true,
          reason: `Action "${toolName}" is consequential. To execute, provide "confirm: true" or switch agent autonomy to full.`
        };
      }
    }

    // 3. Discord Permission Verification if context guild exists
    if (ctx && ctx.guild) {
      const me = ctx.guild.members?.me;
      if (me?.permissions) {
        if (toolName === 'ban_member' && !me.permissions.has('BAN_MEMBERS')) {
          return { allowed: false, reason: 'Discord permission error: BAN_MEMBERS permission missing.' };
        }
        if (toolName === 'kick_member' && !me.permissions.has('KICK_MEMBERS')) {
          return { allowed: false, reason: 'Discord permission error: KICK_MEMBERS permission missing.' };
        }
        if (toolName === 'purge_messages' && !me.permissions.has('MANAGE_MESSAGES')) {
          return { allowed: false, reason: 'Discord permission error: MANAGE_MESSAGES permission missing.' };
        }
        if (['nuke_channel', 'delete_channel'].includes(toolName) && !me.permissions.has('MANAGE_CHANNELS')) {
          return { allowed: false, reason: 'Discord permission error: MANAGE_CHANNELS permission missing.' };
        }
      }
    }

    // 4. Rate-limit throttle for mutating actions
    if (!this.isReadOnly(toolName)) {
      const now = Date.now();
      const elapsed = now - this.lastActionTime;
      if (elapsed < this.rateLimitDelay) {
        await new Promise(r => setTimeout(r, this.rateLimitDelay - elapsed));
      }
      this.lastActionTime = Date.now();
    }

    return { allowed: true };
  }
}

module.exports = SafetyGate;
