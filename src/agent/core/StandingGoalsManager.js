const Logger = require('../../utils/Logger');
const Storage = require('../../utils/Storage');

/**
 * StandingGoalsManager
 * Enables persistent instructions and standing objectives for the autonomous ReAct agent.
 * The agent can register goals (e.g. "watch #alerts for server name pings", "log user joins in server X")
 * and wake on an interval or message trigger via the AgentEngine.
 */
class StandingGoalsManager {
  constructor(engine = null) {
    this.engine = engine;
    this.timer = null;
    this.intervalMs = 60000; // Check standing goals every 60 seconds
    this.isRunning = false;
  }

  setEngine(engine) {
    this.engine = engine;
  }

  addGoal(goal) {
    return Storage.addStandingGoal({
      title: goal.title || 'Standing Instruction',
      instruction: goal.instruction,
      channelId: goal.channelId || null,
      guildId: goal.guildId || null,
      intervalSec: goal.intervalSec || 300 // default 5 min
    });
  }

  listGoals() {
    return Storage.getActiveStandingGoals();
  }

  deleteGoal(id) {
    return Storage.deleteStandingGoal(id);
  }

  start(ctx = null) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.timer = setInterval(async () => {
      try {
        await this.checkAndRunGoals(ctx);
      } catch (err) {
        Logger.warn(`Standing goal tick failed: ${err.message}`);
      }
    }, this.intervalMs);

    Logger.info('Standing Goals background orchestrator started (60s tick interval).');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  async checkAndRunGoals(ctx) {
    if (!this.engine) return;
    const goals = this.listGoals();
    const now = Date.now();

    for (const goal of goals) {
      const elapsedSec = (now - goal.last_run) / 1000;
      if (elapsedSec >= goal.interval_sec) {
        Logger.info(`Executing standing goal [ID ${goal.id}]: "${goal.title}"`);
        Storage.updateStandingGoalRun(goal.id, 'Running');

        try {
          const prompt = `[STANDING GOAL: ${goal.title}]
Instruction: ${goal.instruction}
Context: Guild ${goal.guild_id || 'Current'}, Channel ${goal.channel_id || 'Current'}.
Execute this standing check, inspect recent messages/events, take necessary actions or return a concise status report.`;

          const result = await this.engine.run({
            prompt,
            sessionId: `goal_${goal.id}`,
            ctx: ctx || {
              channel: goal.channel_id ? { id: goal.channel_id } : null,
              guild: goal.guild_id ? { id: goal.guild_id } : null
            }
          });

          const summary = (result.finalResponse || 'Completed cleanly.').slice(0, 300);
          Storage.updateStandingGoalRun(goal.id, summary);
          Logger.success(`Standing goal [ID ${goal.id}] settled successfully.`);
        } catch (err) {
          Storage.updateStandingGoalRun(goal.id, `Error: ${err.message}`);
          Logger.error(`Standing goal [ID ${goal.id}] failed: ${err.message}`);
        }
      }
    }
  }
}

module.exports = new StandingGoalsManager();
module.exports.StandingGoalsManager = StandingGoalsManager;
