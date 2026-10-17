const { Client, GatewayIntentBits } = require('discord.js');
const { FlawComponentsView } = require('./FlawComponentsView');
const Logger = require('../utils/Logger');

/**
 * FlawBotFrontend
 * Official Discord User-Installable Application Frontend for Flaw.
 * Handles interaction routing, server-side authorization checks,
 * Components V2 interactive dashboards, and dispatches real executions
 * directly into the Flaw selfbot backend engine.
 */
class FlawBotFrontend {
  constructor(selfClient, options = {}) {
    this.selfClient = selfClient;
    this.token = options.token || process.env.DISCORD_BOT_TOKEN;
    this.ownerId = options.ownerId || '1449235608022286347'; // Primary Lemon/Flaw account identity
    this.authorizedUsers = new Set(
      (options.authorizedUsers || [this.ownerId]).map(String)
    );

    this.bot = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.setupEvents();
  }

  isAuthorized(userId) {
    if (!userId) return false;
    const strId = String(userId);
    return strId === this.ownerId || this.authorizedUsers.has(strId);
  }

  setupEvents() {
    this.bot.on('clientReady', () => {
      Logger.success(`Flaw User-Installable App Frontend online: ${this.bot.user.tag} (ID: ${this.bot.user.id})`);
    });

    this.bot.on('interactionCreate', async (interaction) => {
      try {
        await this.handleInteraction(interaction);
      } catch (err) {
        Logger.error(`Frontend Interaction Error: ${err.message}`);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `⚠️ Internal Error: ${err.message}`, ephemeral: true }).catch(() => {});
        }
      }
    });
  }

  async handleInteraction(interaction) {
    const userId = interaction.user?.id;

    // Strict Server-Side Authorization Check
    if (!this.isAuthorized(userId)) {
      Logger.warn(`Unauthorized access attempt by user ${interaction.user?.tag} (${userId})`);
      return interaction.reply({
        content: `⛔ **Access Denied**: You are not an authorized operator of Flaw Control Center.`,
        ephemeral: true
      });
    }

    // 1. Slash Command Handling
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'flaw') {
        const payload = FlawComponentsView.buildOverview(
          this.selfClient.commandHandler,
          this.selfClient
        );
        return interaction.reply({ ...payload, ephemeral: true });
      }

      if (interaction.commandName === 'exec') {
        const cmdStr = interaction.options.getString('command', true);
        await interaction.deferReply({ ephemeral: true });

        const start = Date.now();
        const res = await this.executeOnSelfbot(cmdStr, interaction);
        const duration = Date.now() - start;

        const payload = FlawComponentsView.buildExecutionResult(
          cmdStr.split(' ')[0],
          res.output,
          duration,
          res.success,
          Boolean(this.selfClient.config?.fastMode)
        );
        return interaction.editReply(payload);
      }

      // Subcommand Execution (e.g. /moderation ban user:@user reason:test)
      let subcommandName = null;
      try {
        subcommandName = interaction.options.getSubcommand(false);
      } catch {}

      if (subcommandName) {
        // Collect all options passed to the subcommand
        const optionValues = [];
        if (interaction.options.data && interaction.options.data[0]?.options) {
          for (const opt of interaction.options.data[0].options) {
            if (opt.value !== undefined && opt.value !== null && opt.value !== '') {
              optionValues.push(String(opt.value));
            }
          }
        }

        const fullCmdStr = `${subcommandName} ${optionValues.join(' ')}`.trim();
        await interaction.deferReply({ ephemeral: true });

        const start = Date.now();
        const res = await this.executeOnSelfbot(fullCmdStr, interaction);
        const duration = Date.now() - start;

        const payload = FlawComponentsView.buildExecutionResult(
          subcommandName,
          res.output,
          duration,
          res.success,
          Boolean(this.selfClient.config?.fastMode)
        );
        return interaction.editReply(payload);
      }

      // Backward compatible grouped option execution if ever called with 'action'
      const chosenCmd = interaction.options.getString('action');
      if (chosenCmd) {
        const optionalArgs = interaction.options.getString('args') || '';
        const fullCmdStr = `${chosenCmd} ${optionalArgs}`.trim();
        await interaction.deferReply({ ephemeral: true });

        const start = Date.now();
        const res = await this.executeOnSelfbot(fullCmdStr, interaction);
        const duration = Date.now() - start;

        const payload = FlawComponentsView.buildExecutionResult(
          chosenCmd,
          res.output,
          duration,
          res.success,
          Boolean(this.selfClient.config?.fastMode)
        );
        return interaction.editReply(payload);
      }
    }

    // 2. Select Menu Handling
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'flaw_module_select') {
        const chosen = interaction.values[0];
        const moduleId = chosen.replace(/^mod_/, '');
        const payload = FlawComponentsView.buildModuleList(
          moduleId,
          this.selfClient.commandHandler,
          0
        );
        return interaction.update(payload);
      }

      if (interaction.customId === 'flaw_cmd_select') {
        const chosen = interaction.values[0];
        const cmdName = chosen.replace(/^cmd_/, '');
        const payload = FlawComponentsView.buildCommandDetail(
          cmdName,
          this.selfClient.commandHandler
        );
        return interaction.update(payload);
      }
    }

    // 3. Button Handling
    if (interaction.isButton()) {
      if (interaction.customId === 'flaw_nav_home') {
        const payload = FlawComponentsView.buildOverview(
          this.selfClient.commandHandler,
          this.selfClient
        );
        return interaction.update(payload);
      }

      if (interaction.customId.startsWith('flaw_page_')) {
        const parts = interaction.customId.split('_'); // flaw, page, moduleId, pageNum
        const moduleId = parts[2];
        const pageNum = parseInt(parts[3], 10) || 0;
        const payload = FlawComponentsView.buildModuleList(
          moduleId,
          this.selfClient.commandHandler,
          pageNum
        );
        return interaction.update(payload);
      }

      if (interaction.customId.startsWith('flaw_run_')) {
        const cmdName = interaction.customId.replace('flaw_run_', '');
        await interaction.deferUpdate();

        const start = Date.now();
        const res = await this.executeOnSelfbot(cmdName, interaction);
        const duration = Date.now() - start;

        const payload = FlawComponentsView.buildExecutionResult(
          cmdName,
          res.output,
          duration,
          res.success,
          Boolean(this.selfClient.config?.fastMode)
        );
        return interaction.editReply(payload);
      }

      if (interaction.customId === 'flaw_toggle_mode') {
        const currentMode = Boolean(this.selfClient.config?.fastMode);
        const newMode = !currentMode;
        if (typeof this.selfClient.setFastMode === 'function') {
          this.selfClient.setFastMode(newMode);
        } else {
          this.selfClient.config.fastMode = newMode;
          if (this.selfClient.client) this.selfClient.client.config = this.selfClient.config;
        }

        const payload = FlawComponentsView.buildOverview(
          this.selfClient.commandHandler,
          this.selfClient
        );
        return interaction.update(payload);
      }

      if (interaction.customId === 'flaw_quick_exec') {
        return interaction.reply({
          content: '💡 **Tip**: Use `/exec command:<name>` to run any selfbot command with custom arguments (e.g. `/exec command:userinfo @user` or `/exec command:ping`)!',
          ephemeral: true
        });
      }

      if (interaction.customId === 'flaw_search_modal') {
        return interaction.reply({
          content: '🔍 **Search**: Pick any category from the dropdown above to view all its commands, or type `/exec command:help <query>` to filter commands directly!',
          ephemeral: true
        });
      }
    }
  }

  async executeOnSelfbot(commandStr, interaction) {
    const handler = this.selfClient?.commandHandler;
    if (!handler) {
      return { success: false, output: 'Selfbot CommandHandler is not initialized.' };
    }

    const clean = commandStr.trim().replace(/^\.+/, '');
    let output = '';

    const bridgeCtx = {
      type: 'frontend',
      client: this.selfClient.client,
      channel: this.selfClient.activeChannel,
      guild: this.selfClient.activeChannel?.guild || null,
      commandHandler: handler,
      reply: async (content) => {
        output += (typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)) + '\n';
      },
      log: (text) => {
        output += String(text) + '\n';
      }
    };

    let success = true;
    try {
      await handler.execute(bridgeCtx, clean);
    } catch (err) {
      success = false;
      output += `⚠️ Execution Exception: ${err.message}\n`;
    }

    return {
      success,
      output: output.trim() || 'Command executed without output.'
    };
  }

  async start() {
    if (!this.token || !this.token.includes('.')) {
      Logger.warn('No valid Discord bot token provided for Flaw frontend application.');
      return false;
    }

    try {
      await this.bot.login(this.token);

      // Auto-sync grouped slash commands to Discord on start
      const SlashCommandRegistryBuilder = require('./SlashCommandRegistryBuilder');
      SlashCommandRegistryBuilder.syncWithDiscord(
        this.token,
        this.bot.user.id,
        this.selfClient.commandHandler
      ).then(ok => {
        if (ok) {
          Logger.success('All core commands synced as user-installable slash command groups!');
        }
      }).catch(() => {});

      return true;
    } catch (err) {
      Logger.error(`Flaw frontend application login failed: ${err.message}`);
      return false;
    }
  }

  async stop() {
    if (this.bot) {
      this.bot.destroy();
    }
  }
}

module.exports = FlawBotFrontend;
