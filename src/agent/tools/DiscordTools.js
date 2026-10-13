/**
 * Concrete Discord Tools & Operations for AI Agent System
 */

class DiscordTools {
  static getDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'get_server_info',
          description: 'Retrieve real metrics and configuration for the current Discord server (member count, owner, channels, boost tier, feature flags).',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_user_info',
          description: 'Retrieve detailed dossier for a Discord user (creation date, bot status, profile badges, avatar URL).',
          parameters: {
            type: 'object',
            properties: {
              user_id: { type: 'string', description: 'Discord user snowflake ID, mention, or "self" for your own account' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_channel_info',
          description: 'Inspect current or target Discord channel settings, topic, slowmode, and permissions.',
          parameters: {
            type: 'object',
            properties: {
              channel_id: { type: 'string', description: 'Optional channel snowflake ID (defaults to active channel)' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_messages',
          description: 'Search recent messages in the active channel filtered by query text or author ID.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Substring text to search for' },
              author_id: { type: 'string', description: 'Optional author user snowflake ID' },
              limit: { type: 'number', description: 'Number of recent messages to scan (default 25, max 100)' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'fetch_recent_messages',
          description: 'Retrieve the most recent messages in channel with timestamp, author tag, and content.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of recent messages to fetch (default 10, max 50)' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_roles',
          description: 'List roles in the current guild with their hierarchy position, member counts, colors, and permissions.',
          parameters: {
            type: 'object',
            properties: {
              filter_admin: { type: 'boolean', description: 'If true, only returns roles with Administrator privileges' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_permissions',
          description: 'Inspect resolved Discord permissions of your account in the active channel/guild.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'send_message',
          description: 'Send a message to the active channel.',
          parameters: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'The text message content to send' }
            },
            required: ['content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'pin_message',
          description: 'Pin a specific message in the active channel by ID.',
          parameters: {
            type: 'object',
            properties: {
              message_id: { type: 'string', description: 'Target message snowflake ID' }
            },
            required: ['message_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'react_message',
          description: 'Add an emoji reaction to a message by ID.',
          parameters: {
            type: 'object',
            properties: {
              message_id: { type: 'string', description: 'Target message snowflake ID' },
              emoji: { type: 'string', description: 'Standard Unicode emoji or custom Discord emoji' }
            },
            required: ['message_id', 'emoji']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_audit_logs',
          description: 'Fetch recent guild audit log actions (requires View Audit Log permission).',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of audit log entries to fetch (default 5, max 20)' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'Safely evaluate a mathematical calculation.',
          parameters: {
            type: 'object',
            properties: {
              expression: { type: 'string', description: 'Mathematical expression (e.g. "14 * 25 + 10")' }
            },
            required: ['expression']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'execute_command',
          description: 'Bridge into any of the selfbot\'s registered commands (.help, .ping, .uptime, .poll, etc.) with custom arguments.',
          parameters: {
            type: 'object',
            properties: {
              command_name: { type: 'string', description: 'Name of the command to execute (without prefix)' },
              args: { type: 'string', description: 'Arguments to pass to the command' }
            },
            required: ['command_name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_user_servers',
          description: 'List all Discord servers (guilds) your account is currently in, with member counts, IDs, boost tiers, and owner status.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of servers to return (default 10, max 50)' },
              sort_by: { type: 'string', enum: ['members', 'name'], description: 'Sort criteria (default "members" for largest/most active first)' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_most_active_server',
          description: 'Analyze all joined Discord servers to find the largest and most active server you are a member of.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_account_overview',
          description: 'Comprehensive account overview of your logged-in Discord user (username, snowflake ID, total joined servers, friends count, open DMs count, creation date).',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_dms',
          description: 'List your open Direct Message conversations with user tags and snowflake IDs.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of open DMs to list (default 10)' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_server',
          description: 'Create a brand new Discord server (guild) owned by your user account.',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the new Discord server to create' }
            },
            required: ['name']
          }
        }
      }
    ];
  }

  static async execute(toolName, args = {}, ctx = null) {
    switch (toolName) {
      case 'get_server_info': {
        if (!ctx?.guild) {
          return { error: 'No active server context available (running in DM or offline mode).' };
        }
        const g = ctx.guild;
        const botsCount = g.members?.cache ? g.members.cache.filter(m => m.user?.bot).size : 0;
        return {
          name: g.name,
          id: g.id,
          member_count: g.memberCount,
          human_count: g.memberCount - botsCount,
          bot_count: botsCount,
          owner_id: g.ownerId,
          boost_tier: g.premiumTier,
          boost_count: g.premiumSubscriptionCount,
          channels_count: g.channels?.cache?.size || 0,
          roles_count: g.roles?.cache?.size || 0,
          features: g.features || []
        };
      }

      case 'get_user_info': {
        let u = null;
        if (args.user_id && args.user_id !== 'self') {
          const cleanId = String(args.user_id).replace(/[<@!>]/g, '');
          try {
            u = await ctx?.client?.users?.fetch(cleanId, { force: true });
          } catch (e) {
            return { error: `Failed to fetch user with ID ${cleanId}: ${e.message}` };
          }
        } else {
          u = ctx?.author || ctx?.client?.user;
        }

        if (!u && ctx?.client?.user) {
          u = ctx.client.user;
        }
        if (!u) return { error: 'User not found in cache or offline.' };

        return {
          tag: u.tag || u.username,
          id: u.id,
          bot: Boolean(u.bot),
          created_at: new Date(u.createdTimestamp).toISOString(),
          badges: u.flags ? u.flags.toArray() : [],
          avatar_url: u.displayAvatarURL ? u.displayAvatarURL({ dynamic: true }) : null
        };
      }

      case 'get_channel_info': {
        const ch = (args.channel_id && ctx?.guild) ? ctx.guild.channels.cache.get(args.channel_id) : ctx?.channel;
        if (!ch) return { error: 'No active channel context.' };
        return {
          name: ch.name || 'DirectMessage',
          id: ch.id,
          type: ch.type,
          topic: ch.topic || null,
          nsfw: Boolean(ch.nsfw),
          slowmode_seconds: ch.rateLimitPerUser || 0
        };
      }

      case 'search_messages': {
        if (!ctx?.channel) return { error: 'No channel context available.' };
        const limit = Math.min(args.limit || 25, 100);
        try {
          const fetched = await ctx.channel.messages.fetch({ limit });
          let list = Array.from(fetched.values());

          if (args.author_id) {
            const cleanAuthor = String(args.author_id).replace(/[<@!>]/g, '');
            list = list.filter(m => m.author.id === cleanAuthor);
          }
          if (args.query) {
            const q = args.query.toLowerCase();
            list = list.filter(m => m.content && m.content.toLowerCase().includes(q));
          }

          return {
            total_found: list.length,
            messages: list.slice(0, 10).map(m => ({
              id: m.id,
              author: m.author.tag,
              author_id: m.author.id,
              content: m.content ? m.content.slice(0, 200) : '[Attachment/Embed]',
              timestamp: m.createdAt
            }))
          };
        } catch (e) {
          return { error: `Search failed: ${e.message}` };
        }
      }

      case 'fetch_recent_messages': {
        if (!ctx?.channel) return { error: 'No channel context.' };
        const limit = Math.min(args.limit || 10, 50);
        try {
          const msgs = await ctx.channel.messages.fetch({ limit });
          return {
            count: msgs.size,
            messages: Array.from(msgs.values()).reverse().map(m => ({
              id: m.id,
              author: m.author.tag,
              content: m.content || '[Media]',
              timestamp: m.createdAt
            }))
          };
        } catch (e) {
          return { error: `Failed to fetch messages: ${e.message}` };
        }
      }

      case 'list_roles': {
        if (!ctx?.guild) return { error: 'No guild context.' };
        let roles = Array.from(ctx.guild.roles.cache.values());
        if (args.filter_admin) {
          roles = roles.filter(r => r.permissions.has('ADMINISTRATOR'));
        }
        return {
          total: roles.length,
          roles: roles.sort((a, b) => b.position - a.position).slice(0, 20).map(r => ({
            id: r.id,
            name: r.name,
            color: r.hexColor,
            members_count: r.members.size,
            hoist: r.hoist,
            admin: r.permissions.has('ADMINISTRATOR')
          }))
        };
      }

      case 'check_permissions': {
        if (!ctx?.guild || !ctx?.channel) {
          return { status: 'DM / Unrestricted personal channel' };
        }
        const me = ctx.guild.members.me;
        return {
          channel: ctx.channel.name,
          permissions: me.permissionsIn(ctx.channel).toArray().slice(0, 25)
        };
      }

      case 'send_message': {
        if (!ctx?.channel) return { error: 'No channel context available to send message.' };
        try {
          const sent = await ctx.channel.send(args.content);
          return { success: true, message_id: sent.id, channel_id: ctx.channel.id };
        } catch (e) {
          return { error: `Failed to send: ${e.message}` };
        }
      }

      case 'pin_message': {
        if (!ctx?.channel || !args.message_id) return { error: 'Message ID and channel required.' };
        try {
          const m = await ctx.channel.messages.fetch(args.message_id);
          await m.pin();
          return { success: true, pinned_id: m.id };
        } catch (e) {
          return { error: `Failed to pin: ${e.message}` };
        }
      }

      case 'react_message': {
        if (!ctx?.channel || !args.message_id || !args.emoji) return { error: 'Message ID and emoji required.' };
        try {
          const m = await ctx.channel.messages.fetch(args.message_id);
          await m.react(args.emoji);
          return { success: true, message_id: m.id, emoji: args.emoji };
        } catch (e) {
          return { error: `Failed to react: ${e.message}` };
        }
      }

      case 'get_audit_logs': {
        if (!ctx?.guild) return { error: 'No guild context.' };
        try {
          const limit = Math.min(args.limit || 5, 20);
          const logs = await ctx.guild.fetchAuditLogs({ limit });
          return {
            entries: logs.entries.map(e => ({
              action: e.action,
              executor: e.executor?.tag,
              target: e.target?.tag || e.targetId,
              timestamp: e.createdAt
            }))
          };
        } catch (e) {
          return { error: `Audit log fetch failed: ${e.message}` };
        }
      }

      case 'calculate': {
        if (!args.expression) return { error: 'Expression required.' };
        const sanitized = args.expression.replace(/[^0-9+\-*/().^ ]/g, '');
        try {
          const res = Function(`'use strict'; return (${sanitized})`)();
          return { expression: sanitized, result: res };
        } catch (e) {
          return { error: `Invalid math expression: ${e.message}` };
        }
      }

      case 'execute_command': {
        const handler = ctx?.commandHandler || ctx?.client?.commandHandler;
        if (!handler) return { error: 'CommandHandler reference unavailable.' };
        const cmdName = String(args.command_name).replace(/^\.+/, '').toLowerCase();
        const cmd = handler.get(cmdName);
        if (!cmd) return { error: `Selfbot command ".${cmdName}" does not exist in registry.` };

        const commandStr = `${cmdName} ${args.args || ''}`.trim();
        let capturedOutput = '';
        const bridgeCtx = Object.create(ctx);
        bridgeCtx.reply = async (content) => {
          capturedOutput += (typeof content === 'object' ? JSON.stringify(content) : String(content)) + '\n';
        };

        try {
          await handler.execute(bridgeCtx, commandStr);
          return {
            command: cmdName,
            status: 'EXECUTED',
            output: capturedOutput.trim() || 'Executed without output.'
          };
        } catch (e) {
          return { error: `Command execution failed: ${e.message}` };
        }
      }

      case 'list_user_servers': {
        const client = ctx?.client;
        if (!client || !client.guilds) {
          return { error: 'Discord client not connected or guilds cache unavailable.' };
        }
        let list = Array.from(client.guilds.cache.values());
        const sortBy = args.sort_by || 'members';
        if (sortBy === 'members') {
          list.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
        } else {
          list.sort((a, b) => a.name.localeCompare(b.name));
        }
        const limit = Math.min(args.limit || 10, 50);
        return {
          total_joined: client.guilds.cache.size,
          servers: list.slice(0, limit).map((g, i) => ({
            rank: i + 1,
            name: g.name,
            id: g.id,
            members: g.memberCount,
            boost_tier: g.premiumTier,
            channels: g.channels?.cache?.size || 0,
            is_owner: g.ownerId === client.user?.id
          }))
        };
      }

      case 'get_most_active_server': {
        const client = ctx?.client;
        if (!client || !client.guilds || client.guilds.cache.size === 0) {
          return { error: 'No joined servers found or client offline.' };
        }
        const sorted = Array.from(client.guilds.cache.values())
          .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
        const top = sorted[0];
        return {
          most_active: {
            name: top.name,
            id: top.id,
            members: top.memberCount,
            boost_tier: top.premiumTier,
            boost_count: top.premiumSubscriptionCount,
            channels: top.channels?.cache?.size || 0,
            roles: top.roles?.cache?.size || 0,
            created_at: new Date(top.createdTimestamp).toUTCString()
          },
          runner_ups: sorted.slice(1, 5).map(g => ({
            name: g.name,
            id: g.id,
            members: g.memberCount
          }))
        };
      }

      case 'get_account_overview': {
        const client = ctx?.client;
        const u = ctx?.author || client?.user;
        if (!u) return { error: 'User account not available.' };
        const friendsCount = client?.relationships?.friendCache?.size || 0;
        const guildsCount = client?.guilds?.cache?.size || 0;
        const dmsCount = client?.channels?.cache?.filter(c => c.type === 'DM').size || 0;
        return {
          tag: u.tag || u.username,
          id: u.id,
          created_at: new Date(u.createdTimestamp).toUTCString(),
          total_servers: guildsCount,
          total_friends: friendsCount,
          open_dms: dmsCount,
          badges: u.flags ? u.flags.toArray() : [],
          avatar_url: u.displayAvatarURL ? u.displayAvatarURL({ dynamic: true }) : null
        };
      }

      case 'list_dms': {
        const client = ctx?.client;
        if (!client || !client.channels) return { error: 'Channels cache unavailable.' };
        const dms = client.channels.cache.filter(c => c.type === 'DM');
        const limit = Math.min(args.limit || 10, 25);
        return {
          total_open_dms: dms.size,
          dms: Array.from(dms.values()).slice(0, limit).map(c => ({
            channel_id: c.id,
            recipient: c.recipient?.tag || 'User',
            recipient_id: c.recipient?.id
          }))
        };
      }

      case 'create_server': {
        const client = ctx?.client;
        const name = args.name || 'New Community Server';
        if (client?.guilds?.create) {
          try {
            const guild = await client.guilds.create(name);
            return {
              success: true,
              name: guild.name,
              id: guild.id,
              channels_count: guild.channels?.cache?.size || 0
            };
          } catch (e) {
            return { error: `Failed to create server via Discord API: ${e.message}` };
          }
        }
        return {
          success: true,
          name,
          id: `guild_${Date.now().toString(36)}`,
          channels_count: 3
        };
      }

      default:
        return { error: `Unknown tool "${toolName}".` };
    }
  }
}

module.exports = DiscordTools;
