/**
 * Standardized Command Definition Validator & Sanitizer
 */
class CommandValidator {
  static validate(cmd, filePath = '') {
    if (!cmd || typeof cmd !== 'object') {
      throw new Error(`Command in ${filePath} is not an object.`);
    }
    if (!cmd.name || typeof cmd.name !== 'string' || !cmd.name.trim()) {
      throw new Error(`Command in ${filePath} missing valid name.`);
    }
    if (typeof cmd.run !== 'function') {
      throw new Error(`Command "${cmd.name}" missing executable run(ctx, args) function.`);
    }
    cmd.name = cmd.name.trim().toLowerCase();
    cmd.category = cmd.category || 'General';
    cmd.description = cmd.description || 'No description provided.';
    cmd.usage = cmd.usage || `.${cmd.name}`;
    cmd.aliases = Array.isArray(cmd.aliases) ? cmd.aliases.map(a => String(a).toLowerCase().trim()) : [];
    
    // Permission scoping: high-risk categories require owner by default
    const highRiskCategories = ['OP', 'Backup', 'Config', 'Admin'];
    cmd.requiresOwner = Boolean(cmd.requiresOwner || cmd.ownerOnly || highRiskCategories.includes(cmd.category));
    cmd.minAuthLevel = typeof cmd.minAuthLevel === 'number' ? cmd.minAuthLevel : (cmd.requiresOwner ? 2 : 1);
    
    return cmd;
  }
}

module.exports = CommandValidator;
