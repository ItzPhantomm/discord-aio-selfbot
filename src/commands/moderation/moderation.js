const Storage = require('../../utils/Storage');

module.exports = [
  {
    name: 'kick',
    category: 'Moderation',
    description: 'Kick a member from the server',
    usage: '.kick <user> [reason]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ User not found.');
      await user.kick(args.slice(1).join(' ') || 'Kicked by selfbot');
      return ctx.reply(`👢 Kicked **${user.user.tag}**`);
    }
  },
  {
    name: 'ban',
    category: 'Moderation',
    description: 'Ban a member from the server',
    usage: '.ban <user> [reason]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ User not found.');
      await user.ban({ reason: args.slice(1).join(' ') || 'Banned by selfbot' });
      return ctx.reply(`🔨 Banned **${user.user.tag}**`);
    }
  },
  {
    name: 'unban',
    category: 'Moderation',
    description: 'Unban a user by ID',
    usage: '.unban <user_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Guild and user ID required.');
      await ctx.guild.bans.remove(args[0]);
      return ctx.reply(`🔓 Unbanned user ID: ${args[0]}`);
    }
  },
  {
    name: 'softban',
    category: 'Moderation',
    description: 'Ban and immediate unban to clear user messages',
    usage: '.softban <user> [reason]',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ User not found.');
      await user.ban({ days: 7, reason: 'Softban' });
      await ctx.guild.bans.remove(user.id);
      return ctx.reply(`🧹 Softbanned **${user.user.tag}**`);
    }
  },
  {
    name: 'mute',
    category: 'Moderation',
    description: 'Timeout member for specified minutes',
    usage: '.mute <user> [minutes]',
    aliases: ['timeout'],
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ User not found.');
      const mins = parseInt(args[1], 10) || 5;
      await user.timeout(mins * 60 * 1000, 'Timed out by selfbot');
      return ctx.reply(`🔇 Muted **${user.user.tag}** for ${mins} minutes.`);
    }
  },
  {
    name: 'unmute',
    category: 'Moderation',
    description: 'Remove timeout from member',
    usage: '.unmute <user>',
    aliases: ['untimeout'],
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ User not found.');
      await user.timeout(null);
      return ctx.reply(`🔊 Unmuted **${user.user.tag}**`);
    }
  },
  {
    name: 'deafen',
    category: 'Moderation',
    description: 'Server-deafen member in voice',
    usage: '.deafen <user>',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ Member not found.');
      await user.voice.setDeaf(true);
      return ctx.reply(`🔇 Deafened **${user.user.tag}** in voice.`);
    }
  },
  {
    name: 'undeafen',
    category: 'Moderation',
    description: 'Server-undeafen member in voice',
    usage: '.undeafen <user>',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ Member not found.');
      await user.voice.setDeaf(false);
      return ctx.reply(`🔊 Undeafened **${user.user.tag}**`);
    }
  },
  {
    name: 'voicemove',
    category: 'Moderation',
    description: 'Move user to another voice channel',
    usage: '.voicemove <user> <channel_id>',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user || !args[1]) return ctx.reply('❌ Member and channel ID required.');
      await user.voice.setChannel(args[1]);
      return ctx.reply(`🎧 Moved **${user.user.tag}**.`);
    }
  },
  {
    name: 'voicekick',
    category: 'Moderation',
    description: 'Disconnect member from voice channel',
    usage: '.voicekick <user>',
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const user = ctx.guild.members.cache.get(args[0]?.replace(/[<@!>]/g, ''));
      if (!user) return ctx.reply('❌ Member not found.');
      await user.voice.disconnect();
      return ctx.reply(`🔌 Disconnected **${user.user.tag}** from voice.`);
    }
  },
  {
    name: 'warn',
    category: 'Moderation',
    description: 'Log moderation warning for member',
    usage: '.warn <user> <reason>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.warn <user> <reason>`');
      const id = args[0].replace(/[<@!>]/g, '');
      const reason = args.slice(1).join(' ');
      const warns = Storage.get('warnings', {});
      if (!warns[id]) warns[id] = [];
      warns[id].push({ reason, by: ctx.author.tag, timestamp: Date.now() });
      Storage.set('warnings', warns);
      return ctx.reply(`⚠️ Warned <@${id}> for: "${reason}"`);
    }
  },
  {
    name: 'warnings',
    category: 'Moderation',
    description: 'View saved warnings for user',
    usage: '.warnings <user>',
    aliases: ['warns'],
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user.');
      const id = args[0].replace(/[<@!>]/g, '');
      const warns = Storage.get('warnings', {})[id] || [];
      if (warns.length === 0) return ctx.reply('✅ No warnings on record.');
      return ctx.reply(`⚠️ **Warnings for <@${id}> (${warns.length}):**\n` + warns.map((w, i) => `${i + 1}. ${w.reason} (by ${w.by})`).join('\n'));
    }
  },
  {
    name: 'clearwarns',
    category: 'Moderation',
    description: 'Clear warnings for user',
    usage: '.clearwarns <user>',
    run: async (ctx, args) => {
      if (!args[0]) return ctx.reply('❌ Provide user.');
      const id = args[0].replace(/[<@!>]/g, '');
      const warns = Storage.get('warnings', {});
      delete warns[id];
      Storage.set('warnings', warns);
      return ctx.reply(`🧹 Cleared warnings for <@${id}>`);
    }
  },
  {
    name: 'slowmode',
    category: 'Moderation',
    description: 'Set channel slowmode in seconds',
    usage: '.slowmode <seconds>',
    run: async (ctx, args) => {
      if (!ctx.channel || !ctx.channel.setRateLimitPerUser) return ctx.reply('❌ Guild text channel required.');
      const sec = parseInt(args[0], 10) || 0;
      await ctx.channel.setRateLimitPerUser(sec);
      return ctx.reply(`⏱️ Slowmode set to **${sec}s**`);
    }
  },
  {
    name: 'lock',
    category: 'Moderation',
    description: 'Lock channel permissions for @everyone',
    usage: '.lock',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel) return ctx.reply('❌ Guild channel required.');
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: false });
      return ctx.reply('🔒 Channel locked.');
    }
  },
  {
    name: 'unlock',
    category: 'Moderation',
    description: 'Unlock channel permissions for @everyone',
    usage: '.unlock',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel) return ctx.reply('❌ Guild channel required.');
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: true });
      return ctx.reply('🔓 Channel unlocked.');
    }
  },
  {
    name: 'hide',
    category: 'Moderation',
    description: 'Hide channel from @everyone',
    usage: '.hide',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel) return ctx.reply('❌ Guild channel required.');
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { VIEW_CHANNEL: false });
      return ctx.reply('👁️‍🗨️ Channel hidden.');
    }
  },
  {
    name: 'unhide',
    category: 'Moderation',
    description: 'Unhide channel for @everyone',
    usage: '.unhide',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel) return ctx.reply('❌ Guild channel required.');
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { VIEW_CHANNEL: true });
      return ctx.reply('👁️ Channel made visible.');
    }
  },
  {
    name: 'nuke',
    category: 'Moderation',
    description: 'Clone channel and delete old channel to reset chat',
    usage: '.nuke',
    run: async (ctx) => {
      if (!ctx.guild || !ctx.channel) return ctx.reply('❌ Guild channel required.');
      const pos = ctx.channel.position;
      const clone = await ctx.channel.clone();
      await clone.setPosition(pos);
      await ctx.channel.delete();
      return clone.send('💥 **Channel nuked and cloned.**');
    }
  },
  {
    name: 'roleadd',
    category: 'Moderation',
    description: 'Add role to member',
    usage: '.roleadd <user> <role>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Guild, member and role required.');
      const user = ctx.guild.members.cache.get(args[0].replace(/[<@!>]/g, ''));
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase() || r.id === args[1]);
      if (!user || !role) return ctx.reply('❌ Member or role not found.');
      await user.roles.add(role);
      return ctx.reply(`✅ Added role **${role.name}** to **${user.user.tag}**`);
    }
  },
  {
    name: 'roleremove',
    category: 'Moderation',
    description: 'Remove role from member',
    usage: '.roleremove <user> <role>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Guild, member and role required.');
      const user = ctx.guild.members.cache.get(args[0].replace(/[<@!>]/g, ''));
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase() || r.id === args[1]);
      if (!user || !role) return ctx.reply('❌ Member or role not found.');
      await user.roles.remove(role);
      return ctx.reply(`✅ Removed role **${role.name}** from **${user.user.tag}**`);
    }
  },
  {
    name: 'rolecreate',
    category: 'Moderation',
    description: 'Create a new server role',
    usage: '.rolecreate <name> [hexColor]',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Role name required.');
      const name = args[0];
      const color = args[1] || '#99aab5';
      const role = await ctx.guild.roles.create({ name, color });
      return ctx.reply(`🎨 Created role **${role.name}** (\`${role.id}\`)`);
    }
  },
  {
    name: 'roledelete',
    category: 'Moderation',
    description: 'Delete server role',
    usage: '.roledelete <role_name_or_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Provide role.');
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase() || r.id === args[0]);
      if (!role) return ctx.reply('❌ Role not found.');
      await role.delete();
      return ctx.reply(`🗑️ Deleted role **${role.name}**`);
    }
  },
  {
    name: 'channelcreate',
    category: 'Moderation',
    description: 'Create text or voice channel',
    usage: '.channelcreate <name> [text|voice]',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Channel name required.');
      const name = args[0];
      const type = args[1]?.toLowerCase() === 'voice' ? 'GUILD_VOICE' : 'GUILD_TEXT';
      const ch = await ctx.guild.channels.create(name, { type });
      return ctx.reply(`📺 Created channel **${ch.name}** (\`${ch.id}\`)`);
    }
  },
  {
    name: 'channeldelete',
    category: 'Moderation',
    description: 'Delete channel by ID or current channel',
    usage: '.channeldelete [channel_id]',
    run: async (ctx, args) => {
      const ch = args[0] ? ctx.guild?.channels.cache.get(args[0]) : ctx.channel;
      if (!ch) return ctx.reply('❌ Channel not found.');
      await ch.delete();
      return ctx.log(`Deleted channel ${ch.name}`);
    }
  },
  {
    name: 'perch',
    category: 'Moderation',
    description: 'Perch moderation sentinel: lock perimeters, unhoist nicknames, and scrub spam burst',
    usage: '.perch [lock|sweep|scrub]',
    aliases: ['perchmod', 'watchtower'],
    run: async (ctx, args) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required for perch moderation.');
      const sub = args[0]?.toLowerCase() || 'sweep';
      if (sub === 'lock') {
        if (ctx.channel?.permissionOverwrites) {
          await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: false });
        }
        return ctx.reply('🛡️ **PERCH LOCK:** Channel perimeter secured against member messages.');
      } else if (sub === 'scrub') {
        const msgs = await ctx.channel.messages.fetch({ limit: 30 });
        let deleted = 0;
        for (const m of msgs.values()) {
          if (m.deletable) {
            await m.delete().catch(() => {});
            deleted++;
          }
        }
        return ctx.reply(`🧹 **PERCH SCRUB:** Wiped \`${deleted}\` recent chatter messages.`);
      } else {
        const hoisters = ctx.guild.members.cache.filter(m => m.nickname && /^[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?`~]/.test(m.nickname));
        return ctx.reply(`👁️ **PERCH SENTINEL STATUS:**\n* Channel Lockdown: \`Ready\`\n* Spam Scrub: \`Ready\`\n* Special Character Hoisters Detected: \`${hoisters.size}\` members`);
      }
    }
  },
  {
    name: 'lockdownall',
    category: 'Moderation',
    description: 'Mass emergency lockdown of all guild channels for @everyone',
    usage: '.lockdownall',
    aliases: ['masslock'],
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      let count = 0;
      for (const ch of ctx.guild.channels.cache.values()) {
        if (ch.isText() && ch.permissionOverwrites) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: false }).catch(() => {});
          count++;
        }
      }
      return ctx.reply(`🚨 **EMERGENCY LOCKDOWN:** Secured \`${count}\` text channels.`);
    }
  },
  {
    name: 'unhoist',
    category: 'Moderation',
    description: 'Scan and reset nicknames of members hoisting with symbols (!, #, @)',
    usage: '.unhoist',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      let unhoisted = 0;
      for (const m of ctx.guild.members.cache.values()) {
        if (m.nickname && /^[!#@$%&*]/.test(m.nickname) && m.manageable) {
          await m.setNickname(m.nickname.replace(/^[!#@$%&*]+/, '').trim() || 'dehoisted').catch(() => {});
          unhoisted++;
        }
      }
      return ctx.reply(`🧼 **UNHOIST COMPLETE:** Normalized nicknames for \`${unhoisted}\` members.`);
    }
  },
  {
    name: 'purgeuserall',
    category: 'Moderation',
    description: 'Purge all messages from specified user in recent channel cache',
    usage: '.purgeuserall <user_id>',
    run: async (ctx, args) => {
      if (!ctx.channel || !args[0]) return ctx.reply('❌ Provide user ID.');
      const id = args[0].replace(/[<@!>]/g, '');
      const msgs = await ctx.channel.messages.fetch({ limit: 100 });
      const userMsgs = msgs.filter(m => m.author.id === id);
      let count = 0;
      for (const m of userMsgs.values()) {
        if (m.deletable) {
          await m.delete().catch(() => {});
          count++;
        }
      }
      return ctx.reply(`🧹 Purged \`${count}\` messages from <@${id}>`);
    }
  },
  {
    name: 'slowmodechannel',
    category: 'Moderation',
    description: 'Set slowmode duration on a specific channel remotely',
    usage: '.slowmodechannel <channel_id> <seconds>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.slowmodechannel <channel_id> <seconds>`');
      const ch = ctx.guild.channels.cache.get(args[0]);
      if (!ch || !ch.setRateLimitPerUser) return ctx.reply('❌ Text channel not found.');
      const sec = parseInt(args[1], 10) || 0;
      await ch.setRateLimitPerUser(sec);
      return ctx.reply(`⏱️ Slowmode on <#${ch.id}> set to \`${sec}s\``);
    }
  },
  {
    name: 'channeltopic',
    category: 'Moderation',
    description: 'Change topic description of specified channel',
    usage: '.channeltopic <channel_id> <new_topic>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.channeltopic <channel_id> <topic>`');
      const ch = ctx.guild.channels.cache.get(args[0]);
      if (!ch || !ch.setTopic) return ctx.reply('❌ Channel not found.');
      const topic = args.slice(1).join(' ');
      await ch.setTopic(topic);
      return ctx.reply(`📝 Updated topic on <#${ch.id}>.`);
    }
  },
  {
    name: 'channelrename',
    category: 'Moderation',
    description: 'Rename a guild channel',
    usage: '.channelrename <channel_id> <new_name>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.channelrename <channel_id> <name>`');
      const ch = ctx.guild.channels.cache.get(args[0]);
      if (!ch) return ctx.reply('❌ Channel not found.');
      await ch.setName(args[1]);
      return ctx.reply(`🏷️ Renamed channel to \`#${args[1]}\``);
    }
  },
  {
    name: 'rolecolor',
    category: 'Moderation',
    description: 'Update display color hex of a server role',
    usage: '.rolecolor <role_name_or_id> <hex_code>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.rolecolor <role> <hex>`');
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args[0].toLowerCase() || r.id === args[0]);
      if (!role) return ctx.reply('❌ Role not found.');
      await role.setColor(args[1]);
      return ctx.reply(`🎨 Color of **${role.name}** updated to \`${args[1]}\``);
    }
  },
  {
    name: 'rolerename',
    category: 'Moderation',
    description: 'Rename a server role',
    usage: '.rolerename <role_name_or_id> <new_name>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.rolerename <role> <new_name>`');
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args[0].toLowerCase() || r.id === args[0]);
      if (!role) return ctx.reply('❌ Role not found.');
      await role.setName(args.slice(1).join(' '));
      return ctx.reply(`🏷️ Role renamed.`);
    }
  },
  {
    name: 'rolemembers',
    category: 'Moderation',
    description: 'List members assigned to target role',
    usage: '.rolemembers <role_name_or_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || !args[0]) return ctx.reply('❌ Provide role.');
      const role = ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase() || r.id === args[0]);
      if (!role) return ctx.reply('❌ Role not found.');
      const members = role.members.map(m => `* **${m.user.tag}** (\`${m.id}\`)`);
      return ctx.reply(`### 🏷️ MEMBERS WITH ${role.name} (${role.members.size})\n${members.slice(0, 20).join('\n') || '> No members'}`);
    }
  },
  {
    name: 'massunban',
    category: 'Moderation',
    description: 'Review guild ban list count and verify unban readiness',
    usage: '.massunban',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      try {
        const bans = await ctx.guild.bans.fetch();
        return ctx.reply(`🔨 **BAN LIST DOSSIER:** Server has \`${bans.size}\` banned members.`);
      } catch (e) {
        return ctx.reply(`❌ Missing ban permissions: ${e.message}`);
      }
    }
  },
  {
    name: 'clearallwarns',
    category: 'Moderation',
    description: 'Wipe all moderation warnings saved in storage across all users',
    usage: '.clearallwarns',
    run: async (ctx) => {
      Storage.set('warnings', {});
      return ctx.reply('🧹 Cleared all moderation warnings across all accounts.');
    }
  },
  {
    name: 'lockallchannels',
    category: 'Moderation',
    description: 'Lock messaging permissions across all categories',
    usage: '.lockallchannels',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      let count = 0;
      for (const ch of ctx.guild.channels.cache.values()) {
        if (ch.isText() && ch.permissionOverwrites) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: false }).catch(() => {});
          count++;
        }
      }
      return ctx.reply(`🔒 Locked \`${count}\` channels.`);
    }
  },
  {
    name: 'unlockallchannels',
    category: 'Moderation',
    description: 'Restore messaging permissions across all categories',
    usage: '.unlockallchannels',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      let count = 0;
      for (const ch of ctx.guild.channels.cache.values()) {
        if (ch.isText() && ch.permissionOverwrites) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SEND_MESSAGES: true }).catch(() => {});
          count++;
        }
      }
      return ctx.reply(`🔓 Unlocked \`${count}\` channels.`);
    }
  },
  {
    name: 'cleanbots',
    category: 'Moderation',
    description: 'Count bot accounts present in current guild',
    usage: '.cleanbots',
    run: async (ctx) => {
      if (!ctx.guild) return ctx.reply('❌ Guild required.');
      const bots = ctx.guild.members.cache.filter(m => m.user.bot);
      return ctx.reply(`🤖 **BOT INVENTORY:** Server contains \`${bots.size}\` bot accounts.`);
    }
  },
  {
    name: 'voicemoveall',
    category: 'Moderation',
    description: 'Move all members from source voice channel to destination',
    usage: '.voicemoveall <source_vc_id> <dest_vc_id>',
    run: async (ctx, args) => {
      if (!ctx.guild || args.length < 2) return ctx.reply('❌ Usage: `.voicemoveall <src_vc> <dest_vc>`');
      const src = ctx.guild.channels.cache.get(args[0]);
      const dest = ctx.guild.channels.cache.get(args[1]);
      if (!src || !dest) return ctx.reply('❌ Voice channels not found.');
      let moved = 0;
      for (const m of src.members.values()) {
        await m.voice.setChannel(dest).catch(() => {});
        moved++;
      }
      return ctx.reply(`🎧 Moved \`${moved}\` members to **${dest.name}**.`);
    }
  },
  {
    name: 'voicedeafenall',
    category: 'Moderation',
    description: 'Server-deafen all members currently in your voice room',
    usage: '.voicedeafenall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Must be connected to a voice channel.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setDeaf(true).catch(() => {});
        count++;
      }
      return ctx.reply(`🔇 Deafened \`${count}\` voice members.`);
    }
  },
  {
    name: 'voiceundeafenall',
    category: 'Moderation',
    description: 'Server-undeafen all members currently in your voice room',
    usage: '.voiceundeafenall',
    run: async (ctx) => {
      const vc = ctx.member?.voice?.channel;
      if (!vc) return ctx.reply('❌ Must be connected to a voice channel.');
      let count = 0;
      for (const m of vc.members.values()) {
        await m.voice.setDeaf(false).catch(() => {});
        count++;
      }
      return ctx.reply(`🔊 Undeafened \`${count}\` voice members.`);
    }
  }
];
